// Start menu state: the profile's Start layout (which tiles are pinned, in
// what order and at what size) plus when each app first appeared, which is what
// "Recently added" is built from. Windows keeps this per account, so it is
// persisted as JSON on the emulated C: volume; without storage the session
// simply starts like a first boot.
//
// API only — the UI lives in startmenu.js. The volume arrives as a getter
// so sharing the app registry's mount stays lazy: nothing touches storage
// until the Start layout is actually read or written.

var STATE_PATH = 'C:\\Users\\User\\AppData\\Local\\Start\\startmenu.json';
// Win10 stops calling an app "recently added" after a week.
var RECENT_DAYS = 7;
var DAY_MS = 24 * 60 * 60 * 1000;
var TILE_SIZES = ['small', 'medium', 'wide', 'large'];
// The Start tile grid as it starts out: three columns and four rows of tiles,
// which is the size the menu opens at before the user resizes it.
var DEFAULT_START_COLS = 3;
var DEFAULT_START_ROWS = 4;
// Ceilings, so a resize gesture cannot size the menu past the display.
var MAX_START_COLS = 6;
var MAX_START_ROWS = 5;

var state = {
  // appId -> epoch ms the app first appeared in this profile.
  firstSeen: {},
  // [{ appId, size, col, row }] in tile order; the tile grid reads this.
  pins: [],
  // The menu's size in grid cells: Win10 lets Start be dragged bigger and
  // smaller and remembers the size the user left it at.
  startCols: DEFAULT_START_COLS,
  startRows: DEFAULT_START_ROWS,
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
    pins: state.pins,
    startCols: state.startCols,
    startRows: state.startRows,
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
  ['firstSeen'].forEach(function (key) {
    if (stored[key] && typeof stored[key] === 'object') {
      for (var id in stored[key]) {
        if (Object.prototype.hasOwnProperty.call(stored[key], id)) {
          state[key][id] = Number(stored[key][id]) || 0;
        }
      }
    }
  });
  if (Array.isArray(stored.pins)) {
    var storedPins = stored.pins
      .filter(function (pin) { return pin && typeof pin.appId === 'string'; })
      .map(function (pin) {
        return { appId: pin.appId, size: sameSize(pin.size) };
      });
    // Layouts saved before tiles had cells were an ordered list. Packing them
    // in order puts every tile back exactly where it was drawn, so an existing
    // profile keeps the Start layout it had.
    state.pins = [];
    storedPins.forEach(function (pin) {
      var span = spanOf(pin.size);
      var spot = firstFreeCell(state.pins, 0, 0, span[0], span[1], null);
      pin.col = spot.col;
      pin.row = spot.row;
      state.pins.push(pin);
    });
  }
  if (typeof stored.showAppList === 'boolean') {
    state.showAppList = stored.showAppList;
  }
  state.startCols = clampInt(stored.startCols, DEFAULT_START_COLS, 1, MAX_START_COLS);
  state.startRows = clampInt(stored.startRows, DEFAULT_START_ROWS, 0, MAX_START_ROWS);
}

function clampInt(value, fallback, min, max) {
  var n = Number(value);
  if (!isFinite(n)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.round(n)));
}

