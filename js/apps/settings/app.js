// Settings: registers itself on load; boot imports this module once so the taskbar,
// desktop and Start menu can launch it. The taskbar has been pinning a Settings
// button since before there was an app behind it - this is it.
//
// It asks for storage and nothing else. Every setting it shows is kept in the
// profile's own store file (see js/apis/settings-store.js), which is why it is
// the only permission it needs: the pages that report on files read the volume
// the shell already mounts, and no setting anywhere writes to one.

import { registerApp } from '../../core/apps.js';
import { SETTINGS_SRC } from '../../global/constants.js';
import { openSettings } from './shell.js';

export var SETTINGS_APP_ID = 'settings';

registerApp({
  id: SETTINGS_APP_ID,
  name: 'Settings',
  icon: SETTINGS_SRC,
  manifest: {
    publisher: 'Microsoft Corporation',
    version: '10.0.19041.1',
    description: 'Change the way this computer looks and behaves, and what it lets apps do.',
    // The settings are a profile's own file, so this app needs storage to
    // remember anything between visits - which is the whole of its purpose.
    permissions: ['storage']
  },
  start: {
    subtitle: 'System',
    pinned: true,
    tile: { size: 'medium', background: '#eef3f7', color: '#eef3f7' }
  },
  // `args.page` opens Settings on one page, which is what a link from elsewhere
  // in the shell needs: Settings has no window to focus a second time.
  launch: function (context, args) {
    return openSettings(context, args || {});
  }
});