import {
  DESKTOP_WALLPAPER_SRC,
  THISPC_SRC,
  RECYCLE_BIN_SRC,
  FOLDER_SRC,
  FILE_SRC,
  KNOWN_FOLDER_SRC,
  DISPLAY_WIDTH,
  DISPLAY_HEIGHT,
  TASKBAR_HEIGHT_PX,
  DOUBLE_TAP_MS
} from '../global/constants.js';
import { buildTaskbar } from './taskbar.js';
import { initWindowSystem } from './windowmanager.js';
import { launchApp, getApp, getVolume } from './apps.js';
import { createWindow } from './windowmanager.js';
import { showMessageBox } from './msgbox.js';
import { defaultAppFor, extensionOf } from '../apis/associations.js';
import {
  isShortcutName,
  createFileLink,
  createShortcutFile,
  describeLink,
  readShortcut,
  targetExists
} from '../apis/shelllink.js';
import { on, emit, VOLUME_CHANGED } from '../system/events.js';
import { showContextMenu } from './contextmenu.js';
import { buildStartMenu } from './startmenu.js';

// Desktop shell: hero wallpaper, grid-snapped icons, taskbar pinned to the
// bottom. Click selects, Ctrl+click toggles a multi-selection, dragging
// empty space draws the blue marquee, and icons drag between grid slots
// (swapping with any occupant). Positions live only in memory — nothing is
// saved.
//
// The two shell icons are always here; everything else is the user's Desktop
// folder, read from the volume and re-read whenever anything changes it, so a
// shortcut made in Explorer shows up here and opens what it points at.

var DESKTOP_ICONS = [
  { label: 'This PC', src: THISPC_SRC, appId: 'thispc' },
  { label: 'Recycle Bin', src: RECYCLE_BIN_SRC, appId: 'explorer', args: { path: 'recyclebin' } }
];

// Windows a dialog raised by the desktop itself belongs to. It is not an app:
// nothing launches it, and nothing lists it in Start. It only names the windows
// the shell owns so they are not mistaken for one of the running apps.
var SHELL_APP_ID = 'shell';

var USER_DESKTOP = 'C:\\Users\\User\\Desktop';

function iconFor(entry) {
  if (entry.type === 'dir') {
    return KNOWN_FOLDER_SRC[entry.label] || FOLDER_SRC;
  }
  return FILE_SRC;
}

var SLOT_W = 88;
var SLOT_H = 96;
var GRID_X = 8;
var GRID_Y = 8;
var ICON_W = 84;
var ICON_H = 92;
var DRAG_THRESHOLD_PX = 6;
// Win10 desktop View menu: the three icon sizes are fixed steps.
var ICON_SCALE_LARGE = 1.5;
var ICON_SCALE_MEDIUM = 1;
var ICON_SCALE_SMALL = 0.7;
var iconScale = ICON_SCALE_MEDIUM;
var autoArrange = false;
var sortKey = 'name';
var sortAsc = true;

function slotPos(col, row) {
  return { x: GRID_X + col * SLOT_W, y: GRID_Y + row * SLOT_H };
}

function maxRow() {
  return Math.max(0, Math.floor((DISPLAY_HEIGHT - TASKBAR_HEIGHT_PX - GRID_Y - 4) / SLOT_H));
}

function buildDesktopIcon(icon) {
  var el = document.createElement('div');
  el.className = 'desktop-icon' + (icon.link ? ' is-shortcut' : '');
  el.tabIndex = 0;

  var art = document.createElement('div');
  art.className = 'desktop-icon-art';
  var img = document.createElement('img');
  img.src = icon.src;
  img.alt = '';
  img.draggable = false;
  art.appendChild(img);

  var label = document.createElement('div');
  label.className = 'desktop-icon-label';
  label.textContent = icon.label;

  el.appendChild(art);
  el.appendChild(label);

  return el;
}

