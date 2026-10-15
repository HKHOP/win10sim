// Making a range input follow the emulated pointer.
//
// The browser can drag a range input perfectly well, but this shell's pointer
// cannot drive it, so the drag is done here instead of being left to the UA.
// Three things in cursor.js force it:
//
//   - the cursor dispatches MouseEvents only. There is no `pointerdown` anywhere
//     in it, so a handler on one never runs.
//   - `mousemove` is dispatched on the *document*, with `bubbles: false`, so
//     that the shell's own window and tile drags are not fed twice. A control
//     that wants to follow the pointer must listen on the document for it -
//     which is exactly what textfield-pointer.js does for a text selection, and
//     why this is the same shape.
//   - the browser's own drag begins from its own mousedown handling, which would
//     race ours, so it is declined and the focus taken by hand.
//
// What is left to the browser is the keyboard: arrow keys and Home/End on a
// focused range input raise `input` by themselves, and that is the path they
// take through here.
//
// One helper rather than one copy per control, because two sliders that drag
// differently is one more thing to notice only on the second one.

export function attachSlider(input, spec) {
  var min = Number(spec.min);
  var max = Number(spec.max);
  // The thumb's width, which is what the value is mapped against so that the
  // thumb's *centre* follows the pointer rather than its left edge. It matches
  // the thumb in settings.css.
  var THUMB = 10;

  var dragging = false;

  // The value at a pointer position, or null when the slider has no width yet.
  function valueAt(clientX) {
    var box = input.getBoundingClientRect();
    if (!box.width) {
      return null;
    }
    var travel = box.width - THUMB;
    var at = travel > 0 ? (clientX - box.left - THUMB / 2) / travel : 0;
    at = Math.max(0, Math.min(1, at));
    var next = min + at * (max - min);
    // The step is applied here as well as by the input, because `value` is a
    // string and rounding it in one place keeps the store from being handed a
    // value the control would immediately round differently.
    var step = Number(spec.step) || 1;
    next = min + Math.round((next - min) / step) * step;
    return Math.max(min, Math.min(max, next));
  }

  // Redraws the filled part of the track and the number, from whatever the
  // input holds right now. Called during a drag as well as after one, so the
  // thumb and the readout do not lag a move behind.
  function paint() {
    var value = Number(input.value);
    var span = max - min;
    var pct = span > 0 ? Math.round(((value - min) / span) * 100) : 0;
    input.style.setProperty('--fill', Math.max(0, Math.min(100, pct)) + '%');
    if (spec.paint) {
      spec.paint(value);
    }
  }

  function applyTo(clientX) {
    var next = valueAt(clientX);
    if (next === null) {
      return;
    }
    input.value = String(next);
    paint();
    spec.write(next);
  }

  function onDown(event) {
    if (event.button !== 0) {
      return;
    }
    // On a real touch screen the press arrives twice: the browser's own, and
    // the echo the cursor routes so the shell sees the press it drove. The echo
    // is marked (cursor.js), and a surface that follows a press through its
    // lifecycle follows the device press and skips the echo - the same rule
    // desktop.js and starttiles.js apply. Only the echo is skipped: an
    // untrusted, unmarked press is the emulated pointer's own and is the only
    // press there is on a desktop.
    if (event.simEcho) {
      return;
    }
    // Declined, so the browser does not start a drag of its own alongside this
    // one - and the focus is taken here because declining the default stops
    // that too, and without a focus the arrow keys go nowhere.
    event.preventDefault();
    input.focus();
    dragging = true;
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    applyTo(event.clientX);
  }

  function onMove(event) {
    if (!dragging) {
      return;
    }
    applyTo(event.clientX);
  }

  function onUp() {
    if (!dragging) {
      return;
    }
    dragging = false;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
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
    release: onUp,
    dispose: onUp
  };
}