import { registerApp } from '../../core/apps.js';
import { DISK_CLEANUP_SRC } from '../../global/constants.js';
import { openDiskCleanup } from './diskcleanup.js';

// Disk Cleanup: registers itself on load; boot imports this module once so the
// Start menu and the search box can launch it. It is not pinned and not on the
// desktop, because the machine that ships it does not put it there either - it
// is reached by searching for it, which is how most people ever open it.

export var DISK_CLEANUP_APP_ID = 'diskcleanup';

registerApp({
  id: DISK_CLEANUP_APP_ID,
  name: 'Disk Cleanup',
  icon: DISK_CLEANUP_SRC,
  // It reads and deletes files, so it asks for the storage permission and is
  // refused the volume without it.
  manifest: {
    publisher: 'Microsoft Corporation',
    version: '10.0.19041.1',
    description: 'Free up disk space by removing unnecessary files from this drive.',
    permissions: ['storage']
  },
  start: {
    subtitle: 'Windows Administrative Tools',
    tile: {
      size: 'medium',
      color: '#0b5fa5'
    }
  },
  launch: function (context) {
    return openDiskCleanup(context);
  }
});
