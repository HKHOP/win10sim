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
  TAP_MAX_MS,
  TAP_MAX_MOVE_PX
} from '../global/constants.js';

// Emulated hardware cursor, driven like a real captured mouse:
// - Desktop: clicking the stage pointer-locks it (the OS pointer stays
//   frozen in place); movement deltas steer the simulated cursor and clicks
//   are routed to whatever sits under it. Esc releases; click re-captures.
// - Touch: the stage behaves like a laptop touchpad — one finger drags the
//   cursor relatively, a quick tap left-clicks, two fingers drag to scroll.

var LINK_SELECTOR = 'a, button, input, select, textarea, [role="button"]';
var TEXT_SELECTOR = 'textarea, input[type="text"], input[type="password"], input[type="search"], input:not([type])';
// Elements that carry a .sim-hover twin for their :hover style, since the
// frozen OS pointer never triggers real hover while locked.
var HOVER_SELECTOR = 'button, a, input, select, textarea, [role="button"], ' +
  '.desktop-icon, .exp-tile, .exp-list-row, .exp-detail-row, .exp-drive, ' +
  '.exp-nav-row, .exp-crumb-btn, .task-showdesktop, .start-item';

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
  img.style.width = CURSOR_SIZE_PX + 'px';
  img.style.height = CURSOR_SIZE_PX + 'px';
  img.alt = '';
  img.draggable = false;
  el.appendChild(img);
  // No cursor until boot finishes: the machine is not usable yet.
  el.classList.add('sim-cursor-off');
  // The cursor lives at the document level, not inside the stage: context
  // menus open there too, and the stage's stacking context would always
  // paint the cursor underneath them.
  document.body.appendChild(el);

  function render() {
    // Client coordinates: the cursor is a document-level element now, so it
    // has to follow the stage's on-screen rect instead of its local grid.
    var c = clientPoint();
    el.style.transform = 'translate(' + c.x + 'px,' + c.y + 'px)';
  }

  function clamp() {
    x = Math.max(0, Math.min(DISPLAY_WIDTH - 1, x));
    y = Math.max(0, Math.min(DISPLAY_HEIGHT - 1, y));
  }

  function setState(next) {
    if (next === state) {
      return;
    }
    state = next;
    var art = next === 'link' ? [CURSOR_LINK_SRC, CURSOR_LINK_HOTSPOT]
      : next === 'text' ? [CURSOR_TEXT_SRC, CURSOR_TEXT_HOTSPOT]
      : [CURSOR_IDLE_SRC, CURSOR_IDLE_HOTSPOT];
    img.src = art[0];
    img.style.marginLeft = (-art[1][0]) + 'px';
    img.style.marginTop = (-art[1][1]) + 'px';
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

  function targetUnderCursor() {
    var c = clientPoint();
    // The cursor element itself is pointer-events:none, so this resolves
    // to the simulated UI underneath.
    return document.elementFromPoint(c.x, c.y);
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
    var target = document.elementFromPoint(c.x, c.y);
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

  // The emulated desktop never shows a browser menu of its own.
  stage.addEventListener('contextmenu', function (event) {
    event.preventDefault();
  });

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
    var locked = isLocked();
    stage.classList.toggle('cursor-live', locked);
    // Also on the body: context menus live outside the stage, and a locked
    // session must not reveal the OS pointer over them.
    document.body.classList.toggle('cursor-live', locked);
    // Unlocked on a mouse-driven machine: OS pointer works normally and
    // the sim cursor parks dimmed until the next capture click.
    el.classList.toggle('sim-cursor-parked', finePointer && !locked);
    // No cursor at all before boot, or when locking is unavailable
    // (then the native OS pointer is the real one).
    el.classList.toggle('sim-cursor-off', !booted || (finePointer && lockUnavailable && !locked));
    if (hint) {
      hint.classList.toggle('cursor-hint-hidden', !booted || locked || lockUnavailable);
    }
    if (!locked) {
      setState('idle');
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

  var lastClient = null;
  stage.addEventListener('mousemove', function (event) {
    if (!isLocked()) {
      lastClient = { x: event.clientX, y: event.clientY };
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
    var rect = stage.getBoundingClientRect();
    var toStage = DISPLAY_WIDTH / rect.width;
    x += dx * toStage * MOUSE_SENSITIVITY;
    y += dy * toStage * MOUSE_SENSITIVITY;
    clamp();
    render();
    var hovered = targetUnderCursor();
    updateHover(hovered);
    setSimHover(hovered);
  });

  // Capture-phase: the engagement click only captures the mouse and never
  // fires UI underneath (locking retargets the rest of that same gesture,
  // which would otherwise misdeliver the click).
  stage.addEventListener('mousedown', function (event) {
    if (!event.isTrusted) {
      // Our own routed clicks bubbling back: never re-enter routing.
      return;
    }
    lastClient = { x: event.clientX, y: event.clientY };
    if (!isLocked()) {
      if (finePointer && !lockUnavailable) {
        event.stopPropagation();
        event.preventDefault();
        requestLock();
      }
      return;
    }
    // Locked: route the click through the simulated cursor, keeping
    // the real modifier keys so Ctrl+click survives routing.
    // preventDefault: the real press targets the lock element, so the
    // browser would move focus off whatever the routed press just focused
    // (Explorer's address and search boxes need focus to survive the click).
    event.preventDefault();
    if (event.button === 2) {
      dispatchContextMenu(event);
      return;
    }
    synthClick(event);
  }, true);

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

  stage.addEventListener('touchstart', function (event) {
    event.preventDefault();
    clearSimHover();
    for (var i = 0; i < event.changedTouches.length; i++) {
      fingerDown(event.changedTouches[i]);
    }
  }, { passive: false });

  stage.addEventListener('touchmove', function (event) {
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
  }, { passive: false });

  function touchEnd(event) {
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

  stage.addEventListener('touchend', touchEnd, { passive: false });
  stage.addEventListener('touchcancel', function (event) {
    if (holdActive) {
      synthUp(null);
    }
    clearHold();
    holdActive = false;
    for (var i = 0; i < event.changedTouches.length; i++) {
      fingerUp(event.changedTouches[i]);
    }
    tapCandidate = null;
  });

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
    setBooted: setBooted
  };
}
