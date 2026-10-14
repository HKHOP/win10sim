// Win10 Search Flyout: triggered from the taskbar search box or global typing
// when the start menu is open. Displays filter tabs (All, Apps, Documents,
// Settings, Web, More), Top Apps / Recent / Quick searches when empty, and
// Best Match / App results / Web search when querying.

import { DISPLAY_HEIGHT, START_ANIM_CLOSE_MS } from '../global/constants.js';
import { SEARCH_SVG } from '../global/icons.js';
import { listStartApps, launchApp } from './apps.js';
import { isRawDevicePress } from './cursor.js';
import { prefersReducedMotion } from './motion.js';
import { on, emit } from '../system/events.js';

export const SEARCH_OPENED = 'search-opened';
export const SEARCH_CLOSED = 'search-closed';

var searchEl = null;
var inputEl = null;
var bodyEl = null;
var open = false;
var openListeners = [];
var currentQuery = '';
var activeTab = 'all';

// The taskbar hands its own search box over: it is the input this panel serves.
// There is no second box in the panel itself - Win10 widens the one in the
// taskbar and drops the panel on top of it, so typing never has to move.
export function attachSearchInput(field) {
  inputEl = field;
}

// Listen for typed character from Start menu to open search with that query
on('start-menu-type-to-search', function (key) {
  openSearch(key);
});

export function subscribeSearchOpen(fn) {
  openListeners.push(fn);
  fn(open);
}

function emitOpen() {
  openListeners.forEach(function (fn) {
    fn(open);
  });
}

export function isSearchOpen() {
  return open;
}

export function toggleSearch() {
  if (open) {
    closeSearch();
  } else {
    openSearch('');
  }
}

// A query already in the taskbar's box is kept when the panel opens with no
// argument, the way Win10 reopens the panel on what was typed last.
export function openSearch(initialQuery) {
  var query;
  if (initialQuery === undefined) {
    query = inputEl ? inputEl.value : currentQuery;
  } else {
    query = initialQuery || '';
  }
  if (inputEl) {
    inputEl.value = query;
  }
  currentQuery = query;
  if (open) {
    renderContent();
    focusInput();
    return;
  }
  renderContent();
  searchEl.hidden = false;
  void searchEl.offsetWidth;
  searchEl.classList.remove('search-closing');
  searchEl.classList.add('search-open');
  open = true;
  emitOpen();
  emit(SEARCH_OPENED);
  window.addEventListener('mousedown', onOutsidePress, true);
  window.addEventListener('touchstart', onOutsidePress, true);
  window.addEventListener('keydown', onSearchKey, true);
  focusInput();
}

// Typing in the panel's box: open the panel if it is shut, otherwise just
// re-read the box - the panel is already on screen and the caret is where the
// typist left it.
export function searchTyped(value) {
  if (!open) {
    openSearch(value);
    return;
  }
  currentQuery = value || '';
  renderContent();
}

function focusInput() {
  if (inputEl && inputEl.focus) {
    inputEl.focus();
  }
}

export function closeSearch() {
  if (!open) {
    return;
  }
  open = false;
  emitOpen();
  emit(SEARCH_CLOSED);
  window.removeEventListener('mousedown', onOutsidePress, true);
  window.removeEventListener('touchstart', onOutsidePress, true);
  window.removeEventListener('keydown', onSearchKey, true);
  // Win10 leaves the box empty once the panel has gone: what was typed was for
  // the panel, not for the taskbar.
  if (inputEl) {
    inputEl.value = '';
  }
  currentQuery = '';
  if (prefersReducedMotion()) {
    searchEl.hidden = true;
    searchEl.classList.remove('search-open');
    return;
  }
  searchEl.classList.remove('search-open');
  searchEl.classList.add('search-closing');
  window.setTimeout(function () {
    searchEl.classList.remove('search-closing');
    if (!open) {
      searchEl.hidden = true;
    }
  }, START_ANIM_CLOSE_MS);
}

