// A check for the path arithmetic the Save As dialog is built on. places.js is
// pure (it only reads constants.js), so it runs under node as-is; the helpers
// that resolve a typed name are re-declared here the same way saveas.js declares
// them, because they are the other half of the same arithmetic and a browser
// cannot be asked about them without running the whole shell.
//
// Run: node tools/check_saveas_paths.js

import {
  VOLUME_ROOT,
  knownFolderPath,
  trailOf,
  leafOf,
  shortcutPlaces
} from '../js/apis/saveas/places.js';

var checks = 0;
var failures = [];

function eq(label, got, want) {
  checks += 1;
  var a = JSON.stringify(got);
  var b = JSON.stringify(want);
  if (a !== b) {
    failures.push(label + '\n    got:  ' + a + '\n    want: ' + b);
  }
}

// --- the drive root ---
eq('trailOf root', trailOf(VOLUME_ROOT), [{ label: 'This PC', path: 'C:\\' }]);
eq('trailOf root bare', trailOf('C:'), [{ label: 'This PC', path: 'C:\\' }]);
eq('trailOf root slashes', trailOf('C:/'), [{ label: 'This PC', path: 'C:\\' }]);

// --- the account's folders ---
eq(
  'trailOf Documents',
  trailOf(knownFolderPath('Documents')),
  [
    { label: 'This PC', path: 'C:\\' },
    { label: 'Users', path: 'C:\\Users' },
    { label: 'User', path: 'C:\\Users\\User' },
    { label: 'Documents', path: 'C:\\Users\\User\\Documents' }
  ]
);
eq('leafOf Desktop', leafOf(knownFolderPath('Desktop')), 'Desktop');
eq('leafOf root', leafOf('C:\\'), '');
eq('leafOf trailing', leafOf('C:\\Users\\User\\Desktop\\'), 'Desktop');

// --- forward slashes, the other separator a person might type ---
eq(
  'trailOf forward slashes',
  trailOf('C:/Users/User/Pictures'),
  [
    { label: 'This PC', path: 'C:\\' },
    { label: 'Users', path: 'C:\\Users' },
    { label: 'User', path: 'C:\\Users\\User' },
    { label: 'Pictures', path: 'C:\\Users\\User\\Pictures' }
  ]
);

// --- the shortcuts ---
var shortcuts = shortcutPlaces();
eq('six shortcuts', shortcuts.length, 6);
eq('first shortcut', shortcuts[0].label, 'Desktop');
eq('last shortcut', shortcuts[5].label, 'Videos');
eq('shortcut paths are whole', shortcuts[0].path, 'C:\\Users\\User\\Desktop');
eq('every shortcut has artwork', shortcuts.every(function (p) { return /^assets\//.test(p.icon); }), true);

// --- the name-box helpers, as saveas.js declares them ---
function normaliseTyped(typed) {
  return String(typed || '').trim().replace(/\//g, '\\').replace(/\\+$/, '');
}
function joinPath(base, relative) {
  var head = String(base || '').replace(/\\+$/, '');
  var tail = String(relative || '').replace(/^\\+/, '').replace(/\\+$/, '');
  return tail ? head + '\\' + tail : head;
}
function pathOfTyped(typed, directory) {
  var text = normaliseTyped(typed);
  if (/^[a-zA-Z]:/.test(text)) {
    return text;
  }
  return joinPath(directory, text);
}
function folderOfTyped(typed, directory) {
  var whole = pathOfTyped(typed, directory);
  var at = whole.lastIndexOf('\\');
  if (at <= 0) {
    return VOLUME_ROOT;
  }
  var head = whole.slice(0, at);
  return /^[a-zA-Z]:$/.test(head) ? VOLUME_ROOT : head;
}

var docs = knownFolderPath('Documents');

// A bare name is a name in the folder being looked at, and its folder is that
// folder. This is the case that used to fall through to the account's home,
// because a bare name's "directory" was computed as one.
eq('bare name keeps the folder', folderOfTyped('a.txt', docs), docs);

// A relative path resolves against the folder being looked at.
eq(
  'relative path resolves under it',
  pathOfTyped('Budget\\a.txt', docs),
  'C:\\Users\\User\\Documents\\Budget\\a.txt'
);
eq(
  'deeper relative path',
  folderOfTyped('Budget\\2019\\a.txt', docs),
  'C:\\Users\\User\\Documents\\Budget\\2019'
);

// A whole path is used as typed.
eq('whole path is its own folder', folderOfTyped('C:\\Temp\\a.txt', docs), 'C:\\Temp');

// A drive letter is the drive root, not a folder called "C:".
eq('drive letter is the root', folderOfTyped('C:\\a.txt', docs), VOLUME_ROOT);
eq('bare drive', folderOfTyped('C:a.txt', docs), VOLUME_ROOT);

// What a typed folder walks into: these are the paths the dialog navigates to
// when a folder is typed into the File name box, which is how a directory is
// entered without finding it in the list.
eq('walk a whole folder', pathOfTyped('C:\\Users\\User\\Desktop', docs), 'C:\\Users\\User\\Desktop');
eq(
  'walk a folder under the open one',
  pathOfTyped('Desktop', 'C:\\Users\\User'),
  'C:\\Users\\User\\Desktop'
);
eq('joinPath none', joinPath('C:\\Users', ''), 'C:\\Users');
eq('joinPath trailing', joinPath('C:\\Users\\', 'User'), 'C:\\Users\\User');

// What compute() answers, which is what the app is handed.
eq(
  'compute a plain name',
  folderOfTyped('notes', docs) + '\\' + 'notes.txt',
  'C:\\Users\\User\\Documents\\notes.txt'
);
eq(
  'compute a typed path',
  folderOfTyped('C:\\Users\\User\\Desktop\\notes.txt', docs) + '\\' + leafOf(pathOfTyped('C:\\Users\\User\\Desktop\\notes.txt', docs)) + '.txt',
  'C:\\Users\\User\\Desktop\\notes.txt.txt'
);

if (failures.length) {
  console.log('Save As path arithmetic has ' + failures.length + ' failure(s) of ' + checks + ':');
  failures.forEach(function (f) {
    console.log('  ' + f);
  });
  process.exit(1);
}
console.log('Save As path arithmetic is sound: ' + checks + ' checks passed.');
