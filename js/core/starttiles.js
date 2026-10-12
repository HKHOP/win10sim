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
import { unpinApp, getPins, setPinSize, movePin, START_TILE_COLS } from './startstate.js';
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

function tileSizeClass(size) {
  return 'start-tile-' + (size || 'medium');
}

// How many cells a tile covers: small and medium one, wide two across, large a
// 2x2 block. Shared with the placement rules in the Start state store.
function tileSpan(size) {
  if (size === 'wide') {
    return [2, 1];
  }
  if (size === 'large') {
    return [2, 2];
  }
  return [1, 1];
}

function placeTile(tile, pin) {
  var span = tileSpan(pin.size);
  tile.style.gridColumn = ((pin.col || 0) + 1) + ' / span ' + span[0];
  tile.style.gridRow = ((pin.row || 0) + 1) + ' / span ' + span[1];
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
  // The tile's cell in the grid: this is the layout, not a packed order, so a
  // tile can sit in a free cell with a gap beside it.
  placeTile(tile, pin);

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

  // A press is not a launch until it is over: the tile launches when the
  // gesture that press began turns out to have been a tap, not here. A click
  // arrives in the same tick as the press that routed it — before a drag could
  // possibly begin — so launching here meant no tile could ever be dragged.
  tile.addEventListener('click', function (event) {
    event.stopPropagation();
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
  // The store places tiles in cells, so the drawing has to agree with it on how
  // many there are.
  grid.style.setProperty('--tile-cols', String(START_TILE_COLS));
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
    tileNodes[pin.appId] = tile;
    grid.appendChild(tile);
  });
  // The drop ghost lives in the grid, so a rebuild drops it; put it back for
  // the rest of the drag (its box is already where it belongs).
  if (ghostLive && ghost) {
    grid.appendChild(ghost);
  }
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
// under the emulated cursor. Its routed echo is marked and skipped: it would be
// a second press for a gesture that is already running.
function installGestures(grid) {
  // Touch holds, and routed presses that are not echoes, start a gesture.
  grid.addEventListener('mousedown', function (event) {
    if (!event.isTrusted && !event.simEcho) {
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
  // A press let go outside the window never delivers a release here, and a
  // gesture with no release keeps its ghost: drop it.
  window.addEventListener('blur', function () {
    if (drag) {
      cancelTileDrag();
    }
  });
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
    moved: false
  };
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
    // No ghost until the press has actually moved: a plain press must not
    // leave a drop target behind.
  }

  if (drag.mode === 'move') {
    reorderToPointer(drag.grid, pos);
    return;
  }
  resizeToPointer(drag, pos);
}

// The grid's own geometry, read back from the layout the browser resolved:
// column widths, row heights and gaps, so cell maths stays true whatever the
// CSS says the tile sizes are today.
function gridMetrics(grid) {
  var styles = window.getComputedStyle(grid);
  var trackSizes = function (value) {
    return String(value || '').split(' ').map(parseFloat).filter(function (n) {
      return !isNaN(n) && n > 0;
    });
  };
  var rect = grid.getBoundingClientRect();
  return {
    rect: rect,
    cols: trackSizes(styles.gridTemplateColumns),
    rows: trackSizes(styles.gridTemplateRows),
    gapX: parseFloat(styles.columnGap) || 0,
    gapY: parseFloat(styles.rowGap) || 0,
    padLeft: parseFloat(styles.paddingLeft) || 0,
    padTop: parseFloat(styles.paddingTop) || 0
  };
}

// Which cell a point is over. Rows vary in height (a 2x2 tile's row is taller
// than a plain one), so the row is found by walking the tracks, and a point
// below the last row means "the next row down". spanW keeps a wide or large
// tile from being aimed at a cell it cannot fit in.
function cellAtPoint(grid, clientX, clientY, spanW) {
  var m = gridMetrics(grid);
  if (!m.cols.length) {
    return null;
  }
  var dx = clientX - m.rect.left - m.padLeft;
  var dy = clientY - m.rect.top - m.padTop;
  var col = Math.round(dx / (m.cols[0] + m.gapX));
  col = Math.max(0, Math.min(col, m.cols.length - spanW));
  var row = 0;
  var offset = 0;
  for (var i = 0; i < m.rows.length; i++) {
    if (dy < offset + m.rows[i]) {
      break;
    }
    offset += m.rows[i] + m.gapY;
    row = i + 1;
  }
  return { col: col, row: row };
}

// Pixel box of a cell, for the drop ghost. Absolute rather than a grid item of
// its own, so marking a cell never changes the layout it is marking.
function cellBox(grid, col, row, w, h) {
  var m = gridMetrics(grid);
  var offset = m.padTop;
  for (var i = 0; i < row && i < m.rows.length; i++) {
    offset += m.rows[i] + m.gapY;
  }
  var rowH = m.rows.length && row < m.rows.length ? m.rows[row] : (m.rows[0] || 108);
  return {
    left: m.padLeft + col * (m.cols[0] + m.gapX),
    top: offset,
    width: w * m.cols[0] + (w - 1) * m.gapX,
    height: h * rowH + (h - 1) * m.gapY
  };
}

// Where the tile would land. It is drawn as a ghost in the grid and, once the
// gesture commits, as the tile itself — the grid is the layout, so a tile
// takes the cell under the pointer and whatever was there fills in behind it.
function reorderToPointer(grid, pos) {
  var client = tracker.toClient(pos.x, pos.y);
  var span = tileSpan(pinSize(drag.appId));
  var cell = cellAtPoint(grid, client.x, client.y, span[0]);
  if (!cell) {
    return;
  }
  movePin(drag.appId, cell.col, cell.row);
  showGhost(grid, cell, span);
}

function pinSize(appId) {
  var pins = getPins();
  for (var i = 0; i < pins.length; i++) {
    if (pins[i].appId === appId) {
      return pins[i].size;
    }
  }
  return 'medium';
}

var ghost = null;
// The ghost outlives the DOM node it was drawn in (a reorder rebuilds the
// grid), so what it means to be showing is tracked here rather than inferred
// from the gesture: a gesture can be cancelled without ever reaching a
// release, and a ghost left behind would come back with the next render.
var ghostLive = false;

function showGhost(grid, cell, span) {
  ghostLive = true;
  if (!ghost) {
    ghost = document.createElement('div');
    ghost.className = 'start-tile-ghost';
  }
  var box = cellBox(grid, cell.col, cell.row, span[0], span[1]);
  ghost.style.left = box.left + 'px';
  ghost.style.top = box.top + 'px';
  ghost.style.width = box.width + 'px';
  ghost.style.height = box.height + 'px';
  if (ghost.parentNode !== grid) {
    grid.appendChild(ghost);
  }
}

function hideGhost() {
  ghostLive = false;
  if (ghost && ghost.parentNode) {
    ghost.parentNode.removeChild(ghost);
  }
}

// A gesture that never sees its release — the press was let go outside the
// window, the page lost focus, Start closed — is called off here rather than
// left running: a live gesture would keep its ghost alive and re-append it to
// every rebuild, so the drop target would reappear on the next Start.
export function cancelTileDrag() {
  drag = null;
  hideGhost();
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

// The end of the gesture is where a press becomes something: a press that
// never moved was a tap and launches the app, one that moved was a reorder or
// a resize and must not launch anything. Deciding here rather than on the
// click is what lets a press turn into a drag at all.
function endDrag(event) {
  if (!drag) {
    return;
  }
  if (event && event.simEcho) {
    // The echo of a press that is still live: its own release follows.
    return;
  }
  if (!event.isTrusted && drag.origin === 'real') {
    // Routed release of a live real press: wait for the real release.
    return;
  }
  // A cancelled touch never launched anything: the gesture ends as neither a
  // tap nor a reorder.
  var tap = !drag.moved && drag.mode === 'move' &&
    (!event || event.type !== 'touchcancel');
  var appId = drag.appId;
  drag = null;
  hideGhost();
  if (tap) {
    onLaunchTile(appId);
  }
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