// Aero Snap geometry. Win10 reads the cursor against the work-area edges
// while the titlebar is held: the top edge maximizes, the left/right edges
// fill half the screen, and the corners fill a quarter. The translucent
// preview is what Win10 draws over the destination while the drag is live.

import {
  DISPLAY_WIDTH,
  DISPLAY_HEIGHT,
  TASKBAR_HEIGHT_PX,
  SNAP_EDGE_PX,
  SNAP_TOP_PX,
  SNAP_CORNER_PX
} from '../global/constants.js';

var previewEl = null;

export function workArea() {
  return { x: 0, y: 0, w: DISPLAY_WIDTH, h: DISPLAY_HEIGHT - TASKBAR_HEIGHT_PX };
}

function halfW() {
  return Math.floor((DISPLAY_WIDTH) / 2);
}

function halfH() {
  return Math.floor((DISPLAY_HEIGHT - TASKBAR_HEIGHT_PX) / 2);
}

// Zone under a point in stage (work-area) coordinates; null when it is not
// over any snap edge.
export function snapZoneAt(x, y) {
  var area = workArea();
  var left = x <= SNAP_EDGE_PX;
  var right = x >= area.w - SNAP_EDGE_PX;
  var top = y <= SNAP_TOP_PX;
  var bottom = y >= area.h - SNAP_EDGE_PX;
  // Corners outrank the edges they sit on, so a corner drag quarters the
  // screen instead of halving it.
  if (top && x <= SNAP_CORNER_PX) {
    return 'top-left';
  }
  if (top && x >= area.w - SNAP_CORNER_PX) {
    return 'top-right';
  }
  if (bottom && x <= SNAP_CORNER_PX) {
    return 'bottom-left';
  }
  if (bottom && x >= area.w - SNAP_CORNER_PX) {
    return 'bottom-right';
  }
  if (left) {
    return 'left';
  }
  if (right) {
    return 'right';
  }
  if (top) {
    return 'top';
  }
  return null;
}

// Rect a zone lands on, in work-area coordinates.
export function snapZoneRect(zone) {
  var area = workArea();
  var w = halfW();
  var h = halfH();
  switch (zone) {
    case 'top':
      return { x: 0, y: 0, w: area.w, h: area.h };
    case 'left':
      return { x: 0, y: 0, w: w, h: area.h };
    case 'right':
      return { x: area.w - w, y: 0, w: w, h: area.h };
    case 'top-left':
      return { x: 0, y: 0, w: w, h: h };
    case 'top-right':
      return { x: area.w - w, y: 0, w: w, h: h };
    case 'bottom-left':
      return { x: 0, y: area.h - h, w: w, h: h };
    case 'bottom-right':
      return { x: area.w - w, y: area.h - h, w: w, h: h };
    default:
      return null;
  }
}

export function isHalfZone(zone) {
  return zone === 'left' || zone === 'right';
}

// The other half of the screen: what Snap Assist offers to fill.
export function oppositeHalf(zone) {
  return zone === 'left' ? 'right' : 'left';
}

export function initSnapPreview(layer) {
  if (!layer || previewEl) {
    return;
  }
  previewEl = document.createElement('div');
  previewEl.className = 'snap-preview';
  previewEl.hidden = true;
  layer.appendChild(previewEl);
}

// Slides the translucent landing rect between zones while the drag lives.
export function showSnapPreview(zone) {
  if (!previewEl) {
    return;
  }
  var z = snapZoneRect(zone);
  if (!z) {
    hideSnapPreview();
    return;
  }
  previewEl.hidden = false;
  previewEl.style.left = z.x + 'px';
  previewEl.style.top = z.y + 'px';
  previewEl.style.width = z.w + 'px';
  previewEl.style.height = z.h + 'px';
}

export function hideSnapPreview() {
  if (previewEl) {
    previewEl.hidden = true;
  }
}
