import {
  DISPLAY_WIDTH,
  DISPLAY_HEIGHT,
  CURSOR_IDLE_SRC,
  CURSOR_LINK_SRC,
  CURSOR_TEXT_SRC,
  CURSOR_SIZE_PX,
  CURSOR_IDLE_HOTSPOT,
  CURSOR_LINK_HOTSPOT,
  CURSOR_TEXT_HOTSPOT,
  MOUSE_SENSITIVITY,
  POST_LOCK_IGNORE_MS,
  MAX_MOUSE_DELTA_PX,
  TOUCH_SENSITIVITY,
  TOUCH_HOLD_MS,
  TAP_MAX_MS,
  TAP_MAX_MOVE_PX
} from '../global/constants.js';

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
// - Touch: the surface behaves like a laptop touchpad — one finger drags the
//   cursor relatively, a quick tap left-clicks, holding presses and drags,
//   two fingers scroll what is under the cursor.

var INPUT_LAYER_CLASS = 'sim-input-layer';

// Browser chrome, not the emulated OS: it sits above the capture layer on
// purpose, so its presses belong to the browser and must never be swallowed
// or routed into the OS (see sitechrome.js).
var CHROME_SELECTOR = '.site-chrome';

function isSiteChrome(target) {
  return !!(target && target.closest && target.closest(CHROME_SELECTOR));
}

