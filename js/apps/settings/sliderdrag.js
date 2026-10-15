// A range input that follows the emulated pointer.
//
// Nothing here knows how the press, the move or the release arrives - that is
// the gesture service's whole job (see pointergesture.js), and it is the only
// part of this that was ever in any doubt. What is left is the arithmetic: where
// along the track the pointer is, and what the value there is.

import { registerDragSurface } from '../../core/pointergesture.js';

export function attachSlider(input, spec) {
  var min = Number(spec.min);
  var max = Number(spec.max);
  var step = Number(spec.step) || 1;
  // The thumb's width, which is what the value is mapped against so the thumb's
  // *centre* follows the pointer rather than its left edge. It matches the thumb
  // in settings.css.
  var THUMB = 10;

  var dragging = false;

  function snap(value) {
    return min + Math.round((value - min) / step) * step;
  }

  // The value at a pointer position, or null when the slider has no width yet.
  function valueAt(pointer) {
    var box = input.getBoundingClientRect();
    if (!pointer || !box.width) {
      return null;
    }
    // Browsers map the value so the thumb's centre follows the pointer, which is
    // why the travel is the track less the thumb rather than the whole track.
    var travel = box.width - THUMB;
    var fraction = travel > 0 ? (pointer.x - box.left - THUMB / 2) / travel : 0;
    fraction = Math.max(0, Math.min(1, fraction));
    return Math.max(min, Math.min(max, snap(min + fraction * (max - min))));
  }

  // Redraws the filled part of the track and the number from whatever the input
  // holds now. Called during the drag as well as after it, so the thumb and the
  // readout do not lag a move behind.
  function paint() {
    var value = Number(input.value);
    var span = max - min;
    var pct = span > 0 ? Math.round(((value - min) / span) * 100) : 0;
    input.style.setProperty('--fill', Math.max(0, Math.min(100, pct)) + '%');
    if (spec.paint) {
      spec.paint(value);
    }
  }

  function moveTo(pointer) {
    var next = valueAt(pointer);
    if (next === null || Number(input.value) === next) {
      // Already there. Re-storing the value the slider is already at would make
      // the store write for a pointer that did not move.
      return;
    }
    input.value = String(next);
    paint();
    spec.write(next);
  }

  var surface = registerDragSurface(input, {
    onDown: function (pointer) {
      dragging = true;
      // The focus is taken here because the gesture service declines the press's
      // default - which is what stops the browser starting a drag of its own
      // alongside this one, and also what stops it focusing the input. Without a
      // focus the arrow keys go nowhere.
      if (input.focus) {
        input.focus();
      }
      moveTo(pointer);
    },
    onMove: moveTo,
    onUp: function () {
      dragging = false;
    }
  });

  // The keyboard path, and the path a real mouse takes if the shell ever stops
  // intercepting it. Left to the browser: arrow keys and Home/End on a focused
  // range input raise `input` by themselves.
  input.addEventListener('input', function () {
    paint();
    spec.write(Number(input.value));
  });

  return {
    // Puts the thumb where the setting says it is - unless the thumb is the one
    // being moved, because writing the value back mid-drag makes it jump out
    // from under the pointer.
    sync: function (value) {
      if (!dragging && document.activeElement !== input) {
        input.value = String(value);
      }
      paint();
    },
    paint: paint,
    stop: function () {
      dragging = false;
    },
    dispose: surface.release
  };
}