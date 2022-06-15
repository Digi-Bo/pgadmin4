/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - PostgreSQL Tools
//
// Copyright (C) 2013 - 2022, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

export const DEBUGGER_EVENTS = {
  TRIGGER_CLEAR_ALL_BREAKPOINTS: 'TRIGGER_CLEAR_ALL_BREAKPOINTS',
  TRIGGER_TOGGLE_BREAKPOINTS: 'TRIGGER_TOGGLE_BREAKPOINTS',
  TRIGGER_STOP_DEBUGGING: 'TRIGGER_STOP_DEBUGGING',
  TRIGGER_CONTINUE_DEBUGGING: 'TRIGGER_CONTINUE_DEBUGGING',
  TRIGGER_STEPOVER_DEBUGGING: 'TRIGGER_STEPOVER_DEBUGGING',
  TRIGGER_STEINTO_DEBUGGING: 'TRIGGER_STEINTO_DEBUGGING',

  SET_STACK: 'SET_STACK',
  SET_MESSAGES: 'SET_MESSAGES',
  SET_RESULTS: 'SET_RESULTS',
  SET_LOCAL_VARIABLES: 'SET_LOCAL_VARIABLES',
  SET_PARAMETERS: 'SET_PARAMETERS',
  SET_FRAME: 'SET_FRAME',

  SET_LOCAL_VARIABLE_VALUE_CHANGE: 'SET_LOCAL_VARIABLE_VALUE_CHANGE',
  SET_PARAMETERS_VALUE_CHANGE: 'SET_PARAMETERS_VALUE_CHANGE',

  DISABLE_MENU: 'DISABLE_MENU',
  ENABLE_MENU: 'ENABLE_MENU',
  ENABLE_SPECIFIC_MENU: 'ENABLE_SPECIFIC_MENU',

  FOCUS_PANEL: 'FOCUS_PANEL',
  GET_TOOL_BAR_BUTTON_STATUS: 'GET_TOOL_BAR_BUTTON_STATUS'
};

export const PANELS = {
  DEBUGGER: 'id-debugger',
  PARAMETERS: 'id-parameters',
  LOCAL_VARIABLES: 'id-local-variables',
  MESSAGES: 'id-debugger-messages',
  RESULTS: 'id-results',
  STACK: 'id-stack',
};

export const MENUS = {
  STEPINTO: 'step-into',
  STEPOVER: 'step-over',
  STOP: 'stop',
  CONTINUE: 'continue',
  CLEAR_ALL_BREAKPOINT: 'clear-al-breakpoint',
  TOGGLE_BREAKPOINT: 'toggle-breakpoint'
};

export const DEBUGGER_ARGS = {
  NO_DEFAULT: '<no default>',
  NO_DEFAULT_VALUE: '<No default value>',
};
