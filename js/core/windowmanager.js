import {
  DISPLAY_WIDTH,
  DISPLAY_HEIGHT,
  TASKBAR_HEIGHT_PX,
  SHAKE_MIN_STEP_PX,
  SHAKE_FLIPS,
  SHAKE_WINDOW_MS
} from '../global/constants.js';
import { CAPT_MAX_SVG, CAPT_RESTORE_SVG } from '../global/icons.js';
import {
  snapZoneAt,
  snapZoneRect,
  isHalfZone,
  oppositeHalf,
  initSnapPreview,
  showSnapPreview,
  hideSnapPreview
} from './snap.js';
import { showSnapAssist, hideSnapAssist } from './snapassist.js';
import { buildWindowFrame } from './windowchrome.js';
import { openWindowMenu, startGuidedMode, stopGuidedMode } from './windowmenu.js';
import { createPointerTracker } from './pointer.js';

// Floating window system: window records and chrome, focus z-order,
// minimize / maximize / Aero Snap state, Aero shake, and the drag / resize
// gestures that drive them. Gestures read the sim cursor while pointer
// lock is engaged (a touch drag steers it), so every input mode behaves the
// same; a native pointer outside pointer lock is tracked directly.

var MIN_W = 220;
var MIN_H = 140;
var CLOSE_MS = 160;
var MINIMIZE_MS = 180;
var RESTORE_MS = 200;
// How far below the held titlebar a window torn out of a snap reappears,
// matching Win10's restore-under-cursor behaviour.
var SNAP_FREE_DROP_PX = 15;

var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

var layer = null;
var cursor = null;
var pointer = null;
var zTop = 100;
var cascade = 0;
var nextId = 1;
var focusSeq = 0;
var windows = [];
var listeners = [];
var gesture = null;

export function initWindowSystem(windowLayer, cursorApi) {
  layer = windowLayer;
  cursor = cursorApi;
  initSnapPreview(windowLayer);
  // Shared pointer bridge: sim cursor under pointer lock or on touch, the
  // real pointer everywhere else.
  pointer = createPointerTracker(cursorApi, layer.parentNode || document.body);
}

function snapshot() {
  return windows.map(function (w) {
    return { id: w.id, appId: w.appId, title: w.title, icon: w.icon, minimized: w.minimized, focused: w.focused, win: w.api };
  });
}

function emit() {
  var snap = snapshot();
  listeners.forEach(function (fn) {
    fn(snap);
  });
}

export function subscribeWindows(fn) {
  listeners.push(fn);
  fn(snapshot());
}

export function windowById(winId) {
  for (var i = 0; i < windows.length; i++) {
    if (windows[i].id === winId) {
      return windows[i];
    }
  }
  return null;
}

// Opens Win10's window menu for a taskbar button's window.
export function showWindowSystemMenu(winId, x, y) {
  var win = windowById(winId);
  if (win) {
    openWindowSystemMenu(win, x, y);
  }
}

// --- Rects: stage coordinates, taskbar excluded from the work area -------

function workAreaRect() {
  return { x: 0, y: 0, w: DISPLAY_WIDTH, h: DISPLAY_HEIGHT - TASKBAR_HEIGHT_PX };
}

function defaultRect() {
  return { x: 140, y: 70, w: 640, h: 420 };
}

function clampRect(r) {
  r.w = Math.max(MIN_W, Math.min(DISPLAY_WIDTH, r.w));
  r.h = Math.max(MIN_H, Math.min(DISPLAY_HEIGHT - TASKBAR_HEIGHT_PX, r.h));
  r.x = Math.max(-r.w + 80, Math.min(DISPLAY_WIDTH - 80, r.x));
  r.y = Math.max(0, Math.min(DISPLAY_HEIGHT - TASKBAR_HEIGHT_PX - 40, r.y));
  return r;
}

function paint(win) {
  win.el.style.transform = 'translate(' + win.rect.x + 'px,' + win.rect.y + 'px)';
  win.el.style.width = win.rect.w + 'px';
  win.el.style.height = win.rect.h + 'px';
}

function setMaxGlyph(win, maximized) {
  win.maxBtn.innerHTML = maximized ? CAPT_RESTORE_SVG : CAPT_MAX_SVG;
  win.maxBtn.setAttribute('aria-label', maximized ? 'Restore' : 'Maximize');
}

