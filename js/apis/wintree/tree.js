import { ROOT } from './root.js';

// The Windows file tree the emulated C: drive shows, and the rules about what
// may be done to it.
//
// ---- the notation the tables in this folder use ----
//   an object   is a directory, and its keys are its entries
//   a number    is a file of that size in bytes
//   a string    is a file whose content the tree can hand back when something
//               opens it; a file with no string is a name to browse, and reads
//               as empty
// Nothing here is ever written anywhere. The tables are read once into a flat
// lookup and consulted in memory, which is what lets the drive carry several
// hundred Windows entries without costing a single byte of storage - the whole
// point being that a person can browse C:\Windows on a phone without filling it.
//
// ---- the rules ----
// Windows protects its own files, and the protection is not advisory: a delete
// of anything below C:\Windows, or of a boot file at the root, is refused
// rather than carried out. The signed-in account's own folders are not
// protected, because those are the ones a person is meant to own.

const SYSTEM_TIME = Date.UTC(2021, 4, 18);

// Folders Windows owns. Deleting inside any of them is refused.
const PROTECTED_TOP = [
  '$Recycle.Bin',
  '$WinREAgent',
  'Boot',
  'Config.Msi',
  'Documents and Settings',
  'EFI',
  'Intel',
  'MSOCache',
  'PerfLogs',
  'Program Files',
  'Program Files (x86)',
  'ProgramData',
  'Recovery',
  'System Volume Information',
  'Windows',
  'inetpub'
];

// Files at the root that belong to the firmware rather than to Windows.
const PROTECTED_ROOT_FILES = ['BOOTNXT', 'bootmgr', 'DumpStack.log.tmp', 'hiberfil.sys', 'pagefile.sys', 'swapfile.sys'];

// Accounts that are not the one sitting at the keyboard, and the files Windows
// keeps inside every account's profile.
const PROTECTED_ACCOUNTS = ['All Users', 'Default', 'Default User'];
const PROTECTED_PROFILE_FILES = ['NTUSER.DAT', 'UsrClass.dat', 'ntuser.dat'];

const SIGNED_IN = 'User';

// Everything below this path is the signed-in user's own, which is where the
// only writes on the drive are allowed. The bin is the other one: Explorer
// moves things into it and Notepad saves into the profile.
function writable(segments) {
  if (segments.length === 0) {
    // Not even a file may be dropped in the root of C:.
    return false;
  }
  if (segments[0] === '$Recycle.Bin') {
    return true;
  }
  return segments[0] === 'Users' && segments[1] === SIGNED_IN;
}

function protectedPath(segments) {
  if (segments.length === 0) {
    return true;
  }
  const head = segments[0];
  if (PROTECTED_TOP.indexOf(head) >= 0) {
    return true;
  }
  if (segments.length === 1 && PROTECTED_ROOT_FILES.indexOf(head) >= 0) {
    return true;
  }
  if (head === 'Users' && segments.length >= 2) {
    if (PROTECTED_ACCOUNTS.indexOf(segments[1]) >= 0) {
      return true;
    }
    // The profile folder itself is not a thing to delete; what is inside it is.
    if (segments.length === 2 && segments[1] === SIGNED_IN) {
      return true;
    }
    return PROTECTED_PROFILE_FILES.indexOf(segments[segments.length - 1]) >= 0;
  }
  // C:\Users itself: deleting it would take every account with it.
  return head === 'Users';
}

// ---- the flat lookup ----

const NODES = new Map();

function keyOf(segments) {
  return segments.join('\\').toLowerCase();
}

function fileNode(name, value) {
  return {
    name: name,
    type: 'file',
    size: typeof value === 'number' ? value : 0,
    content: typeof value === 'string' ? value : null,
    modified: SYSTEM_TIME
  };
}

function dirNode(name) {
  return {
    name: name,
    type: 'dir',
    size: 0,
    content: null,
    modified: SYSTEM_TIME,
    children: new Map()
  };
}

function build(prefix, table) {
  const node = dirNode(prefix.length ? prefix[prefix.length - 1] : 'C:');
  NODES.set(keyOf(prefix), node);
  Object.keys(table).forEach(function (name) {
    const value = table[name];
    const segments = prefix.concat(name);
    const child = (value && typeof value === 'object') ? build(segments, value) : fileNode(name, value);
    NODES.set(keyOf(segments), child);
    node.children.set(name.toLowerCase(), child);
  });
  return node;
}

build([], ROOT);

// The entry a path names, or null when the tree has never heard of it. The root
// itself answers, so `C:\` can be listed like any other folder.
export function winStat(segments) {
  const node = NODES.get(keyOf(segments));
  return node || null;
}

// A folder's entries, by the name as it is written on disk (not as the caller
// happened to type it), or null when the path is not a folder here.
export function winChildren(segments) {
  const node = NODES.get(keyOf(segments));
  return (node && node.type === 'dir') ? node.children : null;
}

export function winIsProtected(segments) {
  return protectedPath(segments);
}

export function winWritable(segments) {
  return writable(segments);
}

// What a visual file holds: its own content where it has any, and nothing at
// all where it does not. A file nobody has ever written is empty, and this one
// is nobody's.
export function winContent(node) {
  return (node && typeof node.content === 'string') ? node.content : '';
}