########################################################################
#
# pgAdmin 4 - PostgreSQL Tools
#
#########################################################################

#########################################################################
# Créer un conteneur Node pour construire les composants JS
# et nettoyer le code source web/
#########################################################################

FROM alpine:latest AS app-builder

RUN apk add --no-cache \
    autoconf \
    automake \
    bash \
    g++ \
    git \
    libc6-compat \
    libjpeg-turbo-dev \
    libpng-dev \
    libtool \
    make \
    nasm \
    nodejs \
    npm \
    yarn \
    zlib-dev

COPY .git .git
# Créer le répertoire /pgadmin4 et copier le code source dans celui-ci
COPY web /pgadmin4/web
RUN rm -rf /pgadmin4/web/*.log \
           /pgadmin4/web/config_*.py \
           /pgadmin4/web/node_modules \
           /pgadmin4/web/regression \
           `find /pgadmin4/web -type d -name tests` \
           `find /pgadmin4/web -type f -name .DS_Store`

WORKDIR /pgadmin4/web

# Build le code JS dans le conteneur app-builder, puis nettoyer les fichiers inutiles
RUN export CPPFLAGS="-DPNG_ARM_NEON_OPT=0" && \
    npm install -g corepack && \
    corepack enable && \
    yarn set version berry && \
    yarn set version 3 && \
    yarn install && \
    yarn run bundle && \
    rm -rf node_modules \
           yarn.lock \
           package.json \
           .[^.]* \
           babel.cfg \
           webpack.* \
           jest.config.js \
           babel.* \
           ./pgadmin/static/js/generated/.cache \
           /pgadmin4/.git

#########################################################################
# Environnement de base Python
#########################################################################

FROM alpine:latest AS env-builder

# Installer les dépendances
COPY requirements.txt /
RUN apk add --no-cache \
        make \
        python3 \
        py3-pip && \
    apk add --no-cache --virtual build-deps \
        build-base \
        openssl-dev \
        libffi-dev \
        postgresql-dev \
        krb5-dev \
        rust \
        cargo \
        zlib-dev \
        libjpeg-turbo-dev \
        libpng-dev \
        python3-dev && \
    python3 -m venv --system-site-packages --without-pip /venv && \
    /venv/bin/python3 -m pip install --no-cache-dir -r requirements.txt && \
    apk del --no-cache build-deps

#########################################################################
# Build de la documentation avec Sphinx
#########################################################################

FROM env-builder AS docs-builder

RUN /venv/bin/python3 -m pip install --no-cache-dir sphinx sphinxcontrib-youtube

COPY docs /pgadmin4/docs
COPY web /pgadmin4/web
RUN rm -rf /pgadmin4/docs/en_US/_build
RUN LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8 /venv/bin/sphinx-build /pgadmin4/docs/en_US /pgadmin4/docs/en_US/_build/html

#########################################################################
# Assemble le conteneur final pour pgAdmin
#########################################################################

FROM alpine:latest

# Copier les packages Python
COPY --from=env-builder /venv /venv

# Remplacer pg17-builder par l'image PostgreSQL officielle
COPY --from=postgres:17-alpine /usr/local/pgsql /usr/local/
COPY --from=postgres:17-alpine /usr/local/lib/libpq.so.5.17 /usr/lib/
COPY --from=postgres:17-alpine /usr/lib/libzstd.so.1.5.6 /usr/lib/
COPY --from=postgres:17-alpine /usr/lib/liblz4.so.1.9.4 /usr/lib/

RUN ln -s libpq.so.5.17 /usr/lib/libpq.so.5 && \
    ln -s libzstd.so.1.5.6 /usr/lib/libzstd.so.1 && \
    ln -s liblz4.so.1.9.4 /usr/lib/liblz4.so.1

WORKDIR /pgadmin4
ENV PYTHONPATH=/pgadmin4

# Utiliser les variables d'environnement pour configurer pgAdmin
ENV PGADMIN_DEFAULT_EMAIL=${PGADMIN_DEFAULT_EMAIL}
ENV PGADMIN_DEFAULT_PASSWORD=${PGADMIN_DEFAULT_PASSWORD}
ENV PGADMIN_LISTEN_PORT=${PGADMIN_LISTEN_PORT}
ENV DATABASE_URL_01=${DATABASE_URL_01}

# Copier le code et la documentation
COPY --from=app-builder /pgadmin4/web /pgadmin4
COPY --from=docs-builder /pgadmin4/docs/en_US/_build/html/ /pgadmin4/docs
COPY pkg/docker/run_pgadmin.py /pgadmin4
COPY pkg/docker/gunicorn_config.py /pgadmin4
COPY pkg/docker/entrypoint.sh /entrypoint.sh

# Installer les dépendances runtime et configurer les permissions
RUN apk add --no-cache \
        python3 \
        bash \
        py3-pip \
        postfix \
        krb5-libs \
        libjpeg-turbo \
        shadow \
        sudo \
        tzdata \
        libedit \
        libldap \
        libcap && \
    /venv/bin/python3 -m pip install --no-cache-dir gunicorn==22.0.0 && \
    find / -type d -name '__pycache__' -exec rm -rf {} + && \
    useradd -r -u 5050 -g root -s /sbin/nologin pgadmin && \
    mkdir -p /run/pgadmin /var/lib/pgadmin && \
    chown pgadmin:root /run/pgadmin /var/lib/pgadmin && \
    chmod g=u /var/lib/pgadmin && \
    touch /pgadmin4/config_distro.py && \
    chown pgadmin:root /pgadmin4/config_distro.py && \
    chmod g=u /pgadmin4/config_distro.py && \
    chmod g=u /etc/passwd && \
    setcap CAP_NET_BIND_SERVICE=+eip /usr/bin/python3.12 && \
    echo "pgadmin ALL = NOPASSWD: /usr/sbin/postfix start" > /etc/sudoers.d/postfix

USER pgadmin

VOLUME /var/lib/pgadmin
# Exposer les ports internes pour HTTP et HTTPS
EXPOSE 80
EXPOSE 443

# Utiliser les variables d'environnement pour lier pgAdmin au bon port d'écoute
CMD ["gunicorn", "--bind", "0.0.0.0:${PGADMIN_LISTEN_PORT}", "pgadmin4:app"]

# L'entrypoint de pgAdmin pour démarrer les services
ENTRYPOINT ["/entrypoint.sh"]
