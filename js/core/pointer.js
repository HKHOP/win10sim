import { DISPLAY_WIDTH, DISPLAY_HEIGHT } from '../global/constants.js';

// Where the emulated pointer is, in stage coordinates (0..1366, 0..768).
//
// The emulated cursor is the only pointer in the OS — the capture layer keeps
// the browser's pointer off the UI entirely — so the cursor is the truth here
// whether or not the browser pointer happens to be captured. Also bridges
// stage <-> client pixels for anything that has to position itself against
// real element rects.

export function createPointerTracker(cursor, stage) {
  function toClient(x, y) {
    var rect = stage.getBoundingClientRect();
    var scaleX = rect.width ? rect.width / DISPLAY_WIDTH : 1;
    var scaleY = rect.height ? rect.height / DISPLAY_HEIGHT : 1;
    return { x: rect.left + x * scaleX, y: rect.top + y * scaleY };
  }

  return {
    position: function () {
      return cursor ? cursor.getPosition() : { x: 0, y: 0 };
    },
    // The element under the emulated cursor. Goes through the cursor's own
    // hit test, which looks past the capture layer.
    hitTest: function (clientX, clientY) {
      if (cursor && cursor.hitTest) {
        return cursor.hitTest(clientX, clientY);
      }
      return document.elementFromPoint(clientX, clientY);
    },
    toClient: toClient
  };
}