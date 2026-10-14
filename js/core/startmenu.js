// Win10 Start menu: the medium panel anchored over the taskbar's left
// corner, in the three segments Windows documents — a narrow icon column at
// the far left (hamburger, the App list / Pinned apps picker, the account and
// power buttons), the app list ("Recently added" / A-Z), and the pinned tile
// grid.
//
// The icon column is glyphs only: Win10 spells out its labels for anyone whose
// pointer is over the column, and the emulated pointer needs no mouse, so the
// column widens while the pointer dwells on it (see startmenu.css). The
// hamburger opens and shuts it by hand, for a pointer that will not wait.
//
// The two column views are Win10's "Show app list" setting: the app list sits
// beside the tiles, and picking Pinned apps takes it away so the tiles take
// its width, with the column keeping a way back to the list.
//
// Everything the menu lists comes from the app registry (apps/), so any app
// that registers later shows up here — in the list, and on a tile if it
// declares one — with no shell change.

import {
  DISPLAY_HEIGHT,
  DISPLAY_WIDTH,
  TASKBAR_HEIGHT_PX,
  START_TOP_PX,
  START_ANIM_CLOSE_MS,
  START_LEFT_PX,
  START_LIST_W,
  START_ACCOUNT_H,
  START_RAIL_W,
  START_RAIL_OPEN_W,
  START_RAIL_HOVER_MS,
  START_TILE_CELL_PX,
  START_TILE_GAP_PX,
  START_TILE_PAD_PX,
  START_TILE_PAD_LEFT_PX,
  START_TILE_PAD_RIGHT_PX,
  START_TILE_ROW_PX,
  START_MIN_H_PX,
  START_RESIZE_EDGE_PX,
  ACCOUNT_NAME,
  ACCOUNT_PIC_SRC,
  START_ACCOUNT_ROW_ICON_PX
} from '../global/constants.js';
import {
  HAMBURGER_SVG,
  START_POWER_SVG,
  SLEEP_SVG,
  SHUTDOWN_SVG,
  RESTART_SVG,
  APP_LIST_SVG,
  TILES_SVG
} from '../global/icons.js';
import { listStartApps, launchApp } from './apps.js';
import { subscribeWindows } from './windowmanager.js';
import { showContextMenu, isContextMenuTarget } from './contextmenu.js';
import { isRawDevicePress } from './cursor.js';
import { sleep, shutDown, restart } from './power.js';
import {
  getRecentlyAdded,
  pinApp,
  isPinned,
  unpinApp,
  getShowAppList,
  setShowAppList,
  getStartSize,
  setStartSize,
  subscribeStartState
} from './startstate.js';
import {
  buildTileGrid,
  renderTileGrid,
  startLiveTiles,
  stopLiveTiles,
  cancelTileDrag,
  highlightRunningTiles,
  setTileLaunchHandler
} from './starttiles.js';
import { createPointerTracker } from './pointer.js';

var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

var menuEl = null;
var railEl = null;
var listEl = null;
var tileGrid = null;
var powerMenu = null;
var accountMenu = null;
var viewButtons = {};
var rows = [];
var open = false;
var runningApps = {};
var openListeners = [];
// Where the emulated pointer is, for the resize edges.
var tracker = null;
// 'apps' = the app list sits beside the tiles, 'tiles' = pinned apps only.
var view = 'apps';
// Touch has no hover, so a tap on the icon column latches it open instead.
var coarsePointer = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

// Starts listeners for open/close state, so the Start button can light up.
export function subscribeStartOpen(fn) {
  openListeners.push(fn);
  fn(open);
}

function emitOpen() {
  openListeners.forEach(function (fn) {
    fn(open);
  });
}

// Flush on the taskbar: the panel's bottom edge is the taskbar's top edge,
// like Win10 — the menu never floats above it.
function menuHeight() {
  return DISPLAY_HEIGHT - TASKBAR_HEIGHT_PX - START_TOP_PX;
}

// --- Resizing: Win10 lets Start be dragged bigger and snaps it to whole tiles

