// Snap Assist: after one window is snapped to a half, Win10 offers the
// remaining open windows in the vacant half so you can fill it. The panel
// lists the candidates (icon + title, like the taskbar), snaps the picked
// one into the empty half, and folds away after a short dwell, an outside
// press or Escape.

import { SNAP_ASSIST_MS, DISPLAY_WIDTH } from '../global/constants.js';
import { snapZoneRect, oppositeHalf } from './snap.js';

var panel = null;
var dismissTimer = null;

function finish() {
  if (dismissTimer) {
    window.clearTimeout(dismissTimer);
    dismissTimer = null;
  }
  window.removeEventListener('mousedown', onOutsidePress, true);
  window.removeEventListener('touchstart', onOutsidePress, true);
  window.removeEventListener('keydown', onEscape, true);
  if (panel && panel.parentNode) {
    panel.parentNode.removeChild(panel);
  }
  panel = null;
}

function onEscape(event) {
  if (event.key === 'Escape') {
    finish();
  }
}

function onOutsidePress(event) {
  if (document.pointerLockElement && event.isTrusted) {
    // A locked press is retargeted at the lock element, so its target says
    // nothing about where the pointer pointed: the routed press right
    // behind it carries the real target and closes the panel then.
    return;
  }
  if (panel && panel.contains(event.target)) {
    return;
  }
  finish();
}

// Shows the chooser in the half opposite the just-snapped window.
// items: [{ id, title, icon }]; onPick(id) snaps the window in.
export function showSnapAssist(opts) {
  hideSnapAssist();
  var layer = opts.layer;
  var zone = opts.zone;
  var items = opts.items || [];
  if (!layer || !items.length) {
    return null;
  }

  var rect = snapZoneRect(oppositeHalf(zone));
  if (!rect) {
    return null;
  }

  panel = document.createElement('div');
  panel.className = 'snap-assist';
  items.forEach(function (item) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'snap-assist-item';
    button.dataset.winId = String(item.id);
    if (item.icon) {
      var img = document.createElement('img');
      img.src = item.icon;
      img.alt = '';
      img.draggable = false;
      button.appendChild(img);
    }
    var label = document.createElement('span');
    label.className = 'snap-assist-label';
    label.textContent = item.title || 'Window';
    button.appendChild(label);
    button.addEventListener('click', function (event) {
      event.stopPropagation();
      var id = item.id;
      finish();
      if (opts.onPick) {
        opts.onPick(id);
      }
    });
    panel.appendChild(button);
  });

  // Centered in the empty half, capped to it, Win10 style.
  var maxW = Math.max(160, rect.w - 24);
  var maxH = Math.max(80, rect.h - 24);
  panel.style.maxWidth = maxW + 'px';
  panel.style.maxHeight = maxH + 'px';
  layer.appendChild(panel);
  var size = panel.getBoundingClientRect();
  var scale = (layer.getBoundingClientRect().width || DISPLAY_WIDTH) / DISPLAY_WIDTH;
  var w = size.width / (scale || 1);
  var h = size.height / (scale || 1);
  panel.style.left = Math.round(rect.x + (rect.w - w) / 2) + 'px';
  panel.style.top = Math.round(rect.y + (rect.h - h) / 2) + 'px';

  window.addEventListener('mousedown', onOutsidePress, true);
  window.addEventListener('touchstart', onOutsidePress, true);
  window.addEventListener('keydown', onEscape, true);
  dismissTimer = window.setTimeout(finish, SNAP_ASSIST_MS);
  return panel;
}

export function hideSnapAssist() {
  finish();
}
