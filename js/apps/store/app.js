import { registerApp } from '../../core/apps.js';
import { STORE_SRC } from '../../global/constants.js';
import { openStore } from './store.js';

// Microsoft Store: registers itself on load; boot imports this module once so
// the taskbar, desktop and Start menu can launch it. The taskbar has been pinning
// a Microsoft Store button since before there was an app behind it.
//
// It asks for no window and no files: the Store is an app package, so the one
// thing it can do on a computer it was never installed on is say so.

export var STORE_APP_ID = 'store';

registerApp({
  id: STORE_APP_ID,
  name: 'Microsoft Store',
  icon: STORE_SRC,
  manifest: {
    publisher: 'Microsoft Corporation',
    version: '10.0.19041.1',
    description: 'The store for apps and games. Not installed on this computer.',
    permissions: []
  },
  start: {
    subtitle: 'Windows'
  },
  launch: function (context) {
    return openStore(context);
  }
});