// The menu is sized in grid cells, and drawn from them, so the width it snaps
// to is always a whole number of tile columns and the height a whole number of
// tile rows. That is what lets a bigger menu mean more tiles rather than a
// longer scroll.
// The tile grid's horizontal insets, as one number. The left and right pads are
// separate so the drawing can be asymmetric, but the width is snapped against
// their sum — the same total either way round.
function gridPadX() {
  return START_TILE_PAD_LEFT_PX + START_TILE_PAD_RIGHT_PX;
}

function menuWidth(cols, listW) {
  // The panes are inset by the resize strips, so their room is subtracted here
  // too: a handle never lands on top of a tile.
  return START_RAIL_W + listW + gridPadX() +
    cols * START_TILE_CELL_PX + (cols - 1) * START_TILE_GAP_PX;
}

function menuHeightForRows(rows) {
  if (!rows) {
    // No rows to show: what is left of the menu is its padding and the strip the
    // top resize edge lives in, which is as short as this menu may be drawn.
    return START_TILE_PAD_PX * 2 + START_RESIZE_EDGE_PX;
  }
  return START_TILE_PAD_PX * 2 + START_RESIZE_EDGE_PX +
    rows * START_TILE_ROW_PX + (rows - 1) * START_TILE_GAP_PX;
}

// The widest the menu may get: the whole display, less the icon column and one
// column of tiles.
function maxMenuWidth(listW) {
  var fit = DISPLAY_WIDTH - START_RAIL_W - listW;
  var cols = Math.floor((fit - gridPadX() + START_TILE_GAP_PX) /
    (START_TILE_CELL_PX + START_TILE_GAP_PX));
  return menuWidth(Math.max(1, cols), listW);
}

// The app list takes its own width only while it is showing; the tile grid is
// sized for the worst case so it always fits in both views.
function listWidth() {
  return view === 'apps' ? START_LIST_W : 0;
}

// The pinned section is either drawn or it is not. It takes rows to be seen in,
// and there is nothing to see with nothing pinned, so both of those put it away
// rather than leave an empty box on the start screen - and the app list is given
// the width it would have been using.
function tilesShown() {
  return getStartSize().rows > 0 && getPins().length > 0;
}

function applyTilesPane() {
  var shown = tilesShown();
  if (tileGrid) {
    tileGrid.hidden = !shown;
  }
  return shown;
}

// The menu with no pinned section in it: the icon column, the app list, and the
// strips the resize edges live on.
function bareWidth(listW) {
  return START_RAIL_W + listW + gridPadX();
}

function applyStartSize() {
  var size = getStartSize();
  var listW = listWidth();
  var shown = applyTilesPane();
  var w = shown
    ? Math.min(menuWidth(size.cols, listW), maxMenuWidth(listW))
    : bareWidth(listW);
  // Zero rows is a size of its own: the section is put away, so the menu is as
  // tall as what is left of it rather than at the floor that keeps the app list
  // usable - which is the only way to hide the section completely, and the size
  // the next drag away from the edge brings back.
  var wanted = menuHeightForRows(size.rows);
  var h = Math.max(size.rows ? START_MIN_H_PX : wanted, Math.min(wanted, menuHeight()));
  menuEl.style.setProperty('--menu-w', w + 'px');
  menuEl.style.setProperty('--menu-h', h + 'px');
  // The bottom edge is pinned to the taskbar, so the top is whatever is left.
  menuEl.style.top = (DISPLAY_HEIGHT - TASKBAR_HEIGHT_PX - h) + 'px';
}

// Which column count a dragged width means, and the other way round. The
// pointer is measured against the edge it is dragging, and the result snaps to
// the nearest whole cell. With no pinned section drawn there are no columns to
// hand out, so the width drag keeps the count it has.
function colsForWidth(px, listW) {
  if (!tilesShown()) {
    return getStartSize().cols;
  }
  var fixed = START_RAIL_W + listW + gridPadX();
  var raw = (px - fixed + START_TILE_GAP_PX) / (START_TILE_CELL_PX + START_TILE_GAP_PX);
  return Math.max(1, Math.min(Math.round(raw), maxCols(listW)));
}

