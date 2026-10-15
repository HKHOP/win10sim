// The Settings window.
//
// Windows 10 draws Settings with its own title bar - the back button and the
// word "Settings" are *inside* the caption, not below it - so the window is
// frameless and the app supplies the caption, exactly as a browser does. The
// buttons call the same window API the shell's own caption buttons call, so the
// window still minimises, maximises, snaps and closes as it would.
//
// The other half of this file is `ops`: the one object every control is given,
// and the only place in the app that knows how to read a setting, write one,
// navigate to a page, or ask the shell a question. Keeping it here is what stops
// a control from reaching into the store or the app registry on its own.

import { CAPT_MIN_SVG, CAPT_MAX_SVG, CAPT_RESTORE_SVG, CAPT_CLOSE_SVG, HAMBURGER_SVG } from '../../global/icons.js';
import { BACK_SVG } from './glyphs.js';
import { buildHome, buildNav } from './home.js';
import { buildFind } from './find.js';
import { buildPage } from './page.js';
import { registerWidgets, hasBuilder } from './controls.js';
import { WIDGET_KINDS } from './controls.js';
import * as LIST_WIDGETS from './widgets.js';
import { PREVIEW_WIDGETS } from './previews.js';
import {
  CATEGORIES,
  NAV_CATEGORIES,
  INDEX,
  pageById,
  normalizePageId,
  HOME_PAGE_ID
} from './catalogue.js';
import { coerce, defaultOf } from './schema.js';
import {
  settingsReady,
  storedValue,
  setStored,
  resetStored,
  onSettingsChanged
} from '../../apis/settings-store.js';
import { getShowAppList, setShowAppList } from '../../core/startstate.js';
import { listStartApps, getManifest, hasApp, launchApp } from '../../core/apps.js';
import { registeredTypes, defaultAppFor, setDefaultApp, handlersFor } from '../../apis/associations.js';
import { showMessageBox } from '../../core/msgbox.js';
import { prefersReducedMotion } from '../../core/motion.js';

// The list widgets and the preview widgets are handed to the control builder
// here rather than imported by it: controls.js knows every *kind*, and these two
// know how the ones that need the shell are drawn.
registerWidgets(LIST_WIDGETS);
registerWidgets(PREVIEW_WIDGETS);

// Settings' own accent, which Win10 sets from Personalisation > Colors. It is
// read rather than fixed because the point of that page is that it changes.
var DEFAULT_ACCENT = '#0078d7';

