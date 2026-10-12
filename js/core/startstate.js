// Start menu state: the profile's Start layout (which tiles are pinned, in
// what order and at what size) plus the launch history that feeds "Most
// used" and "Recently added". Windows keeps this per account, so it is
// persisted as JSON on the emulated C: volume; without storage the session
// simply starts like a first boot.
//
// API only — the UI lives in startmenu.js. The volume arrives as a getter
// so sharing the app registry's mount stays lazy: nothing touches storage
// until the Start layout is actually read or written.

var STATE_PATH = 'C:\\Users\\User\\AppData\\Local\\Start\\startmenu.json';
var MAX_MOST_USED = 6;
// Win10 stops calling an app "recently added" after a week.
var RECENT_DAYS = 7;
var DAY_MS = 24 * 60 * 60 * 1000;
var TILE_SIZES = ['small', 'medium', 'wide', 'large'];

var state = {
  // appId -> launch count (Win10's Most used ordering key).
  launches: {},
  // appId -> epoch ms of the last launch, breaking count ties.
  lastLaunch: {},
  // appId -> epoch ms the app first appeared in this profile.
  firstSeen: {},
  // [{ appId, size }] in tile order; the tile grid reads this.
  pins: [],
  // Settings > Personalization > Start > "Show app list": when off, Start
  // shows the tiles alone and the rail offers a way back to the list.
  showAppList: true
};

var volumeGetter = null;
var storageReady = false;
// True only until a stored Start layout is found or the first boot seeds it.
var freshProfile = false;
var listeners = [];
var saveTimer = null;
var pendingSave = false;

export function initStartState(getVolumeFn) {
  volumeGetter = typeof getVolumeFn === 'function' ? getVolumeFn : null;
  load();
}

function volume() {
  if (!volumeGetter) {
    return Promise.resolve(null);
  }
  return Promise.resolve(volumeGetter());
}

function snapshot() {
  return {
    launches: state.launches,
    pins: state.pins,
    showAppList: state.showAppList
  };
}

function emit() {
  var snap = snapshot();
  listeners.forEach(function (fn) {
    fn(snap);
  });
}

// Start state listeners (the menu re-renders when pins or counts change).
export function subscribeStartState(fn) {
  listeners.push(fn);
  fn(snapshot());
}

// Persistence --------------------------------------------------------------

