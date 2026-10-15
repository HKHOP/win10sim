// Pointer gestures: one press, one move, one release, for every control in the
// shell that follows the pointer.
//
// This exists because the answer is not obvious from the outside, and because
// getting it wrong is silent — a control that takes the press and then refuses
// to move, or moves on a phone and not on a desktop, with nothing to say why.
// Three things have to be true at once, and each of them was a bug on its own:
//
//   - **A drag has to begin on the real press.** A routed click compresses
//     down + up + click into a single instant (cursor.js's `synthClick`), so a
//     gesture begun on a routed press is over before the pointer has moved. The
//     real press does reach the window — trusted, whether it lands on the
//     capture layer or is retargeted at the locked stage — but it says nothing
//     about what was pressed, because the capture layer keeps the browser's
//     pointer off the emulated UI. So the target is found by hit-testing under
//     the emulated cursor instead.
//
//   - **The position never comes off the event.** Under pointer lock the
//     browser's pointer is frozen and only `movementX` moves, so an event's
//     `clientX` says nothing about where the emulated cursor is. Every callback
//     is handed the pointer instead.
//
//   - **A gesture ends on the release that belongs to its press.** A real press
//     is released by the real `mouseup`, which arrives *after* the routed press
//     compressed into its instant click. A routed release while a real press is
//     live is that echo, and is ignored. Its own echo is skipped too.
//
// The touchpad needed none of this explaining — on a touch screen there is no
// mousemove and no `movementX`, the touch events are the real events, and down
// and up are genuinely separate. So a control that works with a finger and does
// nothing with a mouse is not a strange bug; it is this, missing.
//
// One set of window listeners for the whole shell, installed on the first
// registration, and one gesture at a time: the surface that took the press owns
// it until it is released. `starttiles.js` did this for the tile grid and
// `desktop.js` for the icons, each in its own way; this is the same thing, once.

import { pointerClient, pointerHitTest } from './cursor.js';

var surfaces = [];
var installed = false;

// The gesture in progress: the surface that took the press, and whether a real
// press is driving it.
var gesture = null;

function install() {
  if (installed) {
    return;
  }
  installed = true;

  // The routed press. Only a press that is not the echo of a real one starts
  // anything here: on a mouse the real press is handled below, and this is the
  // echo that accompanies it.
  document.addEventListener('mousedown', function (event) {
    if (event.isTrusted || event.simEcho) {
      return;
    }
    beginFrom(event.target, event, 'routed');
  }, true);

  // The real press, which knows what it pressed only by hit-testing the
  // emulated cursor: the browser's pointer never reached the control.
  window.addEventListener('mousedown', function (event) {
    if (!event.isTrusted) {
      return;
    }
    var target = pointerHitTest();
    if (!target) {
      return;
    }
    beginFrom(target, event, 'real');
  });

  // The move. A real mousemove carries a mouse; a touchmove carries a finger,
  // and a touch screen never produces the first. Neither is the position - that
  // is the emulated cursor, which both routes have already moved.
  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove, { passive: true });

  // The release, and the two ways it never arrives: a press let go outside the
  // window, and a window that lost the focus. A gesture with no release keeps
  // its ghost, so both end it.
  window.addEventListener('mouseup', onUp);
  window.addEventListener('touchend', onUp);
  window.addEventListener('touchcancel', onUp);
  window.addEventListener('blur', function () {
    finish(true);
  });
}

// Drops surfaces whose element has gone away. A field closed without its owner
// saying so leaves a detached node in the list, and a gesture can never be owned
// by one - but it would sit there for the rest of the session, and a window that
// has been open and closed a hundred times is a hundred of them. Pruned here
// rather than trusted, because a leak in a module-level array is the kind of
// thing that is invisible until it is not.
function prune() {
  for (var i = surfaces.length - 1; i >= 0; i--) {
    if (!surfaces[i].el.isConnected) {
      surfaces.splice(i, 1);
    }
  }
}

// The deepest registered surface containing `target` owns the press. Deepest
// rather than first: a slider inside a list inside a page should be handed the
// gesture rather than the list it happens to sit in.
function ownerFor(target) {
  prune();
  var best = null;
  var bestDepth = -1;
  for (var i = 0; i < surfaces.length; i++) {
    var entry = surfaces[i];
    if (!entry.el.contains(target)) {
      continue;
    }
    var depth = 0;
    for (var node = entry.el; node; node = node.parentElement) {
      depth++;
    }
    if (depth > bestDepth) {
      best = entry;
      bestDepth = depth;
    }
  }
  return best;
}

function beginFrom(target, event, origin) {
  if (gesture) {
    return;
  }
  var entry = ownerFor(target);
  if (!entry) {
    return;
  }
  gesture = { entry: entry, origin: origin };
  if (entry.ops.onDown) {
    entry.ops.onDown(pointerClient(), event);
  }
}

function onMove() {
  if (!gesture) {
    return;
  }
  if (gesture.entry.ops.onMove) {
    gesture.entry.ops.onMove(pointerClient());
  }
}

// Whether this release is the one that ends the gesture. A real press is
// released by a real release; the routed release in the same tick belongs to the
// echo, and a `simEcho` release belongs to a press that is still live.
function belongsToGesture(event) {
  if (!gesture) {
    return false;
  }
  if (event.simEcho) {
    return false;
  }
  if (gesture.origin === 'real' && !event.isTrusted) {
    return false;
  }
  return true;
}

function finish(cancelled) {
  if (!gesture) {
    return;
  }
  var entry = gesture.entry;
  gesture = null;
  if (entry.ops.onUp) {
    entry.ops.onUp(pointerClient(), cancelled === true);
  }
}

function onUp(event) {
  if (!belongsToGesture(event)) {
    return;
  }
  // A cancelled touch never completed anything: it is neither a press that
  // counted nor a drag that landed.
  finish(event.type === 'touchcancel');
}

// Registers `el` as a surface the pointer can take a gesture on.
//
// ops:
//   onDown(pointer, event) - the press. `pointer` is {x, y} in page coordinates.
//   onMove(pointer)        - the move. No event: there is nothing in it that is
//                            true for every route the pointer can take.
//   onUp(pointer, cancelled) - the release. `cancelled` is true for a touch the
//                            system took back and for a focus loss.
//
// Returns { release() } to unregister, which a surface must do when it goes away
// or it holds the shell's listeners alive with a detached element in the list.
export function registerDragSurface(el, ops) {
  install();
  var entry = { el: el, ops: ops };
  surfaces.push(entry);
  return {
    release: function () {
      var at = surfaces.indexOf(entry);
      if (at >= 0) {
        surfaces.splice(at, 1);
      }
      // A gesture this surface was holding does not survive it being unregistered.
      if (gesture && gesture.entry === entry) {
        gesture = null;
      }
    }
  };
}

// Whether a gesture is in progress at all. For a surface that draws differently
// while it is being dragged.
export function isGestureActive() {
  return !!gesture;
}