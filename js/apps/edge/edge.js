// Microsoft Edge, as an app in this Windows.
//
// The browser's own window furniture - the tab strip, the toolbar, the address
// bar - is drawn inside a shell window, the same way Notepad's menu bar is. That
// keeps the shell's own title bar, taskbar button and window rules around it,
// which is what a Windows program has.
//
// Nothing here reaches the network, because there is none: what the address bar
// can reach is net.js, and what a tab is is tabs.js.

import { EDGE_SRC } from '../../global/constants.js';
import { isRawDevicePress } from '../../core/cursor.js';
import { createTabs } from './tabs.js';
import { buildChrome } from './chrome.js';
import { buildCaptions } from './captions.js';
import { buildNewTab } from './newtab.js';
import { buildErrorPage } from './errorpage.js';
import { buildPage, createPageOps } from './pages.js';
import { createFindBar } from './find.js';
import { buildProfileFlyout } from './profile.js';
import { showEdgeMenu, ZOOM_STEPS } from './menu.js';
import { installEdgeShortcuts } from './shortcuts.js';
import { FAVORITE_SVG } from './edgeglyphs.js';
import * as dialogs from './dialogs.js';
import { NEW_TAB_URL, hostOf } from './net.js';

var SUFFIX = 'Microsoft Edge';
var PRIVATE_SUFFIX = 'InPrivate - Microsoft Edge';

function titleFor(entry, tab) {
  var name = entry.page === 'newtab' ? 'New tab' : entry.title;
  return name + ' - ' + (tab && tab.inPrivate ? PRIVATE_SUFFIX : SUFFIX);
}