export function createDesktop(cursor, stage) {
  var desktop = document.createElement('div');
  desktop.className = 'desktop';
  desktop.style.backgroundImage = 'url("' + DESKTOP_WALLPAPER_SRC + '")';

  var icons = document.createElement('div');
  icons.className = 'desktop-icons';

  var marquee = document.createElement('div');
  marquee.className = 'desktop-marquee';
  icons.appendChild(marquee);

  // Slot grid: icons fill top-to-bottom, then spill into the next column.
  var entries = DESKTOP_ICONS.map(function (icon, index) {
    var entry = {
      el: buildDesktopIcon(icon),
      def: icon,
      col: 0,
      row: index,
      selected: false
    };
    icons.appendChild(entry.el);
    return entry;
  });

  // ---- the user's Desktop folder ----
  // Anything here is a real file on C:, so the desktop re-reads it rather than
  // carrying a second copy of the truth. Entries that are still there keep the
  // slot the user dragged them into.
  var volumePromise = null;

  function volume() {
    if (!volumePromise) {
      volumePromise = getVolume();
    }
    return volumePromise;
  }

  function labelOf(name, showExtensions) {
    if (showExtensions !== false) {
      return name;
    }
    var dot = name.lastIndexOf('.');
    return dot > 0 ? name.slice(0, dot) : name;
  }

  function desktopEntryFor(entry) {
    return {
      place: entry.place,
      label: labelOf(entry.name),
      name: entry.name,
      type: entry.type,
      src: iconFor(entry),
      link: isShortcutName(entry.name)
    };
  }

  function nextFreeSlot() {
    var taken = {};
    entries.forEach(function (entry) {
      taken[entry.col + ':' + entry.row] = true;
    });
    var rows = maxRow() + 1;
    for (var index = 0; index < rows * 32; index++) {
      var col = Math.floor(index / rows);
      var row = index % rows;
      if (!taken[col + ':' + row]) {
        return { col: col, row: row };
      }
    }
    return { col: 0, row: 0 };
  }

  function refreshFromVolume() {
    volume().then(function (vol) {
      if (!vol || !vol.available) {
        return null;
      }
      // A profile that has never opened Explorer still has a desktop folder.
      return vol.makeDir(USER_DESKTOP).catch(function () {}).then(function () {
        return vol.listDir(USER_DESKTOP);
      }).then(function (listed) {
        var seen = [];
        listed.filter(function (entry) {
          return String(entry.name).charAt(0) !== '$';
        }).forEach(function (entry) {
          var place = USER_DESKTOP + '\\' + entry.name;
          seen.push(place);
          var def = desktopEntryFor(entry);
          var existing = entries.filter(function (candidate) {
            return candidate.def.place === place;
          })[0];
          if (existing) {
            existing.def = def;
            rebuildIcon(existing);
            return;
          }
          var slot = nextFreeSlot();
          var created = {
            el: buildDesktopIcon(def),
            def: def,
            col: slot.col,
            row: slot.row,
            selected: false
          };
          entries.push(created);
          icons.appendChild(created.el);
        });
        // Anything that has gone from the folder goes from the desktop.
        entries.slice().forEach(function (entry) {
          if (entry.def.place && seen.indexOf(entry.def.place) < 0) {
            icons.removeChild(entry.el);
            entries.splice(entries.indexOf(entry), 1);
          }
        });
        entries.forEach(function (entry) {
          entry.row = Math.max(0, Math.min(maxRow(), entry.row));
        });
        renderPositions();
      });
    }, function () {});
  }

  // The artwork can change under an entry (a shortcut resolving to a folder, a
  // renamed file), so the icon node is rebuilt in place rather than replaced.
  function rebuildIcon(entry) {
    var fresh = buildDesktopIcon(entry.def);
    entry.el.className = fresh.className;
    entry.el.replaceChild(fresh.children[0], entry.el.children[0]);
    entry.el.children[1].textContent = entry.def.label;
  }

  // "Create shortcut" on the desktop writes it into the desktop folder, next to
  // the thing it points at, which is where Windows puts it too.
  function createDesktopShortcut(entry) {
    var def = entry.def;
    if (!def || !def.place) {
      return;
    }
    volume().then(function (vol) {
      if (!vol || !vol.available) {
        return null;
      }
      var link = createFileLink(def.place, def.type === 'dir');
      var name = def.name + ' - Shortcut.lnk';
      return createShortcutFile(vol, link, USER_DESKTOP, name).then(function (made) {
        emitChange({ kind: 'create', place: made });
      });
    }, function () {});
  }

  function deleteDesktopEntry(entry) {
    var def = entry.def;
    if (!def || !def.place) {
      return;
    }
    volume().then(function (vol) {
      if (!vol || !vol.available) {
        return null;
      }
      return vol.remove(def.place, def.type === 'dir').then(function () {
        emitChange({ kind: 'delete', place: def.place });
      });
    }, function () {});
  }

  // The desktop creates and deletes on the volume too, so it announces its own
  // changes rather than waiting to hear them back.
  function emitChange(detail) {
    emit(VOLUME_CHANGED, detail);
  }

  on(VOLUME_CHANGED, refreshFromVolume);
  refreshFromVolume();

  function renderPositions() {
    entries.forEach(function (entry) {
      var s = slotPos(entry.col, entry.row);
      entry.el.style.transform = 'translate(' + s.x + 'px,' + s.y + 'px)';
    });
  }

  // View ▸ icon sizes rescale the whole grid, the way Win10 re-flows the
  // desktop when you switch between Large / Medium / Small.
  function setIconScale(next) {
    iconScale = next;
    SLOT_W = Math.round(88 * next);
    SLOT_H = Math.round(96 * next);
    ICON_W = Math.round(84 * next);
    ICON_H = Math.round(92 * next);
    icons.style.setProperty('--desktop-icon-w', ICON_W + 'px');
    icons.style.setProperty('--desktop-icon-art', Math.round(42 * next) + 'px');
    entries.forEach(function (entry) {
      entry.row = Math.max(0, Math.min(maxRow(), entry.row));
    });
    renderPositions();
  }

  function entrySortValue(entry, key) {
    if (key === 'type') {
      var def = entry.def || {};
      return (def.type === 'dir' ? 'file folder' : (def.name || def.label || ''))
        .toLowerCase();
    }
    // Shell icons share one size and no timestamps, so Name is the only
    // meaningful order here; the other keys fall back to it.
    return entry.def.label.toLowerCase();
  }

  function sortEntries(key) {
    sortKey = key;
    var dir = sortAsc ? 1 : -1;
    entries.sort(function (a, b) {
      var av = entrySortValue(a, key);
      var bv = entrySortValue(b, key);
      if (av < bv) {
        return -1 * dir;
      }
      if (av > bv) {
        return 1 * dir;
      }
      return 0;
    });
    entries.forEach(function (entry, index) {
      entry.col = 0;
      entry.row = index;
    });
    renderPositions();
  }

  function setSelected(entry, on) {
    entry.selected = on;
    entry.el.classList.toggle('selected', on);
  }

  function clearSelection() {
    entries.forEach(function (entry) {
      setSelected(entry, false);
    });
  }

  // Double-click (or double-tap) opens icons that have an app behind them.
  var lastTap = null;

  // The desktop has no app of its own, so the one message box it needs is built
  // against the window system directly.
  //
  // Its windows are filed under the shell rather than under Explorer. A dialog
  // the desktop raises - a shortcut that has gone, a file with nothing installed
  // to open it - belongs to the shell, and borrowing Explorer's app id filed it
  // under that app: Start and the tile grid both read "running" off the window
  // snapshot's app id, so a dialog saying that a .sys file has nothing to open
  // it turned Explorer into a running app in the tile grid until it was closed.
  var shellContext = {
    createWindow: function (opts) {
      var merged = Object.assign({ appId: SHELL_APP_ID }, opts);
      return createWindow(merged);
    }
  };

  function openEntry(entry) {
    var def = entry.def || {};
    if (def.appId) {
      launchApp(def.appId, def.args);
      return;
    }
    if (!def.place) {
      // An icon with neither an app nor a file behind it opens nothing yet.
      return;
    }
    if (def.type === 'dir') {
      launchApp('explorer', { path: def.place });
      return;
    }
    if (def.link) {
      openLinkEntry(def);
      return;
    }
    openFileEntry(def);
  }

  // A shortcut is a name for something else: resolve it now, not now-and-again.
  function openLinkEntry(def) {
    volume().then(function (vol) {
      return readShortcut(vol, def.place).then(function (link) {
        if (!link) {
          showMessageBox(shellContext, {
            message: 'The shortcut \'' + def.label + '\' is not valid.'
          });
          return null;
        }
        var target = describeLink(link);
        if (target.kind === 'app') {
          var app = getApp(target.target.appId);
          if (!app) {
            showMessageBox(shellContext, {
              message: 'Windows can\'t find \'' + target.target.appId + '\'. Make sure you typed the name correctly, and then try again.'
            });
            return null;
          }
          launchApp(app.id, target.target.args);
          return null;
        }
        return targetExists(vol, link).then(function (there) {
          if (!there) {
            showMessageBox(shellContext, {
              message: 'Windows can\'t find \'' + target.place + '\'. Check the spelling and try again.'
            });
            return null;
          }
          return vol.stat(target.place).then(function (stat) {
            if (stat.type === 'dir') {
              launchApp('explorer', { path: target.place });
              return null;
            }
            return openFileEntry({
              place: target.place,
              label: target.label,
              name: target.label
            }, vol);
          }, function () {
            launchApp('explorer', { path: target.place });
            return null;
          });
        });
      });
    }, function () {});
  }

  // A file on the desktop opens with whatever app registered for its type.
  function openFileEntry(def, vol) {
    var ready = vol ? Promise.resolve(vol) : volume();
    ready.then(function (mounted) {
      if (!mounted || !mounted.available) {
        return null;
      }
      return mounted.stat(def.place).then(function (stat) {
        if (stat.type === 'dir') {
          launchApp('explorer', { path: def.place });
          return null;
        }
        return defaultAppFor(extensionOf(def.name || def.label)).then(function (appId) {
          if (!appId || !getApp(appId)) {
            showMessageBox(shellContext, {
              message: 'There is no app installed that can open \'' + (def.label || def.name) + '\'.'
            });
            return null;
          }
          launchApp(appId, { path: def.place });
          return null;
        });
      }, function () {
        showMessageBox(shellContext, {
          message: 'Windows can\'t find \'' + def.place + '\'. Check the spelling and try again.'
        });
        return null;
      });
    }, function () {});
  }

  function entryFromNode(node) {
    while (node && node !== icons) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].el === node) {
          return entries[i];
        }
      }
      node = node.parentNode;
    }
    return null;
  }

  function nearestSlot(x, y) {
    return {
      col: Math.max(0, Math.round((x - GRID_X) / SLOT_W)),
      row: Math.max(0, Math.min(maxRow(), Math.round((y - GRID_Y) / SLOT_H)))
    };
  }

  // Press tracking follows the REAL press lifecycle. A routed click
  // compresses down+up into one instant, so watching routed events alone
  // can never see a drag. Real presses (native, or pointer-locked and
  // retargeted at the stage) are hit-tested under the sim cursor;
  // synthetic presses only start a tap when no real press exists (touch).
  var press = null;

  function entryAtCursor() {
    var rect = stage.getBoundingClientRect();
    var pos = cursor.getPosition();
    var target = cursor.hitTest(
      rect.left + pos.x / DISPLAY_WIDTH * rect.width,
      rect.top + pos.y / DISPLAY_HEIGHT * rect.height
    );
    if (!target || !icons.contains(target)) {
      return null;
    }
    return { hit: true, entry: entryFromNode(target) };
  }

  function beginPress(entry, additive, origin) {
    var pos = cursor.getPosition();
    press = {
      origin: origin,
      startX: pos.x,
      startY: pos.y,
      entry: entry,
      additive: additive,
      mode: null,
      grabDX: 0,
      grabDY: 0
    };
    if (entry) {
      var s = slotPos(entry.col, entry.row);
      press.grabDX = pos.x - s.x;
      press.grabDY = pos.y - s.y;
    }
  }

  window.addEventListener('mousedown', function (event) {
    if (event.isTrusted) {
      var hit = entryAtCursor();
      if (hit) {
        beginPress(hit.entry, !!(event.ctrlKey || event.metaKey), 'real');
      }
    } else {
      // A routed press that is only the echo of the device press driving this
      // gesture (cursor.js marks it): counting it would make the echo and the
      // real press two taps, so one click would read as a double-click and
      // open the icon.
      if (event.simEcho) {
        return;
      }
      if (!press && event.target && icons.contains(event.target)) {
        beginPress(entryFromNode(event.target), !!(event.ctrlKey || event.metaKey), 'synthetic');
      }
    }
    // Synthetic echoes of a live real press are ignored.
  });

  function onMove() {
    if (!press) {
      return;
    }
    var pos = cursor.getPosition();
    var moved = Math.abs(pos.x - press.startX) + Math.abs(pos.y - press.startY);
    if (!press.mode && moved > DRAG_THRESHOLD_PX) {
      press.mode = press.entry ? 'drag' : 'marquee';
      if (press.mode === 'drag') {
        press.entry.el.classList.add('dragging');
      } else {
        marquee.classList.add('on');
      }
    }
    if (press.mode === 'drag') {
      press.entry.el.style.transform =
        'translate(' + (pos.x - press.grabDX) + 'px,' + (pos.y - press.grabDY) + 'px)';
    } else if (press.mode === 'marquee') {
      paintMarquee(press.startX, press.startY, pos.x, pos.y);
    }
  }

  function paintMarquee(x1, y1, x2, y2) {
    // Marquee coordinates are stage-wide; the layer starts at the desktop
    // origin (same thing), so no offset math is needed.
    marquee.style.left = Math.min(x1, x2) + 'px';
    marquee.style.top = Math.min(y1, y2) + 'px';
    marquee.style.width = Math.abs(x2 - x1) + 'px';
    marquee.style.height = Math.abs(y2 - y1) + 'px';
  }

  function applyMarquee(x1, y1, x2, y2, additive) {
    var left = Math.min(x1, x2);
    var top = Math.min(y1, y2);
    var right = Math.max(x1, x2);
    var bottom = Math.max(y1, y2);
    if (!additive) {
      clearSelection();
    }
    entries.forEach(function (entry) {
      var s = slotPos(entry.col, entry.row);
      var hit = s.x < right && s.x + ICON_W > left && s.y < bottom && s.y + ICON_H > top;
      setSelected(entry, additive ? (entry.selected || hit) : hit);
    });
  }

  function dropDragged(p) {
    var dragged = p.entry;
    dragged.el.classList.remove('dragging');
    if (autoArrange) {
      // Auto-arrange ignores the drop point and re-flows the sorted stack.
      sortEntries(sortKey);
      return;
    }
    var pos = cursor.getPosition();
    var slot = nearestSlot(pos.x - p.grabDX + ICON_W / 2, pos.y - p.grabDY + ICON_H / 2);
    for (var i = 0; i < entries.length; i++) {
      var other = entries[i];
      if (other !== dragged && other.col === slot.col && other.row === slot.row) {
        other.col = dragged.col;
        other.row = dragged.row;
      }
    }
    dragged.col = slot.col;
    dragged.row = slot.row;
    renderPositions();
  }

  // A press that never gets its release (focus lost mid-drag) is dropped.
  window.addEventListener('blur', function () {
    if (!press) {
      return;
    }
    if (press.entry) {
      press.entry.el.classList.remove('dragging');
    }
    press = null;
    marquee.classList.remove('on');
    renderPositions();
  });

  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove, { passive: true });

  window.addEventListener('mouseup', function (event) {
    if (!press) {
      return;
    }
    if (event.simEcho) {
      // The echo of the press that is still live: its own release follows.
      return;
    }
    if (!event.isTrusted && press.origin === 'real') {
      // Routed echo of the live real press: wait for the real release.
      return;
    }
    var p = press;
    press = null;
    marquee.classList.remove('on');
    if (p.mode === 'drag') {
      dropDragged(p);
      return;
    }
    if (p.mode === 'marquee') {
      var pos = cursor.getPosition();
      applyMarquee(p.startX, p.startY, pos.x, pos.y, p.additive);
      return;
    }
    // Plain click (or tap): select, toggle, clear, or double-tap to open.
    if (p.entry) {
      if (p.additive) {
        setSelected(p.entry, !p.entry.selected);
        lastTap = null;
      } else {
        var now = Date.now();
        if (lastTap && lastTap.entry === p.entry && now - lastTap.time < DOUBLE_TAP_MS) {
          lastTap = null;
          openEntry(p.entry);
        } else {
          lastTap = { entry: p.entry, time: now };
          clearSelection();
          setSelected(p.entry, true);
        }
      }
    } else {
      lastTap = null;
      if (!p.additive) {
        clearSelection();
      }
    }
  });

