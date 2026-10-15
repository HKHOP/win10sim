// What a pointer does to a text field: where a click puts the caret, what a
// double and a triple click take, and dragging a selection out.
//
// Split out of textfield.js for the same reason the key handling is: this is a
// different question from what the field is. It also keeps the document-wide
// listeners - which only exist while a selection is being dragged - out of the
// field that owns them, so a window full of fields costs nothing until a finger
// or a pointer actually goes down on one.
//
// The position comes from `pointerClient()` rather than off the event, and the
// move is listened for on both the window and the document. Both matter, and for
// the same reasons as the desktop's icon drag (see desktop.js's onMove, which
// takes no event argument at all): a listener on the field hears nothing while
// the capture layer keeps the browser's pointer off the emulated UI, and under
// pointer lock the browser's pointer is frozen, so an event's clientX says
// nothing about where the emulated cursor is. The window carries a mouse; the
// document carries a finger on the touchpad. Setting a selection to the pointer
// is idempotent, so being called from both costs nothing.

import { pointerClient } from './cursor.js';

export function attachPointer(host, doc, ops) {
  var dragAnchor = null;
  var dragging = false;

  // Where the emulated pointer is in the field, or null before there is a
  // cursor to ask.
  function caretAtPointer() {
    var at = pointerClient();
    return at ? ops.view.indexAt(at.x, at.y) : null;
  }

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

  function onMouseDown(event) {
    if (ops.isDisabled() || event.button === 2) {
      // The right button belongs to the context menu, not to the caret.
      return;
    }
    var at = caretAtPointer();
    if (at === null) {
      return;
    }
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
  }

  function onMouseMove() {
    if (dragAnchor == null) {
      return;
    }
    var at = caretAtPointer();
    if (at === null) {
      return;
    }
    ops.state.start = Math.min(dragAnchor, at);
    ops.state.end = Math.max(dragAnchor, at);
    ops.paint();
    ops.keepCaretVisible();
  }

  // Attaches the move and release listeners to both the window and the document.
// See the note at the top: the window carries a mouse, the document carries a
// finger, and neither alone is the whole shell.
function listenMove() {
  window.addEventListener('mousemove', onMouseMove);
  doc.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  doc.addEventListener('mouseup', onMouseUp);
}

function stopListening() {
  window.removeEventListener('mousemove', onMouseMove);
  doc.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
  doc.removeEventListener('mouseup', onMouseUp);
}

function onMouseUp() {
    if (dragging) {
      dragging = false;
      stopListening();
    }
    if (dragAnchor == null) {
      return;
    }
    dragAnchor = null;
    ops.fire('select', { inputType: 'select' });
  }

  host.addEventListener('mousedown', onMouseDown);
  host.addEventListener('mousedown', function () {
    if (dragging) {
      return;
    }
    dragging = true;
    listenMove();
  });

  return {
    release: function () {
      if (!dragging) {
        return;
      }
      dragging = false;
      stopListening();
    }
  };
}