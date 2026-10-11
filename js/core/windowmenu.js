// Win10's window (titlebar) system menu: right-press a titlebar or a
// taskbar button, or press Alt+Space. Move and Size start the same guided
// keyboard loop Win10 uses — arrows nudge (8px, or 1px with Shift), Enter
// commits, Escape cancels, any click commits.

import { showContextMenu } from './contextmenu.js';

var guided = null;

export function openWindowMenu(x, y, state, actions) {
  var snapped = !!state.snapped;
  var maximized = !!state.maximized;
  showContextMenu(x, y, [
    { label: 'Restore', disabled: !(maximized || snapped), action: actions.restoreSize },
    { label: 'Move', disabled: state.minimized, action: actions.move },
    { label: 'Size', disabled: state.minimized || maximized || snapped, action: actions.size },
    { separator: true },
    { label: 'Minimize', disabled: state.minimized, action: actions.minimize },
    { label: 'Maximize', disabled: maximized, action: actions.maximize },
    { separator: true },
    { label: 'Close', action: actions.close }
  ]);
}

// win is the manager's window record; controls injects the rect helpers
// ({ clamp, paint, unsnap }) so this module never owns window state.
export function startGuidedMode(win, mode, controls) {
  if (guided) {
    endGuided(true);
  }
  if (win.snapZone || win.maximized) {
    controls.unsnap(win);
  }
  guided = {
    win: win,
    mode: mode,
    controls: controls,
    orig: { x: win.rect.x, y: win.rect.y, w: win.rect.w, h: win.rect.h },
    dx: 0,
    dy: 0,
    dw: 0,
    dh: 0
  };
  window.addEventListener('keydown', onGuidedKey, true);
  window.addEventListener('mousedown', endGuidedOnPress, true);
  window.addEventListener('touchstart', endGuidedOnPress, true);
}

export function stopGuidedMode() {
  // Losing focus mid-loop drops it without committing.
  if (guided) {
    endGuided(true);
  }
}

function endGuided(cancel) {
  if (!guided) {
    return;
  }
  var g = guided;
  guided = null;
  window.removeEventListener('keydown', onGuidedKey, true);
  window.removeEventListener('mousedown', endGuidedOnPress, true);
  window.removeEventListener('touchstart', endGuidedOnPress, true);
  if (cancel) {
    var o = g.orig;
    g.win.rect = { x: o.x, y: o.y, w: o.w, h: o.h };
    g.controls.paint(g.win);
  }
}

function endGuidedOnPress() {
  endGuided(false);
}

function onGuidedKey(event) {
  if (!guided) {
    return;
  }
  if (event.key === 'Escape') {
    event.preventDefault();
    endGuided(true);
    return;
  }
  if (event.key === 'Enter') {
    event.preventDefault();
    endGuided(false);
    return;
  }
  var arrow = event.key === 'ArrowLeft' ? [-1, 0]
    : event.key === 'ArrowRight' ? [1, 0]
    : event.key === 'ArrowUp' ? [0, -1]
    : event.key === 'ArrowDown' ? [0, 1]
    : null;
  if (!arrow) {
    return;
  }
  event.preventDefault();
  var step = event.shiftKey ? 1 : 8;
  if (guided.mode === 'move') {
    guided.dx += arrow[0] * step;
    guided.dy += arrow[1] * step;
  } else {
    guided.dw += arrow[0] * step;
    guided.dh += arrow[1] * step;
  }
  var g = guided;
  // Nudging a window off its snap by hand is exactly a drag-out.
  g.win.snapZone = null;
  g.win.rect = g.controls.clamp({
    x: g.orig.x + g.dx,
    y: g.orig.y + g.dy,
    w: g.orig.w + g.dw,
    h: g.orig.h + g.dh
  });
  g.controls.paint(g.win);
}
