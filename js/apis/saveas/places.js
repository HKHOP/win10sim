// The places a file dialog's navigation pane offers.
//
// A dialog is not a file manager. It does not offer Quick access, the Recycle
// Bin or This PC's device list, because a document saved into a folder that
// cannot hold one is a document the person cannot find again. What Win10's Save
// As shows is the one root, This PC, with the drive under it, and the
// signed-in account's known folders - which is where a document actually goes.
//
// Every path here is the emulated volume's own, so the browser that draws these
// reads them with the same volume an app is handed in its context, and a folder
// named here is a folder the app can write to.

import {
  THISPC_SRC,
  DRIVE_SRC,
  KNOWN_FOLDER_SRC,
  FOLDER_SRC
} from '../../global/constants.js';

// The emulated volume's root: the whole machine, as far as a file dialog goes.
export const VOLUME_ROOT = 'C:\\';

// Where the signed-in account's own folders live. Not exported: it is an
// implementation detail of knownFolderPath below, not something an app asks for.
const USER_HOME = 'C:\\Users\\User';

// The known folders Win10 creates for an account, in the order the navigation
// pane lists them.
export const KNOWN_FOLDER_NAMES = [
  'Desktop', 'Documents', 'Downloads', 'Music', 'Pictures', 'Videos'
];

export function knownFolderPath(name) {
  return USER_HOME + '\\' + name;
}

// Which artwork a place wears. The shell already owns this mapping for the
// known folders - the desktop and Explorer both read it - so it is read from
// there rather than copied here.
export function folderIcon(name) {
  return KNOWN_FOLDER_SRC[name] || FOLDER_SRC;
}

// The two fixed entries at the top of the tree: the root, and the drive that is
// the whole of this emulated machine.
export const THIS_PC = {
  label: 'This PC',
  path: VOLUME_ROOT,
  icon: THISPC_SRC
};

export const SYSTEM_DRIVE = {
  label: 'Local Disk (C:)',
  path: VOLUME_ROOT,
  icon: DRIVE_SRC
};

// The shortcuts under the tree. A person saving a document wants Documents or
// Desktop, not three levels of Users\User.
export function shortcutPlaces() {
  return KNOWN_FOLDER_NAMES.map(function (name) {
    return {
      label: name,
      path: knownFolderPath(name),
      icon: folderIcon(name)
    };
  });
}

// What the breadcrumb trail of a path is: the drive root, then each segment
// under it. Returns [{ label, path }] with the full path on every entry, so a
// crumb can be navigated to without reassembling anything.
export function trailOf(path) {
  var segments = String(path || '').replace(/\//g, '\\').split('\\').filter(function (part) {
    return !!part && !/^[a-zA-Z]:$/.test(part);
  });
  var trail = [{ label: 'This PC', path: VOLUME_ROOT }];
  var acc = VOLUME_ROOT;
  segments.forEach(function (part) {
    acc = acc.replace(/\\$/, '') + '\\' + part;
    trail.push({ label: part, path: acc });
  });
  return trail;
}

// The last segment of a path, which is what a window is titled after and what
// the File name box holds when a whole path is typed into it.
export function leafOf(path) {
  var text = String(path || '').replace(/\//g, '\\').replace(/\\+$/, '');
  var at = text.lastIndexOf('\\');
  if (at < 0) {
    // No separator: the drive letter, if it is one, is a name like any other.
    return /^[a-zA-Z]:$/.test(text) ? '' : text;
  }
  var leaf = text.slice(at + 1);
  return /^[a-zA-Z]:$/.test(leaf) ? '' : leaf;
}

// A bare name's folder and leaf. Both are what an app holding a path needs, and
// neither is the filesystem's to answer - a path is a string with separators in
// it, and the drive letter is a name too.
function dirOf(path) {
  var text = String(path || '').replace(/\//g, '\\').replace(/\\+$/, '');
  var at = text.lastIndexOf('\\');
  if (at <= 0) {
    return VOLUME_ROOT;
  }
  var head = text.slice(0, at);
  return /^[a-zA-Z]:$/.test(head) ? VOLUME_ROOT : head;
}

export { dirOf };