// Right-press opens the Win10 desktop menus: the icon menu over an icon,
  // the background menu (View / Sort by / Refresh / New / Display) over the
  // wallpaper. Both input paths land here — a native contextmenu event when
  // the pointer is free, or the routed simcontextmenu event while locked.
  function desktopMenu(x, y, hit) {
    if (hit && hit.entry) {
      var entry = hit.entry;
      var def = entry.def || {};
      var onDisk = !!def.place;
      showContextMenu(x, y, [
        { label: 'Open', action: function () { openEntry(entry); } },
        { separator: true },
        {
          label: 'Create shortcut',
          shortcut: 'Alt+Shift+T',
          // A shortcut to a shortcut is not a thing Windows offers.
          disabled: !onDisk || !!def.link,
          action: function () { createDesktopShortcut(entry); }
        },
        {
          label: 'Delete',
          shortcut: 'Del',
          disabled: !onDisk,
          action: function () { deleteDesktopEntry(entry); }
        },
        { label: 'Rename', shortcut: 'F2', disabled: true },
        { separator: true },
        { label: 'Properties', shortcut: 'Alt+Enter', disabled: true }
      ]);
      return;
    }

    showContextMenu(x, y, [
      {
        label: 'View',
        submenu: [
          { label: 'Large icons', checked: iconScale === ICON_SCALE_LARGE, action: function () { setIconScale(ICON_SCALE_LARGE); } },
          { label: 'Medium icons', checked: iconScale === ICON_SCALE_MEDIUM, action: function () { setIconScale(ICON_SCALE_MEDIUM); } },
          { label: 'Small icons', checked: iconScale === ICON_SCALE_SMALL, action: function () { setIconScale(ICON_SCALE_SMALL); } },
          { separator: true },
          { label: 'Auto arrange icons', checked: autoArrange, action: function () { autoArrange = !autoArrange; renderPositions(); } },
          { label: 'Align icons to grid', checked: true, disabled: true },
          { separator: true },
          { label: 'Show desktop icons', checked: true, disabled: true }
        ]
      },
      { label: 'Sort by', submenu: [
        { label: 'Name', action: function () { sortEntries('name'); } },
        { label: 'Size', action: function () { sortEntries('size'); } },
        { label: 'Item type', action: function () { sortEntries('type'); } },
        { label: 'Date modified', action: function () { sortEntries('date'); } },
        { separator: true },
        { label: 'Ascending', checked: sortAsc, action: function () { sortAsc = true; sortEntries(sortKey); } },
        { label: 'Descending', checked: !sortAsc, action: function () { sortAsc = false; sortEntries(sortKey); } }
      ] },
      { label: 'Refresh', shortcut: 'F5', action: function () { renderPositions(); } },
      { separator: true },
      { label: 'Paste', shortcut: 'Ctrl+V', disabled: true },
      { label: 'Paste shortcut', shortcut: 'Ctrl+Shift+V', disabled: true },
      { separator: true },
      { label: 'New', disabled: true },
      { separator: true },
      { label: 'Display settings', disabled: true },
      { label: 'Personalize', disabled: true }
    ]);
  }

  desktop.addEventListener('contextmenu', function (event) {
    if (document.pointerLockElement) {
      return; // routed path already opened the menu
    }
    var target = event.target;
    // Windows, the taskbar and the Start menu own their right-press; the
    // wallpaper does not.
    if (target && target.closest && target.closest('.window-layer, .taskbar, .start-menu')) {
      return;
    }
    event.preventDefault();
    desktopMenu(event.clientX, event.clientY, target && target.closest && icons.contains(target)
      ? { entry: entryFromNode(target) }
      : null);
  });

  desktop.addEventListener('simcontextmenu', function (event) {
    var target = event.target;
    if (target && target.closest && target.closest('.window-layer, .taskbar, .start-menu')) {
      return;
    }
    event.preventDefault();
    desktopMenu(event.detail.clientX, event.detail.clientY, entryAtCursor());
  });

  renderPositions();
  desktop.appendChild(icons);

  var windowLayer = document.createElement('div');
  windowLayer.className = 'window-layer';
  desktop.appendChild(windowLayer);
  initWindowSystem(windowLayer, cursor);

  desktop.appendChild(buildTaskbar());
  // The Start menu paints above everything, including the windows layer.
  desktop.appendChild(buildStartMenu(cursor, stage));

  return desktop;
}
