// Making a range input follow the emulated pointer.
//
// This does what the shell's own drags do — desktop.js's icon drag, the Start
// tiles — which is the only approach that works across a mouse, a locked mouse
// and a finger:
//
//   - **It listens on the window, not on the input.** A window listener sees the
//     browser's own mousemove whether the pointer is over the capture layer or
//     the cursor is locked; a listener on the input sees nothing at all, because
//     the capture layer keeps the browser's pointer off the emulated UI.
//   - **It takes no position off the event.** Under pointer lock the browser's
//     pointer is frozen and only `movementX` moves, so an event's `clientX`
//     says nothing about where the emulated cursor is. The position comes from
//     `pointerClient()`, which is the one answer to that question.
//
// It also listens on the document, because that is where a finger's travel
// arrives (cursor.js publishes a document mousemove for it). Both listeners run
// the same idempotent thing — put the value at the pointer — so being called
// twice costs nothing and being called from only one of them still works.
//
// The keyboard is left to the browser: arrow keys and Home/End on a focused
// range input raise `input` by themselves, and that is the path they take
// through here.
//
// One helper rather than a copy per control, because two sliders that drag
// differently is a thing you only notice on the second one.

import { pointerClient } from '../../core/cursor.js';

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

  // The value at the emulated pointer, or null when the slider has no width yet.
  function valueAtPointer() {
    var at = pointerClient();
    if (!at) {
      return null;
    }
    var box = input.getBoundingClientRect();
    if (!box.width) {
      return null;
    }
    // Browsers map the value so the thumb's centre follows the pointer, which is
    // why the travel is the track less the thumb rather than the whole track.
    var travel = box.width - THUMB;
    var fraction = travel > 0 ? (at.x - box.left - THUMB / 2) / travel : 0;
    fraction = Math.max(0, Math.min(1, fraction));
    return Math.max(min, Math.min(max, snap(min + fraction * (max - min))));
  }

  // Redraws the filled part of the track and the number from whatever the input
  // holds now. Called during a drag as well as after one, so the thumb and the
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

  function followPointer() {
    var next = valueAtPointer();
    if (next === null) {
      return;
    }
    if (Number(input.value) === next) {
      // Already there. Both listeners call this, and re-storing the value it is
      // already at would make the store write for a pointer that did not move.
      return;
    }
    input.value = String(next);
    paint();
    spec.write(next);
  }

  function stop() {
    if (!dragging) {
      return;
    }
    dragging = false;
    window.removeEventListener('mousemove', followPointer);
    document.removeEventListener('mousemove', followPointer);
    window.removeEventListener('mouseup', stop);
    document.removeEventListener('mouseup', stop);
  }

  function onDown(event) {
    if (event.button !== 0) {
      return;
    }
    // The browser's own drag is declined, so two of them cannot fight, and the
    // focus is taken here because declining the default stops that too - and
    // without a focus the arrow keys go nowhere.
    //
    // No `simEcho` check: that mark says "the routed press that accompanies a
    // real one", and on a mouse *this* press is the only press the input ever
    // sees - the real one lands on the capture layer, not here. Skipping it
    // meant the slider ignored every press on a desktop and worked on a phone.
    event.preventDefault();
    input.focus();
    dragging = true;
    window.addEventListener('mousemove', followPointer);
    document.addEventListener('mousemove', followPointer);
    window.addEventListener('mouseup', stop);
    document.addEventListener('mouseup', stop);
    followPointer();
  }

  input.addEventListener('mousedown', onDown);

  // The keyboard path, and the path a real mouse takes if the shell ever stops
  // intercepting it.
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
    stop: stop,
    dispose: stop
  };
}