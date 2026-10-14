import {
  TOUCH_ACCEL_CURVE,
  TOUCH_HOLD_MS,
  TAP_MAX_MS,
  TAP_MAX_MOVE_PX,
  TAP_DRAG_DELAY_MS,
  TAP_DRAG_MOVE_PX,
  TAP_STILL_MAX_PX,
  MULTI_TAP_MAX_MS,
  MULTI_TAP_MAX_MOVE_PX,
  MULTI_DEAD_ZONE_PX,
  SCROLL_MIN_VELOCITY_PX_MS,
  SCROLL_FRICTION,
  SCROLL_MOMENTUM_MAX_MS
} from '../global/constants.js';

// The touchpad: what fingers on the emulated surface mean.
//
// On a laptop the pad is a physical rectangle you never look at - it is the
// whole stage here, so the gestures have to carry everything the mouse would
// otherwise. Windows' precision touchpad vocabulary:
//
//   one finger moving        the cursor, through an acceleration curve
//   a tap                    a left click
//   a tap that keeps moving  press and drag (tap and drag), no wait
//   a finger held still      press, so the drag can start on its own
//   two fingers moving       scroll whatever is under the cursor
//   two fingers lifted fast  the scroll coasts (momentum)
//   two fingers tapped       a right click - the context menu
//   three fingers tapped     a middle click
//
// Everything here reports in *stage* coordinates through the driver it is
// given: the touchpad never touches the DOM itself, it only decides what a set
// of fingers meant.

