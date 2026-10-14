// The Settings and more menu: the list behind the three dots at the right of the
// toolbar, item for item the way Edge draws it - the three new things at the top,
// the zoom row as a row rather than a list item, then the rooms, the tools, and
// the way out.

import { showContextMenu } from '../../core/contextmenu.js';
import {
  ADD_SVG,
  NEW_WINDOW_SVG,
  IN_PRIVATE_SVG,
  FAVORITE_SVG,
  HISTORY_SVG,
  DOWNLOAD_SVG,
  ESSENTIALS_SVG,
  EXTENSIONS_SVG,
  PRINT_SVG,
  CAMERA_SVG,
  SEARCH_SVG,
  MORE_SVG,
  SETTING_SVG,
  HELP_SVG,
  CANCEL_SVG,
  ZOOM_OUT_SVG,
  ZOOM_IN_SVG,
  FULL_SCREEN_SVG
} from './edgeglyphs.js';

export var ZOOM_STEPS = [0.5, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2];

function zoomRow(ops) {
  var row = document.createElement('div');
  row.className = 'edge-zoom-row';

  var minus = document.createElement('button');
  minus.type = 'button';
  minus.className = 'edge-zoom-step';
  minus.setAttribute('aria-label', 'Zoom out');
  minus.innerHTML = ZOOM_OUT_SVG;
  minus.addEventListener('click', function (event) {
    event.stopPropagation();
    ops.onZoom(-1);
  });

  var level = document.createElement('span');
  level.className = 'edge-zoom-level';

  var plus = document.createElement('button');
  plus.type = 'button';
  plus.className = 'edge-zoom-step';
  plus.setAttribute('aria-label', 'Zoom in');
  plus.innerHTML = ZOOM_IN_SVG;
  plus.addEventListener('click', function (event) {
    event.stopPropagation();
    ops.onZoom(1);
  });

  var full = document.createElement('button');
  full.type = 'button';
  full.className = 'edge-zoom-step';
  full.setAttribute('aria-label', 'Full screen (F11)');
  full.innerHTML = FULL_SCREEN_SVG;
  full.addEventListener('click', function (event) {
    event.stopPropagation();
    ops.onFullScreen();
  });

  row.appendChild(minus);
  row.appendChild(level);
  row.appendChild(plus);
  row.appendChild(full);

  // The menu closes itself when it is pressed anywhere, so a control inside it
  // has to say which press it means - and the level is read back by the opener.
  row.setLevel = function (zoom) {
    level.textContent = Math.round(zoom * 100) + '%';
  };
  row.setLevel(1);
  return row;
}

export function showEdgeMenu(x, y, ops) {
  var zoom = zoomRow(ops);
  var items = [
    { label: 'New tab', icon: ADD_SVG, shortcut: 'Ctrl+T', action: ops.onNewTab },
    { label: 'New window', icon: NEW_WINDOW_SVG, shortcut: 'Ctrl+N', action: ops.onNewWindow },
    {
      label: 'New InPrivate window',
      icon: IN_PRIVATE_SVG,
      shortcut: 'Ctrl+Shift+N',
      action: ops.onInPrivate
    },
    { separator: true },
    { node: zoom },
    { label: 'Favorites', icon: FAVORITE_SVG, shortcut: 'Ctrl+Shift+O', action: ops.onFavorites },
    { label: 'History', icon: HISTORY_SVG, shortcut: 'Ctrl+H', action: ops.onHistory },
    { label: 'Downloads', icon: DOWNLOAD_SVG, shortcut: 'Ctrl+J', action: ops.onDownloads },
    {
      label: 'Apps',
      icon: MORE_SVG,
      submenu: [
        {
          label: 'No apps are installed',
          disabled: true
        }
      ]
    },
    {
      label: 'Extensions',
      icon: EXTENSIONS_SVG,
      submenu: [
        { label: 'No extensions are installed', disabled: true },
        { label: 'Getting extensions needs the internet', disabled: true }
      ]
    },
    { label: 'Browser essentials', icon: ESSENTIALS_SVG, action: ops.onEssentials },
    { separator: true },
    { label: 'Print', icon: PRINT_SVG, shortcut: 'Ctrl+P', action: ops.onPrint },
    { label: 'Screenshot', icon: CAMERA_SVG, shortcut: 'Ctrl+Shift+S', action: ops.onScreenshot },
    { label: 'Find on page', icon: SEARCH_SVG, shortcut: 'Ctrl+F', action: ops.onFind },
    {
      label: 'More tools',
      icon: MORE_SVG,
      submenu: [
        { label: 'Create a shortcut for this page\u2026', action: ops.onShortcut },
        { label: 'Save page as\u2026', action: ops.onSaveAs },
        { label: 'Clear browsing data\u2026', action: ops.onClear },
        { separator: true },
        { label: 'Developer tools', disabled: true }
      ]
    },
    { separator: true },
    { label: 'Settings', icon: SETTING_SVG, action: ops.onSettings },
    {
      label: 'Help and feedback',
      icon: HELP_SVG,
      submenu: [
        { label: 'Send feedback', disabled: true },
        { separator: true },
        { label: 'What can this browser do?', action: ops.onHelp },
        { label: 'About Microsoft Edge', action: ops.onAbout }
      ]
    },
    { separator: true },
    { label: 'Close Microsoft Edge', icon: CANCEL_SVG, shortcut: 'Alt+F4', action: ops.onClose }
  ];
  var menu = showContextMenu(x, y, items);
  // The zoom row was built before the opener knew the level.
  zoom.setLevel(ops.zoom());
  return menu;
}