// Stamps apps that shipped with the profile as old entries (so a used
// install shows no "Recently added"), and lays out the tiles that ship
// pinned. Only a first-boot profile does this; a stored layout wins.
function seedSystemApps() {
  var epoch = 0;
  // The registry answers with appId -> { pinned, tileSize }, so its own keys are
  // the apps: an object has no forEach, and calling one on it meant a first boot
  // never got as far as laying out the tiles that ship pinned.
  var apps = registryApps();
  Object.keys(apps).forEach(function (appId) {
    var info = apps[appId];
    if (state.firstSeen[appId] === undefined) {
      state.firstSeen[appId] = epoch;
    }
    if (info.pinned && !isPinned(appId)) {
      var pin = { appId: appId, size: sameSize(info.tileSize), col: 0, row: 0 };
      var span = spanOf(pin.size);
      var spot = firstFreeCell(state.pins, 0, 0, span[0], span[1], appId);
      pin.col = spot.col;
      pin.row = spot.row;
      state.pins.push(pin);
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

// Registration history ------------------------------------------------------

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

// The Start menu size -------------------------------------------------------

// Win10 snaps the menu to whole tiles as it is dragged and remembers the size
// between sessions. Zero rows is a size like any other: it is what the pinned
// section is hidden at, and the next drag away from the edge brings it back.
export function getStartSize() {
  return {
    cols: gridCols(),
    rows: clampInt(state.startRows, DEFAULT_START_ROWS, 0, MAX_START_ROWS)
  };
}

// The narrowest the grid may be: a wide or large tile needs two columns to sit
// in at all, so the menu cannot be squeezed past what is on it.
function minCols() {
  var widest = 1;
  state.pins.forEach(function (pin) {
    widest = Math.max(widest, spanOf(pin.size)[0]);
  });
  return widest;
}

export function setStartSize(cols, rows) {
  var nextCols = clampInt(cols, DEFAULT_START_COLS, minCols(), MAX_START_COLS);
  var nextRows = clampInt(rows, DEFAULT_START_ROWS, 0, MAX_START_ROWS);
  if (nextCols === gridCols() && nextRows === getStartSize().rows) {
    return false;
  }
  var narrowed = nextCols < gridCols();
  state.startCols = nextCols;
  state.startRows = nextRows;
  // Widening leaves the layout alone: the tiles stay where they were put and
  // the new columns open up beside them. Narrowing takes columns away, so the
  // tiles are packed back into the grid that is left.
  fitPinsToColumns(narrowed);
  pendingSave = true;
  save();
  emit();
  return true;
}

// Pulls every tile inside the columns that are left, and — when columns were
// lost — repacks them in reading order so none of them end up on top of
// another.
function fitPinsToColumns(reflow) {
  var cols = gridCols();
  state.pins.forEach(function (pin) {
    pin.col = Math.max(0, Math.min(pin.col, cols - spanOf(pin.size)[0]));
  });
  if (!reflow) {
    return;
  }
  var order = state.pins.slice().sort(function (a, b) {
    return (a.row - b.row) || (a.col - b.col);
  });
  state.pins = [];
  order.forEach(function (pin) {
    var span = spanOf(pin.size);
    var spot = firstFreeCell(state.pins, 0, 0, span[0], span[1], null);
    pin.col = Math.min(spot.col, Math.max(0, cols - span[0]));
    pin.row = spot.row;
    state.pins.push(pin);
  });
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

// A tile occupies cells: one for small and medium, two across for wide, a 2x2
// block for large. The layout is a grid the user fills in, not a packed list,
// so a pin remembers where it sits.
var TILE_SPANS = {
  small: [1, 1],
  medium: [1, 1],
  wide: [2, 1],
  large: [2, 2]
};
// How far the reflow below may run before we give up looking for room.
var MAX_PLACEMENT_ROWS = 200;

// How wide the grid is right now: the menu is resized in whole columns, so the
// grid the user asked for and the grid tiles are placed in are the same one.
function gridCols() {
  return clampInt(state.startCols, DEFAULT_START_COLS, 1, MAX_START_COLS);
}

function spanOf(size) {
  return TILE_SPANS[size] || TILE_SPANS.medium;
}

function sameSize(size) {
  return TILE_SIZES.indexOf(size) >= 0 ? size : 'medium';
}

// Does the cell block at (col,row), span x span, hit a tile other than
// skipAppId?
function cellTaken(pins, col, row, w, h, skipAppId) {
  for (var i = 0; i < pins.length; i++) {
    var pin = pins[i];
    if (skipAppId && pin.appId === skipAppId) {
      continue;
    }
    var span = spanOf(pin.size);
    if (col < pin.col + span[0] && col + w > pin.col &&
        row < pin.row + span[1] && row + h > pin.row) {
      return true;
    }
  }
  return false;
}

// The first free cell at or after (fromCol, fromRow), reading order, preferring
// the column the tile already sits in so a reflow drops it straight down
// rather than across the grid.
function firstFreeCell(pins, fromCol, fromRow, w, h, skipAppId) {
  var cols = gridCols();
  for (var r = Math.max(0, fromRow); r < fromRow + MAX_PLACEMENT_ROWS; r++) {
    if (fromCol + w <= cols && !cellTaken(pins, fromCol, r, w, h, skipAppId)) {
      return { col: fromCol, row: r };
    }
    for (var c = 0; c < cols; c++) {
      if (c === fromCol || c + w > cols) {
        continue;
      }
      if (!cellTaken(pins, c, r, w, h, skipAppId)) {
        return { col: c, row: r };
      }
    }
  }
  return { col: 0, row: fromRow };
}

function tileOverlapping(pins, pin) {
  var span = spanOf(pin.size);
  for (var i = 0; i < pins.length; i++) {
    var other = pins[i];
    if (other === pin) {
      continue;
    }
    var oSpan = spanOf(other.size);
    if (pin.col < other.col + oSpan[0] && pin.col + span[0] > other.col &&
        pin.row < other.row + oSpan[1] && pin.row + span[1] > other.row) {
      return other;
    }
  }
  return null;
}

// Puts a tile on a cell and settles whatever it lands on: each tile it
// displaces moves to the first free cell forward from where it was, so the
// grid fills in behind the drag instead of leaving holes. Returns whether
// anything actually moved, which is what lets a drag across one cell not
// re-render the whole grid.
function placePin(pins, pin, col, row) {
  var span = spanOf(pin.size);
  var moved = false;
  if (pin.col !== col || pin.row !== row) {
    moved = true;
  }
  pin.col = Math.max(0, Math.min(col, gridCols() - span[0]));
  pin.row = Math.max(0, row);
  for (var guard = 0; guard < pins.length * 4 + 8; guard++) {
    var hit = tileOverlapping(pins, pin);
    if (!hit) {
      return moved;
    }
    var spot = firstFreeCell(pins, hit.col, hit.row, spanOf(hit.size)[0], spanOf(hit.size)[1], hit.appId);
    if (spot.col !== hit.col || spot.row !== hit.row) {
      moved = true;
    }
    hit.col = spot.col;
    hit.row = spot.row;
  }
  return moved;
}

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
  var pin = { appId: appId, size: sameSize(size), col: 0, row: 0 };
  state.pins.push(pin);
  var span = spanOf(pin.size);
  var spot = firstFreeCell(state.pins, 0, 0, span[0], span[1], appId);
  pin.col = spot.col;
  pin.row = spot.row;
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

// Resizing a tile changes the cells it covers, so it is placed again: it stays
// where it was and anything now underneath it moves on.
export function setPinSize(appId, size) {
  var at = indexOfPin(appId);
  if (at < 0 || TILE_SIZES.indexOf(size) < 0) {
    return false;
  }
  if (state.pins[at].size === size) {
    return true;
  }
  var pin = state.pins[at];
  pin.size = size;
  placePin(state.pins, pin, pin.col, pin.row);
  pendingSave = true;
  save();
  emit();
  return true;
}

// Moving a tile: it takes the cell it is dropped on and the grid fills in
// around it. Returns false when nothing moved, so a drag that stays inside one
// cell costs nothing.
export function movePin(appId, col, row) {
  var pin = state.pins[indexOfPin(appId)];
  if (!pin) {
    return false;
  }
  if (!placePin(state.pins, pin, col, row)) {
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
