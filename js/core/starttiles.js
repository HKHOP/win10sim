// Start menu tile grid: Win10's live tiles — which apps are pinned, at
// what size (small / medium / wide / large), their artwork and colour, and
// the badge or live content an app pushes into its tile.
//
// Tiles are driven entirely by the app registry's Start metadata plus the
// pinned layout in the Start state store, so pinning, resizing, reordering
// and live content work for any app that registers later without shell
// changes. Dragging works the way Win10's does: press and move a tile to
// reorder the grid, or grab a tile edge to resize it.

import { APP_TILE_SVG } from '../global/icons.js';
import { getApp, listStartApps, launchApp } from './apps.js';
import { showContextMenu } from './contextmenu.js';
import { unpinApp, getPins, setPinSize, movePin, indexOfPin } from './startstate.js';
import { createPointerTracker } from './pointer.js';

// A drag only counts once the pointer has travelled this far, so a press
// and release on a tile still launches the app.
var DRAG_THRESHOLD_PX = 6;
// Live tiles the Start menu is currently animating (only while the menu is
// open, like Win10): appId -> { intervalMs, render }.
var liveTiles = {};
// Current tile element per app, so badges published later can find it.
var tileNodes = {};
var launchHandler = null;
var tracker = null;
var drag = null;
// Set when a gesture ended in a drag, so the release click does not launch.
var swallowClick = false;

function tileSizeClass(size) {
  return 'start-tile-' + (size || 'medium');
}

function buildTileArt(entry, pinSize) {
  var art = document.createElement('div');
  art.className = 'start-tile-art ' + tileSizeClass(pinSize);

  var glyph;
  if (entry.tile.icon) {
    glyph = document.createElement('img');
    glyph.src = entry.tile.icon;
    glyph.alt = '';
    glyph.draggable = false;
  } else {
    glyph = document.createElement('span');
    glyph.className = 'start-tile-glyph';
    glyph.innerHTML = APP_TILE_SVG;
  }
  art.appendChild(glyph);

  // Tiles paint in the app's colour unless they bring their own artwork
  // background (a flat colour or an image handled in CSS).
  art.style.background = entry.tile.background || entry.tile.color || '#0078d7';

  var badge = document.createElement('span');
  badge.className = 'start-tile-badge';
  badge.hidden = true;
  art.appendChild(badge);
  return art;
}

// Win10's resize handles: one on the right edge (medium <-> wide) and one
// along the bottom (medium <-> large). They show on hover like the real
// ones, and are sized for touch. The grip does not stop the press from
// reaching the grid: beginDrag checks for a grip first and takes over.
function buildGrips(tile) {
  ['x', 'y'].forEach(function (axis) {
    var grip = document.createElement('div');
    grip.className = 'start-tile-grip start-tile-grip-' + axis;
    grip.dataset.axis = axis;
    tile.appendChild(grip);
  });
}

function buildTile(entry, pin) {
  var tile = document.createElement('div');
  tile.className = 'start-tile ' + tileSizeClass(pin.size);
  tile.dataset.appId = entry.id;
  tile.setAttribute('role', 'button');
  tile.tabIndex = -1;
  tile.setAttribute('aria-label', entry.name);

  var art = buildTileArt(entry, pin.size);

  // Win10 draws the app name under the tile, except on a small tile.
  var label = null;
  if (pin.size !== 'small') {
    label = document.createElement('span');
    label.className = 'start-tile-label';
    label.textContent = entry.name;
  }

  tile.appendChild(art);
  if (label) {
    tile.appendChild(label);
  }
  buildGrips(tile);

  tile.addEventListener('click', function (event) {
    event.stopPropagation();
    if (swallowClick) {
      // The gesture was a drag/reorder, not a launch.
      swallowClick = false;
      return;
    }
    onLaunchTile(entry.id);
  });

  // Right-press opens Win10's tile menu: unpin, resize, live tile on/off.
  var openMenu = function (event) {
    var point = event.detail && typeof event.detail.clientX === 'number'
      ? { x: event.detail.clientX, y: event.detail.clientY }
      : { x: event.clientX, y: event.clientY };
    event.preventDefault();
    event.stopPropagation();
    openTileMenu(point.x, point.y, entry, pin);
  };
  tile.addEventListener('contextmenu', openMenu);
  tile.addEventListener('simcontextmenu', openMenu);

  return tile;
}

function openTileMenu(x, y, entry, pin) {
  showContextMenu(x, y, [
    {
      label: 'Unpin from Start',
      action: function () { unpinApp(entry.id); }
    },
    { separator: true },
    { label: 'Small', checked: pin.size === 'small', action: function () { setPinSize(entry.id, 'small'); } },
    { label: 'Medium', checked: pin.size === 'medium', action: function () { setPinSize(entry.id, 'medium'); } },
    { label: 'Wide', checked: pin.size === 'wide', action: function () { setPinSize(entry.id, 'wide'); } },
    { label: 'Large', checked: pin.size === 'large', action: function () { setPinSize(entry.id, 'large'); } },
    { separator: true },
    { label: 'More', submenu: [
      { label: 'Pin to taskbar', disabled: true },
      { separator: true },
      { label: 'App settings', disabled: true },
      { label: 'Rate and review', disabled: true },
      { label: 'Share', disabled: true }
    ] }
  ]);
}