async function readState() {
  if (!volumeGetter) {
    return null;
  }
  try {
    var vol = await volume();
    if (!vol || !vol.available) {
      return null;
    }
    var file = await vol.readFile(STATE_PATH);
    var text = await file.text();
    var parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (err) {
    // No stored layout yet (first boot), or storage is unavailable.
    return null;
  }
}

async function load() {
  var stored = await readState();
  storageReady = true;
  if (stored) {
    mergeState(stored);
    emit();
  } else {
    // First boot on this profile: everything already registered belongs to
    // the system image, not to a fresh install, so nothing reads as newly
    // added, and the apps that ship pinned come up already on the Start
    // layout. Apps registered later get real registration stamps and their
    // own default pins.
    freshProfile = true;
    seedSystemApps();
    emit();
  }
}

function mergeState(stored) {
  ['launches', 'lastLaunch', 'firstSeen'].forEach(function (key) {
    if (stored[key] && typeof stored[key] === 'object') {
      for (var id in stored[key]) {
        if (Object.prototype.hasOwnProperty.call(stored[key], id)) {
          state[key][id] = Number(stored[key][id]) || 0;
        }
      }
    }
  });
  if (Array.isArray(stored.pins)) {
    state.pins = stored.pins
      .filter(function (pin) { return pin && typeof pin.appId === 'string'; })
      .map(function (pin) {
        return { appId: pin.appId, size: TILE_SIZES.indexOf(pin.size) >= 0 ? pin.size : 'medium' };
      });
  }
  if (typeof stored.showAppList === 'boolean') {
    state.showAppList = stored.showAppList;
  }
}

// Stamps apps that shipped with the profile as old entries (so a used
// install shows no "Recently added"), and lays out the tiles that ship
// pinned. Only a first-boot profile does this; a stored layout wins.
function seedSystemApps() {
  var epoch = 0;
  registryApps().forEach(function (appId, info) {
    if (state.firstSeen[appId] === undefined) {
      state.firstSeen[appId] = epoch;
    }
    if (info.pinned && !isPinned(appId)) {
      state.pins.push({ appId: appId, size: info.tileSize || 'medium' });
    }
  });
}

// Injected by the app registry: appId -> { pinned, tileSize }. Kept as a
// hook so this module never imports back into core/.
var registryHook = null;

export function setRegistryHook(fn) {
  registryHook = fn;
}

function registryApps() {
  return (registryHook && registryHook()) || {};
}

function flush() {
  pendingSave = false;
  if (!volumeGetter) {
    return;
  }
  volume().then(function (vol) {
    if (!vol || !vol.available) {
      return;
    }
    return vol.writeFile(STATE_PATH, JSON.stringify(snapshot())).catch(function () {
      // Storage is best-effort: an unwritten layout never blocks the UI.
    });
  }).catch(function () {
    // No volume: in-memory only.
  });
}

// Saves are coalesced: launching an app must not hammer storage.
function save() {
  if (saveTimer) {
    window.clearTimeout(saveTimer);
  }
  saveTimer = window.setTimeout(function () {
    saveTimer = null;
    flush();
  }, 250);
}

// Win10 writes the layout the moment you change it, so a pending change is
// flushed when the page goes away too.
window.addEventListener('beforeunload', function () {
  if (pendingSave) {
    pendingSave = false;
    flush();
  }
});

// Launch history -----------------------------------------------------------

export function recordLaunch(appId) {
  if (!appId) {
    return;
  }
  state.launches[appId] = (state.launches[appId] || 0) + 1;
  state.lastLaunch[appId] = Date.now();
  pendingSave = true;
  save();
  emit();
}

// Called by the registry when an app registers, so genuinely new apps come
// up in "Recently added" while preinstalled ones do not. On a first-boot
// profile an app that ships pinned also lands on the Start layout.
export function noteAppRegistered(appId) {
  if (!appId) {
    return;
  }
  if (state.firstSeen[appId] === undefined) {
    state.firstSeen[appId] = storageReady ? Date.now() : 0;
  }
  var info = registryApps()[appId];
  if (freshProfile && info && info.pinned && !isPinned(appId)) {
    state.pins.push({ appId: appId, size: info.tileSize || 'medium' });
  }
  save();
  emit();
}

export function getLaunchCount(appId) {
  return state.launches[appId] || 0;
}

// Most used: by count, then by how recently it ran. Win10 caps the section
// at six rows.
export function getMostUsed(limit) {
  var max = limit || MAX_MOST_USED;
  var now = Date.now();
  return Object.keys(state.launches)
    .filter(function (id) { return state.launches[id] > 0; })
    .sort(function (a, b) {
      if (state.launches[b] !== state.launches[a]) {
        return state.launches[b] - state.launches[a];
      }
      var at = state.lastLaunch[a] || now;
      var bt = state.lastLaunch[b] || now;
      return bt - at;
    })
    .slice(0, max);
}

// Recently added: apps that appeared inside the recent window, newest
// first. Apps stamped at 0 came with the profile and never qualify.
export function getRecentlyAdded(limit) {
  var max = limit || 3;
  var cutoff = Date.now() - RECENT_DAYS * DAY_MS;
  return Object.keys(state.firstSeen)
    .filter(function (id) {
      var seen = state.firstSeen[id];
      return seen > cutoff;
    })
    .sort(function (a, b) { return state.firstSeen[b] - state.firstSeen[a]; })
    .slice(0, max);
}

// App list visibility -------------------------------------------------------

// True when Start opens on the app list beside the tiles (the default).
export function getShowAppList() {
  return state.showAppList !== false;
}

// Win10 remembers the choice across sessions, so this is persisted like the
// rest of the Start layout.
export function setShowAppList(show) {
  var next = show !== false;
  if (next === state.showAppList) {
    return;
  }
  state.showAppList = next;
  pendingSave = true;
  save();
  emit();
}

// Tile pins ----------------------------------------------------------------

export function getPins() {
  return state.pins.slice();
}

export function isPinned(appId) {
  return state.pins.some(function (pin) { return pin.appId === appId; });
}

export function pinApp(appId, size) {
  if (!appId || isPinned(appId)) {
    return false;
  }
  state.pins.push({ appId: appId, size: TILE_SIZES.indexOf(size) >= 0 ? size : 'medium' });
  pendingSave = true;
  save();
  emit();
  return true;
}

export function unpinApp(appId) {
  var at = indexOfPin(appId);
  if (at < 0) {
    return false;
  }
  state.pins.splice(at, 1);
  pendingSave = true;
  save();
  emit();
  return true;
}

export function setPinSize(appId, size) {
  var at = indexOfPin(appId);
  if (at < 0 || TILE_SIZES.indexOf(size) < 0) {
    return false;
  }
  if (state.pins[at].size === size) {
    return true;
  }
  state.pins[at].size = size;
  pendingSave = true;
  save();
  emit();
  return true;
}

// Drag-reordering of tiles: move a pinned app to a new slot in the grid and
// the rest reflow, like Win10. Returns false when the order is unchanged.
export function movePin(appId, toIndex) {
  var from = indexOfPin(appId);
  if (from < 0) {
    return false;
  }
  var pin = state.pins.splice(from, 1)[0];
  var at = Math.max(0, Math.min(state.pins.length, toIndex));
  state.pins.splice(at, 0, pin);
  if (at === from) {
    return false;
  }
  pendingSave = true;
  save();
  emit();
  return true;
}

export function indexOfPin(appId) {
  for (var i = 0; i < state.pins.length; i++) {
    if (state.pins[i].appId === appId) {
      return i;
    }
  }
  return -1;
}
