import { DISPLAY_WIDTH, DISPLAY_HEIGHT } from '../global/constants.js';

// Where the emulated pointer is, in stage coordinates (0..1366, 0..768).
//
// Pointer lock hands steering to the sim cursor (movement deltas), and a
// touch drag steers it too, so while locked or on touch the cursor is the
// truth. Outside pointer lock the real pointer is tracked directly, which is
// what makes dragging work on machines where pointer lock is unavailable.
// Also bridges stage <-> client pixels for anything that has to position
// itself against real element rects.

export function createPointerTracker(cursor, stage) {
  var nativePos = null;

  function fromClient(clientX, clientY) {
    var rect = stage.getBoundingClientRect();
    var scaleX = rect.width ? DISPLAY_WIDTH / rect.width : 1;
    var scaleY = rect.height ? DISPLAY_HEIGHT / rect.height : 1;
    return {
      x: Math.round((clientX - rect.left) * scaleX),
      y: Math.round((clientY - rect.top) * scaleY)
    };
  }

  function toClient(x, y) {
    var rect = stage.getBoundingClientRect();
    var scaleX = rect.width ? rect.width / DISPLAY_WIDTH : 1;
    var scaleY = rect.height ? rect.height / DISPLAY_HEIGHT : 1;
    return { x: rect.left + x * scaleX, y: rect.top + y * scaleY };
  }

  window.addEventListener('mousemove', function (event) {
    if (event.isTrusted && !document.pointerLockElement) {
      nativePos = fromClient(event.clientX, event.clientY);
    }
  }, true);

  return {
    position: function () {
      if (cursor && document.pointerLockElement) {
        return cursor.getPosition();
      }
      if (nativePos) {
        return nativePos;
      }
      return cursor ? cursor.getPosition() : { x: 0, y: 0 };
    },
    toClient: toClient,
    fromClient: fromClient
  };
}