export function setTileLaunchHandler(fn) {
  launchHandler = fn;
}

function onLaunchTile(appId) {
  launchApp(appId);
  if (launchHandler) {
    launchHandler();
  }
}

export function buildTileGrid(cursor, stage) {
  var grid = document.createElement('div');
  grid.className = 'start-tiles';
  tracker = tracker || createPointerTracker(cursor, stage);
  installGestures(grid);
  return grid;
}

// Rebuilds the grid from the pinned layout. Anything an app pushes into a
// live tile keeps working, because live renderers are re-run on the fresh
// element by refreshLiveTiles below.
export function renderTileGrid(grid) {
  clearTimers();
  tileNodes = {};
  while (grid.firstChild) {
    grid.removeChild(grid.firstChild);
  }
  var entries = {};
  listStartApps().forEach(function (entry) {
    entries[entry.id] = entry;
  });
  getPins().forEach(function (pin) {
    var entry = entries[pin.appId] || appEntryFor(pin.appId);
    if (!entry) {
      return;
    }
    var tile = buildTile(entry, pin);
    // A drag in progress survives the rebuild that a reorder triggers: the
    // tile stays lifted, and stays under the pointer.
    if (drag && drag.moved && drag.appId === pin.appId) {
      tile.classList.add('is-dragging');
      if (drag.lift) {
        tile.style.translate = drag.lift;
      }
    }
    tileNodes[pin.appId] = tile;
    grid.appendChild(tile);
  });
  refreshLiveTiles(grid);
}

function appEntryFor(appId) {
  var def = getApp(appId);
  if (!def) {
    return null;
  }
  return {
    id: appId,
    name: def.start.name,
    icon: def.start.icon,
    tile: def.start.tile
  };
}

// --- Dragging: reorder, and resize from an edge -------------------------

// The press lifecycle has to follow the real press: a routed click compresses
// down+up into one instant, so only a device press can show a drag. The real
// press says nothing about where the pointer pointed (it lands on the capture
// layer, or is retargeted at the locked stage), so the target is hit-tested
// under the emulated cursor.
function installGestures(grid) {
  // Routed presses (the emulated cursor's own clicks, touch holds) start a
  // gesture on the spot; a real press behind them takes over.
  grid.addEventListener('mousedown', function (event) {
    if (!event.isTrusted) {
      beginDrag(grid, event.target, 'synthetic');
    }
  });

  window.addEventListener('mousedown', function (event) {
    if (!event.isTrusted) {
      return;
    }
    var pos = tracker.position();
    var client = tracker.toClient(pos.x, pos.y);
    var target = tracker.hitTest(client.x, client.y);
    if (target && grid.contains(target)) {
      beginDrag(grid, target, 'real');
    }
  });

  window.addEventListener('mousemove', onDragMove);
  window.addEventListener('touchmove', onDragMove, { passive: true });
  window.addEventListener('mouseup', endDrag);
  window.addEventListener('touchend', endDrag);
  window.addEventListener('touchcancel', endDrag);
}

function beginDrag(grid, target, origin) {
  if (!target || !target.closest) {
    return;
  }
  var grip = target.closest('.start-tile-grip');
  var tile = target.closest('.start-tile');
  if (!tile) {
    return;
  }
  var appId = tile.dataset.appId;
  if (!appId) {
    return;
  }
  var pos = tracker.position();
  drag = {
    origin: origin,
    grid: grid,
    appId: appId,
    mode: grip ? 'size-' + grip.dataset.axis : 'move',
    startX: pos.x,
    startY: pos.y,
    // Reference rect captured once, so a resize does not chase its own tail
    // as the tile grows.
    ref: tile.getBoundingClientRect(),
    // Current offset of the lifted tile, kept so a reorder rebuild can put it
    // back under the pointer.
    lift: '',
    moved: false
  };
  if (!grip) {
    tile.classList.add('is-dragging');
  }
}

function onDragMove() {
  if (!drag || !tracker) {
    return;
  }
  var pos = tracker.position();
  var moved = Math.abs(pos.x - drag.startX) + Math.abs(pos.y - drag.startY);
  if (!drag.moved) {
    if (moved < DRAG_THRESHOLD_PX) {
      return;
    }
    drag.moved = true;
  }

  if (drag.mode === 'move') {
    liftToPointer(drag, pos);
    reorderToPointer(drag.grid, pos);
    return;
  }
  resizeToPointer(drag, pos);
}