function rowsForHeight(px) {
  var raw = (px - START_TILE_PAD_PX * 2 - START_RESIZE_EDGE_PX + START_TILE_GAP_PX) /
    (START_TILE_ROW_PX + START_TILE_GAP_PX);
  // Zero rows is reachable on purpose: it is the size that puts the pinned
  // section away, and dragging the top edge back up brings it out again.
  return Math.max(0, Math.min(Math.round(raw), maxRows()));
}

function maxCols(listW) {
  var fit = DISPLAY_WIDTH - START_RAIL_W - listW - gridPadX();
  return Math.max(1, Math.floor((fit + START_TILE_GAP_PX) /
    (START_TILE_CELL_PX + START_TILE_GAP_PX)));
}

function maxRows() {
  return Math.max(1, Math.floor((menuHeight() - START_TILE_PAD_PX * 2 -
    START_RESIZE_EDGE_PX + START_TILE_GAP_PX) /
    (START_TILE_ROW_PX + START_TILE_GAP_PX)));
}

// The gesture. The press has to be the device's own, because a routed press
// compresses down+up into one instant; the edge being dragged decides which
// way the size changes, and the Start state store does the snapping.
var resize = null;

function beginResize(axis) {
  if (!resize) {
    resize = { axis: axis };
  }
}

function onResizeMove() {
  if (!resize || !tracker) {
    return;
  }
  var pos = tracker.position();
  var size = getStartSize();
  if (resize.axis === 'x') {
    setStartSize(colsForWidth(pos.x, listWidth()), size.rows);
  } else {
    // The menu's bottom edge is pinned, so its height is the distance from the
    // pointer down to that edge.
    setStartSize(size.cols, rowsForHeight(DISPLAY_HEIGHT - TASKBAR_HEIGHT_PX - pos.y));
  }
  applyStartSize();
}

function endResize() {
  resize = null;
}

// A resize that never sees its release — the press was let go outside the
// window, or Start closed underneath it — would otherwise sit armed, and the
// next press on an edge would be swallowed by it.
function cancelResize() {
  resize = null;
}

function buildResizeHandles() {
  ['x', 'y'].forEach(function (axis) {
    var handle = document.createElement('div');
    handle.className = 'start-resize start-resize-' + axis;
    handle.dataset.axis = axis;
    menuEl.appendChild(handle);
  });
}

// A press on a handle is the only press in the menu that starts a gesture of
// its own, so the echoes are dropped here as they are for the tiles: the
// device press behind them is the one that counts.
function installResizeGestures() {
  menuEl.addEventListener('mousedown', function (event) {
    if (event.simEcho || !event.target || !event.target.closest) {
      return;
    }
    var handle = event.target.closest('.start-resize');
    if (handle) {
      beginResize(handle.dataset.axis);
    }
  });
  window.addEventListener('mousedown', function (event) {
    if (!event.isTrusted || !tracker) {
      return;
    }
    var pos = tracker.position();
    var client = tracker.toClient(pos.x, pos.y);
    var target = tracker.hitTest(client.x, client.y);
    var handle = target && target.closest ? target.closest('.start-resize') : null;
    if (handle) {
      beginResize(handle.dataset.axis);
    }
  });
  window.addEventListener('mousemove', onResizeMove);
  window.addEventListener('touchmove', onResizeMove, { passive: true });
  window.addEventListener('mouseup', endResize);
  window.addEventListener('touchend', endResize);
  window.addEventListener('touchcancel', endResize);
  window.addEventListener('blur', endResize);
}

function sectionHeader(text, letter) {
  var el = document.createElement('div');
  el.className = 'start-section' + (letter ? ' start-section-letter' : '');
  el.textContent = text;
  return el;
}

// Repaints both panes: the app list from the registry history, the tile
// grid from the pinned layout. Running markers are re-applied after, since
// the tile grid is rebuilt from scratch, and the menu is measured again because
// pinning the first tile is what brings the pinned section back.
function render() {
  renderList();
  renderTileGrid(tileGrid);
  applyRunning();
  applyStartSize();
}

// Win10 files non-letters under their own heading.
function letterOf(name) {
  var first = String(name || '').charAt(0).toUpperCase();
  return first >= 'A' && first <= 'Z' ? first : '0-9';
}