// What Enter in the search box runs: the best match, or the web when there is
// no app to match. Shared by the key handler and the Open button.
export function launchTopResult() {
  var q = currentQuery.trim();
  if (!q) {
    return;
  }
  var apps = listStartApps().filter(function (app) {
    return app.name.toLowerCase().indexOf(q.toLowerCase()) >= 0 ||
      (app.subtitle && app.subtitle.toLowerCase().indexOf(q.toLowerCase()) >= 0);
  });
  if (apps.length) {
    launchApp(apps[0].id);
    closeSearch();
    return;
  }
  launchApp('edge', { url: 'https://www.bing.com/search?q=' + encodeURIComponent(q) });
  closeSearch();
}

function onOutsidePress(event) {
  if (isRawDevicePress(event)) {
    return;
  }
  var target = event.target;
  if (!target || !searchEl) {
    return;
  }
  if (searchEl.contains(target)) {
    return;
  }
  // The taskbar's own search box is the input, so a press on it is a press on
  // this panel, not a press outside it.
  if (target.closest && target.closest('.task-search')) {
    return;
  }
  closeSearch();
}

function onSearchKey(event) {
  // The box the panel serves holds the focus, so Escape and Enter are answered
  // here rather than left to the field: the field has nothing of its own to do
  // with either key.
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    closeSearch();
    return;
  }
  if (event.key === 'Enter') {
    event.preventDefault();
    event.stopPropagation();
    launchTopResult();
  }
}

