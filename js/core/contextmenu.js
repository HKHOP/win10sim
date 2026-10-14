// Win10 context menus: light-theme popup with icons, shortcut hints,
// separators, disabled entries and cascading submenus.
//
// Placement: the menu opens right under the press, nudged a couple of
// pixels like Win10, and flips at the viewport edges so it can never slide
// out of sight or behind the taskbar.
//
// Submenus open on hover after a one-second dwell (Win10's behaviour) and
// fold away shortly after the pointer leaves. Hover is read two ways: real
// `:hover` when the pointer is free, and the `.sim-hover` class the sim
// cursor toggles, because the capture layer keeps real hover off the UI
// entirely. A press on a parent opens its submenu immediately, which is the
// fallback for touch.

import { isRawDevicePress } from './cursor.js';

var currentMenu = null;

function pressInsideMenus(menus, node) {
  for (var i = 0; i < menus.length; i++) {
    if (menus[i].contains(node)) {
      return true;
    }
  }
  return false;
}

// Win10 waits about a second before cascading, so a passing pointer does
// not flash every submenu open.
var SUBMENU_OPEN_DELAY_MS = 1000;
var SUBMENU_CLOSE_DELAY_MS = 400;
var HOVER_POLL_MS = 120;
var MENU_OFFSET_PX = 2;
// What the stylesheet asks for as a minimum, and what a screen narrower than
// that makes the menu give up.
var MIN_MENU_WIDTH_PX = 180;

function closeSub(record) {
  if (!record.child) {
    return;
  }
  closeAllSubs(record.child);
  if (record.child.parentNode) {
    record.child.parentNode.removeChild(record.child);
  }
  record.child = null;
  if (record.owner) {
    var at = record.owner.__subs.indexOf(record);
    if (at >= 0) {
      record.owner.__subs.splice(at, 1);
    }
  }
}

function closeAllSubs(menu) {
  for (var i = menu.__subs.length - 1; i >= 0; i--) {
    closeSub(menu.__subs[i]);
  }
}

function subRecord(menu, parentEl) {
  for (var i = 0; i < menu.__subs.length; i++) {
    if (menu.__subs[i].parentEl === parentEl) {
      return menu.__subs[i];
    }
  }
  return null;
}

function openSub(menu, item, parentEl) {
  var existing = subRecord(menu, parentEl);
  if (existing && existing.child) {
    return;
  }
  // Win10 shows one cascade at a time.
  for (var i = menu.__subs.length - 1; i >= 0; i--) {
    if (menu.__subs[i].parentEl !== parentEl) {
      closeSub(menu.__subs[i]);
    }
  }
  var child = buildMenu(item.submenu);
  document.body.appendChild(child);
  placeMenu(child, -1, -1, parentEl);
  var record = { parentEl: parentEl, child: child, owner: menu };
  menu.__subs.push(record);
}

function buildMenu(items) {
  var menu = document.createElement('div');
  menu.className = 'win-ctx-menu';
  menu.setAttribute('role', 'menu');
  menu.__subs = [];

  items.forEach(function (item) {
    if (item.separator) {
      var sep = document.createElement('div');
      sep.className = 'win-ctx-sep';
      menu.appendChild(sep);
      return;
    }
    var el = document.createElement('button');
    el.type = 'button';
    el.className = 'win-ctx-item' + (item.disabled ? ' is-disabled' : '');
    el.setAttribute('role', 'menuitem');
    el.__ctxItem = item;
    el.__ctxOwner = menu;

    var art = document.createElement('span');
    art.className = 'win-ctx-art';
    if (item.icon) {
      var img = document.createElement('img');
      img.src = item.icon;
      img.alt = '';
      img.draggable = false;
      art.appendChild(img);
    }
    el.appendChild(art);

    var label = document.createElement('span');
    label.className = 'win-ctx-label';
    label.textContent = item.label;
    el.appendChild(label);

    if (item.checked) {
      var tick = document.createElement('span');
      tick.className = 'win-ctx-check';
      tick.textContent = '✓';
      el.appendChild(tick);
    }

    if (item.shortcut) {
      var key = document.createElement('span');
      key.className = 'win-ctx-key';
      key.textContent = item.shortcut;
      el.appendChild(key);
    }

    if (item.submenu) {
      var arrow = document.createElement('span');
      arrow.className = 'win-ctx-arrow';
      arrow.textContent = '›';
      el.appendChild(arrow);
      el.addEventListener('click', function (event) {
        event.stopPropagation();
        openSub(menu, item, el);
      });
    } else if (!item.disabled) {
      el.addEventListener('click', function () {
        hideContextMenu();
        if (item.action) {
          item.action();
        }
      });
    }

    menu.appendChild(el);
  });

  return menu;
}