function buildRow(entry) {
  var row = document.createElement('div');
  row.className = 'start-item';
  row.dataset.appId = entry.id;
  row.tabIndex = -1;

  var art = document.createElement('span');
  art.className = 'start-item-icon';
  if (entry.icon) {
    var img = document.createElement('img');
    img.src = entry.icon;
    img.alt = '';
    img.draggable = false;
    art.appendChild(img);
  }

  var text = document.createElement('span');
  text.className = 'start-item-text';
  var name = document.createElement('span');
  name.className = 'start-item-name';
  name.textContent = entry.name;
  text.appendChild(name);
  if (entry.subtitle) {
    var sub = document.createElement('span');
    sub.className = 'start-item-sub';
    sub.textContent = entry.subtitle;
    text.appendChild(sub);
  }

  row.appendChild(art);
  row.appendChild(text);

  row.addEventListener('click', function (event) {
    event.stopPropagation();
    launchApp(entry.id);
    closeStartMenu();
  });

  var openMenu = function (event) {
    event.preventDefault();
    event.stopPropagation();
    var point = event.detail && typeof event.detail.clientX === 'number'
      ? { x: event.detail.clientX, y: event.detail.clientY }
      : { x: event.clientX, y: event.clientY };
    openRowMenu(point.x, point.y, entry);
  };
  row.addEventListener('contextmenu', openMenu);
  row.addEventListener('simcontextmenu', openMenu);

  rows.push(row);
  return row;
}

// Win10's app-list context menu: pin/unpin the Start tile, plus items that
// only matter on a full shell.
function openRowMenu(x, y, entry) {
  var pinned = isPinned(entry.id);
  showContextMenu(x, y, [
    {
      label: pinned ? 'Unpin from Start' : 'Pin to Start',
      action: function () {
        if (pinned) {
          unpinApp(entry.id);
        } else {
          pinApp(entry.id);
        }
      }
    },
    { separator: true },
    { label: 'Run as administrator', disabled: true },
    { label: 'Open file location', disabled: true },
    { separator: true },
    { label: 'Uninstall', disabled: true }
  ]);
}

function renderList() {
  rows = [];
  while (listEl.firstChild) {
    listEl.removeChild(listEl.firstChild);
  }
  var entries = listStartApps();
  var byId = {};
  entries.forEach(function (entry) {
    byId[entry.id] = entry;
  });

  // Only genuinely new apps get a Recently added section.
  var recent = getRecentlyAdded()
    .map(function (id) { return byId[id]; })
    .filter(Boolean);
  if (recent.length) {
    listEl.appendChild(sectionHeader('Recently added'));
    recent.forEach(function (entry) {
      listEl.appendChild(buildRow(entry));
    });
  }

  var groups = {};
  entries.forEach(function (entry) {
    var letter = letterOf(entry.name);
    (groups[letter] = groups[letter] || []).push(entry);
  });
  Object.keys(groups).sort().forEach(function (letter) {
    listEl.appendChild(sectionHeader(letter, true));
    groups[letter].forEach(function (entry) {
      listEl.appendChild(buildRow(entry));
    });
  });
  applyRunning();
}

function applyRunning() {
  rows.forEach(function (row) {
    row.classList.toggle('is-running', !!runningApps[row.dataset.appId]);
  });
  highlightRunningTiles(tileGrid, runningApps);
}

// --- Popovers: power and account ----------------------------------------

function popover(className) {
  var el = document.createElement('div');
  el.className = className;
  el.hidden = true;
  return el;
}

function togglePopover(pop, anchor) {
  var wasHidden = pop.hidden;
  hidePopovers();
  if (wasHidden) {
    pop.hidden = false;
    anchor.classList.add('is-open');
  }
}

function hidePopovers() {
  [powerMenu, accountMenu].forEach(function (pop) {
    if (!pop) {
      return;
    }
    pop.hidden = true;
  });
  var buttons = menuEl.querySelectorAll('.is-open');
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove('is-open');
  }
}

function powerItem(label, glyph, run) {
  var row = document.createElement('button');
  row.type = 'button';
  row.className = 'start-power-item';
  row.innerHTML = glyph;
  var text = document.createElement('span');
  text.textContent = label;
  row.appendChild(text);
  row.addEventListener('click', function (event) {
    event.stopPropagation();
    closeStartMenu();
    run();
  });
  return row;
}

