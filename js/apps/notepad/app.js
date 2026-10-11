import { registerApp } from '../../core/apps.js';
import { NOTEPAD_SRC } from '../../global/constants.js';
import { openNotepad } from './notepad.js';

// Notepad: registers itself on load; boot imports this module once so the
// taskbar, desktop and Start menu can launch it.

export var NOTEPAD_APP_ID = 'notepad';

registerApp({
  id: NOTEPAD_APP_ID,
  name: 'Notepad',
  icon: NOTEPAD_SRC,
  // Start-menu presence: Notepad is a normal app, so it lists under "N"
  // without a tile until it is pinned.
  start: {
    subtitle: 'Windows',
    tile: { size: 'medium', background: '#eef3f7', color: '#eef3f7' }
  },
  launch: function (context, args) {
    return openNotepad(context, args);
  }
});