function setMaximizedChrome(win, maximized) {
  win.el.classList.toggle('win-maximized', maximized);
  setMaxGlyph(win, maximized);
}

// --- Layer <-> client coordinate bridging -------------------------------

function clientToStage(x, y) {
  var rect = layer.getBoundingClientRect();
  var scale = rect.width ? rect.width / DISPLAY_WIDTH : 1;
  return { x: (x - rect.left) / scale, y: (y - rect.top) / scale };
}

function stageToClient(x, y) {
  var rect = layer.getBoundingClientRect();
  var scale = rect.width ? rect.width / DISPLAY_WIDTH : 1;
  return { x: rect.left + x * scale, y: rect.top + y * scale };
}

function taskbarButtonFor(winId) {
  var root = layer && layer.parentNode;
  if (!root || !root.querySelector) {
    return null;
  }
  try {
    return root.querySelector('[data-win-id="' + winId + '"]');
  } catch (err) {
    return null;
  }
}

// Minimize / restore aim at the window's taskbar button, so a window
// shrinks toward the slot it will reappear from.
function aimAtTaskbarButton(win) {
  var button = taskbarButtonFor(win.id);
  var dx = 0;
  var dy;
  if (button) {
    var b = button.getBoundingClientRect();
    var p = clientToStage(b.left + b.width / 2, b.top + b.height / 2);
    dx = p.x - (win.rect.x + win.rect.w / 2);
    dy = p.y - (win.rect.y + win.rect.h / 2);
  } else {
    // No button yet: aim at the taskbar strip as a whole.
    dy = DISPLAY_HEIGHT - TASKBAR_HEIGHT_PX / 2 - (win.rect.y + win.rect.h / 2);
  }
  win.el.style.setProperty('--win-snap-dx', Math.round(dx) + 'px');
  win.el.style.setProperty('--win-snap-dy', Math.round(dy) + 'px');
}

// --- Window creation ----------------------------------------------------

export function createWindow(opts) {
  var options = opts || {};
  var area = workAreaRect();
  var w = Math.min(options.width || 640, area.w);
  var h = Math.min(options.height || 420, area.h);
  var baseX = 140 + (cascade % 6) * 28;
  var baseY = 70 + (cascade % 6) * 24;
  cascade++;

  var win = {
    id: nextId++,
    appId: options.appId || 'app',
    title: options.title || 'Window',
    icon: options.icon || '',
    rect: clampRect({
      x: options.x != null ? options.x : baseX,
      y: options.y != null ? options.y : baseY,
      w: w,
      h: h
    }),
    prevRect: null,
    // Snap state: 'left' / 'right' / 'top-left' / ... when snapped, null
    // when free. Maximize is tracked separately, exactly like Win10's
    // window state.
    snapZone: null,
    maximized: false,
    minimized: false,
    focused: false,
    seq: 0,
    el: null,
    bodyEl: null,
    maxBtn: null,
    titleEl: null,
    api: null
  };

  var frame = buildWindowFrame(win, {
    onCaption: function (action) {
      if (action === 'minimize') {
        win.api.minimize();
      } else if (action === 'maximize') {
        win.api.toggleMaximize();
      } else if (action === 'close') {
        win.api.close();
      }
    },
    onPress: function (target) {
      startWindowGesture(win, target, 'synthetic');
    },
    onSystemMenu: function (x, y) {
      openWindowSystemMenu(win, x, y);
    }
  });
  win.el = frame.el;
  win.bodyEl = frame.body;
  win.maxBtn = frame.maxBtn;
  win.titleEl = frame.title;

  layer.appendChild(win.el);
  windows.push(win);
  paint(win);
  focusWindow(win);
  if (!REDUCED) {
    frame.el.classList.add('win-opening');
    frame.el.addEventListener('animationend', function openingDone() {
      frame.el.removeEventListener('animationend', openingDone);
      frame.el.classList.remove('win-opening');
    });
  }

  win.api = {
    id: win.id,
    body: win.bodyEl,
    setTitle: function (text) {
      win.title = text;
      win.titleEl.textContent = text;
      emit();
    },
    focus: function () { focusWindow(win); },
    minimize: function () { setMinimized(win, true); },
    restore: function () { setMinimized(win, false); focusWindow(win); },
    toggleMaximize: function () { toggleMaximize(win); },
    restoreSize: function () { restoreSize(win); },
    close: function () { closeWindow(win); }
  };

  emit();
  return win.api;
}

