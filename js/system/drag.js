// Whether a drag is under way, for the surfaces that need to know.
//
// The emulated cursor holds its shape for the length of a drag. Windows does not
// change the pointer as a window travels over the taskbar or a file name: it
// keeps the one it had, and a control the window passes over does not light up
// either. Without this, dragging a window across the desktop flicks the pointer
// between the beam, the hand and the resize arrows, which reads as a bug.
//
// It lives here rather than in the window manager because the cursor and the
// window manager are both core modules with no business knowing about each
// other, and because a drag is not only a window's - the desktop's icons and the
// Start tiles drag too, and they can say so here as well.

// Counted rather than a flag, so a drag that is interrupted and resumed - a
// second finger releasing a press part way through, say - cannot leave the count
// stuck and freeze the pointer for the rest of the session.
var count = 0;
var listeners = [];

export function beginDrag() {
  count++;
}

export function endDrag() {
  if (count === 0) {
    // Nothing was being held, so there is nothing to announce: an unbalanced end
    // must not wake a listener that would go and repaint the pointer for a drag
    // that is not happening.
    return;
  }
  count--;
  if (count === 0) {
    // Whoever is waiting for it can decide the pointer's shape now that nothing
    // is holding it.
    listeners.slice().forEach(function (listener) {
      listener();
    });
  }
}

export function isDragging() {
  return count > 0;
}

export function onDragEnd(listener) {
  listeners.push(listener);
}