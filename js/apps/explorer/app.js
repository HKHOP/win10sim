import { registerApp } from '../../core/apps.js';
import { EXPLORER_SRC, THISPC_SRC } from '../../global/constants.js';
import { openExplorer } from './explorer.js';

// Explorer registers two entries because Windows exposes two places from one
// program. Launching File Explorer lands on Home, the Quick Access page, while
// This PC opens the machine's own page; the windows are identical inside
// explorer.exe, so This PC also shows File Explorer's icon and window title.

export var EXPLORER_APP_ID = 'explorer';
export var THISPC_APP_ID = 'thispc';

// Explorer is the app that browses the volume, so its manifest asks for storage
// and claims nothing else. It registers no file types of its own: in Windows
// the shell opens folders itself and only files come from registered apps.
var EXPLORER_MANIFEST = {
  publisher: 'Microsoft Corporation',
  version: '10.0.18362.1249',
  description: 'Browse the files and folders stored on this PC.',
  permissions: ['storage']
};

registerApp({
  id: EXPLORER_APP_ID,
  name: 'File Explorer',
  icon: EXPLORER_SRC,
  manifest: EXPLORER_MANIFEST,
  // Start-menu presence: File Explorer ships with the profile, so a used
  // install shows it in Most used labelled as a system app and pins it as
  // a wide tile. Apps that register later with no metadata still appear in
  // the A-Z list.
  start: {
    subtitle: 'System',
    pinned: true,
    tile: { size: 'wide', background: '#eef3f7', color: '#eef3f7' }
  },
  launch: function (context, args) {
    var path = args && args.path ? args.path : 'home';
    return openExplorer(context, path);
  }
});

registerApp({
  id: THISPC_APP_ID,
  name: 'This PC',
  // Win10 shows This PC's own icon in the places that name it, but the window
  // it opens is an Explorer window and carries Explorer's icon.
  icon: THISPC_SRC,
  manifest: EXPLORER_MANIFEST,
  start: {
    subtitle: 'System',
    tile: { size: 'medium', background: '#eef3f7', color: '#eef3f7' }
  },
  launch: function (context) {
    return openExplorer(context, 'thispc');
  }
});