// --- Focus --------------------------------------------------------------

function focusWindow(win) {
  var changed = false;
  windows.forEach(function (w) {
    var should = w === win;
    if (w.focused !== should) {
      w.focused = should;
      w.el.classList.toggle('win-focused', should);
      changed = true;
    }
  });
  win.seq = ++focusSeq;
  win.el.style.zIndex = String(++zTop);
  if (changed) {
    emit();
  }
}

function focusedWindow() {
  for (var i = 0; i < windows.length; i++) {
    if (windows[i].focused) {
      return windows[i];
    }
  }
  return windows.length ? windows[windows.length - 1] : null;
}

// --- Minimize / restore -------------------------------------------------

function setMinimized(win, on) {
  win.minimized = on;
  if (REDUCED) {
    win.el.style.display = on ? 'none' : '';
    if (!on) {
      paint(win);
    }
    emit();
    return;
  }
  if (on) {
    aimAtTaskbarButton(win);
    win.el.classList.add('win-minimizing');
    // Snapshot now so the taskbar underline drops with the animation, and
    // again when the window is hidden for good.
    emit();
    window.setTimeout(function () {
      win.el.classList.remove('win-minimizing');
      win.el.style.display = 'none';
      emit();
    }, MINIMIZE_MS);
  } else {
    win.el.style.display = '';
    paint(win);
    aimAtTaskbarButton(win);
    win.el.classList.add('win-restoring');
    window.setTimeout(function () {
      win.el.classList.remove('win-restoring');
    }, RESTORE_MS);
    emit();
  }
}

// --- Snap / maximize state ----------------------------------------------

function saveRestoreRect(win) {
  win.prevRect = { x: win.rect.x, y: win.rect.y, w: win.rect.w, h: win.rect.h };
}

function maximizeWindow(win) {
  var area = workAreaRect();
  if (!win.snapZone) {
    // A snapped window maximizes on top of its snap, so the zone stays and
    // restoring later returns it there (Win10's behaviour).
    saveRestoreRect(win);
  }
  win.maximized = true;
  win.rect = { x: area.x, y: area.y, w: area.w, h: area.h };
  setMaximizedChrome(win, true);
  paint(win);
  focusWindow(win);
}

// Restore Down: return to the rect the window sat at before it was snapped
// or maximized.
function restoreSize(win) {
  unsnapWindow(win);
  paint(win);
  focusWindow(win);
}

function toggleMaximize(win) {
  if (!win.maximized) {
    maximizeWindow(win);
    return;
  }
  // Restoring a maximize lands on the snap position when one exists.
  var restore = win.snapZone ? snapZoneRect(win.snapZone) : win.prevRect;
  if (!restore) {
    restore = defaultRect();
  }
  win.maximized = false;
  win.rect = clampRect({ x: restore.x, y: restore.y, w: restore.w, h: restore.h });
  setMaximizedChrome(win, false);
  paint(win);
  focusWindow(win);
}

function snapWindow(win, zone) {
  hideSnapAssist();
  var z = snapZoneRect(zone);
  if (!z) {
    return;
  }
  if (zone === 'top') {
    maximizeWindow(win);
    return;
  }
  if (!win.snapZone && !win.maximized) {
    saveRestoreRect(win);
  }
  win.snapZone = zone;
  win.maximized = false;
  setMaximizedChrome(win, false);
  win.rect = { x: z.x, y: z.y, w: z.w, h: z.h };
  paint(win);
  focusWindow(win);
  if (isHalfZone(zone)) {
    offerSnapAssist(win, zone);
  }
}

function unsnapWindow(win) {
  var restore = win.prevRect || defaultRect();
  win.snapZone = null;
  win.maximized = false;
  setMaximizedChrome(win, false);
  win.rect = clampRect({ x: restore.x, y: restore.y, w: restore.w, h: restore.h });
}

