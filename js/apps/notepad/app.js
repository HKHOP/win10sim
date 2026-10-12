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
  // What Notepad says about itself. The file types here are what Explorer
  // offers when you ask how to open a .txt: it opens them in Notepad because
  // this manifest claimed them, not because the shell knows what Notepad is.
  manifest: {
    publisher: 'Microsoft Corporation',
    version: '10.0.18362.1249',
    description: 'A plain text editor for documents and source files.',
    permissions: ['storage'],
    associations: [
      {
        ext: ['txt', 'log', 'ini', 'md', 'csv', 'xml', 'json'],
        type: 'Text Document',
        role: 'editor'
      }
    ]
  },
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