export async function openSettings(context, args) {
  var volume = await context.getVolume();
  var win = context.createWindow({
    title: 'Settings',
    frameless: true,
    width: 940,
    height: 640
  });

  // Everything waits for the stored table. A control painted from a default the
  // profile had already overridden would be showing a lie for as long as it was
  // on screen, which is the one thing a settings page must never do.
  await settingsReady();

  var root = document.createElement('div');
  root.className = 'set-root';
  win.body.appendChild(root);

  var state = {
    pageId: normalizePageId(args && args.page) || HOME_PAGE_ID,
    history: [],
    at: -1,
    searching: false
  };

  var current = null;   // the page on screen
  var nav = null;
  var find = null;

  // --- the ops every control is given -------------------------------------

  var ops = {
    // The value a control should show: what is stored if the profile has set it
    // and the setting still offers it, and the declared default otherwise. The
    // coercion is what makes a stored value from an older build harmless.
    value: function (key) {
      var raw = storedValue(key);
      var item = ITEM_BY_KEY[key];
      if (!item) {
        return raw;
      }
      if (raw === undefined && item.bridge) {
        return bridgedValue(item.bridge);
      }
      return coerce(item, raw);
    },

    write: function (key, value) {
      var item = ITEM_BY_KEY[key];
      // A setting the shell owns is written through the shell. "Show app list"
      // belongs to the Start menu; storing a second copy here would let the two
      // disagree, and the Start menu is what the user actually sees.
      if (item && item.bridge) {
        writeBridge(item.bridge, value);
        return Promise.resolve(value);
      }
      return setStored(key, coerce(item || { kind: 'text' }, value));
    },

    navigate: function (pageId) {
      go(normalizePageId(pageId) || HOME_PAGE_ID);
    },

    run: function (action, arg) {
      runAction(action, arg);
    },

    navCategories: function () {
      return NAV_CATEGORIES;
    },

    // The category a page sits in, which is what the nav pane is scoped to.
    categoryOf: function (pageId) {
      var page = pageById(pageId);
      if (!page) {
        return null;
      }
      return CATEGORIES.filter(function (category) {
        return category.id === page.categoryId;
      })[0] || null;
    },

    apps: function () {
      return listStartApps().filter(function (app) { return hasApp(app.id); });
    },

    app: function (appId) {
      var found = listStartApps().filter(function (app) { return app.id === appId; })[0];
      return found || null;
    },

    manifest: function (appId) {
      return getManifest(appId);
    },

    localAccounts: function () {
      return [{ name: 'User', kind: 'Administrator' }];
    },

    sites: function () {
      return [];
    },

    filterFor: function (source) {
      return FILTERS[source] || { query: '', sort: 'name' };
    },

    setFilter: function (source, patch) {
      FILTERS[source] = Object.assign(FILTERS[source] || { query: '', sort: 'name' }, patch);
      (FILTER_LISTENERS[source] || []).slice().forEach(function (fn) { fn(); });
    },

    onFilter: function (source, fn) {
      FILTER_LISTENERS[source] = (FILTER_LISTENERS[source] || []).filter(function (existing) {
        return existing !== fn;
      });
      FILTER_LISTENERS[source].push(fn);
    },

    defaultAppRows: function () {
      // The rows are the registered file types; which app each opens with is
      // asynchronous, so the list is drawn with "Choose an app" in it and
      // refilled when the answers come back. DEFAULT_REPAINT is the list's own
      // repaint, registered by the widget the first time it is built - there is
      // nothing here to call until then, and calling nothing is correct.
      return registeredTypes().map(function (entry) {
        defaultAppFor(entry.ext).then(function (appId) {
          var row = DEFAULT_ROWS[entry.ext];
          if (row) {
            row.appId = appId;
            DEFAULT_REPAINT();
          }
        });
        var row = { ext: entry.ext, kind: entry.type || entry.ext.toUpperCase(), appId: null, icon: '' };
        DEFAULT_ROWS[entry.ext] = row;
        return row;
      });
    },

    // Called by the default-apps widget when it is built, so the answers that
    // arrive afterwards have something to redraw.
    onDefaultAppsPainted: function (repaint) {
      DEFAULT_REPAINT = typeof repaint === 'function' ? repaint : function () {};
    },

    storageUsage: function () {
      return STORAGE_USAGE;
    },

    // Where a drop-down opens. A layer over the whole window rather than a child
    // of the box: the page scrolls, and a list positioned inside it is clipped
    // at the content edges - one near the bottom of a long page would lose half
    // its entries.
    overlay: function () {
      return overlay;
    },

    // What the search box tells the shell about itself.
//
// The nav does not go away while a search is running - the search box is
// *inside* it, so hiding it would take the box with it. What goes is everything
// else in the pane: Home and the categories, which are the answer the search
// replaces. Windows does the same thing, and it is why typing in the box seems
// to make the list below it become the results.
onSearchChanged: function (searching) {
      nav.el.classList.toggle('is-searching', !!searching);
      contentEl.classList.toggle('is-searching', !!searching);
    },

    onSearchClosed: function () {
      nav.el.classList.remove('is-searching');
      contentEl.classList.remove('is-searching');
    },

    volume: volume
  };

  // --- settings by key, so a value can be coerced without the page --------

  var ITEM_BY_KEY = {};
  INDEX.order.forEach(function (page) {
    page.groups.forEach(function (group) {
      group.items.forEach(function (item) {
        if (item.key && !ITEM_BY_KEY[item.key]) {
          ITEM_BY_KEY[item.key] = item;
        }
      });
    });
  });

  // Filters for the list pages, and the listeners that redraw them.
  var FILTERS = {};
  var FILTER_LISTENERS = {};
  var DEFAULT_ROWS = {};
  var DEFAULT_REPAINT = function () {};
  var STORAGE_USAGE = { total: 0, used: 0 };

  // --- bridged settings ---------------------------------------------------

  // A setting this page does not own. Only one so far, and it is worth saying
  // why: the Start menu's app-list switch was already in the shell, and putting
  // a copy in the settings table would let Personalisation > Start and the Start
  // menu itself show different answers to the same question.
  function bridgedValue(bridge) {
    if (bridge === 'startShowAppList') {
      return getShowAppList();
    }
    return undefined;
  }

  function writeBridge(bridge, value) {
    if (bridge === 'startShowAppList') {
      setShowAppList(value);
    }
  }

  // --- actions ------------------------------------------------------------

  // Buttons and links that do something rather than store something. Windows has
  // a great many of them; the ones below are the ones this shell can actually
  // carry out. Anything else says so rather than appearing to work.
  function runAction(action, arg) {
    var name = String(action || '');
    if (name === 'help.get' || name === 'help.feedback') {
      // There is no Get Help on this machine, and Windows says so with a
      // message rather than by opening nothing.
      context.popup({
        title: name === 'help.get' ? 'Get Help' : 'Send feedback',
        body: name === 'help.get'
          ? ['This PC has no Get Help app installed.', 'Windows 10 would open it here.']
          : ['Feedback cannot be sent: this computer has no network.'],
        buttons: [{ label: 'Close', primary: true, value: 'ok' }]
      });
      return;
    }
    if (name === 'defaultApps.choose') {
      chooseDefaultApp(arg);
      return;
    }
    if (name === 'defaultApps.reset') {
      // "Reset" puts every file type back to what Windows recommends, which is
      // the first app that claimed it.
      var all = registeredTypes();
      Promise.all(all.map(function (entry) {
        var offered = handlersFor(entry.ext);
        return offered.length ? setDefaultApp(entry.ext, offered[0].appId) : null;
      })).then(function () {
        refresh();
      });
      return;
    }
    if (name.indexOf('apps.uninstall') === 0) {
      context.popup({
        title: 'Uninstall',
        body: 'This app and its related info will be uninstalled.',
        buttons: [
          { label: 'Uninstall', primary: true, value: 'yes' },
          { label: 'Cancel', value: 'no' }
        ]
      });
      return;
    }
    if (name === 'security.open') {
      showMessageBox(context, {
        title: 'Windows Security',
        info: true,
        message: 'Windows Security is not installed on this computer.',
        ownerId: win.id,
        buttons: [{ label: 'Close', primary: true }]
      });
      return;
    }
    if (name === 'lockScreen.chooseApp') {
      // Pressing an empty slot opens the app list, exactly as it does in
      // Windows; the shell's own "all apps" list is the closest thing to the
      // app picker Settings opens here.
      return;
    }
    if (name === 'about.rename') {
      context.popup({
        title: 'Rename your PC',
        fields: [{ name: 'name', label: 'New name', value: 'DESKTOP-WIN10SIM' }],
        buttons: [
          { label: 'Save', primary: true, value: 'save' },
          { label: 'Cancel', value: 'cancel' }
        ]
      });
      return;
    }
    // A setting that is remembered but has nothing behind it. Windows shows
    // these as dimmed and says what they are for; saying so is more honest than
    // pressing a button that does nothing.
    var row = document.querySelector('.set-page');
    if (row) {
      var note = document.createElement('p');
      note.className = 'set-flash';
      note.textContent = '“' + (name || 'That') + '” has nothing behind it on this PC.';
      row.insertBefore(note, row.firstChild);
      window.setTimeout(function () {
        if (note.parentNode) {
          note.parentNode.removeChild(note);
        }
      }, 2600);
    }
  }

  function chooseDefaultApp(ext) {
    var offered = handlersFor(ext);
    if (offered.length <= 1) {
      // One app claims this type, so there is nothing to choose between - which
      // is the answer Windows gives too.
      return;
    }
    // The list of apps to choose from is the registered handlers for the type,
    // not every app on the machine: Windows only offers what can actually open
    // the file, and offering Notepad for a .html would be offering a lie.
    var options = offered.map(function (entry) {
      var app = listStartApps().filter(function (row) { return row.id === entry.appId; })[0];
      return {
        value: entry.appId,
        label: app ? app.name : entry.appId
      };
    });
    context.popup({
      title: 'Choose an app',
      body: 'How do you want to open ' + ext.toUpperCase() + ' files?',
      ownerId: win.id,
      fields: [{
        name: 'app',
        type: 'dropdown',
        label: 'Choose an app',
        options: options
      }],
      buttons: [
        { label: 'Set default', primary: true, value: 'set' },
        { label: 'Cancel', value: 'cancel' }
      ],
      onSubmit: function (value, values) {
        if (value === 'set' && values && values.app) {
          setDefaultApp(ext, values.app).then(refresh);
        }
        // The dialog closes either way; there is nothing here to validate.
        return true;
      }
    });
  }

  // --- routing ------------------------------------------------------------

  function go(pageId, push) {
    if (push !== false) {
      state.history = state.history.slice(0, state.at + 1);
      state.history.push(pageId);
      state.at = state.history.length - 1;
    }
    state.pageId = pageId;
    // Home is reached from a category, and everything else is a page, so the
    // home grid gets its own kind of movement rather than a push in a direction
    // it has no list to be pushed along.
    paint(pageId ? 'forward' : 'home');
  }

  function back() {
    if (state.at <= 0) {
      return;
    }
    state.at -= 1;
    state.pageId = state.history[state.at];
    paint(state.pageId ? 'back' : 'home');
  }

  function canGoBack() {
    return state.at > 0;
  }

  var backButton = null;
  var titleEl = null;
  var contentEl = null;
  var navToggle = null;

  // Puts the search box back in the nav pane. appendChild moves an element
  // rather than copying it, so this is safe to call on every paint whether or
  // not the box is already there.
  function putFindInNav() {
    if (find && find.el.parentNode !== nav.searchSlot) {
      nav.searchSlot.appendChild(find.el);
      find.el.classList.add('set-find--nav');
      find.el.classList.remove('set-find--home');
    }
  }

  // The two halves of a page change, and why they are not one animation.
//
// Windows cross-fades: the page you are leaving slides one way while the one you
// are going to arrives from the other, and for a moment both are on screen. For
// a page of settings that means two sets of words overlapping in the same
// place, which is genuinely unpleasant to look at — it is the whole of what a
// fade is usually for, applied to the one thing on a page that is all text.
//
// So the two halves are sequential instead: what is on screen fades out, and
// only once it has gone does the next page fade in. The movement is kept — the
// arrival slides a little, in the direction you travelled — but there is never
// a frame with both pages on it. The exit does not slide, because text moving
// sideways while it is still readable is the worst of it.
var OUT_MS = 90;
var IN_MS = 150;

var SLIDE = {
  forward: ['set-page--leave', 'set-page--enter-forward'],
  back: ['set-page--leave', 'set-page--enter-back'],
  home: ['set-page--leave', 'set-page--enter-home']
};

// A swap waiting for the page in front to fade out. One at a time, and replaced
// rather than queued: two navigations in quick succession should land on the
// second, not animate through both.
var pendingSwap = null;
var swapToken = 0;

function paint(direction) {
  if (pendingSwap) {
    window.clearTimeout(pendingSwap);
    pendingSwap = null;
  }

  var leaving = contentEl.firstElementChild;
  var pair = SLIDE[direction];
  // Nothing to fade out on the first paint, and nothing to animate for a visitor
  // who has asked for less motion.
  if (!pair || !leaving || prefersReducedMotion()) {
    swap(direction);
    return;
  }

  // The page in front is put away now whatever the transition does with it: a
  // clock's interval and a drop-down's listener are not wanted for the next
  // quarter of a second, and the store does not depend on them.
  if (current && typeof current.dispose === 'function') {
    current.dispose();
  }

  leaving.classList.add('set-page--leaving', pair[0]);
  var token = ++swapToken;
  pendingSwap = window.setTimeout(function () {
    pendingSwap = null;
    if (token !== swapToken) {
      return;
    }
    swap(direction);
  }, OUT_MS);
}

// Puts the page on screen and starts it arriving.
function swap(direction) {
    if (current && typeof current.dispose === 'function') {
      current.dispose();
    }

    while (contentEl.firstChild) {
      contentEl.removeChild(contentEl.firstChild);
    }

    var navChanged = nav.setScope(state.pageId);
    backButton.disabled = !canGoBack();

    // There is one search box, not one per page, so it goes back to the nav
    // pane before every page is drawn. Moving it on the way *into* home without
    // moving it back would leave the box inside a home screen that has just
    // been thrown away, which is how it goes missing with nothing on screen.
    putFindInNav();

    var next;
    if (!state.pageId) {
      var home = buildHome(ops);
      current = home;
      next = home.el;
      // Windows puts the search box in the middle of the home screen rather
      // than down in the nav pane, so it is moved rather than duplicated: two
      // boxes would search two different things and neither would be the one
      // the box on screen was.
      home.searchSlot.appendChild(find.el);
      find.el.classList.remove('set-find--nav');
      find.el.classList.add('set-find--home');
      home.searchSlot.classList.add('set-home-search--inline');
      titleEl.textContent = 'Settings';
    } else {
      var page = pageById(state.pageId);
      if (!page) {
        go(HOME_PAGE_ID);
        return;
      }
      current = buildPage(page, ops);
      next = current.el;
      titleEl.textContent = 'Settings';
    }

    contentEl.appendChild(next);
    contentEl.scrollTop = 0;

    if (prefersReducedMotion()) {
      return;
    }
    var pair = SLIDE[direction];
    if (pair) {
      next.classList.add(pair[1]);
    }
    if (navChanged) {
      nav.markFade();
    }
  }

  function refresh() {
    if (current && typeof current.refresh === 'function') {
      current.refresh();
    }
    find.refresh();
  }

  // A setting written from anywhere - this page, another one, or the shell -
  // puts every open control back into step.
  onSettingsChanged(function () {
    if (current && typeof current.refresh === 'function') {
      current.refresh();
    }
  });

  // --- the window ---------------------------------------------------------

  // The caption, the nav pane and the page - in that order in the document, and
  // the overlay last so a drop-down is over everything.
  var overlay = document.createElement('div');
  overlay.className = 'set-overlay';
  root.appendChild(overlay);

  var caption = document.createElement('div');
  caption.className = 'set-caption';

  // The nav button only appears on a window too narrow to hold the nav beside
  // the page, where it opens the nav over it (see settings.css). It is always
  // in the caption rather than hidden and revealed, so there is nothing to get
  // out of step: CSS decides whether it is shown, the same way it decides
  // everything else about the caption.
  navToggle = document.createElement('button');
  navToggle.type = 'button';
  navToggle.className = 'set-nav-toggle';
  navToggle.setAttribute('aria-label', 'Show the settings categories');
  navToggle.innerHTML = HAMBURGER_SVG;
  navToggle.addEventListener('click', function (event) {
    event.stopPropagation();
    var open = root.classList.toggle('is-nav-open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  caption.appendChild(navToggle);

  backButton = document.createElement('button');
  backButton.type = 'button';
  backButton.className = 'set-back';
  backButton.setAttribute('aria-label', 'Back');
  backButton.innerHTML = BACK_SVG;
  backButton.addEventListener('click', function (event) {
    event.stopPropagation();
    back();
  });
  caption.appendChild(backButton);

  titleEl = document.createElement('span');
  titleEl.className = 'set-caption-title';
  titleEl.textContent = 'Settings';
  caption.appendChild(titleEl);

  caption.appendChild(buildCaptions(win));
  root.appendChild(caption);

  // The nav pane, the search box, and the page.
  nav = buildNav(ops);
  root.appendChild(nav.el);
  contentEl = document.createElement('div');
  contentEl.className = 'set-content';
  root.appendChild(contentEl);

  find = buildFind(ops);
  nav.searchSlot.appendChild(find.el);
  find.el.classList.add('set-find--nav');

  // The accent Personalisation > Colors chooses, applied to the window so the
  // switches and links are the colour the user picked.
  function applyAccent() {
    var accents = {
      'Windows blue': '#0078d7',
      'Windows teal': '#0099bc',
      'Windows green': '#00b294',
      'Windows orange': '#e97000',
      'Windows red': '#e81123',
      'Windows purple': '#8764b8'
    };
    var accent = accents[ops.value('personalisation.colors.accent')] || DEFAULT_ACCENT;
    root.style.setProperty('--set-accent', accent);
    var dark = ['#e81123', '#e97000', '#107c10'].indexOf(accent) >= 0;
    root.classList.toggle('is-dark-accent', dark);
  }
  applyAccent();

  paint();

  // The volume is only needed by the pages that report on storage, so it is
  // asked for once and only if one of them is ever opened.
  function watchVolume() {
    if (!volume || !volume.available || typeof volume.getFreeSpace !== 'function') {
      STORAGE_USAGE = { total: 0, used: 0 };
      return;
    }
    // getFreeSpace answers { quota, usage, free }: the quota is what the drive
    // holds, the usage what is on it. The gap between them is what free is,
    // which is why the total comes from the quota and not from adding the two.
    volume.getFreeSpace().then(function (info) {
      STORAGE_USAGE = {
        total: (info && info.quota) || 0,
        used: (info && info.usage) || 0
      };
      refresh();
    }).catch(function () {
      STORAGE_USAGE = { total: 0, used: 0 };
    });
  }
  watchVolume();

  return win;
}

// Settings draws its own caption buttons for the same reason a browser does: the
// back button has to sit inside the caption, and there is no room for it beside
// a title bar the shell drew.
function buildCaptions(win) {
  var box = document.createElement('div');
  box.className = 'set-caps';

  function caption(className, label, inner, onPress) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'set-cap ' + className;
    button.setAttribute('aria-label', label);
    button.title = label;
    button.innerHTML = inner;
    button.addEventListener('click', function (event) {
      event.stopPropagation();
      onPress();
    });
    return button;
  }

  box.appendChild(caption('set-cap-min', 'Minimize', CAPT_MIN_SVG, function () { win.minimize(); }));
  box.appendChild(caption('set-cap-max', 'Maximize',
    '<span class="set-cap-max-glyph">' + CAPT_MAX_SVG + '</span>' +
    '<span class="set-cap-restore-glyph">' + CAPT_RESTORE_SVG + '</span>',
    function () { win.toggleMaximize(); }));
  box.appendChild(caption('set-cap-close', 'Close', CAPT_CLOSE_SVG, function () { win.close(); }));
  return box;
}

// Guards against a control kind reaching the page with no builder after all: the
// catalogue checker catches a *declared* kind, but this catches one that arrived
// through a bridge or a future edit, and says so on the page rather than
// silently drawing a gap.
export function assertBuilders() {
  var missing = WIDGET_KINDS.filter(function (kind) { return !hasBuilder(kind); });
  return missing;
}

// Kept so a page can be built without the shell, which is what makes a page
// drawable in a test and what the shell itself uses for the one page it builds
// outside go().
export { buildPage, buildHome, buildNav, buildFind, launchApp, defaultOf };