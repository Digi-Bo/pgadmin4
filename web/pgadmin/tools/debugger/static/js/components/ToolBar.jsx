/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - PostgreSQL Tools
//
// Copyright (C) 2013 - 2022, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

import React, { useCallback, useContext, useEffect, useState } from 'react';

import { Box, makeStyles } from '@material-ui/core';
import FormatIndentIncreaseIcon from '@material-ui/icons/FormatIndentIncrease';
import FormatIndentDecreaseIcon from '@material-ui/icons/FormatIndentDecrease';
import PlayCircleFilledWhiteIcon from '@material-ui/icons/PlayCircleFilledWhite';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import NotInterestedIcon from '@material-ui/icons/NotInterested';
import StopIcon from '@material-ui/icons/Stop';
import HelpIcon from '@material-ui/icons/HelpRounded';

import gettext from 'sources/gettext';
import { shortcut_key } from 'sources/keyboard_shortcuts';
import url_for from 'sources/url_for';

import { PgButtonGroup, PgIconButton } from '../../../../../static/js/components/Buttons';
import { DebuggerContext, DebuggerEventsContext } from './DebuggerComponent';
import { DEBUGGER_EVENTS } from '../DebuggerConstants';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: '2px 4px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: theme.otherVars.editorToolbarBg,
    flexWrap: 'wrap',
    ...theme.mixins.panelBorder.bottom,
  },
}));

export function ToolBar() {
  const classes = useStyles();
  const debuggerCtx = useContext(DebuggerContext);
  const eventBus = useContext(DebuggerEventsContext);
  let preferences = debuggerCtx.preferences.debugger;

  const [buttonsDisabled, setButtonsDisabled] = useState({
    'stop': true,
    'clear-all-breakpoints': true,
    'toggle-breakpoint': true,
    'start': true,
    'step-over': true,
    'step-into': true,
  });

  const setDisableButton = useCallback((name, disable = true) => {
    setButtonsDisabled((prev) => ({ ...prev, [name]: disable }));
  }, []);

  const clearAllBreakpoint = useCallback(() => {
    eventBus.fireEvent(DEBUGGER_EVENTS.TRIGGER_CLEAR_ALL_BREAKPOINTS);
  }, []);

  const toggleBreakpoint = useCallback(() => {
    eventBus.fireEvent(DEBUGGER_EVENTS.TRIGGER_TOGGLE_BREAKPOINTS);
  }, []);

  const stop = useCallback(() => {
    eventBus.fireEvent(DEBUGGER_EVENTS.TRIGGER_STOP_DEBUGGING);
  });

  const continueDebugger = useCallback(() => {
    eventBus.fireEvent(DEBUGGER_EVENTS.TRIGGER_CONTINUE_DEBUGGING);
  });


  const stepOverDebugger = useCallback(() => {
    eventBus.fireEvent(DEBUGGER_EVENTS.TRIGGER_STEPOVER_DEBUGGING);
  });

  const stepInTODebugger = useCallback(() => {
    eventBus.fireEvent(DEBUGGER_EVENTS.TRIGGER_STEINTO_DEBUGGING);
  });

  const onHelpClick=()=>{
    let url = url_for('help.static', {'filename': 'debugger.html'});
    window.open(url, 'pgadmin_help');
  };

  useEffect(() => {
    eventBus.registerListener(DEBUGGER_EVENTS.DISABLE_MENU, () => {
      setDisableButton('start', true);
      setDisableButton('step-into', true);
      setDisableButton('step-over', true);
      setDisableButton('clear-all-breakpoints', true);
      setDisableButton('toggle-breakpoint', true);
      setDisableButton('stop', true);
    });

    eventBus.registerListener(DEBUGGER_EVENTS.ENABLE_MENU, () => {
      setDisableButton('start', false);
      setDisableButton('step-into', false);
      setDisableButton('step-over', false);
      setDisableButton('clear-all-breakpoints', false);
      setDisableButton('toggle-breakpoint', false);
      setDisableButton('stop', false);
    });

    eventBus.registerListener(DEBUGGER_EVENTS.ENABLE_SPECIFIC_MENU, (key) => {
      setDisableButton(key, false);
    });
  }, []);


  return (
    <Box className={classes.root}>
      <PgButtonGroup size="small">
        <PgIconButton data-test='step-in' title={gettext('Step into')} disabled={buttonsDisabled['step-into']} icon={<FormatIndentIncreaseIcon />} onClick={() => { stepInTODebugger(); }}
          accesskey={shortcut_key(preferences?.btn_step_into)} />
        <PgIconButton data-test='step-over' title={gettext('Step over')} disabled={buttonsDisabled['step-over']} icon={<FormatIndentDecreaseIcon />} onClick={() => { stepOverDebugger(); }}
          accesskey={shortcut_key(preferences?.btn_step_over)} />
        <PgIconButton data-test='debugger-contiue' title={gettext('Continue/Start')} disabled={buttonsDisabled['start']} icon={<PlayCircleFilledWhiteIcon />} onClick={() => { continueDebugger(); }}
          accesskey={shortcut_key(preferences?.btn_start)} />
      </PgButtonGroup>
      <PgButtonGroup size="small">
        <PgIconButton data-test='toggle-breakpoint' title={gettext('Toggle breakpoint')} disabled={buttonsDisabled['toggle-breakpoint']} icon={<FiberManualRecordIcon />}
          accesskey={shortcut_key(preferences?.btn_toggle_breakpoint)} onClick={() => { toggleBreakpoint(); }} />
        <PgIconButton data-test='clear-breakpoint' title={gettext('Clear all breakpoints')} disabled={buttonsDisabled['clear-all-breakpoints']} icon={<NotInterestedIcon />}
          accesskey={shortcut_key(preferences?.btn_clear_breakpoints)} onClick={() => { clearAllBreakpoint(); }} />
      </PgButtonGroup>
      <PgButtonGroup size="small">
        <PgIconButton data-test='stop-debugger' title={gettext('Stop')} icon={<StopIcon />} disabled={buttonsDisabled['stop']} onClick={() => { stop(); }}
          accesskey={shortcut_key(preferences?.btn_stop)} />
      </PgButtonGroup>
      <PgButtonGroup size="small">
        <PgIconButton data-test='debugger-help' title={gettext('Help')} icon={<HelpIcon />} onClick={onHelpClick} />
      </PgButtonGroup>
    </Box>
  );
}