// Snap Assist: offer the other open windows for the vacant half, most
// recently focused first, the way Win10 fills the rest of the screen.
function offerSnapAssist(snappedWin, zone) {
  var vacant = oppositeHalf(zone);
  // Win10 shows the chooser only while the space it fills is empty: with
  // both halves taken there is nothing to offer.
  for (var i = 0; i < windows.length; i++) {
    if (windows[i] !== snappedWin && windows[i].snapZone === vacant) {
      return;
    }
  }
  var others = windows.filter(function (w) { return w !== snappedWin; });
  if (!others.length) {
    return;
  }
  others.sort(function (a, b) { return b.seq - a.seq; });
  showSnapAssist({
    layer: layer,
    zone: zone,
    items: others.map(function (w) {
      return { id: w.id, title: w.title, icon: w.icon };
    }),
    onPick: function (winId) {
      var target = windowById(winId);
      if (!target) {
        return;
      }
      if (target.minimized) {
        setMinimized(target, false);
      }
      // Fill the vacant half — not the half this window just took, which
      // would stack the chosen window on top of it.
      snapWindow(target, vacant);
    }
  });
}

function closeWindow(win) {
  var at = windows.indexOf(win);
  if (at >= 0) {
    windows.splice(at, 1);
  }
  hideSnapAssist();
  if (win.focused && windows.length > 0) {
    focusWindow(windows[windows.length - 1]);
  }
  emit();
  if (REDUCED) {
    removeWindowEl(win);
    return;
  }
  win.el.classList.add('win-closing');
  window.setTimeout(function () {
    removeWindowEl(win);
  }, CLOSE_MS);
}

function removeWindowEl(win) {
  if (win.el.parentNode) {
    win.el.parentNode.removeChild(win.el);
  }
}

// --- Window system menu -------------------------------------------------

function openWindowSystemMenu(win, x, y) {
  openWindowMenu(x, y, {
    maximized: win.maximized,
    snapped: !!win.snapZone,
    minimized: win.minimized
  }, {
    restoreSize: function () { restoreSize(win); },
    move: function () {
      startGuidedMode(win, 'move', { clamp: clampRect, paint: paint, unsnap: unsnapWindow });
    },
    size: function () {
      startGuidedMode(win, 'size', { clamp: clampRect, paint: paint, unsnap: unsnapWindow });
    },
    minimize: function () { win.api.minimize(); },
    maximize: function () { toggleMaximize(win); },
    close: function () { win.api.close(); }
  });
}

// Alt+Space opens the menu of the focused window, like Win10.
window.addEventListener('keydown', function (event) {
  if (event.key !== ' ' || !event.altKey || !layer) {
    return;
  }
  var win = focusedWindow();
  if (!win) {
    return;
  }
  event.preventDefault();
  var p = stageToClient(Math.round(win.rect.x + 24), Math.round(win.rect.y + 4));
  openWindowSystemMenu(win, p.x, p.y);
}, true);

// --- Drag / resize gestures ---------------------------------------------

function gesturePoint() {
  return pointer ? pointer.position() : { x: 0, y: 0 };
}

// Torn free of a snap or maximize before the drag proceeds, the way Win10
// hands back the restore size when a titlebar is dragged away.
function pinToGrip(win, mode) {
  if (!win.snapZone && !win.maximized) {
    return;
  }
  if (mode !== 'move') {
    unsnapWindow(win);
    return;
  }
  var pos = gesturePoint();
  unsnapWindow(win);
  // The window reappears at its restore size under the pointer, so the drag
  // continues from the held titlebar instead of jumping.
  win.rect.x = pos.x - win.rect.w / 2;
  win.rect.y = Math.max(0, pos.y - SNAP_FREE_DROP_PX);
  clampRect(win.rect);
  paint(win);
}

function beginGesture(win, mode, origin) {
  var pos = gesturePoint();
  pinToGrip(win, mode);
  gesture = {
    origin: origin,
    win: win,
    mode: mode,
    startX: pos.x,
    startY: pos.y,
    moveX: pos.x,
    orig: { x: win.rect.x, y: win.rect.y, w: win.rect.w, h: win.rect.h },
    pendingZone: null,
    shake: { dir: 0, flips: 0, lastAt: 0 }
  };
}

function startWindowGesture(win, target, origin) {
  focusWindow(win);
  if (win.minimized) {
    return;
  }
  var inCaps = target && target.closest ? target.closest('.win-caps') : null;
  if (inCaps) {
    return;
  }
  var grip = target && target.closest ? target.closest('.win-resize') : null;
  if (grip) {
    beginGesture(win, 'resize:' + grip.dataset.zone, origin);
    return;
  }
  var bar = target && target.closest ? target.closest('.win-titlebar') : null;
  if (bar) {
    beginGesture(win, 'move', origin);
  }
}