// --- Open / close --------------------------------------------------------

export function isStartMenuOpen() {
  return open;
}

export function toggleStartMenu() {
  if (open) {
    closeStartMenu();
  } else {
    openStartMenu();
  }
}

export function openStartMenu() {
  if (open) {
    return;
  }
  hidePopovers();
  // Start never opens mid-gesture: an armed resize from a previous session of
  // the menu would swallow the first press on an edge.
  cancelResize();
  cancelTileDrag();
  render();
  menuEl.hidden = false;
  // Force a reflow so the enter animation runs from its start state.
  void menuEl.offsetWidth;
  menuEl.classList.remove('start-closing');
  menuEl.classList.add('start-open');
  open = true;
  emitOpen();
  startLiveTiles(tileGrid);
  window.addEventListener('mousedown', onOutsidePress, true);
  window.addEventListener('touchstart', onOutsidePress, true);
  window.addEventListener('keydown', onMenuKey, true);
  window.addEventListener('mousemove', onRailPointerMove);
  // Deliberately not sampled once here. Start is opened from the taskbar's
  // Start button, which sits directly below the column in the same 48px strip,
  // so the pointer that opened the menu is parked on the column whether or not
  // the user ever meant to be there — arming a dwell from that position opened
  // the column on its own a couple of seconds later. The dwell starts from the
  // first real move onto the strip instead.
  if (view === 'apps' && listEl && listEl.focus) {
    // preventScroll: parking focus must not scroll any ancestor, or the whole
    // emulated screen shifts as the browser scrolls the focused box into view.
    listEl.focus({ preventScroll: true });
  }
}

export function closeStartMenu() {
  if (!open) {
    return;
  }
  open = false;
  hidePopovers();
  // A dwell still running would open the column over the next Start session,
  // and the next one starts from the strip shut whatever the last one did.
  railDismissed = false;
  closeRail();
  // Closing mid-drag must not leave a gesture running behind the panel: its
  // drop target would come back the next time Start renders.
  cancelResize();
  cancelTileDrag();
  stopLiveTiles();
  emitOpen();
  window.removeEventListener('mousedown', onOutsidePress, true);
  window.removeEventListener('touchstart', onOutsidePress, true);
  window.removeEventListener('keydown', onMenuKey, true);
  window.removeEventListener('mousemove', onRailPointerMove);
  if (REDUCED) {
    menuEl.hidden = true;
    menuEl.classList.remove('start-open');
    return;
  }
  menuEl.classList.remove('start-open');
  menuEl.classList.add('start-closing');
  window.setTimeout(function () {
    menuEl.classList.remove('start-closing');
    if (!open) {
      menuEl.hidden = true;
    }
  }, START_ANIM_CLOSE_MS);
}

// A press outside the panel closes it, Win10 style. Presses the device made
// rather than the emulated cursor — the capture layer taking a touchpad
// gesture, or the locked stage swallowing a captured press — say nothing about
// what was pressed and are ignored; so is the Start button, which toggles the
// menu itself.
function onOutsidePress(event) {
  if (isRawDevicePress(event)) {
    return;
  }
  var target = event.target;
  if (!target) {
    return;
  }
  if (menuEl.contains(target)) {
    return;
  }
  // A tile's or a row's right-click menu hangs off the document body, but it
  // belongs to Start: picking from it is not pressing outside.
  if (isContextMenuTarget(target)) {
    return;
  }
  if (target.closest && target.closest('.task-start')) {
    return;
  }
  closeStartMenu();
}

function onMenuKey(event) {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeStartMenu();
    return;
  }
  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown' && event.key !== 'Enter') {
    return;
  }
  // Arrow keys move the highlight through the app list, Enter launches.
  // With the list hidden there is nothing to walk.
  if (view !== 'apps') {
    return;
  }
  var visible = rows.filter(function (row) {
    return row.parentNode;
  });
  if (!visible.length) {
    return;
  }
  var at = visible.indexOf(document.activeElement);
  if (at < 0) {
    at = 0;
  }
  if (event.key === 'Enter') {
    if (visible[at]) {
      event.preventDefault();
      launchApp(visible[at].dataset.appId);
      closeStartMenu();
    }
    return;
  }
  event.preventDefault();
  var next = at + (event.key === 'ArrowDown' ? 1 : -1);
  if (next < 0) {
    next = visible.length - 1;
  }
  if (next >= visible.length) {
    next = 0;
  }
  visible[next].focus({ preventScroll: true });
}