var LINK_SELECTOR = 'a, button, input, select, textarea, [role="button"]';
var TEXT_SELECTOR = 'textarea, input[type="text"], input[type="password"], input[type="search"], input:not([type])';
// Elements that carry a .sim-hover twin for their :hover style: the capture
// layer means real :hover never fires on the emulated UI, so the class is the
// only hover the OS gets.
var HOVER_SELECTOR = 'button, a, input, select, textarea, [role="button"], ' +
  '.desktop-icon, .exp-tile, .exp-list-row, .exp-detail-row, .exp-drive, ' +
  '.exp-nav-row, .exp-crumb-btn, .task-showdesktop, .start-item';

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
  // paint the cursor underneath them.
  document.body.appendChild(el);

  // The glyph is drawn in emulated pixels but lives outside the stage, which
  // the page scales down to fit the viewport — so on a phone, where the whole
  // monitor is scaled to a fraction, an unscaled cursor would be several times
  // too big next to the taskbar it is pointing at. It scales with the stage.
  var scale = 1;
  var art = [CURSOR_IDLE_SRC, CURSOR_IDLE_HOTSPOT];

  function applyCursorArt() {
    img.src = art[0];
    img.style.width = (CURSOR_SIZE_PX * scale) + 'px';
    img.style.height = (CURSOR_SIZE_PX * scale) + 'px';
    // The hotspot is in emulated pixels too, so the pointer tip stays on the
    // pixel it points at at every stage scale.
    img.style.marginLeft = (-art[1][0] * scale) + 'px';
    img.style.marginTop = (-art[1][1] * scale) + 'px';
  }

  function render() {
    // Client coordinates: the cursor is a document-level element now, so it
    // has to follow the stage's on-screen rect instead of its local grid.
    var rect = stage.getBoundingClientRect();
    var nextScale = rect.width ? rect.width / DISPLAY_WIDTH : 1;
    if (nextScale !== scale) {
      scale = nextScale;
      applyCursorArt();
    }
    el.style.transform = 'translate(' + (rect.left + x / DISPLAY_WIDTH * rect.width) +
      'px,' + (rect.top + y / DISPLAY_HEIGHT * rect.height) + 'px)';
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
    art = next === 'link' ? [CURSOR_LINK_SRC, CURSOR_LINK_HOTSPOT]
      : next === 'text' ? [CURSOR_TEXT_SRC, CURSOR_TEXT_HOTSPOT]
      : [CURSOR_IDLE_SRC, CURSOR_IDLE_HOTSPOT];
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

  function updateHover(target) {
    if (target && target.closest) {
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

  function synthDown(source) {
    var target = targetUnderCursor();
    if (!target) {
      return;
    }
    target.dispatchEvent(new MouseEvent('mousedown', eventOpts(source, clientPoint())));
    if (target.focus && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) {
      target.focus();
    }
    updateHover(target);
  }

  function synthUp(source) {
    var target = targetUnderCursor();
    if (!target) {
      return;
    }
    target.dispatchEvent(new MouseEvent('mouseup', eventOpts(source, clientPoint())));
  }

  function synthTap(source) {
    var target = targetUnderCursor();
    if (!target) {
      return;
    }
    target.dispatchEvent(new MouseEvent('click', eventOpts(source, clientPoint())));
    updateHover(target);
  }

  function synthClick(modifiers) {
    synthDown(modifiers);
    synthUp(modifiers);
    synthTap(modifiers);
  }

  function synthWheel(deltaX, deltaY) {
    var target = targetUnderCursor();
    if (!target) {
      return;
    }
    var c = clientPoint();
    target.dispatchEvent(new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaX: deltaX,
      deltaY: deltaY,
      clientX: c.x,
      clientY: c.y
    }));
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
    var hovered = targetUnderCursor();
    updateHover(hovered);
    setSimHover(hovered);
  }

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
    synthWheel(event.deltaX, event.deltaY);
  }, { capture: true, passive: false });

  // --- Touch: relative touchpad tracking (unchanged by pointer lock). ---
  // Holding one finger still engages a press (like holding a mouse button),
  // so windows and icons can be dragged; a quick tap still clicks.
  var fingers = {};
  var fingerCount = 0;
  var tapCandidate = null;
  var holdTimer = null;
  var holdActive = false;
  var holdMoved = 0;

  function clearHold() {
    if (holdTimer) {
      window.clearTimeout(holdTimer);
      holdTimer = null;
    }
  }

  function fingerDown(touch) {
    fingers[touch.identifier] = { x: touch.clientX, y: touch.clientY };
    fingerCount++;
    if (fingerCount === 1) {
      tapCandidate = { start: Date.now(), moved: 0 };
      holdActive = false;
      holdMoved = 0;
      holdTimer = window.setTimeout(function () {
        holdTimer = null;
        if (fingerCount === 1 && fingers[touch.identifier]) {
          holdActive = true;
          synthDown(null);
        }
      }, TOUCH_HOLD_MS);
    } else {
      // Second finger turns the gesture into a scroll; not a tap or hold.
      tapCandidate = null;
      if (holdActive) {
        synthUp(null);
      }
      clearHold();
      holdActive = false;
    }
  }

  function fingerMove(touch) {
    var prev = fingers[touch.identifier];
    if (!prev) {
      return null;
    }
    var dx = touch.clientX - prev.x;
    var dy = touch.clientY - prev.y;
    prev.x = touch.clientX;
    prev.y = touch.clientY;
    return { dx: dx, dy: dy };
  }

  function fingerUp(touch) {
    if (fingers[touch.identifier]) {
      delete fingers[touch.identifier];
      fingerCount--;
    }
  }

  // Touch is caught at the window, before it can reach anything: a finger on
  // the touchpad steers the emulated cursor and nothing else, so it can never
  // press what sits under the finger.
  window.addEventListener('touchstart', function (event) {
    if (!booted || isSiteChrome(event.target)) {
      // Site chrome taps are taps, not touchpad gestures, so they must not be
      // swallowed into a cursor move.
      return;
    }
    event.preventDefault();
    for (var i = 0; i < event.changedTouches.length; i++) {
      fingerDown(event.changedTouches[i]);
    }
  }, { passive: false, capture: true });

  window.addEventListener('touchmove', function (event) {
    if (!booted) {
      return;
    }
    event.preventDefault();
    var rect = stage.getBoundingClientRect();
    var toStage = DISPLAY_WIDTH / rect.width;
    if (fingerCount === 1) {
      var touch = event.changedTouches[0];
      var d = fingerMove(touch);
      if (!d) {
        return;
      }
      x += d.dx * toStage * TOUCH_SENSITIVITY;
      y += d.dy * toStage * TOUCH_SENSITIVITY;
      clamp();
      render();
      // The emulated cursor is the pointer, so the finger hovering a control
      // hovers it exactly as a mouse would.
      updateHoverTarget();
      holdMoved += Math.abs(d.dx) + Math.abs(d.dy);
      if (!holdActive && holdTimer && holdMoved >= TAP_MAX_MOVE_PX) {
        // Left the spot: plain cursor move, not a hold.
        clearHold();
      }
      if (tapCandidate) {
        tapCandidate.moved += Math.abs(d.dx) + Math.abs(d.dy);
      }
    } else if (fingerCount === 2) {
      // Two-finger drag scrolls whatever sits under the cursor.
      var totalX = 0;
      var totalY = 0;
      var n = 0;
      for (var j = 0; j < event.changedTouches.length; j++) {
        var dd = fingerMove(event.changedTouches[j]);
        if (dd) {
          totalX += dd.dx;
          totalY += dd.dy;
          n++;
        }
      }
      if (n > 0) {
        synthWheel(totalX / n, totalY / n);
      }
    }
  }, { passive: false, capture: true });

  function touchEnd(event) {
    if (!booted) {
      return;
    }
    event.preventDefault();
    var wasTap = tapCandidate &&
      fingerCount === 1 &&
      (Date.now() - tapCandidate.start) < TAP_MAX_MS &&
      tapCandidate.moved < TAP_MAX_MOVE_PX;
    var held = holdActive;
    var heldStill = holdMoved < TAP_MAX_MOVE_PX;
    clearHold();
    holdActive = false;
    for (var i = 0; i < event.changedTouches.length; i++) {
      fingerUp(event.changedTouches[i]);
    }
    if (fingerCount === 0) {
      tapCandidate = null;
    }
    if (held) {
      // Held press released: end the drag, and click only if it never moved.
      synthUp(null);
      if (heldStill) {
        synthTap(null);
      }
    } else if (wasTap) {
      synthClick();
    }
  }

  window.addEventListener('touchend', touchEnd, { passive: false, capture: true });
  window.addEventListener('touchcancel', function (event) {
    if (!booted) {
      return;
    }
    event.preventDefault();
    if (holdActive) {
      synthUp(null);
    }
    clearHold();
    holdActive = false;
    for (var i = 0; i < event.changedTouches.length; i++) {
      fingerUp(event.changedTouches[i]);
    }
    tapCandidate = null;
  }, { passive: false, capture: true });

  setState('idle');
  render();
  syncLockState();

  function setBooted(done) {
    booted = done;
    syncLockState();
  }

  return {
    element: el,
    getPosition: function () {
      return { x: Math.round(x), y: Math.round(y) };
    },
    // The element under the emulated cursor, for the surfaces that track a
    // device press through its whole lifecycle (drags) and so have to find
    // the target themselves.
    hitTest: hitTestThroughInputLayer,
    setBooted: setBooted
  };
}
