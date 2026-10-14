import {
  DISPLAY_WIDTH,
  DISPLAY_HEIGHT,
  CURSOR_IDLE_SRC,
  CURSOR_LINK_SRC,
  CURSOR_TEXT_SRC,
  CURSOR_RESIZE_EW_SRC,
  CURSOR_RESIZE_NS_SRC,
  CURSOR_RESIZE_NESW_SRC,
  CURSOR_RESIZE_NWSE_SRC,
  CURSOR_UNAVAILABLE_SRC,
  CURSOR_BUSY_FRAME_COUNT,
  CURSOR_BUSY_FRAME_MS,
  CURSOR_SIZE_PX,
  CURSOR_IDLE_HOTSPOT,
  CURSOR_LINK_HOTSPOT,
  CURSOR_TEXT_HOTSPOT,
  CURSOR_RESIZE_EW_HOTSPOT,
  CURSOR_RESIZE_NS_HOTSPOT,
  CURSOR_DIAG_HOTSPOT,
  CURSOR_BUSY_HOTSPOT,
  MOUSE_SENSITIVITY,
  POST_LOCK_IGNORE_MS,
  MAX_MOUSE_DELTA_PX
} from '../global/constants.js';
import { mountTouchpad } from './touchpad.js';
import { isDragging, onDragEnd } from '../system/drag.js';

// The emulated hardware cursor is the only pointer in the emulated OS.
//
// A capture layer sits over the whole viewport and takes every real press,
// move, wheel and touch. The browser's pointer therefore never reaches the
// UI: it cannot hover it, cannot click it, and a finger on the touchpad
// cannot press what happens to sit under that finger. Input is delivered the
// only way Win10 delivers it — by routing it to whatever sits under the
// emulated cursor.
//
// - Desktop: clicking captures the pointer (the OS pointer freezes and
//   movement deltas steer the emulated cursor); if capture is unavailable the
//   real pointer steers the cursor absolutely, still with no direct UI
//   interaction. Esc releases; click re-captures.
// - Touch: the surface behaves like a laptop touchpad, recognised in
//   touchpad.js — one finger steers the cursor through an acceleration curve, a
//   tap left-clicks, a tap that keeps moving drags, a finger held still
//   presses, two fingers scroll (and coast), two fingers tapped right-click
//   and three middle-click.

var INPUT_LAYER_CLASS = 'sim-input-layer';

// Browser chrome, not the emulated OS: it sits above the capture layer on
// purpose, so its presses belong to the browser and must never be swallowed
// or routed into the OS (see sitechrome.js). The virtual keyboard is chrome too
// and is not a `.site-chrome` button - it is a panel, with its own shape - so it
// is named here rather than dressed in the button's styles.
var CHROME_SELECTOR = '.site-chrome, .sim-keyboard';

function isSiteChrome(target) {
  return !!(target && target.closest && target.closest(CHROME_SELECTOR));
}

var LINK_SELECTOR = 'a, button, input, select, textarea, [role="button"]';
// The shell's own text fields carry role="textbox" (see textfield.js), and they
// want the beam like any other field text goes into.
var TEXT_SELECTOR = 'textarea, input[type="text"], input[type="password"], input[type="search"], input:not([type]), [role="textbox"]';
// Elements that carry a .sim-hover twin for their :hover style: the capture
// layer means real :hover never fires on the emulated UI, so the class is the
// only hover the OS gets.
var HOVER_SELECTOR = 'button, a, input, select, textarea, [role="button"], [role="textbox"], ' +
  '.desktop-icon, .exp-tile, .exp-list-row, .exp-detail-row, .exp-drive, ' +
  '.exp-qa-row, .exp-nav-row, .exp-crumb-btn, .task-showdesktop, .start-item';

var inputLayer = null;

// Hit-testing has to see past the capture layer, which by definition covers
// everything. Dropping its hit-test for the duration of one lookup is what
// makes the emulated cursor the only thing that can address the UI.
export function hitTestThroughInputLayer(clientX, clientY) {
  var layer = inputLayer || document.querySelector('.' + INPUT_LAYER_CLASS);
  if (!layer) {
    return document.elementFromPoint(clientX, clientY);
  }
  var wasHitTestable = layer.style.pointerEvents !== 'none';
  if (wasHitTestable) {
    layer.style.pointerEvents = 'none';
  }
  var found = document.elementFromPoint(clientX, clientY);
  if (wasHitTestable) {
    layer.style.pointerEvents = '';
  }
  return found;
}

