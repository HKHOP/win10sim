// What a pointer does to a text field: where a click puts the caret, what a
// double and a triple click take, and dragging a selection out.
//
// Split out of textfield.js for the same reason the key handling is: this is a
// different question from what the field is. It also keeps the document-wide
// listeners - which only exist while a selection is being dragged - out of the
// field that owns them, so a window full of fields costs nothing until a finger
// or a pointer actually goes down on one.

export function attachPointer(host, doc, ops) {
  var dragAnchor = null;
  var dragging = false;

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
    var at = ops.view.indexAt(event.clientX, event.clientY);
    host.focus({ preventScroll: true });
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

  function onMouseMove(event) {
    if (dragAnchor == null) {
      return;
    }
    var at = ops.view.indexAt(event.clientX, event.clientY);
    ops.state.start = Math.min(dragAnchor, at);
    ops.state.end = Math.max(dragAnchor, at);
    ops.paint();
    ops.keepCaretVisible();
  }

  function onMouseUp() {
    if (dragging) {
      dragging = false;
      doc.removeEventListener('mousemove', onMouseMove);
      doc.removeEventListener('mouseup', onMouseUp);
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
    doc.addEventListener('mousemove', onMouseMove);
    doc.addEventListener('mouseup', onMouseUp);
  });

  return {
    release: function () {
      if (!dragging) {
        return;
      }
      dragging = false;
      doc.removeEventListener('mousemove', onMouseMove);
      doc.removeEventListener('mouseup', onMouseUp);
    }
  };
}