function windowFromNode(node) {
  while (node) {
    for (var i = 0; i < windows.length; i++) {
      if (windows[i].el === node) {
        return windows[i];
      }
    }
    node = node.parentNode;
  }
  return null;
}

// Trusted presses: the press lifecycle has to be the device's, because a
// routed click compresses down+up into one instant and a drag would never be
// seen. The emulated cursor is the only pointer, so every real press is
// hit-tested under it — captured or not.
window.addEventListener('mousedown', function (event) {
  if (!event.isTrusted || !layer || !cursor) {
    return;
  }
  var point = cursor.getPosition();
  var rect = layer.getBoundingClientRect();
  // Uniform stage scale (the layer is 40px shorter, so height lies).
  var scale = rect.width / DISPLAY_WIDTH;
  var target = cursor.hitTest(rect.left + point.x * scale, rect.top + point.y * scale);
  var win = target ? windowFromNode(target) : null;
  if (win) {
    startWindowGesture(win, target, 'real');
  }
});

function updateGesture() {
  if (!gesture || !layer) {
    return;
  }
  var pos = gesturePoint();
  var g = gesture;
  var r = g.win.rect;
  var o = g.orig;
  var dx = pos.x - g.startX;
  var dy = pos.y - g.startY;
  if (g.mode === 'move') {
    r.x = o.x + dx;
    r.y = o.y + dy;
    clampRect(r);
    trackShake(g, pos);
    trackSnapZone(g, pos);
  } else {
    var zone = g.mode.slice('resize:'.length);
    if (zone.indexOf('e') >= 0) { r.w = o.w + dx; }
    if (zone.indexOf('s') >= 0) { r.h = o.h + dy; }
    if (zone.indexOf('w') >= 0) { r.x = o.x + dx; r.w = o.w - dx; }
    if (zone.indexOf('n') >= 0) { r.y = o.y + dy; r.h = o.h - dy; }
    clampRect(r);
  }
  paint(g.win);
}

function trackSnapZone(g, pos) {
  var zone = snapZoneAt(pos.x, pos.y);
  if (zone === g.pendingZone) {
    return;
  }
  g.pendingZone = zone;
  if (zone) {
    showSnapPreview(zone);
  } else {
    hideSnapPreview();
  }
}

// Aero Shake: a quick horizontal back-and-forth of the titlebar minimizes
// every other window, like Win7+.
function trackShake(g, pos) {
  var dx = pos.x - g.moveX;
  g.moveX = pos.x;
  if (Math.abs(dx) < SHAKE_MIN_STEP_PX) {
    // Dribble: neither a swing nor a reversal.
    return;
  }
  var now = Date.now();
  var dir = dx > 0 ? 1 : -1;
  if (g.shake.dir !== 0 && now - g.shake.lastAt > SHAKE_WINDOW_MS) {
    // The run went stale: start counting over.
    g.shake.flips = 0;
  }
  if (g.shake.dir === 0 || g.shake.dir === dir) {
    g.shake.dir = dir;
    g.shake.lastAt = now;
    return;
  }
  g.shake.flips++;
  g.shake.dir = dir;
  g.shake.lastAt = now;
  if (g.shake.flips >= SHAKE_FLIPS) {
    g.shake.flips = 0;
    shakeOthers(g.win);
  }
}

function shakeOthers(victim) {
  windows.forEach(function (w) {
    if (w !== victim && !w.minimized) {
      setMinimized(w, true);
    }
  });
}

window.addEventListener('mousemove', updateGesture);
window.addEventListener('touchmove', updateGesture, { passive: true });

window.addEventListener('mouseup', function (event) {
  if (!gesture) {
    return;
  }
  if (!event.isTrusted && gesture.origin === 'real') {
    // Routed echo of the live real press: wait for the real release.
    return;
  }
  var g = gesture;
  gesture = null;
  hideSnapPreview();
  if (g.mode === 'move' && g.pendingZone) {
    snapWindow(g.win, g.pendingZone);
  }
});

window.addEventListener('blur', function () {
  gesture = null;
  hideSnapPreview();
  hideSnapAssist();
  stopGuidedMode();
});