export function mountTouchpad(win, driver) {
  var perf = win.performance;
  var now = perf && perf.now
    ? function () { return perf.now(); }
    : function () { return Date.now(); };

  // The fingers currently down, by identifier.
  var fingers = {};
  // A one-finger tap candidate: still on its way to being a click.
  var tap = null;
  // A two- or three-finger tap candidate: the context menu / middle click that
  // has not committed yet because a finger may yet travel far enough to scroll.
  var multiTap = null;
  // A press has been delivered and not yet released.
  var pressed = false;
  // How far the finger travelled while pressed. A press that ends without
  // travelling was a click, as it is on a laptop pad.
  var pressedMoved = 0;
  var holdTimer = null;
  var scrolling = false;
  var multiTravel = 0;
  var velocity = { x: 0, y: 0 };
  var lastScrollAt = 0;
  var lastMoveAt = 0;
  // The centroid of the fingers down, from the last event. Scrolling follows the
  // centroid rather than one finger, so lifting one of three does not jump.
  var centroid = null;
  var momentum = null;

  function fingerCount() {
    var n = 0;
    for (var id in fingers) {
      if (Object.prototype.hasOwnProperty.call(fingers, id)) {
        n++;
      }
    }
    return n;
  }

  function centroidOf() {
    var sx = 0;
    var sy = 0;
    var n = 0;
    for (var id in fingers) {
      if (!Object.prototype.hasOwnProperty.call(fingers, id)) {
        continue;
      }
      sx += fingers[id].x;
      sy += fingers[id].y;
      n++;
    }
    return n ? { x: sx / n, y: sy / n } : null;
  }

  function rebase() {
    centroid = centroidOf();
  }

  // --- one finger ---------------------------------------------------------

  // A precision touchpad is not a constant multiple of finger travel: slow
  // movement gains little so a small target can be hit, fast movement gains
  // more so the screen can be crossed. The curve's last entry is the top speed.
  function gainFor(speed) {
    var curve = TOUCH_ACCEL_CURVE;
    for (var i = 0; i < curve.length - 1; i++) {
      var low = curve[i];
      var high = curve[i + 1];
      if (speed <= high[0]) {
        var span = high[0] - low[0];
        var t = span > 0 ? (speed - low[0]) / span : 1;
        return low[1] + (high[1] - low[1]) * Math.max(0, Math.min(1, t));
      }
    }
    return curve[curve.length - 1][1];
  }

  function accelerate(dx, dy) {
    var t = now();
    var dt = lastMoveAt ? Math.max(1, t - lastMoveAt) : 16;
    lastMoveAt = t;
    return gainFor(Math.sqrt(dx * dx + dy * dy) / dt);
  }

  function engagePress() {
    clearHold();
    pressed = true;
    driver.press();
  }

  function singleMove(dx, dy) {
    if (pressed) {
      // A drag follows the cursor one for one: the surface under it is already
      // where the cursor is, so the acceleration curve has nothing left to say.
      pressedMoved += Math.abs(dx) + Math.abs(dy);
      driver.move(dx, dy);
      return;
    }
    var gain = accelerate(dx, dy);
    driver.move(dx * gain, dy * gain);
    if (!tap) {
      return;
    }
    // Judged once, when the delay is up: a finger that has not travelled by then
    // has come to rest, and a finger that has come to rest and then travels is
    // pressing and dragging. A swipe never rests - it is travelling from the
    // first frame - so a swipe steers the cursor and only a swipe-free gesture
    // presses, which is what separates the two on a real pad.
    if (!tap.decided && now() - tap.start >= TAP_DRAG_DELAY_MS) {
      tap.decided = true;
      tap.armed = tap.moved <= TAP_STILL_MAX_PX;
    }
    tap.moved += Math.abs(dx) + Math.abs(dy);
    if (tap.armed && tap.moved >= TAP_DRAG_MOVE_PX) {
      // Tap and drag.
      pressedMoved = tap.moved;
      tap = null;
      engagePress();
      return;
    }
    if (tap.moved >= TAP_MAX_MOVE_PX) {
      // Left the spot: plain cursor movement, not a hold.
      clearHold();
    }
  }

  // --- two or more fingers ------------------------------------------------

  // Both fingers of one touchmove arrive in the same tick, so their travel is
  // accumulated and scrolled once. Measuring each half on its own would give the
  // second one a zero-length frame and a velocity no flick had.
  var pending = { x: 0, y: 0, active: false };

  function flushScroll() {
    if (!pending.active) {
      return;
    }
    var t = now();
    var dt = lastScrollAt ? Math.max(1, t - lastScrollAt) : 16;
    lastScrollAt = t;
    // The vertical sign is turned over here, at the one place a scroll leaves the
    // touchpad: fingers going up take you up the page, the other way round from
    // dragging the content along with them. It is done to the numbers rather than
    // to the call below so that the coast - which is measured from the same numbers
    // - carries on the way the fingers were already going. Sideways is left alone:
    // a pad has no "up the page" for a sideways scroll to be confused with.
    var scrollX = pending.x;
    var scrollY = -pending.y;
    // Smoothed, so one stuttered frame does not throw the coast.
    velocity.x = velocity.x * 0.6 + (scrollX / dt) * 0.4;
    velocity.y = velocity.y * 0.6 + (scrollY / dt) * 0.4;
    driver.scroll(scrollX, scrollY);
    pending.x = 0;
    pending.y = 0;
    pending.active = false;
  }

  function multiMove(touch) {
    var finger = fingers[touch.identifier];
    if (!finger) {
      return;
    }
    var dx = touch.clientX - finger.x;
    var dy = touch.clientY - finger.y;
    finger.x = touch.clientX;
    finger.y = touch.clientY;
    var here = centroidOf();
    if (centroid) {
      var ddx = here.x - centroid.x;
      var ddy = here.y - centroid.y;
      if (!scrolling) {
        multiTravel += Math.abs(ddx) + Math.abs(ddy);
        if (multiTravel < MULTI_DEAD_ZONE_PX) {
          // A finger landing slightly off centre is not a scroll. Windows waits
          // for the fingers to actually travel before it scrolls anything.
          centroid = here;
          return;
        }
        scrolling = true;
        if (multiTap) {
          multiTap.scrolling = true;
        }
      }
      pending.x += ddx;
      pending.y += ddy;
      pending.active = true;
    }
    centroid = here;
    if (multiTap) {
      multiTap.moved += Math.abs(dx) + Math.abs(dy);
    }
  }

  // The coast a laptop pad gives a flick, decaying until it is too slow to see.
  // Only the caller knows the gesture scrolled: by the time this runs the
  // gesture has been judged and cleared.
  function startMomentum() {
    if (momentum) {
      return;
    }
    if (Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y) < SCROLL_MIN_VELOCITY_PX_MS) {
      return;
    }
    momentum = {
      vx: velocity.x,
      vy: velocity.y,
      until: now() + SCROLL_MOMENTUM_MAX_MS
    };
    var last = now();

    function step() {
      if (!momentum) {
        return;
      }
      var t = now();
      var dt = Math.max(1, Math.min(40, t - last));
      last = t;
      momentum.vx *= Math.pow(SCROLL_FRICTION, dt);
      momentum.vy *= Math.pow(SCROLL_FRICTION, dt);
      var speed = Math.sqrt(momentum.vx * momentum.vx + momentum.vy * momentum.vy);
      if (t > momentum.until || speed < SCROLL_MIN_VELOCITY_PX_MS) {
        momentum = null;
        return;
      }
      driver.scroll(momentum.vx * dt, momentum.vy * dt);
      win.requestAnimationFrame(step);
    }

    win.requestAnimationFrame(step);
  }

  function cancelMomentum() {
    momentum = null;
    velocity.x = 0;
    velocity.y = 0;
  }

  // --- fingers down and up ------------------------------------------------

  // Everything the pad remembers about a gesture it has finished judging.
  function reset() {
    tap = null;
    multiTap = null;
    pressed = false;
    scrolling = false;
    multiTravel = 0;
    pressedMoved = 0;
    lastMoveAt = 0;
    lastScrollAt = 0;
    pending.active = false;
    centroid = null;
  }

  function fingerDown(touch) {
    var already = fingerCount();
    if (already === 0) {
      // A finger on the pad stops the coast: the user is steering again, and
      // the flick's speed is measured from the first scrolled frame rather than
      // from however long the finger had been resting before it moved.
      cancelMomentum();
      tap = { start: now(), moved: 0, decided: false, armed: false };
      armHold();
    } else {
      clearHold();
      // A second finger means this is no longer a tap or a hold of one thing.
      tap = null;
      if (pressed) {
        driver.release();
        pressed = false;
      }
      if (already === 1 && !scrolling) {
        multiTap = { start: now(), moved: 0, scrolling: false, fingers: 2 };
      } else if (already >= 2 && multiTap) {
        // A third finger inside the window makes it a three-finger tap.
        multiTap.fingers = 3;
      }
    }
    fingers[touch.identifier] = { x: touch.clientX, y: touch.clientY };
    rebase();
  }

  function fingerUp(touch) {
    delete fingers[touch.identifier];
    var left = fingerCount();

    if (left === 1) {
      // Two fingers down to one: the gesture carries on rather than becoming a
      // fresh one-finger one, and it must not re-arm the hold. The tap
      // candidate has to SURVIVE this - lifting one finger before the other is
      // how anyone makes a two-finger tap, so it is judged when the last
      // finger lifts, not when the first one leaves.
      centroid = null;
      return;
    }
    if (left >= 2) {
      // One finger lifted while scrolling carries on: re-baseline the centroid
      // so the remaining fingers do not jump the view.
      rebase();
      return;
    }

    clearHold();
    // Judge the gesture on what it was, then clear it.
    var wasPressed = pressed;
    var travelled = pressedMoved;
    var wasTap = tap;
    var multi = multiTap;
    var wasScrolling = scrolling;
    reset();

    if (wasPressed) {
      driver.release();
      // Held down and released without travelling is a click, as on a pad.
      if (travelled < TAP_MAX_MOVE_PX) {
        driver.click();
      }
    } else if (wasTap && now() - wasTap.start < TAP_MAX_MS && wasTap.moved < TAP_MAX_MOVE_PX) {
      driver.click();
    }

    if (multi && !multi.scrolling &&
        now() - multi.start < MULTI_TAP_MAX_MS &&
        multi.moved < MULTI_TAP_MAX_MOVE_PX) {
      if (multi.fingers >= 3) {
        driver.middleClick();
      } else {
        driver.rightClick();
      }
    }

    if (wasScrolling) {
      startMomentum();
    }
  }

  function cancelGesture() {
    clearHold();
    if (pressed) {
      driver.release();
    }
    var ids = Object.keys(fingers);
    for (var i = 0; i < ids.length; i++) {
      delete fingers[ids[i]];
    }
    reset();
    // A gesture the system cancelled does not coast either.
    cancelMomentum();
  }

  // --- the events ---------------------------------------------------------

  function eachTouch(event, fn) {
    for (var i = 0; i < event.changedTouches.length; i++) {
      fn(event.changedTouches[i]);
    }
  }

  function owns(event) {
    // Site chrome taps belong to the browser and must not be swallowed into a
    // cursor movement.
    return driver.isBooted() && !driver.isExempt(event.target);
  }

  win.addEventListener('touchstart', function (event) {
    if (!owns(event)) {
      return;
    }
    event.preventDefault();
    eachTouch(event, fingerDown);
  }, { passive: false, capture: true });

  win.addEventListener('touchmove', function (event) {
    if (!driver.isBooted()) {
      return;
    }
    // A finger that landed on the page's own chrome and then moved is still the
    // browser's - it is dragging the keyboard by its grip, not steering the
    // cursor. A gesture already under way is not abandoned when it wanders over
    // the chrome, because dropping it mid-drag would strand a press.
    if (!fingerCount() && driver.isExempt(event.target)) {
      return;
    }
    event.preventDefault();
    if (fingerCount() === 1) {
      eachTouch(event, function (touch) {
        var finger = fingers[touch.identifier];
        if (!finger) {
          return;
        }
        var dx = touch.clientX - finger.x;
        var dy = touch.clientY - finger.y;
        finger.x = touch.clientX;
        finger.y = touch.clientY;
        singleMove(dx, dy);
      });
      return;
    }
    eachTouch(event, multiMove);
    flushScroll();
  }, { passive: false, capture: true });

  win.addEventListener('touchend', function (event) {
    if (!driver.isBooted()) {
      return;
    }
    if (!fingerCount() && driver.isExempt(event.target)) {
      return;
    }
    event.preventDefault();
    eachTouch(event, fingerUp);
  }, { passive: false, capture: true });

  win.addEventListener('touchcancel', function (event) {
    if (!driver.isBooted()) {
      return;
    }
    event.preventDefault();
    cancelGesture();
  }, { passive: false, capture: true });

  function clearHold() {
    if (holdTimer) {
      win.clearTimeout(holdTimer);
      holdTimer = null;
    }
  }

  function armHold() {
    clearHold();
    holdTimer = win.setTimeout(function () {
      holdTimer = null;
      if (fingerCount() === 1 && tap) {
        // Held still: a press, so the drag can start without the tap ending.
        tap = null;
        pressedMoved = 0;
        engagePress();
      }
    }, TOUCH_HOLD_MS);
  }

  return {
    // A mouse wheel means a real wheel is turning, so the coast must stop dead
    // rather than fight it.
    cancelMomentum: cancelMomentum,
    isCoasting: function () {
      return !!momentum;
    }
  };
}