// True for a press the device made rather than one the emulated cursor
// delivered: it landed on the capture layer, or the pointer is locked and the
// press was retargeted at the stage. Surfaces that treat a press as "outside
// me" ask first — steering the cursor with a finger on the touchpad is not a
// press on anything, and must never dismiss a menu.
export function isRawDevicePress(event) {
  if (!event || !event.isTrusted) {
    return false;
  }
  var target = event.target;
  if (target && target.closest && target.closest('.' + INPUT_LAYER_CLASS)) {
    return true;
  }
  return !!document.pointerLockElement;
}

// One entry per cursor the OS can be wearing: the artwork and where its click
// point sits inside it. Both come out of the source .cur files' own headers.
var CURSOR_ART = {
  idle: { src: CURSOR_IDLE_SRC, hotspot: CURSOR_IDLE_HOTSPOT },
  link: { src: CURSOR_LINK_SRC, hotspot: CURSOR_LINK_HOTSPOT },
  text: { src: CURSOR_TEXT_SRC, hotspot: CURSOR_TEXT_HOTSPOT },
  'resize-ew': { src: CURSOR_RESIZE_EW_SRC, hotspot: CURSOR_RESIZE_EW_HOTSPOT },
  'resize-ns': { src: CURSOR_RESIZE_NS_SRC, hotspot: CURSOR_RESIZE_NS_HOTSPOT },
  'resize-nesw': { src: CURSOR_RESIZE_NESW_SRC, hotspot: CURSOR_DIAG_HOTSPOT },
  'resize-nwse': { src: CURSOR_RESIZE_NWSE_SRC, hotspot: CURSOR_DIAG_HOTSPOT },
  unavailable: { src: CURSOR_UNAVAILABLE_SRC, hotspot: CURSOR_DIAG_HOTSPOT },
  busy: { hotspot: CURSOR_BUSY_HOTSPOT, animated: true }
};

// A window's resize grip says which way the edge runs, and Windows answers
// with the cursor that runs the same way.
var RESIZE_CURSOR = {
  n: 'resize-ns',
  s: 'resize-ns',
  e: 'resize-ew',
  w: 'resize-ew',
  ne: 'resize-nesw',
  sw: 'resize-nesw',
  nw: 'resize-nwse',
  se: 'resize-nwse'
};

// The emulated cursor in the running session, so the loading ring can be put on
// from anywhere (app launch) without threading the cursor through.
var session = null;

// The loading ring, as Windows wears it while something is starting.
export function setCursorBusy(busy) {
  if (session) {
    session.setBusy(busy);
  }
}