// --- Icon column: views, and how it opens ---------------------------------

// Win10 names the two column views after what they show, and remembers the
// choice; the column carries the view names because it is the column's job to
// say which view Start is in.
function viewButton(name, label, glyph) {
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'start-rail-view';
  btn.dataset.view = name;
  btn.setAttribute('aria-pressed', 'false');

  var art = document.createElement('span');
  art.className = 'start-rail-view-icon';
  art.innerHTML = glyph;
  var text = document.createElement('span');
  text.className = 'start-rail-view-label';
  text.textContent = label;
  btn.appendChild(art);
  btn.appendChild(text);

  btn.addEventListener('click', function (event) {
    event.stopPropagation();
    latchRail();
    setView(name);
  });

  viewButtons[name] = btn;
  return btn;
}

// The app list is a segment of its own, so the column only tracks which view
// is showing and where the list belongs.
function applyRail() {
  menuEl.classList.toggle('show-app-list', view === 'apps');
  listEl.hidden = view !== 'apps';
  // The width belongs to the view: the app list's column is in it or it is not.
  applyStartSize();
  Object.keys(viewButtons).forEach(function (name) {
    var active = name === view;
    viewButtons[name].classList.toggle('is-selected', active);
    viewButtons[name].setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

// `persist` is false when the rail is being synced from stored state, so
// applying a value never writes it straight back out.
function setView(next, persist) {
  view = next === 'tiles' ? 'tiles' : 'apps';
  applyRail();
  if (persist !== false) {
    setShowAppList(view === 'apps');
  }
}

// --- Icon column: opens on a dwell, stays open -----------------------------

// The column is a strip of glyphs until the pointer has settled on it, so the
// open state is one class the CSS draws from. Once open it stays open for the
// rest of this Start session: the labels are wanted while the pointer is off in
// the app list or the tiles, and only closing Start puts them away. A touch
// screen has no hover, so a tap on a column button opens it the same way.
var railTimer = 0;
// Set when the hamburger closed the column by hand: the dwell must not undo
// that while the pointer is still sitting on the strip the user just shut.
var railDismissed = false;

function openRail() {
  menuEl.classList.add('rail-open');
}

function closeRail() {
  cancelRailDwell();
  menuEl.classList.remove('rail-open');
}

function cancelRailDwell() {
  if (railTimer) {
    window.clearTimeout(railTimer);
    railTimer = 0;
  }
}

// The whole strip counts, not just the buttons in it: the column is narrow and
// its controls are sparse, so a pointer over its bare background is over the
// column. Real :hover never fires on the emulated UI — the capture layer keeps
// the browser's pointer off it — so this measures the emulated cursor against
// the column's own rect instead.
function pointerOnRail() {
  if (!tracker || !railEl || resize) {
    return false;
  }
  var pos = tracker.position();
  var point = tracker.toClient(pos.x, pos.y);
  var rect = railEl.getBoundingClientRect();
  return point.x >= rect.left && point.x <= rect.right &&
    point.y >= rect.top && point.y <= rect.bottom;
}

// Opening waits out the dwell, so crossing the strip on the way to the tiles
// leaves it shut. The dwell never closes anything: the hamburger and closing
// Start are the only two things that do.
function onRailPointerMove() {
  // A touch screen has no hover to measure: its column opens on a tap instead.
  if (!open || coarsePointer) {
    return;
  }
  if (!pointerOnRail()) {
    // The pointer has left the strip, so a column the user closed by hand is
    // free to open again the next time they dwell on it — and a dwell already
    // running is called off. Leaving is the whole meaning of the dwell: it is
    // the pointer resting on the column, so a timer left armed here would open
    // the column a couple of seconds later with the pointer somewhere else
    // entirely, which is how it appeared to open on its own.
    cancelRailDwell();
    railDismissed = false;
    return;
  }
  if (railDismissed || menuEl.classList.contains('rail-open') || railTimer) {
    return;
  }
  railTimer = window.setTimeout(function () {
    railTimer = 0;
    openRail();
  }, START_RAIL_HOVER_MS);
}

// The hamburger is the column's own open/close switch: Win10 shows the strip
// permanently but keeps its labels for whoever asks, and a hand-operated
// pointer has no hover to ask with. A column closed by hand stays shut even
// with the pointer resting on it, so it only answers again once the pointer has
// left the strip and come back.
function toggleRail() {
  if (menuEl.classList.contains('rail-open')) {
    railDismissed = true;
    closeRail();
  } else {
    railDismissed = false;
    openRail();
  }
  return menuEl.classList.contains('rail-open');
}

// A finger has no hover, so a tap on the column holds it open instead of the
// dwell that opens it under a pointer.
function latchRail() {
  if (coarsePointer) {
    railDismissed = false;
    openRail();
  }
}

// --- Build ----------------------------------------------------------------

export function buildStartMenu(cursor, stage) {
  tracker = createPointerTracker(cursor, stage);
  menuEl = document.createElement('div');
  menuEl.className = 'start-menu';
  menuEl.hidden = true;
  menuEl.style.left = START_LEFT_PX + 'px';
  menuEl.style.setProperty('--account-h', START_ACCOUNT_H + 'px');
  // The panel and column widths, handed to the CSS that widens both once the
  // column opens.
  menuEl.style.setProperty('--rail-w', START_RAIL_W + 'px');
  menuEl.style.setProperty('--rail-w-open', START_RAIL_OPEN_W + 'px');
  menuEl.style.setProperty('--list-w', START_LIST_W + 'px');
  // The tile grid draws from the same geometry the resize snapping measures,
  // so a snapped menu and the grid inside it cannot disagree.
  menuEl.style.setProperty('--tile-cell', START_TILE_CELL_PX + 'px');
  menuEl.style.setProperty('--tile-row', START_TILE_ROW_PX + 'px');
  menuEl.style.setProperty('--tile-gap', START_TILE_GAP_PX + 'px');
  menuEl.style.setProperty('--tile-pad', START_TILE_PAD_PX + 'px');
  menuEl.style.setProperty('--tile-pad-left', START_TILE_PAD_LEFT_PX + 'px');
  menuEl.style.setProperty('--tile-pad-right', START_TILE_PAD_RIGHT_PX + 'px');
  menuEl.style.setProperty('--resize-edge', START_RESIZE_EDGE_PX + 'px');

  railEl = document.createElement('div');
  railEl.className = 'start-rail';

  // Win10 pairs the hamburger with the "Start" title — a word the menu had
  // not shown since Windows XP.
  var head = document.createElement('div');
  head.className = 'start-rail-head';

  var hamburger = document.createElement('button');
  hamburger.type = 'button';
  hamburger.className = 'start-hamburger';
  hamburger.innerHTML = HAMBURGER_SVG;
  hamburger.setAttribute('aria-label', 'Show the icon column');
  // The hamburger is Win10's open/close for the column: pressing it spells the
  // column's labels out, pressing it again puts them away. Switching between
  // the two views is the picker's job, further down the column.
  hamburger.addEventListener('click', function (event) {
    event.stopPropagation();
    var isOpen = toggleRail();
    hamburger.setAttribute('aria-label', isOpen ? 'Hide the icon column' : 'Show the icon column');
  });
  head.appendChild(hamburger);

  var railTitle = document.createElement('span');
  railTitle.className = 'start-rail-title';
  railTitle.textContent = 'Start';
  head.appendChild(railTitle);
  railEl.appendChild(head);

  var views = document.createElement('div');
  views.className = 'start-rail-views';
  views.setAttribute('role', 'group');
  views.setAttribute('aria-label', 'Start view');
  views.appendChild(viewButton('apps', 'App list', APP_LIST_SVG));
  views.appendChild(viewButton('tiles', 'Pinned apps', TILES_SVG));
  railEl.appendChild(views);

  var bottom = document.createElement('div');
  bottom.className = 'start-rail-bottom';
  // The row's height is set from CSS, off --account-h below, so the closed
  // column can give its stacked row a height of its own.

  var account = document.createElement('button');
  account.type = 'button';
  account.className = 'start-account';
  account.setAttribute('aria-label', 'Account: ' + ACCOUNT_NAME);
  var pic = document.createElement('img');
  pic.className = 'start-account-pic';
  pic.src = ACCOUNT_PIC_SRC;
  pic.alt = '';
  pic.draggable = false;
  pic.style.width = START_ACCOUNT_ROW_ICON_PX + 'px';
  pic.style.height = START_ACCOUNT_ROW_ICON_PX + 'px';
  var accountName = document.createElement('span');
  accountName.className = 'start-account-name';
  accountName.textContent = ACCOUNT_NAME;
  account.appendChild(pic);
  account.appendChild(accountName);
  accountMenu = popover('start-account-menu');
  [
    { label: 'Change account settings', disabled: true },
    { label: 'Lock', disabled: true },
    { separator: true },
    { label: 'Sign out', action: function () { closeStartMenu(); restart(); } }
  ].forEach(function (item) {
    var row = document.createElement('button');
    row.type = 'button';
    row.className = 'start-menu-item' + (item.disabled ? ' is-disabled' : '');
    row.textContent = item.label;
    if (!item.disabled) {
      row.addEventListener('click', function (event) {
        event.stopPropagation();
        item.action();
      });
    }
    accountMenu.appendChild(row);
  });
  account.addEventListener('click', function (event) {
    event.stopPropagation();
    latchRail();
    togglePopover(accountMenu, account);
  });

  var power = document.createElement('button');
  power.type = 'button';
  power.className = 'start-power';
  power.innerHTML = START_POWER_SVG;
  power.setAttribute('aria-label', 'Power');
  powerMenu = popover('start-power-menu');
  powerMenu.appendChild(powerItem('Sleep', SLEEP_SVG, function () { sleep(menuEl); }));
  powerMenu.appendChild(powerItem('Shut down', SHUTDOWN_SVG, function () { shutDown(menuEl); }));
  powerMenu.appendChild(powerItem('Restart', RESTART_SVG, restart));
  power.addEventListener('click', function (event) {
    event.stopPropagation();
    latchRail();
    togglePopover(powerMenu, power);
  });

  bottom.appendChild(account);
  bottom.appendChild(accountMenu);
  bottom.appendChild(power);
  bottom.appendChild(powerMenu);
  railEl.appendChild(bottom);

  tileGrid = buildTileGrid(cursor, stage);
  tileGrid.addEventListener('click', function (event) {
    event.stopPropagation();
  });
  tileGrid.addEventListener('contextmenu', function (event) {
    event.preventDefault();
  });

  // The app list is a segment of the menu, not part of the icon column.
  listEl = document.createElement('div');
  listEl.className = 'start-list';
  listEl.tabIndex = -1;
  listEl.setAttribute('role', 'list');

  menuEl.appendChild(railEl);
  menuEl.appendChild(listEl);
  menuEl.appendChild(tileGrid);
  buildResizeHandles();
  installResizeGestures();

  // A tap inside the menu but off the column drops the touch latch, so the
  // column does not stay open after the finger is done with it.
  menuEl.addEventListener('click', function (event) {
    if (coarsePointer && menuEl.classList.contains('rail-open')) {
      if (!(event.target && event.target.closest && event.target.closest('.start-rail'))) {
        closeRail();
      }
    }
  });

  // The stored "Show app list" choice decides which view Start opens in.
  setView(getShowAppList() ? 'apps' : 'tiles', false);
  applyStartSize();

  // The registry and the Start layout can change underneath the menu, so
  // re-render whenever either does. A closed menu re-renders on open.
  subscribeStartState(function (snapshot) {
    var wanted = snapshot && snapshot.showAppList === false ? 'tiles' : 'apps';
    if (wanted !== view) {
      setView(wanted, false);
    }
    if (open) {
      render();
    }
  });
  subscribeWindows(function (snapshot) {
    runningApps = {};
    snapshot.forEach(function (item) {
      runningApps[item.appId] = true;
    });
    applyRunning();
  });

  // Launching from a tile folds the menu away, like Win10.
  setTileLaunchHandler(function () {
    closeStartMenu();
  });

  return menuEl;
}
