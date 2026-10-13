import { createWindow } from './windowmanager.js';
import { openPopup } from './popup.js';
import { mountNtfs } from '../apis/ntfs.js';
import { attachQuickAccess } from '../apis/quickaccess.js';
import { attachAssociations, registerAssociations } from '../apis/associations.js';
import { APP_PERMISSIONS } from '../global/constants.js';
import { initStartState, setRegistryHook, noteAppRegistered, recordLaunch } from './startstate.js';
import { setCursorBusy } from './cursor.js';

// App registry + launcher: each app registers { id, name, icon, manifest,
// launch }. The manifest is what the app says about itself - who publishes it,
// which version, what it may ask of the shell, and which files it opens - and
// the shell keeps the rest of the book: Start-menu metadata (tile size/colour,
// the line under the name, whether it shows in the A-Z list), file type
// associations and launch counts. Apps are discovered through the registry,
// never hard-coded into the shell.
//
// launch receives a context with window creation and shared volume access. The
// volume mounts lazily on first use so boot never blocks on storage, and an app
// only ever gets it if its manifest asked for storage.

const registry = {};
let volumePromise = null;

const TILE_SIZES = ['small', 'medium', 'wide', 'large'];

export function getVolume() {
  if (!volumePromise) {
    volumePromise = mountNtfs();
  }
  return volumePromise;
}

// The Start state store shares the registry's single (lazy) volume mount,
// and asks this hook what ships pinned so a first boot comes up with the
// profile's default Start layout.
initStartState(getVolume);
// Explorer's Quick access page and the file type table read and write through
// the same volume.
attachQuickAccess(getVolume);
attachAssociations(getVolume);
setRegistryHook(function () {
  var out = {};
  Object.keys(registry).forEach(function (id) {
    var start = registry[id].start || {};
    out[id] = {
      pinned: !!start.pinned,
      tileSize: start.tile ? start.tile.size : 'medium'
    };
  });
  return out;
});

// Default Start presence: an app with no metadata simply appears under its
// name in the A-Z list with no tile.
function normalizeStart(def) {
  const declared = def.start || {};
  const tile = declared.tile ? {
    size: TILE_SIZES.indexOf(declared.tile.size) >= 0 ? declared.tile.size : 'medium',
    icon: declared.tile.icon || def.icon || '',
    color: declared.tile.color || '#0078d7',
    background: declared.tile.background || '',
    // Live tiles render content on an interval; only opted-in tiles do.
    live: declared.tile.live || null,
    badge: declared.tile.badge || ''
  } : null;
  return {
    name: declared.name || def.name || def.id,
    icon: def.icon || '',
    // Second line in Most used rows (Win10 shows the publisher there).
    subtitle: declared.subtitle || '',
    tile: tile,
    pinned: !!declared.pinned,
    // Hidden apps exist for launching but stay out of the menu.
    hidden: !!declared.hidden,
    order: declared.order || 0
  };
}

// What the app says about itself. Normalized once, at registration, so every
// later reader sees the same shape whatever the app left out.
function normalizeManifest(def) {
  const declared = def.manifest || {};
  const permissions = [];
  (Array.isArray(declared.permissions) ? declared.permissions : []).forEach(function (name) {
    if (APP_PERMISSIONS[name] && permissions.indexOf(name) < 0) {
      permissions.push(name);
    }
  });
  const associations = [];
  (Array.isArray(declared.associations) ? declared.associations : []).forEach(function (group) {
    if (!group) {
      return;
    }
    const exts = (Array.isArray(group.ext) ? group.ext : [group.ext])
      .map(function (ext) { return String(ext || '').replace(/^\./, '').toLowerCase(); })
      .filter(Boolean);
    if (exts.length === 0) {
      return;
    }
    associations.push({
      ext: exts,
      type: group.type || '',
      role: group.role || 'handler'
    });
  });
  return {
    publisher: declared.publisher || 'Unknown publisher',
    version: declared.version || '1.0.0.0',
    description: declared.description || '',
    permissions: permissions,
    associations: associations
  };
}

export function registerApp(def) {
  if (!def || !def.id) {
    return;
  }
  def.start = normalizeStart(def);
  def.manifest = normalizeManifest(def);
  registry[def.id] = def;
  // The file types this app claims go straight into the shell's table, the way
  // a registered app writes its own ProgIDs into HKCR.
  registerAssociations(def.id, def.manifest);
  // A brand new app is really new; one that came with the profile is not.
  noteAppRegistered(def.id);
}

export function getApp(id) {
  return registry[id] || null;
}

export function getManifest(id) {
  const def = registry[id];
  return def ? def.manifest : null;
}

export function hasApp(id) {
  return !!registry[id];
}

// App discovery: every registered app with its normalized Start presence,
// alphabetical the way the Start menu lists them.
export function listStartApps() {
  return Object.keys(registry)
    .map(function (id) {
      const def = registry[id];
      return {
        id: id,
        name: def.start.name,
        icon: def.start.icon,
        subtitle: def.start.subtitle,
        tile: def.start.tile,
        pinned: def.start.pinned,
        hidden: def.start.hidden,
        order: def.start.order
      };
    })
    .filter(function (entry) { return !entry.hidden; })
    .sort(function (a, b) {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      return a.name.localeCompare(b.name);
    });
}

// A volume an app gets when its manifest never asked for storage: the same
// shape as the real one, but unavailable, so an app's own "no storage" path
// runs instead of a crash.
function lockedVolume(appName) {
  return Promise.resolve({
    available: false,
    label: '',
    reason: appName + ' was not given permission to use your files.'
  });
}

export function launchApp(id, args) {
  const def = registry[id];
  if (!def) {
    return null;
  }
  const manifest = def.manifest;
  const mayUseFiles = manifest.permissions.indexOf('storage') >= 0;
  // Windows puts the spinning ring on the pointer while an app starts, and
  // takes it off once the window is there.
  setCursorBusy(true);
  const context = {
    id: def.id,
    name: def.name,
    manifest: manifest,
    hasPermission: function (name) {
      return manifest.permissions.indexOf(name) >= 0;
    },
    // The permission is checked here rather than inside the app: an app that
    // has not asked for storage never reaches the files.
    getVolume: function () {
      return mayUseFiles ? getVolume() : lockedVolume(def.name);
    },
    // How an app asks the shell for a dialog. The popup is the one surface
    // every app gets without asking: a window, a set of controls and buttons,
    // and an answer.
    popup: function (spec) {
      return openPopup(context, spec);
    },
    createWindow: function (opts) {
      const merged = Object.assign({}, opts, { appId: def.id });
      if (!merged.icon && def.icon) {
        merged.icon = def.icon;
      }
      if (!merged.title) {
        merged.title = def.name;
      }
      return createWindow(merged);
    }
  };
  let result;
  try {
    result = def.launch(context, args);
  } finally {
    // Two frames: one to put the started window on screen, one to be sure the
    // ring was seen doing its job before it is taken off.
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        setCursorBusy(false);
      });
    });
  }
  // Win10 counts a launch for Most used as soon as the app starts.
  recordLaunch(id);
  return result;
}