function renderContent() {
  if (!bodyEl) {
    return;
  }
  while (bodyEl.firstChild) {
    bodyEl.removeChild(bodyEl.firstChild);
  }

  var q = currentQuery.trim().toLowerCase();
  var apps = listStartApps();

  if (!q) {
    // Initial view: Top apps, Recent, Quick searches
    var leftPane = document.createElement('div');
    leftPane.className = 'search-left-pane';

    var topAppsTitle = document.createElement('div');
    topAppsTitle.className = 'search-section-title';
    topAppsTitle.textContent = 'Top apps';
    leftPane.appendChild(topAppsTitle);

    var topAppsGrid = document.createElement('div');
    topAppsGrid.className = 'search-top-apps';
    apps.slice(0, 5).forEach(function (app) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'search-top-app-card';
      var img = document.createElement('img');
      img.src = app.icon;
      img.alt = '';
      img.draggable = false;
      var nameSpan = document.createElement('span');
      nameSpan.textContent = app.name;
      card.appendChild(img);
      card.appendChild(nameSpan);
      card.addEventListener('click', function () {
        launchApp(app.id);
        closeSearch();
      });
      topAppsGrid.appendChild(card);
    });
    leftPane.appendChild(topAppsGrid);

    var recentTitle = document.createElement('div');
    recentTitle.className = 'search-section-title';
    recentTitle.style.marginTop = '16px';
    recentTitle.textContent = 'Recent';
    leftPane.appendChild(recentTitle);

    apps.slice(0, 3).forEach(function (app) {
      var row = document.createElement('button');
      row.type = 'button';
      row.className = 'search-result-row';
      var iconWrap = document.createElement('span');
      iconWrap.className = 'search-result-icon';
      var img = document.createElement('img');
      img.src = app.icon;
      img.alt = '';
      img.draggable = false;
      iconWrap.appendChild(img);
      var info = document.createElement('div');
      info.className = 'search-result-info';
      var nameEl = document.createElement('span');
      nameEl.className = 'search-result-name';
      nameEl.textContent = app.name;
      var subEl = document.createElement('span');
      subEl.className = 'search-result-sub';
      subEl.textContent = 'App';
      info.appendChild(nameEl);
      info.appendChild(subEl);
      row.appendChild(iconWrap);
      row.appendChild(info);
      row.addEventListener('click', function () {
        launchApp(app.id);
        closeSearch();
      });
      leftPane.appendChild(row);
    });

    var rightPane = document.createElement('div');
    rightPane.className = 'search-right-pane';
    var quickTitle = document.createElement('div');
    quickTitle.className = 'search-section-title';
    quickTitle.textContent = 'Quick searches';
    rightPane.appendChild(quickTitle);

    [
      { label: 'Weather', sub: 'Check current weather conditions' },
      { label: 'Top news', sub: 'Latest headlines from around the world' }
    ].forEach(function (item) {
      var row = document.createElement('button');
      row.type = 'button';
      row.className = 'search-result-row';
      var info = document.createElement('div');
      info.className = 'search-result-info';
      var nameEl = document.createElement('span');
      nameEl.className = 'search-result-name';
      nameEl.textContent = item.label;
      var subEl = document.createElement('span');
      subEl.className = 'search-result-sub';
      subEl.textContent = item.sub;
      info.appendChild(nameEl);
      info.appendChild(subEl);
      row.appendChild(info);
      rightPane.appendChild(row);
    });

    bodyEl.appendChild(leftPane);
    bodyEl.appendChild(rightPane);
    return;
  }

  // Query results view
  var matchedApps = apps.filter(function (app) {
    return app.name.toLowerCase().indexOf(q) >= 0 ||
      (app.subtitle && app.subtitle.toLowerCase().indexOf(q) >= 0);
  });

  var bestMatch = matchedApps.length ? matchedApps[0] : null;

  var leftPane = document.createElement('div');
  leftPane.className = 'search-left-pane';

  if (bestMatch) {
    var bmTitle = document.createElement('div');
    bmTitle.className = 'search-section-title';
    bmTitle.textContent = 'Best match';
    leftPane.appendChild(bmTitle);

    var bmRow = document.createElement('button');
    bmRow.type = 'button';
    bmRow.className = 'search-result-row is-selected';
    var iconWrap = document.createElement('span');
    iconWrap.className = 'search-result-icon';
    var img = document.createElement('img');
    img.src = bestMatch.icon;
    img.alt = '';
    img.draggable = false;
    iconWrap.appendChild(img);
    var info = document.createElement('div');
    info.className = 'search-result-info';
    var nameEl = document.createElement('span');
    nameEl.className = 'search-result-name';
    nameEl.textContent = bestMatch.name;
    var subEl = document.createElement('span');
    subEl.className = 'search-result-sub';
    subEl.textContent = 'App';
    info.appendChild(nameEl);
    info.appendChild(subEl);
    bmRow.appendChild(iconWrap);
    bmRow.appendChild(info);
    bmRow.addEventListener('click', function () {
      launchApp(bestMatch.id);
      closeSearch();
    });
    leftPane.appendChild(bmRow);
  }

  if (matchedApps.length > 1) {
    var appsTitle = document.createElement('div');
    appsTitle.className = 'search-section-title';
    appsTitle.style.marginTop = '12px';
    appsTitle.textContent = 'Apps';
    leftPane.appendChild(appsTitle);

    matchedApps.slice(1).forEach(function (app) {
      var row = document.createElement('button');
      row.type = 'button';
      row.className = 'search-result-row';
      var iconWrap = document.createElement('span');
      iconWrap.className = 'search-result-icon';
      var img = document.createElement('img');
      img.src = app.icon;
      img.alt = '';
      img.draggable = false;
      iconWrap.appendChild(img);
      var info = document.createElement('div');
      info.className = 'search-result-info';
      var nameEl = document.createElement('span');
      nameEl.className = 'search-result-name';
      nameEl.textContent = app.name;
      var subEl = document.createElement('span');
      subEl.className = 'search-result-sub';
      subEl.textContent = 'App';
      info.appendChild(nameEl);
      info.appendChild(subEl);
      row.appendChild(iconWrap);
      row.appendChild(info);
      row.addEventListener('click', function () {
        launchApp(app.id);
        closeSearch();
      });
      leftPane.appendChild(row);
    });
  }

  // Web search row
  var webTitle = document.createElement('div');
  webTitle.className = 'search-section-title';
  webTitle.style.marginTop = '12px';
  webTitle.textContent = 'Search the web';
  leftPane.appendChild(webTitle);

  var webRow = document.createElement('button');
  webRow.type = 'button';
  webRow.className = 'search-result-row';
  var webIcon = document.createElement('span');
  webIcon.className = 'search-result-icon';
  webIcon.innerHTML = SEARCH_SVG;
  var webInfo = document.createElement('div');
  webInfo.className = 'search-result-info';
  var webName = document.createElement('span');
  webName.className = 'search-result-name';
  webName.textContent = currentQuery + ' - See web results';
  var webSub = document.createElement('span');
  webSub.className = 'search-result-sub';
  webSub.textContent = 'Web';
  webInfo.appendChild(webName);
  webInfo.appendChild(webSub);
  webRow.appendChild(webIcon);
  webRow.appendChild(webInfo);
  webRow.addEventListener('click', function () {
    launchApp('edge', { url: 'https://www.bing.com/search?q=' + encodeURIComponent(currentQuery) });
    closeSearch();
  });
  leftPane.appendChild(webRow);

  var rightPane = document.createElement('div');
  rightPane.className = 'search-right-pane';

  if (bestMatch) {
    var card = document.createElement('div');
    card.className = 'search-best-match-card';
    var bigImg = document.createElement('img');
    bigImg.src = bestMatch.icon;
    bigImg.alt = '';
    bigImg.draggable = false;
    var bmName = document.createElement('div');
    bmName.className = 'bm-name';
    bmName.textContent = bestMatch.name;
    var bmType = document.createElement('div');
    bmType.className = 'bm-type';
    bmType.textContent = 'App';
    var openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.className = 'search-best-match-open';
    openBtn.textContent = 'Open';
    openBtn.addEventListener('click', function () {
      launchApp(bestMatch.id);
      closeSearch();
    });
    card.appendChild(bigImg);
    card.appendChild(bmName);
    card.appendChild(bmType);
    card.appendChild(openBtn);
    rightPane.appendChild(card);
  } else {
    var noRes = document.createElement('div');
    noRes.style.color = '#666';
    noRes.style.fontSize = '13px';
    noRes.textContent = 'No results found for "' + currentQuery + '".';
    rightPane.appendChild(noRes);
  }

  bodyEl.appendChild(leftPane);
  bodyEl.appendChild(rightPane);
}

