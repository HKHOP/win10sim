// Shortcuts: the .lnk file that points at something else.
//
// Windows stores a shortcut as a Shell Link - a binary IShellLink structure
// (MS-SHLLINK) describing the target, the working directory, the icon, the
// window state and so on. The same objection applies as with ink: there is no
// build step in this project, so nothing compiles a binary writer, and a real
// Shell Link would mean nothing to anything here anyway. A shortcut in this
// simulator is therefore a JSON record under the .lnk name, holding the same
// fields Windows holds, and read back by the shell that wrote it.
//
// What that buys is the behaviour, which is the part anyone meets: a shortcut
// names a target, resolves it at the moment it is opened, shows an arrow over
// the target's own icon, and reports a broken link when the target has gone.

export const LINK_EXTENSION = 'lnk';
export const SHORTCUT_TYPE = 'Shortcut';

const FORMAT = 'shell-link';
const VERSION = 1;

export function isShortcutName(name) {
  return new RegExp('\\.' + LINK_EXTENSION + '$', 'i').test(String(name || ''));
}

// "notes.txt - Shortcut.lnk", the name Windows gives a new shortcut: the whole
// name is kept, extension and all.
export function shortcutNameFor(name) {
  return String(name || '') + ' - Shortcut.' + LINK_EXTENSION;
}

function normalizeTarget(target) {
  if (!target || typeof target !== 'object') {
    return null;
  }
  if (target.kind === 'app') {
    if (!target.appId) {
      return null;
    }
    return { kind: 'app', appId: target.appId, args: target.args || null };
  }
  if (!target.place) {
    return null;
  }
  return { kind: 'file', place: target.place };
}

export function serializeLink(link) {
  var target = normalizeTarget(link.target);
  return JSON.stringify({
    format: FORMAT,
    version: VERSION,
    target: target,
    workingDir: link.workingDir || '',
    description: link.description || '',
    hotkey: link.hotkey || '',
    windowStyle: link.windowStyle || 'normal',
    created: link.created || 0
  }, null, 2);
}

// A file with a .lnk name that is not one is not a shortcut - it is just a
// file somebody called that. Read as nothing rather than as broken markup.
export function parseLink(text) {
  var parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    return null;
  }
  if (!parsed || parsed.format !== FORMAT) {
    return null;
  }
  var target = normalizeTarget(parsed.target);
  if (!target) {
    return null;
  }
  return {
    target: target,
    workingDir: parsed.workingDir || '',
    description: parsed.description || '',
    hotkey: parsed.hotkey || '',
    windowStyle: parsed.windowStyle || 'normal',
    created: parsed.created || 0
  };
}

export function createFileLink(place, isDir) {
  var name = String(place).split('\\').pop() || place;
  return {
    target: { kind: 'file', place: place },
    workingDir: isDir ? place : parentOf(place),
    description: 'Shortcut to: ' + name,
    hotkey: '',
    windowStyle: 'normal',
    created: Date.now()
  };
}

export function createAppLink(appId, args, label) {
  return {
    target: { kind: 'app', appId: appId, args: args || null },
    workingDir: '',
    description: 'Shortcut to: ' + (label || appId),
    hotkey: '',
    windowStyle: 'normal',
    created: Date.now()
  };
}

function parentOf(place) {
  var parts = String(place).split('\\').filter(Boolean);
  parts.pop();
  return parts.join('\\') || 'C:\\';
}

export function readShortcut(volume, path) {
  return volume.readFile(path).then(function (file) {
    return file.text().then(function (text) {
      return parseLink(text);
    });
  }, function () {
    return null;
  });
}

export function writeShortcut(volume, path, link) {
  return volume.writeFile(path, serializeLink(link));
}

// What Windows shows on a shortcut's Properties, and what decides whether the
// arrow is drawn: the target it names, and whether that target is still there.
// A file target is checked against the volume; an app target is left to the
// caller, which is the only side that knows the app registry.
export function describeLink(link) {
  var target = normalizeTarget(link.target);
  if (!target) {
    return { kind: 'unknown', label: 'Unknown' };
  }
  if (target.kind === 'app') {
    return { kind: 'app', label: target.appId, target: target };
  }
  var name = String(target.place).split('\\').pop() || target.place;
  return { kind: 'file', label: name, place: target.place, target: target };
}

export function targetExists(volume, link) {
  var target = normalizeTarget(link.target);
  if (!target || target.kind !== 'file') {
    // An app target is resolved by the shell that owns the registry.
    return Promise.resolve(true);
  }
  return volume.stat(target.place).then(function () {
    return true;
  }, function () {
    return false;
  });
}

// Writes a shortcut next to what it points at, the way Windows does. The caller
// passes the folder to put it in; a folder with no room for the new name gets
// "... - 2.lnk", and so on, so a second shortcut never overwrites the first.
export function createShortcutFile(volume, link, dir, name) {
  var wanted = name || shortcutNameFor(describeLink(link).label);
  function attempt(index) {
    var candidate = index === 0
      ? wanted
      : wanted.replace(/\.lnk$/i, ' - ' + (index + 1) + '.lnk');
    var place = String(dir).endsWith('\\') ? dir + candidate : dir + '\\' + candidate;
    return volume.writeFile(place, serializeLink(link)).then(function () {
      return place;
    }, function () {
      // Taken already: try the next number.
      return attempt(index + 1);
    });
  }
  return attempt(0);
}
