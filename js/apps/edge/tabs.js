// Edge's tabs: the strip along the top of the window, and the model behind it.
//
// The strip is the only place in the browser that re-paints itself as tabs come
// and go, so it owns its own rendering and hands the rest of the browser the
// active tab rather than being told what to draw.

import { resolve, NEW_TAB_URL, hostOf, isInternal } from './net.js';
import { EDGE_SRC } from '../../global/constants.js';
import { CANCEL_SVG, ADD_SVG, GLOBE_SVG } from './edgeglyphs.js';

var nextId = 1;

export function createTabs(ops) {
  var tabs = [];
  var activeId = null;
  var strip = document.createElement('div');
  strip.className = 'edge-tabstrip';

  function active() {
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].id === activeId) {
        return tabs[i];
      }
    }
    return tabs[tabs.length - 1] || null;
  }

  // Every address the tab has stood on, most recent last, and where in that list
  // it currently is - which is what makes Back and Forward possible.
  function record(tab, address) {
    var found = resolve(address);
    var entry = { url: found.url, title: found.title, page: found.page, query: found.query };
    // Standing somewhere else in the list drops the part after it, the way a
    // browser drops the forward history when you go somewhere new.
    tab.history = tab.history.slice(0, tab.index + 1);
    tab.history.push(entry);
    tab.index = tab.history.length - 1;
    tab.url = entry.url;
    tab.title = entry.title;
    tab.page = entry.page;
    tab.query = entry.query;
    return entry;
  }

  function current(tab) {
    return tab.history[tab.index] || record(tab, NEW_TAB_URL);
  }

  function open(address, options) {
    var opts = options || {};
    var tab = {
      id: nextId++,
      history: [],
      index: -1,
      url: '',
      title: 'New tab',
      page: 'newtab',
      query: '',
      inPrivate: !!opts.inPrivate
    };
    record(tab, address || NEW_TAB_URL);
    if (opts.activate !== false) {
      activeId = tab.id;
    }
    tabs.push(tab);
    paint();
    if (opts.activate !== false) {
      showActive();
    }
    return tab;
  }

  function close(id) {
    var at = indexOf(id != null ? id : activeId);
    if (at < 0) {
      return;
    }
    tabs.splice(at, 1);
    if (!tabs.length) {
      // Edge never leaves a window with no tabs: the last one closes the window.
      if (ops.onEmpty) {
        ops.onEmpty();
      }
      return;
    }
    if (activeId === id || activeId === null) {
      // Closing the tab you are on shows the one that takes its place, which is
      // the tab to its right, or the last one if it was the last.
      activeId = tabs[Math.min(at, tabs.length - 1)].id;
      showActive();
    }
    paint();
  }

  function indexOf(id) {
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].id === id) {
        return i;
      }
    }
    return -1;
  }

  function activate(id) {
    if (id === activeId || indexOf(id) < 0) {
      return;
    }
    activeId = id;
    paint();
    showActive();
  }

  // Moving through a tab's own history, the way the arrow buttons do.
  function step(delta) {
    var tab = active();
    if (!tab) {
      return false;
    }
    var at = tab.index + delta;
    if (at < 0 || at >= tab.history.length) {
      return false;
    }
    tab.index = at;
    tab.url = tab.history[at].url;
    tab.title = tab.history[at].title;
    tab.page = tab.history[at].page;
    tab.query = tab.history[at].query;
    paint();
    showActive();
    return true;
  }

  function canGo(delta) {
    var tab = active();
    if (!tab) {
      return false;
    }
    var at = tab.index + delta;
    return at >= 0 && at < tab.history.length;
  }

  function navigate(address, options) {
    var tab = active();
    if (!tab) {
      open(address, options);
      return;
    }
    record(tab, address);
    paint();
    showActive();
  }

  // A tab's own record of where it has been, newest first - what the History
  // page lists and what the Back button's tooltip says.
  function visited() {
    var out = [];
    tabs.forEach(function (tab) {
      tab.history.forEach(function (entry) {
        out.push({ url: entry.url, title: entry.title, at: Date.now() });
      });
    });
    return out;
  }

  function showActive() {
    var tab = active();
    if (tab && ops.onActivate) {
      ops.onActivate(tab);
    }
  }

  function faviconFor(tab) {
    // Edge's own pages carry the Edge mark; everything else carries the globe,
    // which is what a browser shows for a site it has no icon for.
    var img = document.createElement('img');
    img.src = isInternal(tab.url) ? EDGE_SRC : GLOBE_SVG;
    img.alt = '';
    img.draggable = false;
    return img;
  }

  function paint() {
    while (strip.firstChild) {
      strip.removeChild(strip.firstChild);
    }
    tabs.forEach(function (tab) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'edge-tab' + (tab.id === activeId ? ' is-active' : '') +
        (tab.inPrivate ? ' is-private' : '');
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', tab.id === activeId ? 'true' : 'false');
      var art = document.createElement('span');
      art.className = 'edge-tab-fav';
      art.appendChild(faviconFor(tab));
      var label = document.createElement('span');
      label.className = 'edge-tab-title';
      label.textContent = tab.title;
      var close = document.createElement('span');
      close.className = 'edge-tab-close';
      close.setAttribute('role', 'button');
      close.setAttribute('aria-label', 'Close ' + tab.title);
      close.innerHTML = CANCEL_SVG;
      close.addEventListener('click', function (event) {
        event.stopPropagation();
        close(tab.id);
      });
      button.appendChild(art);
      button.appendChild(label);
      button.appendChild(close);
      button.addEventListener('click', function () {
        activate(tab.id);
      });
      button.addEventListener('auxclick', function (event) {
        if (event.button === 1) {
          close(tab.id);
        }
      });
      strip.appendChild(button);
    });
    var add = document.createElement('button');
    add.type = 'button';
    add.className = 'edge-tab-new';
    add.setAttribute('aria-label', 'New tab (Ctrl+T)');
    add.innerHTML = ADD_SVG;
    add.addEventListener('click', function () {
      open(NEW_TAB_URL);
    });
    strip.appendChild(add);
    // Whatever the app has put on the strip itself - a browser's caption
    // buttons - goes back on after the repaint, which cleared the strip.
    if (ops.stripExtras) {
      strip.appendChild(ops.stripExtras);
    }
    if (ops.onTabsChanged) {
      ops.onTabsChanged();
    }
  }

  return {
    element: strip,
    open: open,
    close: close,
    activate: activate,
    navigate: navigate,
    step: step,
    canGo: canGo,
    reload: function () {
      var tab = active();
      if (tab) {
        current(tab);
        paint();
        showActive();
      }
    },
    visited: visited,
    active: active,
    all: function () { return tabs.slice(); },
    currentEntry: function () {
      var tab = active();
      return tab ? current(tab) : null;
    },
    host: hostOf
  };
}