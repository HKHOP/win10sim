import { createWindow } from './windowmanager.js';
import { mountNtfs } from '../apis/ntfs.js';
import { attachQuickAccess } from '../apis/quickaccess.js';
import { initStartState, setRegistryHook, noteAppRegistered, recordLaunch } from './startstate.js';
import { setCursorBusy } from './cursor.js';

// App registry + launcher: each app registers { id, name, icon, launch }.
// launch receives a context with window creation and shared volume access.
// The volume mounts lazily on first use so boot never blocks on storage.
//
// Manifests also carry Start-menu metadata (tile size/colour, the line under
// the name, whether it shows in the A-Z list), so the Start menu can list
// every registered app without knowing any of them. Apps are discovered
// through the registry, never hard-coded into the shell.

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
// Explorer's Home page reads and writes Quick Access through the same volume.
attachQuickAccess(getVolume);
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

export function registerApp(def) {
  if (!def || !def.id) {
    return;
  }
  def.start = normalizeStart(def);
  registry[def.id] = def;
  // A brand new app is really new; one that came with the profile is not.
  noteAppRegistered(def.id);
}

export function getApp(id) {
  return registry[id] || null;
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

export function launchApp(id, args) {
  const def = registry[id];
  if (!def) {
    return null;
  }
  // Windows puts the spinning ring on the pointer while an app starts, and
  // takes it off once the window is there.
  setCursorBusy(true);
  const context = {
    id: def.id,
    name: def.name,
    getVolume: getVolume,
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
