// The list of things Disk Cleanup offers to remove, in the order and with the
// names the real cleanmgr uses.
//
// There are two kinds of entry in it, which is the whole point of the app:
//
//   * An entry with `paths` is a real place on this volume's disk layer. It is
//     measured by walking those folders, and cleaning it deletes what is in
//     them, so the space really does come back - the files were really there.
//     These are the account's own folders: its Temp, its Downloads, its Recycle
//     Bin.
//
//   * An entry with `fake` belongs to Windows itself: the update store, the
//     upgrade logs, the memory dumps, the previous installation. Windows
//     protects those folders on this drive, and they hold no bytes here at all
//     - the Windows tree in js/apis/wintree/ is a table read into memory, not
//     storage. So the figure is the one Disk Cleanup reports for that category
//     on a real machine, and cleaning it zeroes the figure for the rest of the
//     session. Nothing else moves. That is deliberate: the tool is being
//     emulated, including the part of it that has nothing to weigh.

// The account's own profile, and the bin Explorer moves deleted files into. The
// bin's folder is named with the account's security identifier - this is the
// same path Explorer uses, so a file deleted in Explorer is what Disk Cleanup
// finds here.
export var USER_PROFILE = 'C:\\Users\\User';
export var RECYCLE_BIN_ROOT = 'C:\\$Recycle.Bin\\S-1-5-21-1964531255-1331432381-3380043568-1013';

var MB = 1024 * 1024;
var GB = 1024 * MB;

export var CATEGORIES = [
  {
    id: 'downloaded-programs',
    name: 'Downloaded Program Files',
    description: 'Downloaded Program Files are ActiveX controls and Java applets ' +
      'downloaded automatically from the Internet when you view certain pages. They ' +
      'are temporarily stored in the Downloaded Program Files folder on your hard disk.',
    fake: 0
  },
  {
    id: 'temporary-internet-files',
    name: 'Temporary Internet Files',
    description: 'The Temporary Internet Files folder contains webpages stored on your ' +
      'hard disk for quick viewing. Your personalised settings for webpages will be ' +
      'left intact.',
    // Edge does keep an INetCache and a WebCache in the profile tree. They are
    // entries to browse rather than anything written to, so the figure is the
    // one the category carries. See the note at the top of this file.
    fake: 1.3 * MB
  },
  {
    id: 'directx-shader-cache',
    name: 'DirectX Shader Cache',
    description: 'The DirectX Shader Cache is used to reduce the time taken by later ' +
      'launches of applications that use the GPU. Deleting it does not harm anything ' +
      'already installed; the shaders are compiled again when they are next needed.',
    fake: 36 * MB,
    system: true
  },
  {
    id: 'delivery-optimization',
    name: 'Delivery Optimization Files',
    description: 'Delivery Optimization files are copies of updates and app packages ' +
      'that Windows kept so that other computers on your network could download them ' +
      'from this one instead of from the Internet.',
    fake: 274 * MB,
    system: true
  },
  {
    id: 'windows-update-cleanup',
    name: 'Windows Update Cleanup',
    description: 'Windows keeps copies of all previously installed updates to make it ' +
      'possible to uninstall them again. Cleaning up these files removes those copies ' +
      'and may mean that the updates can no longer be uninstalled.',
    fake: 1.72 * GB,
    system: true
  },
  {
    id: 'defender',
    name: 'Windows Defender Antivirus',
    description: 'Windows Defender Antivirus keeps the definitions and the scan ' +
      'records it is not currently using. Removing them does not remove the ' +
      'protection itself; they are downloaded again when they are needed.',
    fake: 112 * MB,
    system: true
  },
  {
    id: 'upgrade-logs',
    name: 'Windows Upgrade Log Files',
    description: 'These log files were created by Windows Setup and are used to ' +
      'troubleshoot problems with the installation. You can safely delete them.',
    fake: 268 * MB,
    system: true
  },
  {
    id: 'memory-dumps',
    name: 'System error memory dump files',
    description: 'System error memory dump files are written when a program stops ' +
      'responding. They are read when the cause of the error is investigated, and are ' +
      'of no use once that has been done.',
    fake: 1.09 * GB,
    system: true
  },
  {
    id: 'minidumps',
    name: 'System error minidump files',
    description: 'System error minidump files are written along with the memory dump ' +
      'files, and hold the same information in less detail.',
    fake: 512 * 1024,
    system: true
  },
  {
    id: 'previous-installation',
    name: 'Previous Windows installation(s)',
    description: 'Files from a previous installation of Windows are stored in the ' +
      'Windows.old folder. Deleting them means the computer can no longer be put back ' +
      'to the version of Windows that was installed before the current one.',
    fake: 3.48 * GB,
    system: true
  },
  {
    id: 'thumbnails',
    name: 'Thumbnails',
    description: 'Windows keeps a small copy of every picture, video and document it ' +
      'has shown you so that it can show it again quickly. Deleting the cache costs ' +
      'nothing but the moment the pictures take to be drawn again.',
    fake: 8.4 * MB
  },
  {
    id: 'temp',
    name: 'Temporary files',
    description: 'The Temporary files folder contains files stored in the Temp ' +
      'folders. Programs use it for work they are only part way through, and files are ' +
      'normally removed when a program closes; what is left is what it did not tidy up.',
    paths: [USER_PROFILE + '\\AppData\\Local\\Temp'],
    removable: true,
    defaultOn: true
  },
  {
    id: 'downloads',
    name: 'Downloads',
    description: 'The Downloads folder is where files you download from the Internet are ' +
      'saved. Nothing here is used by Windows, but it is your own folder, so Disk ' +
      'Cleanup offers it without ticking it.',
    paths: [USER_PROFILE + '\\Downloads'],
    removable: true
  },
  {
    id: 'recycle-bin',
    name: 'Recycle Bin',
    description: 'The Recycle Bin contains the files you have deleted from your ' +
      'computer. Emptying it gives back the space they take and makes them impossible ' +
      'to restore.',
    paths: [RECYCLE_BIN_ROOT],
    removable: true
  }
];

// Windows' own wording for a size, which is what the column beside every
// category and the running total are written in.
export function formatBytes(count) {
  var value = Number(count) || 0;
  if (value < 1024) {
    return value + (value === 1 ? ' byte' : ' bytes');
  }
  var units = ['KB', 'MB', 'GB', 'TB'];
  var step = 0;
  value = value / 1024;
  while (value >= 1024 && step < units.length - 1) {
    value = value / 1024;
    step++;
  }
  var digits = value < 10 ? 2 : (value < 100 ? 1 : 0);
  return value.toFixed(digits) + ' ' + units[step];
}