// The menu has to stay inside the emulated screen, not just the viewport:
// the stage is letterboxed inside #viewport, so a menu placed against the
// window edge would hang off the monitor.
function screenBounds() {
  var pad = MENU_OFFSET_PX;
  var bounds = {
    left: pad,
    top: pad,
    right: window.innerWidth - pad,
    bottom: window.innerHeight - pad
  };
  var stage = document.getElementById('monitor-stage');
  if (!stage) {
    return bounds;
  }
  var rect = stage.getBoundingClientRect();
  if (rect.width < 120 || rect.height < 120) {
    return bounds;
  }
  var left = Math.max(bounds.left, rect.left + pad);
  var top = Math.max(bounds.top, rect.top + pad);
  var right = Math.min(bounds.right, rect.right - pad);
  var bottom = Math.min(bounds.bottom, rect.bottom - pad);
  if (right - left < 120 || bottom - top < 80) {
    return bounds;
  }
  return { left: left, top: top, right: right, bottom: bottom };
}

// Win10 flips the menu up or left when the press is near an edge, so the
// list never runs off-screen or under the taskbar.
function placeMenu(menu, x, y, hostEl) {
  var bounds = screenBounds();
  var availWidth = bounds.right - bounds.left;
  var availHeight = bounds.bottom - bounds.top;
  // The screen gets the last word on both sizes before the position is even
  // considered. A menu taller than the screen scrolls; one wider than it is
  // narrowed and its labels ellipsize, the way Windows does - because a menu
  // placed at the left edge and running off the right is not a menu that fits.
  menu.style.maxWidth = availWidth + 'px';
  menu.style.maxHeight = availHeight + 'px';
  if (availWidth < MIN_MENU_WIDTH_PX) {
    // A screen narrower than a menu is the emulated display on a phone held
    // upright: the menu gives up its minimum rather than hanging off both edges.
    menu.style.minWidth = '0';
  }
  var rect = menu.getBoundingClientRect();
  var left;
  var top;
  if (hostEl) {
    var host = hostEl.getBoundingClientRect();
    left = host.right - MENU_OFFSET_PX;
    if (left + rect.width > bounds.right) {
      // No room to the right of the parent, so cascade to its left instead.
      left = host.left - rect.width + MENU_OFFSET_PX;
    }
    top = host.top - 3;
  } else {
    left = x + MENU_OFFSET_PX;
    top = y + MENU_OFFSET_PX;
  }
  menu.style.left = Math.max(bounds.left, Math.min(left, bounds.right - rect.width)) + 'px';
  menu.style.top = Math.max(bounds.top, Math.min(top, bounds.bottom - rect.height)) + 'px';
}

// Every menu currently on screen, root first.
function openMenus(menu, out) {
  out.push(menu);
  for (var i = 0; i < menu.__subs.length; i++) {
    if (menu.__subs[i].child) {
      openMenus(menu.__subs[i].child, out);
    }
  }
  return out;
}

// The item the pointer is on — anywhere in the cascade — whether that is a
// real hover or the sim cursor's hover stand-in.
function hoveredItem(menu) {
  var menus = openMenus(menu, []);
  var simHovered = null;
  var realHovered = null;
  for (var m = 0; m < menus.length; m++) {
    var nodes = menus[m].querySelectorAll('.win-ctx-item');
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].classList.contains('sim-hover')) {
        simHovered = nodes[i];
      }
      if (!realHovered) {
        try {
          if (nodes[i].matches(':hover')) {
            realHovered = nodes[i];
          }
        } catch (err) {
          // matches(':hover') is unsupported: the sim-hover class covers it.
        }
      }
    }
  }
  return simHovered || realHovered;
}