// Win10 lifts the tile out of the grid and carries it under the pointer while
// you drag; the other tiles reflow around it. The offset is measured in
// client pixels because the stage is CSS-scaled.
function liftToPointer(state, pos) {
  var node = tileNodes[state.appId];
  if (!node) {
    return;
  }
  var from = tracker.toClient(state.startX, state.startY);
  var to = tracker.toClient(pos.x, pos.y);
  state.lift = (to.x - from.x) + 'px ' + (to.y - from.y) + 'px';
  node.style.translate = state.lift;
}

// Insert before the first tile whose centre is to the right of the
// pointer, which is how Win10's grid feels while you drag across it.
function reorderToPointer(grid, pos) {
  var client = tracker.toClient(pos.x, pos.y);
  var tiles = gridTileNodes(grid);
  var target = tiles.length;
  for (var i = 0; i < tiles.length; i++) {
    var rect = tiles[i].getBoundingClientRect();
    if (tiles[i].dataset.appId === drag.appId) {
      continue;
    }
    if (client.x < rect.left + rect.width / 2) {
      target = i;
      break;
    }
  }
  var current = indexOfPin(drag.appId);
  if (target !== current) {
    movePin(drag.appId, target);
  }
}

// Edge drag snaps to the neighbouring size, like Win10: pulling the right
// edge past the middle widens the tile, the bottom edge past the middle
// makes it large, and pulling back shrinks it again.
function resizeToPointer(state, pos) {
  var client = tracker.toClient(pos.x, pos.y);
  var ref = state.ref;
  if (state.mode === 'size-x') {
    var wide = client.x > ref.left + ref.width / 2;
    setPinSize(state.appId, wide ? 'wide' : 'medium');
    return;
  }
  var large = client.y > ref.top + ref.height / 2;
  setPinSize(state.appId, large ? 'large' : 'medium');
}

function gridTileNodes(grid) {
  var out = [];
  for (var i = 0; i < grid.children.length; i++) {
    var child = grid.children[i];
    if (child.classList && child.classList.contains('start-tile')) {
      out.push(child);
    }
  }
  return out;
}

function endDrag(event) {
  if (!drag) {
    return;
  }
  if (!event.isTrusted && drag.origin === 'real') {
    // Routed echo of a live real press: wait for the real release.
    return;
  }
  if (drag.moved) {
    // The release must not read as a launch.
    swallowClick = true;
    window.setTimeout(function () {
      swallowClick = false;
    }, 250);
  }
  var node = tileNodes[drag.appId];
  if (node) {
    // Drop the tile back into its new slot in the grid.
    node.classList.remove('is-dragging');
    node.style.translate = '';
  }
  drag = null;
}

// --- Live tiles ----------------------------------------------------------

function clearTimers() {
  Object.keys(liveTiles).forEach(function (appId) {
    var live = liveTiles[appId];
    if (live && live.timer) {
      window.clearInterval(live.timer);
      live.timer = null;
    }
  });
}

// Live tiles only animate while the menu is open (Win10 behaviour), so the
// caller starts and stops them with the menu.
export function startLiveTiles(grid) {
  if (!grid) {
    return;
  }
  Object.keys(liveTiles).forEach(function (appId) {
    var live = liveTiles[appId];
    var node = tileNodes[appId];
    if (!live || !node) {
      return;
    }
    if (live.timer) {
      window.clearInterval(live.timer);
    }
    var art = node.querySelector('.start-tile-art');
    live.timer = window.setInterval(function () {
      var current = tileNodes[appId];
      if (!current) {
        return;
      }
      live.render(current.querySelector('.start-tile-art'), current);
    }, live.intervalMs);
  });
}

export function stopLiveTiles() {
  clearTimers();
}

// Re-renders live content once for tiles opened mid-interval.
export function refreshLiveTiles(grid) {
  if (!grid) {
    return;
  }
  Object.keys(liveTiles).forEach(function (appId) {
    var node = tileNodes[appId];
    var art = node && node.querySelector('.start-tile-art');
    if (art) {
      liveTiles[appId].render(art, node);
    }
  });
}

// Publishes a live-tile renderer for an app: called every interval while
// the Start menu shows that tile. Apps call this from their launch path.
export function registerLiveTile(appId, intervalMs, render) {
  liveTiles[appId] = {
    intervalMs: Math.max(400, intervalMs || 5000),
    render: render,
    timer: null
  };
}

export function clearLiveTile(appId) {
  var live = liveTiles[appId];
  if (live && live.timer) {
    window.clearInterval(live.timer);
  }
  delete liveTiles[appId];
}

// Badge: the small count Win10 draws on the corner of a tile.
export function setTileBadge(appId, text) {
  var node = tileNodes[appId];
  if (!node) {
    return false;
  }
  var badge = node.querySelector('.start-tile-badge');
  if (!badge) {
    return false;
  }
  if (!text) {
    badge.hidden = true;
    badge.textContent = '';
    return true;
  }
  badge.textContent = text;
  badge.hidden = false;
  return true;
}

export function highlightRunningTiles(grid, runningApps) {
  if (!grid) {
    return;
  }
  Object.keys(tileNodes).forEach(function (appId) {
    tileNodes[appId].classList.toggle('is-running', !!runningApps[appId]);
  });
}