##########################################################################
#
# pgAdmin 4 - PostgreSQL Tools
#
# Copyright (C) 2013 - 2021, The pgAdmin Development Team
# This software is released under the PostgreSQL Licence
#
##########################################################################

"""A blueprint module implementing the Authentication."""

import config
import copy

from flask import current_app, flash, Response, request, url_for,\
    session, redirect
from flask_babelex import gettext
from flask_security.views import _security
from flask_security.utils import get_post_logout_redirect, \
    get_post_login_redirect

from pgadmin.utils import PgAdminModule
from pgadmin.utils.constants import KERBEROS, INTERNAL, OAUTH2, LDAP
from pgadmin.authenticate.registry import AuthSourceRegistry


MODULE_NAME = 'authenticate'
auth_obj = None


class AuthenticateModule(PgAdminModule):
    def get_exposed_url_endpoints(self):
        return ['authenticate.login']


blueprint = AuthenticateModule(MODULE_NAME, __name__, static_url_path='')


@blueprint.route('/login', endpoint='login', methods=['GET', 'POST'])
def login():
    """
    Entry point for all the authentication sources.
    The user input will be validated and authenticated.
    """
    form = _security.login_form()

    auth_obj = AuthSourceManager(form, copy.deepcopy(
        config.AUTHENTICATION_SOURCES))
    if OAUTH2 in config.AUTHENTICATION_SOURCES\
            and 'oauth2_button' in request.form:
        session['auth_obj'] = auth_obj

    session['auth_source_manager'] = None
    # Validate the user
    if not auth_obj.validate():
        for field in form.errors:
            for error in form.errors[field]:
                flash(error, 'warning')
        return redirect(get_post_logout_redirect())

    # Authenticate the user
    status, msg = auth_obj.authenticate()
    if status:
        # Login the user
        status, msg = auth_obj.login()
        current_auth_obj = auth_obj.as_dict()

        if not status:
            if current_auth_obj['current_source'] ==\
                    KERBEROS:
                return redirect('{0}?next={1}'.format(url_for(
                    'authenticate.kerberos_login'), url_for('browser.index')))

            flash(msg, 'danger')
            return redirect(get_post_logout_redirect())
        session['auth_source_manager'] = current_auth_obj
        if 'auth_obj' in session:
            session['auth_obj'] = None
        return redirect(get_post_login_redirect())

    elif isinstance(msg, Response):
        return msg
    elif 'oauth2_button' in request.form and not isinstance(msg, str):
        return msg
    flash(msg, 'danger')
    response = redirect(get_post_logout_redirect())
    return response


class AuthSourceManager:
    """This class will manage all the authentication sources.
     """

    def __init__(self, form, sources):
        self.form = form
        self.auth_sources = sources
        self.source = None
        self.source_friendly_name = INTERNAL
        self.current_source = INTERNAL
        self.update_auth_sources()

    def as_dict(self):
        """
        Returns the dictionary object representing this object.
        """

        res = dict()
        res['source_friendly_name'] = self.source_friendly_name
        res['auth_sources'] = self.auth_sources
        res['current_source'] = self.current_source

        return res

    def update_auth_sources(self):
        for auth_src in [KERBEROS, OAUTH2]:
            if auth_src in self.auth_sources:
                if 'internal_button' in request.form:
                    self.auth_sources.remove(auth_src)
                elif INTERNAL in self.auth_sources:
                    self.auth_sources.remove(INTERNAL)

    def set_current_source(self, source):
        self.current_source = source

    @property
    def get_current_source(self):
        return self.current_source

    def set_source(self, source):
        self.source = source

    @property
    def get_source(self):
        return self.source

    def set_source_friendly_name(self, name):
        self.source_friendly_name = name

    @property
    def get_source_friendly_name(self):
        return self.source_friendly_name

    def validate(self):
        """Validate through all the sources."""
        for src in self.auth_sources:
            source = get_auth_sources(src)
            if source.validate(self.form):
                return True
        return False

    def authenticate(self):
        """Authenticate through all the sources."""
        status = False
        msg = None
        for src in self.auth_sources:
            source = get_auth_sources(src)
            self.set_source(source)
            current_app.logger.debug(
                "Authentication initiated via source: %s" %
                source.get_source_name())

            status, msg = source.authenticate(self.form)

            if status:
                self.set_current_source(source.get_source_name())
                if msg is not None and 'username' in msg:
                    self.form._fields['email'].data = msg['username']
                return status, msg

        return status, msg

    def login(self):
        status, msg = self.source.login(self.form)
        if status:
            self.set_source_friendly_name(self.source.get_friendly_name())
            current_app.logger.debug(
                "Authentication and Login successfully done via source : %s" %
                self.source.get_source_name())

            # Set the login, logout view as per source  if available
            current_app.login_manager.login_view = getattr(
                self.source, 'LOGIN_VIEW', 'security.login')
            current_app.login_manager.logout_view = getattr(
                self.source, 'LOGOUT_VIEW', 'security.logout')

        return status, msg


def get_auth_sources(type):
    """Get the authenticated source object from the registry"""

    auth_sources = getattr(current_app, '_pgadmin_auth_sources', None)

    if auth_sources is None or not isinstance(auth_sources, dict):
        auth_sources = dict()

    if type in auth_sources:
        return auth_sources[type]

    auth_source = AuthSourceRegistry.get(type)

    if auth_source is not None:
        auth_sources[type] = auth_source
        setattr(current_app, '_pgadmin_auth_sources', auth_sources)

    return auth_source


def init_app(app):
    auth_sources = dict()

    setattr(app, '_pgadmin_auth_sources', auth_sources)
    AuthSourceRegistry.load_modules(app)

    return auth_sources