export function buildSearchMenu(cursor, stage) {
  searchEl = document.createElement('div');
  searchEl.className = 'search-menu';
  searchEl.hidden = true;

  // Header with tabs
  var header = document.createElement('div');
  header.className = 'search-header';

  var tabs = document.createElement('div');
  tabs.className = 'search-tabs';
  ['All', 'Apps', 'Documents', 'Settings', 'Web', 'More'].forEach(function (label, idx) {
    var tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'search-tab' + (idx === 0 ? ' is-active' : '');
    tab.textContent = label;
    tab.addEventListener('click', function () {
      var active = header.querySelectorAll('.is-active');
      for (var i = 0; i < active.length; i++) {
        active[i].classList.remove('is-active');
      }
      tab.classList.add('is-active');
      activeTab = label.toLowerCase();
    });
    tabs.appendChild(tab);
  });
  header.appendChild(tabs);

  var actions = document.createElement('div');
  actions.className = 'search-header-actions';
  var closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'search-action-btn';
  closeBtn.innerHTML = '<svg viewBox="0 0 12 12" width="12" height="12"><path fill="currentColor" d="M1.17 1.17a1 1 0 0 1 1.42 0L6 4.59l3.41-3.42a1 1 0 1 1 1.42 1.42L7.41 6l3.42 3.41a1 1 0 0 1-1.42 1.42L6 7.41l-3.41 3.42a1 1 0 0 1-1.42-1.42L4.59 6 1.17 2.59a1 1 0 0 1 0-1.42z"/></svg>';
  closeBtn.setAttribute('aria-label', 'Close search');
  closeBtn.addEventListener('click', function () {
    closeSearch();
  });
  actions.appendChild(closeBtn);
  header.appendChild(actions);

  searchEl.appendChild(header);

  // Body. The panel has no input of its own: the taskbar search box beneath it
  // is the input, so this is all there is to draw.
  bodyEl = document.createElement('div');
  bodyEl.className = 'search-body';
  searchEl.appendChild(bodyEl);

  return searchEl;
}