export function openEdge(context, args) {
  var options = args || {};
  var volume = null;
  var favorites = [];
  var zoom = 1;

  var win = context.createWindow({
    title: 'New tab - ' + SUFFIX,
    icon: EDGE_SRC,
    width: 1040,
    height: 660,
    // Edge draws its own chrome: the tab strip takes the row a title bar would
    // be, with its own caption buttons at the end of it, and the strip is what
    // drags the window - a browser has no title bar to drag.
    frameless: true
  });

  var root = document.createElement('div');
  root.className = 'edge' + (options.inPrivate ? ' is-private' : '');
  win.body.appendChild(root);

  // The dialogs that write files ask for the volume when they need it, not now.
  dialogs.attachVolume(function () {
    if (!volume) {
      volume = context.getVolume();
    }
    return volume;
  });

  // --- the tabs, the toolbar, and the page area ---------------------------
  var viewport;
  var find;
  var flyout;

  var readyQueue = [];
  // The new tab page focuses its search box once it is on screen; a page says so
  // rather than reaching for the focus itself.
  function onReady(fn) {
    readyQueue.push(fn);
  }
  function runReady() {
    readyQueue.forEach(function (fn) {
      fn();
    });
    readyQueue = [];
  }

  function go(address) {
    tabs.navigate(address);
  }

  var chrome = buildChrome({
    onBack: function () { tabs.step(-1); },
    onForward: function () { tabs.step(1); },
    onReload: function () { tabs.reload(); },
    onHome: function () { go(NEW_TAB_URL); },
    onNavigate: function (text) {
      go(text);
    },
    onFavorite: toggleFavorite,
    onCollections: function () { dialogs.showEssentials(context); },
    onEssentials: function () { dialogs.showEssentials(context); },
    onProfile: function (event) {
      if (flyout.isOpen()) {
        flyout.close();
      } else {
        flyout.open(event.currentTarget);
      }
    },
    onMore: function (event) {
      var rect = event.currentTarget.getBoundingClientRect();
      showMenuAt(rect.left - 40, rect.bottom + 2);
    }
  });

  viewport = chrome.viewport;
  find = createFindBar(viewport, {});

  var tabs = createTabs({
    onActivate: render,
    // The caption buttons live at the end of the strip, and the strip is emptied
    // and rebuilt every repaint, so they are handed over as furniture to put
    // back rather than as children to keep.
    stripExtras: buildCaptions(win),
    onEmpty: function () {
      win.close();
    }
  });
  // The empty part of the strip is what moves the window, the way a title bar is;
  // a tab, a button or a field inside it is still pressed as itself.
  win.setDragHandle(tabs.element);
  tabs.element.addEventListener('dblclick', function (event) {
    if (event.target && event.target.closest && event.target.closest('button')) {
      return;
    }
    win.toggleMaximize();
  });

  flyout = buildProfileFlyout({
    onSettings: function () {
      flyout.close();
      go('edge://settings');
    },
    onOtherProfiles: function () {
      flyout.close();
      dialogs.showOtherProfiles(context);
    }
  });

  root.appendChild(tabs.element);
  root.appendChild(chrome.bar);
  root.appendChild(viewport);
  root.appendChild(find.element);
  root.appendChild(flyout.element);

  // --- drawing the page ---------------------------------------------------
  function swap(node) {
    while (viewport.firstChild) {
      viewport.removeChild(viewport.firstChild);
    }
    if (node) {
      viewport.appendChild(node);
    }
  }

  function isFavorite(url) {
    return favorites.some(function (row) {
      return row.url === url;
    });
  }

  function toggleFavorite() {
    var entry = tabs.currentEntry();
    if (!entry) {
      return;
    }
    var at = -1;
    favorites.forEach(function (row, i) {
      if (row.url === entry.url) {
        at = i;
      }
    });
    if (at >= 0) {
      favorites.splice(at, 1);
    } else {
      favorites.push({ url: entry.url, title: entry.title });
    }
    chrome.sync(toolbarState());
  }

  function toolbarState() {
    var entry = tabs.currentEntry();
    return {
      address: entry ? entry.url : '',
      canBack: tabs.canGo(-1),
      canForward: tabs.canGo(1),
      favorite: entry ? isFavorite(entry.url) : false,
      zoom: zoom
    };
  }

  // The pages are given the browser's own record of things, not copies of it.
  function pageOps() {
    return createPageOps({ go: go, visited: tabs.visited, favorites: favorites });
  }

  function render() {
    var tab = tabs.active();
    var entry = tabs.currentEntry();
    if (!tab || !entry) {
      return;
    }
    win.setTitle(titleFor(entry, tab));
    chrome.sync(toolbarState());
    find.reset();
    if (entry.page === 'newtab') {
      swap(buildNewTab({ onNavigate: go, onReady: onReady }));
    } else if (entry.page === 'error') {
      // Both of the page's suggestions do something: one reloads, the other
      // opens a tab on the new tab page, which is where a person starts again.
      swap(buildErrorPage(entry, {
        onReload: function () { tabs.reload(); },
        onNewTab: function () { tabs.open(NEW_TAB_URL); }
      }));
    } else {
      swap(buildPage(entry.page, entry, pageOps()));
    }
    runReady();
  }

  // --- the menu -----------------------------------------------------------
  function setZoom(delta) {
    var at = ZOOM_STEPS.indexOf(zoom);
    var next = ZOOM_STEPS[Math.max(0, Math.min(ZOOM_STEPS.length - 1, (at < 0 ? 3 : at) + delta))];
    zoom = next;
    chrome.sync(toolbarState());
  }

  function showMenuAt(x, y) {
    showEdgeMenu(x, y, {
      zoom: function () { return zoom; },
      onZoom: setZoom,
      onFullScreen: function () { win.toggleMaximize(); },
      onNewTab: function () { tabs.open(NEW_TAB_URL); },
      // A second window is a second Edge, which is what New window means. An
      // InPrivate window is the same thing with its tabs marked, so its title and
      // its tab strip say so.
      onNewWindow: function () { openEdge(context); },
      onInPrivate: function () { openEdge(context, { inPrivate: true }); },
      onFavorites: function () { go('edge://favorites'); },
      onHistory: function () { go('edge://history'); },
      onDownloads: function () { go('edge://downloads'); },
      onEssentials: function () { dialogs.showEssentials(context); },
      onPrint: function () { dialogs.showPrint(context); },
      onScreenshot: function () { dialogs.showScreenshot(context); },
      onFind: function () { find.show(); },
      onShortcut: function () {
        dialogs.showCreateShortcut(context, tabs.currentEntry());
      },
      onSaveAs: function () {
        dialogs.showSaveAs(context, tabs.currentEntry()).then(function (path) {
          if (path) {
            dialogs.showSaved(win, path);
          }
        });
      },
      onClear: function () {
        dialogs.showClearData(context).then(function (answer) {
          if (answer && answer.value === 'clear') {
            favorites = [];
            tabs.all().forEach(function (tab) {
              tab.history = [];
              tab.index = -1;
            });
            tabs.navigate(NEW_TAB_URL);
          }
        });
      },
      onSettings: function () { go('edge://settings'); },
      onHelp: function () { dialogs.showHelp(context); },
      onAbout: function () { go('edge://about'); },
      onClose: function () { win.close(); }
    });
  }

  // --- presses outside, keys ---------------------------------------------
  // A press anywhere else puts the flyout away, the way a menu behaves - but a
  // press the device made landed on the capture layer, so it says nothing about
  // what was pressed and must not dismiss it on its own.
  document.addEventListener('mousedown', function (event) {
    if (!flyout.isOpen() || flyout.contains(event.target)) {
      return;
    }
    if (isRawDevicePress(event)) {
      return;
    }
    flyout.close();
  });

  installEdgeShortcuts(root, {
    dismiss: function () {
      if (flyout.isOpen()) {
        flyout.close();
        return true;
      }
      if (find.isOpen()) {
        find.hide();
        return true;
      }
      return false;
    },
    newTab: function () { tabs.open(NEW_TAB_URL); },
    // A second window is a second Edge, which is what New window means. An
    // InPrivate window is the same thing with its tabs marked, so its title and
    // its tab strip say so.
    newWindow: function () { openEdge(context); },
    inPrivate: function () { openEdge(context, { inPrivate: true }); },
    history: function () { go('edge://history'); },
    downloads: function () { go('edge://downloads'); },
    favorites: function () { go('edge://favorites'); },
    find: function () { find.show(); },
    favorite: toggleFavorite,
    print: function () { dialogs.showPrint(context); },
    screenshot: function () { dialogs.showScreenshot(context); },
    reload: function () { tabs.reload(); },
    back: function () { tabs.step(-1); },
    forward: function () { tabs.step(1); },
    menu: function () {
      var more = chrome.bar.querySelector('.edge-more');
      if (!more) {
        return;
      }
      var rect = more.getBoundingClientRect();
      showMenuAt(rect.left - 40, rect.bottom + 2);
    }
  });

  // The first tab: the new tab page, unless the browser was asked to open an
  // address - and an InPrivate window's tab is marked from the start.
  tabs.open(options.url || NEW_TAB_URL, { inPrivate: !!options.inPrivate });

  return win;
}