// Dwell timer for the cascade: hovering a parent for a second opens it,
// leaving it closes whatever is open.
function watchHover(menu) {
  var openTimer = null;
  var closeTimer = null;
  var last = null;

  function clearTimers() {
    if (openTimer) {
      window.clearTimeout(openTimer);
      openTimer = null;
    }
    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }
  }

  var poll = window.setInterval(function () {
    if (!currentMenu || currentMenu.menu !== menu) {
      window.clearInterval(poll);
      clearTimers();
      return;
    }
    var active = hoveredItem(menu);
    if (active === last) {
      return;
    }
    last = active;
    clearTimers();
    if (active && active.__ctxItem && active.__ctxItem.submenu) {
      // Hovering a parent for a second cascades it open.
      openTimer = window.setTimeout(function () {
        openTimer = null;
        openSub(active.__ctxOwner || menu, active.__ctxItem, active);
      }, SUBMENU_OPEN_DELAY_MS);
    } else if (active && active.__ctxOwner && active.__ctxOwner !== menu) {
      // Pointer is inside an open cascade: leave it standing.
      return;
    } else {
      closeTimer = window.setTimeout(function () {
        closeTimer = null;
        closeAllSubs(menu);
      }, SUBMENU_CLOSE_DELAY_MS);
    }
  }, HOVER_POLL_MS);

  return function stop() {
    window.clearInterval(poll);
    clearTimers();
  };
}

export function showContextMenu(x, y, items, onClose) {
  hideContextMenu();

  var menu = buildMenu(items);

  function pressInside(event) {
    return pressInsideMenus(openMenus(menu, []), event.target);
  }

  function onPress(event) {
    if (pressInside(event)) {
      return;
    }
    // A press the device made rather than the emulated cursor: it landed on
    // the capture layer, or on the locked stage, so it says nothing about
    // what was pressed and must not dismiss the menu on its own.
    if (isRawDevicePress(event)) {
      return;
    }
    hideContextMenu();
  }

  function onKey(event) {
    if (event.key === 'Escape') {
      hideContextMenu();
    }
  }

  function dismiss() {
    hideContextMenu();
  }

  function cleanup() {
    window.removeEventListener('mousedown', onPress, true);
    window.removeEventListener('contextmenu', onPress, true);
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('blur', dismiss);
    window.removeEventListener('resize', dismiss);
  }

  document.body.appendChild(menu);
  placeMenu(menu, x, y);

  window.addEventListener('mousedown', onPress, true);
  window.addEventListener('contextmenu', onPress, true);
  window.addEventListener('keydown', onKey, true);
  window.addEventListener('blur', dismiss);
  window.addEventListener('resize', dismiss);

  currentMenu = { menu: menu, cleanup: cleanup, onClose: onClose, stopHover: null };
  currentMenu.stopHover = watchHover(menu);
  return menu;
}

export function hideContextMenu() {
  if (!currentMenu) {
    return;
  }
  var open = currentMenu;
  currentMenu = null;
  if (open.stopHover) {
    open.stopHover();
  }
  closeAllSubs(open.menu);
  if (open.menu.parentNode) {
    open.menu.parentNode.removeChild(open.menu);
  }
  if (open.cleanup) {
    open.cleanup();
  }
  if (open.onClose) {
    open.onClose();
  }
}

// True when the node belongs to a menu currently on screen. Surfaces that
// treat a press as "outside" ask first: a tile's right-click fly-out is part
// of Start, so using it must not count as pressing outside Start. The menus
// live on the document body, which is why this cannot be a contains() test on
// the surface that opened them.
export function isContextMenuTarget(node) {
  if (!currentMenu || !node) {
    return false;
  }
  return pressInsideMenus(openMenus(currentMenu.menu, []), node);
}