export function createCursor(stage) {
  var x = Math.floor(DISPLAY_WIDTH / 2);
  var y = Math.floor(DISPLAY_HEIGHT / 2);
  var state = '';
  var booted = false;
  var finePointer = !!(window.matchMedia && window.matchMedia('(pointer: fine)').matches);

  var el = document.createElement('div');
  el.className = 'sim-cursor';
  var img = document.createElement('img');
  img.className = 'sim-cursor-img';
  img.alt = '';
  img.draggable = false;
  el.appendChild(img);
  // No cursor until boot finishes: the machine is not usable yet.
  el.classList.add('sim-cursor-off');
  // The cursor lives at the document level, not inside the stage: context
  // menus open there too, and the stage's stacking context would always
  // paint the cursor underneath them. The cost of that is that nothing was
  // clipping it, so at the edges of the emulated screen the 32px sprite hung
  // off the monitor - which on a phone is plainly visible, because there the
  // stage is letterboxed inside the viewport and the spill lands on the page.
  // The frame is the emulated screen on the page: the pointer can still reach
  // every pixel of it, and the frame is what stops the sprite being drawn
  // outside it.
  var frame = document.createElement('div');
  frame.className = 'sim-cursor-frame';
  frame.appendChild(el);
  document.body.appendChild(frame);

  // The glyph is drawn in emulated pixels but lives outside the stage, which
  // the page scales down to fit the viewport — so on a phone, where the whole
  // monitor is scaled to a fraction, an unscaled cursor would be several times
  // too big next to the taskbar it is pointing at. It scales with the stage.
  var scale = 1;
  var busy = false;
  var busyFrame = 0;
  var busyTimer = null;

  function busySrc() {
    return 'assets/cursor/busy-' + (busyFrame % CURSOR_BUSY_FRAME_COUNT) + '.png';
  }

  function applyCursorArt() {
    var art = CURSOR_ART[state] || CURSOR_ART.idle;
    var hotspot = art.hotspot;
    img.src = art.animated ? busySrc() : art.src;
    img.style.width = (CURSOR_SIZE_PX * scale) + 'px';
    img.style.height = (CURSOR_SIZE_PX * scale) + 'px';
    // The hotspot is in emulated pixels too, so the pointer tip stays on the
    // pixel it points at at every stage scale.
    img.style.marginLeft = (-hotspot[0] * scale) + 'px';
    img.style.marginTop = (-hotspot[1] * scale) + 'px';
  }

  // The loading ring is an animated cursor, so it is played here rather than
  // drawn: the frames came out of the .ani one file per frame.
  function setBusy(on) {
    if (busy === !!on) {
      return;
    }
    busy = !!on;
    if (busyTimer) {
      window.clearInterval(busyTimer);
      busyTimer = null;
    }
    if (busy) {
      busyFrame = 0;
      setState('busy');
      busyTimer = window.setInterval(function () {
        busyFrame++;
        applyCursorArt();
      }, CURSOR_BUSY_FRAME_MS);
      return;
    }
    // Back to whatever the pointer is actually over.
    updateHover(targetUnderCursor());
  }

  function render() {
    var rect = stage.getBoundingClientRect();
    var nextScale = rect.width ? rect.width / DISPLAY_WIDTH : 1;
    if (nextScale !== scale) {
      scale = nextScale;
      applyCursorArt();
    }
    // The frame is the emulated screen where it has landed on the page, bounded by
    // the window as well: the cursor is the one thing that must never be drawn
    // outside the viewport, and the sprite is 32px across with its hotspot on the
    // pointer, so at the bottom and right edges most of it hangs over. The
    // cursor's place inside the frame is then measured from the frame, not from
    // the stage, so the two stay together when the clip is inset.
    var left = Math.max(0, rect.left);
    var top = Math.max(0, rect.top);
    var right = Math.min(window.innerWidth || rect.right, rect.right);
    var bottom = Math.min(window.innerHeight || rect.bottom, rect.bottom);
    frame.style.left = left + 'px';
    frame.style.top = top + 'px';
    frame.style.width = Math.max(0, right - left) + 'px';
    frame.style.height = Math.max(0, bottom - top) + 'px';
    el.style.transform = 'translate(' + (x / DISPLAY_WIDTH * rect.width - (left - rect.left)) +
      'px,' + (y / DISPLAY_HEIGHT * rect.height - (top - rect.top)) + 'px)';
  }

  // A viewport change rescales the stage under the cursor, so the glyph has to
  // be re-measured even if the cursor itself never moves.
  window.addEventListener('resize', render);
  window.addEventListener('orientationchange', render);

  function clamp() {
    x = Math.max(0, Math.min(DISPLAY_WIDTH - 1, x));
    y = Math.max(0, Math.min(DISPLAY_HEIGHT - 1, y));
  }

  function setState(next) {
    if (next === state) {
      return;
    }
    state = next;
    applyCursorArt();
  }

  function clientPoint() {
    var rect = stage.getBoundingClientRect();
    return {
      x: rect.left + x / DISPLAY_WIDTH * rect.width,
      y: rect.top + y / DISPLAY_HEIGHT * rect.height
    };
  }

  var hoverEl = null;

  function setSimHover(target) {
    var next = target && target.closest ? target.closest(HOVER_SELECTOR) : null;
    if (next === hoverEl) {
      return;
    }
    if (hoverEl) {
      hoverEl.classList.remove('sim-hover');
    }
    hoverEl = next;
    if (hoverEl) {
      hoverEl.classList.add('sim-hover');
    }
  }

  function clearSimHover() {
    if (hoverEl) {
      hoverEl.classList.remove('sim-hover');
      hoverEl = null;
    }
  }

  // What the pointer is wearing follows what it is over: a resize grip gets the
  // cursor that runs along that edge, a text field the beam, a control the hand.
  //
  // A title bar gets nothing. Windows dresses a title bar in the four-arrowed
  // move cursor, and here the shape meant nothing to anyone: a title bar is the
  // widest thing anyone aims at, so the arrow flickered on and off as the pointer
  // crossed it on its way somewhere else, and then stayed for the whole drag - one
  // glyph still claiming a move after the window had already moved. A window
  // following the pointer says that by itself.
function updateHover(target) {
  if (busy) {
    // Something is starting: the ring outranks whatever is underneath.
    setState('busy');
    return;
  }
  if (target && target.closest) {
    var grip = target.closest('.win-resize');
    if (grip && RESIZE_CURSOR[grip.dataset.zone]) {
      setState(RESIZE_CURSOR[grip.dataset.zone]);
      return;
    }
    // Text fields win over the generic link state.
    if (target.closest(TEXT_SELECTOR)) {
      setState('text');
      return;
    }
    if (target.closest(LINK_SELECTOR)) {
      setState('link');
      return;
    }
  }
  setState('idle');
}

  // The capture layer: the browser's pointer stops here and everything the
  // emulated OS can be pressed with is routed from here. It sits outside the
  // stage so the stage's own handlers never see a real press at all, and it
  // stays out of the way until the machine boots — the BIOS splash, lock and
  // sign-in screens are clicked with the browser's own pointer, as they are
  // before any OS exists.
  inputLayer = document.createElement('div');
  inputLayer.className = INPUT_LAYER_CLASS;
  inputLayer.hidden = true;
  inputLayer.setAttribute('aria-hidden', 'true');
  (stage.parentNode || document.body).appendChild(inputLayer);

  function targetUnderCursor() {
    var c = clientPoint();
    // The cursor element is pointer-events:none too, so this resolves to the
    // emulated UI underneath.
    return hitTestThroughInputLayer(c.x, c.y);
  }

  function eventOpts(source, c) {
    return {
      bubbles: true,
      cancelable: true,
      clientX: c.x,
      clientY: c.y,
      view: window,
      ctrlKey: !!(source && source.ctrlKey),
      shiftKey: !!(source && source.shiftKey),
      altKey: !!(source && source.altKey),
      metaKey: !!(source && source.metaKey)
    };
  }

  // A routed press that is the echo of a real device press is marked as one.
  // The echo is delivered in the same tick as the press that caused it, and it
  // arrives BEFORE that press reaches the surfaces that follow a press through
  // its lifecycle (drags), so without the mark a single physical press reads as
  // two presses and the echo wins the race: a tile would launch before it could
  // be dragged anywhere. Those surfaces skip echoes and follow the device press.
  function markEcho(event, source) {
    if (source && source.isTrusted) {
      event.simEcho = true;
    }
    return event;
  }

  function synthDown(source) {
    var target = targetUnderCursor();
    if (!target) {
      return;
    }
    target.dispatchEvent(markEcho(new MouseEvent('mousedown', eventOpts(source, clientPoint())), source));
    // The browser's own controls are focused here for them. The shell's fields
    // are not: they are the shell's, and a field takes the caret itself when it
    // is pressed, exactly as a real one does when the browser focuses it.
    if (target.focus && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) {
      target.focus();
    }
    updateHover(target);
  }

  // A move is an event as well as a position. Anything that follows a pointer -
  // a selection being dragged out of a text box above all - is listening for
  // mousemove, and the emulated cursor is the only pointer in the shell, so
  // without this a press-and-drag across a text box selects nothing at all.
  //
  // It is dispatched on the document rather than on the element under the cursor,
  // and it does not bubble: the shell's window-level mousemove handlers are the
  // emulated pointer's own plumbing (the window gesture, the desktop's icons, the
  // Start tiles), already fed by the device that moved the cursor, and an event
  // bubbling up from an element would make every one of those drags happen twice.
  function synthMove(source) {
    var opts = eventOpts(source, clientPoint());
    opts.bubbles = false;
    document.dispatchEvent(new MouseEvent('mousemove', opts));
  }

  function synthUp(source) {
    var target = targetUnderCursor();
    if (!target) {
      return;
    }
    target.dispatchEvent(markEcho(new MouseEvent('mouseup', eventOpts(source, clientPoint())), source));
  }

  function synthTap(source) {
    var target = targetUnderCursor();
    if (!target) {
      return;
    }
    target.dispatchEvent(markEcho(new MouseEvent('click', eventOpts(source, clientPoint())), source));
    updateHover(target);
  }

  function synthClick(modifiers) {
    synthDown(modifiers);
    synthUp(modifiers);
    synthTap(modifiers);
  }

  // The middle button, which on a pad is three fingers tapped. It is delivered
  // as the button-1 press pair plus auxclick, and deliberately NOT as a `click`:
  // a middle click is not an activation, so nothing that launches on click may
  // see one.
  function synthMiddleClick() {
    var target = targetUnderCursor();
    if (!target) {
      return;
    }
    var opts = eventOpts(null, clientPoint());
    opts.button = 1;
    opts.buttons = 1;
    target.dispatchEvent(new MouseEvent('mousedown', opts));
    target.dispatchEvent(new MouseEvent('mouseup', opts));
    target.dispatchEvent(new MouseEvent('auxclick', opts));
    updateHover(target);
  }

  // The nearest thing above `node` that can actually move on this axis. A
  // browser only scrolls a box for a *trusted* wheel event, and every wheel
  // that reaches the emulated desktop is re-dispatched from here, so the box
  // under the cursor has to be found and moved by hand.
  function scrollerFor(node, axis) {
    var overflow = axis === 'y' ? 'overflowY' : 'overflowX';
    var extent = axis === 'y' ? 'scrollHeight' : 'scrollWidth';
    var box = axis === 'y' ? 'clientHeight' : 'clientWidth';
    while (node && node !== document.body && node !== document.documentElement) {
      var style = window.getComputedStyle(node);
      var scrolls = style[overflow] === 'auto' || style[overflow] === 'scroll' ||
        style[overflow] === 'overlay';
      if (scrolls && node[extent] > node[box] + 1) {
        return node;
      }
      node = node.parentNode;
    }
    return null;
  }

  function synthWheel(deltaX, deltaY) {
    var target = targetUnderCursor();
    if (!target) {
      return;
    }
    var c = clientPoint();
    var event = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaX: deltaX,
      deltaY: deltaY,
      clientX: c.x,
      clientY: c.y
    });
    target.dispatchEvent(event);
    // Anything that handled the wheel itself (and said so) has done the work.
    if (event.defaultPrevented) {
      return;
    }
    if (deltaY) {
      var vertical = scrollerFor(target, 'y');
      if (vertical) {
        vertical.scrollTop += deltaY;
      }
    }
    if (deltaX) {
      var horizontal = scrollerFor(target, 'x');
      if (horizontal) {
        horizontal.scrollLeft += deltaX;
      }
    }
  }

  // The right button opens a Win10 context menu at the sim cursor. Real
  // contextmenu events are retargeted at the lock element under pointer
  // lock, so the menu is addressed through a custom event that carries the
  // real hit target instead.
  function dispatchContextMenu(source) {
    var c = clientPoint();
    var target = hitTestThroughInputLayer(c.x, c.y);
    if (!target) {
      return;
    }
    target.dispatchEvent(new CustomEvent('simcontextmenu', {
      bubbles: true,
      cancelable: true,
      detail: {
        clientX: c.x,
        clientY: c.y,
        ctrlKey: !!(source && source.ctrlKey),
        shiftKey: !!(source && source.shiftKey)
      }
    }));
  }

  // The emulated desktop never shows a browser menu of its own. Captured at the
  // window so neither the layer nor the locked stage ever yields one.
  window.addEventListener('contextmenu', function (event) {
    if (booted) {
      event.preventDefault();
    }
  }, true);

  // --- Pointer lock: the OS pointer freezes, deltas drive the sim cursor. ---
  function isLocked() {
    return document.pointerLockElement === stage;
  }

  var hint = null;
  if (finePointer) {
    hint = document.createElement('div');
    hint.className = 'cursor-capture-hint cursor-hint-hidden';
    hint.textContent = 'Click to capture the mouse';
    stage.appendChild(hint);
  }

  function syncLockState() {
    // The layer arms with the machine: before boot there is no emulated OS to
    // be the only pointer of.
    inputLayer.hidden = !booted;
    document.body.classList.toggle('sim-pointer-only', booted);
    el.classList.toggle('sim-cursor-off', !booted);
    if (hint) {
      hint.classList.toggle('cursor-hint-hidden', !booted || isLocked() || lockUnavailable);
    }
    if (!booted) {
      clearSimHover();
    }
  }

  var lockUnavailable = false;
  var lockWatchdog = null;

  function requestLock() {
    if (!finePointer || isLocked() || lockUnavailable) {
      return;
    }
    try {
      var result = stage.requestPointerLock();
      if (result && result.catch) {
        result.catch(function () {
          lockUnavailable = true;
          syncLockState();
        });
      }
      // If the lock never engages, stop swallowing clicks for capture.
      if (lockWatchdog) {
        window.clearTimeout(lockWatchdog);
      }
      lockWatchdog = window.setTimeout(function () {
        lockWatchdog = null;
        if (!isLocked()) {
          lockUnavailable = true;
          syncLockState();
        }
      }, 600);
    } catch (err) {
      // Pointer lock unavailable: fall back to the native OS pointer.
      lockUnavailable = true;
      syncLockState();
    }
  }

  // Chrome fires a bogus movement jump right as the lock engages;
  // movement inside this window after locking is discarded.
  var ignoreMovesUntil = 0;

  document.addEventListener('pointerlockchange', function () {
    if (isLocked()) {
      ignoreMovesUntil = Date.now() + POST_LOCK_IGNORE_MS;
      if (lockWatchdog) {
        window.clearTimeout(lockWatchdog);
        lockWatchdog = null;
      }
    }
    syncLockState();
  });
  document.addEventListener('pointerlockerror', function () {
    lockUnavailable = true;
    syncLockState();
  });

  // Every real move is heard here, whether it landed on the capture layer
  // (pointer free) or on the locked stage. Either way it only ever steers the
  // emulated cursor.
  var lastClient = null;
  window.addEventListener('mousemove', function (event) {
    if (!event.isTrusted || !booted) {
      return;
    }
    var rect = stage.getBoundingClientRect();
    if (!isLocked()) {
      // No capture: the browser pointer steers the cursor absolutely, still
      // without ever touching the UI itself.
      lastClient = { x: event.clientX, y: event.clientY };
      if (!rect.width || !rect.height) {
        return;
      }
      x = (event.clientX - rect.left) / rect.width * DISPLAY_WIDTH;
      y = (event.clientY - rect.top) / rect.height * DISPLAY_HEIGHT;
      clamp();
      render();
      updateHoverTarget();
      return;
    }
    if (Date.now() < ignoreMovesUntil) {
      lastClient = { x: event.clientX, y: event.clientY };
      return;
    }
    var dx = event.movementX;
    var dy = event.movementY;
    if (typeof dx !== 'number' || (dx === 0 && dy === 0 && lastClient)) {
      // Fallback for movement-less events: absolute difference.
      if (!lastClient) {
        return;
      }
      dx = event.clientX - lastClient.x;
      dy = event.clientY - lastClient.y;
    }
    lastClient = { x: event.clientX, y: event.clientY };
    if (Math.abs(dx) > MAX_MOUSE_DELTA_PX || Math.abs(dy) > MAX_MOUSE_DELTA_PX) {
      // Absurd single-event jump (lock-transition artifact): drop it.
      return;
    }
    var toStage = DISPLAY_WIDTH / rect.width;
    x += dx * toStage * MOUSE_SENSITIVITY;
    y += dy * toStage * MOUSE_SENSITIVITY;
    clamp();
    render();
    updateHoverTarget();
  }, true);

  function updateHoverTarget() {
    // Windows holds the pointer's shape - and a control's highlight - for the
    // whole length of a drag. A window travelling over the taskbar, a file name
    // and a text box must not turn the cursor into a hand and then a beam.
    if (isDragging()) {
      return;
    }
    var hovered = targetUnderCursor();
    updateHover(hovered);
    setSimHover(hovered);
  }

  // The drag is over, so whatever is under the cursor decides its shape again.
  onDragEnd(function () {
    updateHoverTarget();
  });

  // Capture-phase: the real press is swallowed here and re-delivered as the
  // emulated cursor's own press. The engagement click only captures the
  // mouse and never fires the UI underneath.
  window.addEventListener('mousedown', function (event) {
    if (!event.isTrusted || !booted || isSiteChrome(event.target)) {
      // Our own routed clicks bubbling back never re-enter routing, before
      // boot the browser's pointer is the only pointer there is, and the
      // website's own chrome is not ours to press.
      return;
    }
    lastClient = { x: event.clientX, y: event.clientY };
    // The layer takes the press, so the browser must not also act on it —
    // least of all move focus off whatever a routed press just focused
    // (Explorer's address and search boxes need focus to survive a click).
    event.preventDefault();
    if (!isLocked() && finePointer && !lockUnavailable) {
      requestLock();
      return;
    }
    // Route the press through the emulated cursor, keeping the real modifier
    // keys so Ctrl+click survives routing.
    if (event.button === 2) {
      dispatchContextMenu(event);
      return;
    }
    synthClick(event);
  }, true);

  // The wheel scrolls whatever is under the emulated cursor, captured or not.
  window.addEventListener('wheel', function (event) {
    if (!event.isTrusted || !booted) {
      return;
    }
    event.preventDefault();
    // A real wheel is being turned, so a coast still running from a touch flick
    // must stop rather than fight it.
    if (touchpad) {
      touchpad.cancelMomentum();
    }
    // Some wheels report lines rather than pixels; the scroller moves in
    // pixels, so translate before anything reads the delta.
    var scale = event.deltaMode === 1 ? 16 : (event.deltaMode === 2 ? 400 : 1);
    synthWheel(event.deltaX * scale, event.deltaY * scale);
  }, { capture: true, passive: false });

  // --- Touch: the surface is a laptop touchpad. ---
  // The pad is this whole stage, so the touchpad recognises the gestures and
  // reports what they meant; it never touches the DOM itself.
  var touchpad = mountTouchpad(window, {
    isBooted: function () {
      return booted;
    },
    isExempt: isSiteChrome,
    move: function (dx, dy) {
      // Finger travel is in CSS pixels while the emulated display has its own
      // size, so the movement is converted into display units.
      var rect = stage.getBoundingClientRect();
      var toStage = DISPLAY_WIDTH / rect.width;
      x += dx * toStage;
      y += dy * toStage;
      clamp();
      render();
      // The emulated cursor is the pointer, so the finger hovering a control
      // hovers it exactly as a mouse would.
      updateHoverTarget();
      // And a drag the pointer is in the middle of is still a drag: the surfaces
      // following it are told where it has got to.
      synthMove(null);
    },
    press: function () { synthDown(null); },
    release: function () { synthUp(null); },
    click: function () { synthClick(); },
    rightClick: function () { dispatchContextMenu(null); },
    middleClick: function () { synthMiddleClick(); },
    scroll: function (dx, dy) { synthWheel(dx, dy); }
  });

  setState('idle');
  render();
  syncLockState();

  function setBooted(done) {
    booted = done;
    syncLockState();
  }

  // The one cursor in the session, so anything in the shell can put the loading
  // ring on without being handed the cursor itself.
  session = {
    setBusy: setBusy
  };

  return {
    element: el,
    getPosition: function () {
      return { x: Math.round(x), y: Math.round(y) };
    },
    // The element under the emulated cursor, for the surfaces that track a
    // device press through its whole lifecycle (drags) and so have to find
    // the target themselves.
    hitTest: hitTestThroughInputLayer,
    setBusy: setBusy,
    setBooted: setBooted
  };
}
