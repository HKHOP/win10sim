// What a pointer does to a text field: where a click puts the caret, what a
// double and a triple click take, and dragging a selection out.
//
// Split out of textfield.js for the same reason the key handling is: this is a
// different question from what the field is.
//
// The press, the move and the release all come from the gesture service
// (pointergesture.js), which is where the shell's answer to "what does a drag
// look like in here" lives. It is not a detail: a routed click compresses down
// and up into a single instant, so only a real press can show a drag; and under
// pointer lock the browser's pointer is frozen and its `clientX` says nothing
// about where the emulated cursor is. A field that took the press and then would
// not move with a mouse was this, not the field — and it was so in every text
// field in the shell, not just in one place.

import { registerDragSurface } from './pointergesture.js';

export function attachPointer(host, doc, ops) {
  var dragAnchor = null;

  function selectWordAt(at) {
    var value = ops.state.value;
    var start = at;
    var end = at;
    while (start > 0 && !/\s/.test(value.charAt(start - 1))) {
      start--;
    }
    while (end < value.length && !/\s/.test(value.charAt(end))) {
      end++;
    }
    // A click in the space between two words still takes something.
    if (end === start && start < value.length) {
      end = start + 1;
    }
    return { start: start, end: end };
  }

  var surface = registerDragSurface(host, {
    onDown: function (pointer, event) {
      if (ops.isDisabled() || event.button === 2) {
        // The right button belongs to the context menu, not to the caret.
        return;
      }
      var at = ops.view.indexAt(pointer.x, pointer.y);
      host.focus({ preventScroll: true });
      // A field reached with the pointer has no ring round it: the caret is the
      // feedback, and the ring is for someone arriving by keyboard. See the note
      // in textfield.js on why :focus-visible could not do this on its own.
      host.classList.remove('is-keyboard-focus');
      if (event.detail >= 3) {
        // Three clicks take the line the caret is on, as they do in Windows.
        var bounds = ops.lineBounds(at);
        ops.setSelection(bounds.start, bounds.end);
        dragAnchor = null;
        return;
      }
      if (event.detail === 2) {
        var word = selectWordAt(at);
        ops.setSelection(word.start, word.end);
        dragAnchor = word.start;
        return;
      }
      if (event.shiftKey && host.hasCaret) {
        ops.setSelection(ops.state.anchor, at, true);
      } else {
        ops.setSelection(at, at);
        dragAnchor = at;
      }
    },

    onMove: function (pointer) {
      if (dragAnchor == null) {
        return;
      }
      var at = ops.view.indexAt(pointer.x, pointer.y);
      ops.state.start = Math.min(dragAnchor, at);
      ops.state.end = Math.max(dragAnchor, at);
      ops.paint();
      ops.keepCaretVisible();
    },

    onUp: function () {
      if (dragAnchor == null) {
        return;
      }
      dragAnchor = null;
      ops.fire('select', { inputType: 'select' });
    }
  });

  return {
    release: function () {
      surface.release();
      dragAnchor = null;
    }
  };
}