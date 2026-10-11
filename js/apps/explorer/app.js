import { registerApp } from '../../core/apps.js';
import { EXPLORER_SRC } from '../../global/constants.js';
import { openExplorer } from './explorer.js';

// File Explorer: browses the emulated C: volume. Registers itself on load;
// boot imports this module once so taskbar and desktop can launch it.

export var EXPLORER_APP_ID = 'explorer';

registerApp({
  id: EXPLORER_APP_ID,
  name: 'File Explorer',
  icon: EXPLORER_SRC,
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
    var path = args && args.path ? args.path : 'thispc';
    return openExplorer(context, path);
  }
});
