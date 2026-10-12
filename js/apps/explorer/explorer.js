import {
  FOLDER_SRC,
  FILE_SRC,
  DRIVE_SRC,
  THISPC_SRC,
  EXPLORER_SRC,
  RECYCLE_BIN_SRC,
  DOUBLE_TAP_MS
} from '../../global/constants.js';
import { SEARCH_SVG } from '../../global/icons.js';
import { buildRibbon } from './ribbon.js';
import { showContextMenu, hideContextMenu } from '../../core/contextmenu.js';
import {
  buildQuickAccessGroup,
  buildRecentTabs,
  folderArt,
  homeArt,
  itemArt as homeItemArt
} from './home.js';
import { getPinned, noteUsed } from '../../apis/quickaccess.js';

// File Explorer content: editable address bar (typed paths, recent
// places), working search, nav pane, browsable tiles / list / details,
// This PC groups with a live drive-space bar, status bar.
// Click selects (Ctrl toggles, double-click/tap opens); history for
// back/forward, breadcrumb segments, up, and refresh all work.

var PROFILE_FOLDERS = ['3D Objects', 'Desktop', 'Documents', 'Downloads', 'Music', 'Pictures', 'Videos'];
var USER_BASE = 'C:\\Users\\User';
// Shell folder that lives outside the volume: no path segments, no
// storage backing — the bin is rendered as a virtual root like This PC.
var RECYCLE_BIN_PLACE = 'recyclebin';
// Home is what File Explorer opens on, the way Win10 lands on Quick Access
// rather than on a drive. This PC stays a separate page: Explorer treats them
// as different places, and the address bar and title say so.
var HOME_PLACE = 'home';
var SEARCH_DEBOUNCE_MS = 300;
// Bounds on the recursive walk so a big volume can never freeze the UI.
var SEARCH_MAX_RESULTS = 300;
var SEARCH_MAX_VISITS = 4000;
// Win10 error glyph (red disc, white X) for the address-bar message box.
var ERROR_SVG =
  '<svg viewBox="0 0 32 32" aria-hidden="true">' +
  '<circle cx="16" cy="16" r="13" fill="#e81123"/>' +
  '<path d="M11 11l10 10M21 11L11 21" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' +
  '</svg>';
var INFO_SVG =
  '<svg viewBox="0 0 32 32" aria-hidden="true">' +
  '<circle cx="16" cy="16" r="13" fill="#0078d7"/>' +
  '<path d="M16 8v11" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' +
  '<circle cx="16" cy="23.5" r="2" fill="#fff"/>' +
  '</svg>';
// Deleted items live under the user's bin SID, exactly where NTFS keeps
// them, so the C:\ root listing has to hide it the way Win10 does.
var RECYCLE_BIN_ROOT = 'C:\\$Recycle.Bin\\S-1-5-21-1964531255-1331432381-3380043568-1013';
var SYSTEM_ENTRY_PREFIX = '$';

// The editable form of a place, exactly what Win10 puts in the address box.
function displayPath(place) {
  if (place === 'thispc') {
    return 'This PC';
  }
  if (place === HOME_PLACE) {
    return 'Home';
  }
  if (place === RECYCLE_BIN_PLACE) {
    return 'Recycle Bin';
  }
  return place;
}

// "... Search <this>" — Win10 names the box after the current location.
function searchScopeLabel(place) {
  if (place === 'thispc') {
    return 'This PC';
  }
  if (place === HOME_PLACE) {
    return 'Home';
  }
  if (place === RECYCLE_BIN_PLACE) {
    return 'Recycle Bin';
  }
  if (/^[a-zA-Z]:\\?$/.test(place)) {
    return place.charAt(0) + ':';
  }
  var parts = place.split('\\').filter(function (p) { return !!p; });
  return parts.length ? parts[parts.length - 1] : place;
}

function leafName(path) {
  var parts = String(path).split('\\').filter(function (p) { return !!p; });
  return parts.length ? parts[parts.length - 1] : String(path);
}

function parentPath(path) {
  var parts = String(path).split('\\').filter(function (p) { return !!p; });
  if (parts.length <= 1) {
    return 'C:\\';
  }
  parts.pop();
  var joined = parts.join('\\');
  return /^[a-zA-Z]:$/.test(joined) ? joined + '\\' : joined;
}

function joinPath(dir, name) {
  return String(dir).endsWith('\\') ? dir + name : dir + '\\' + name;
}

// Typed address text -> a place this Explorer can navigate to (null = junk).
function normalizePlace(raw, from) {
  var text = String(raw || '').trim().replace(/^"|"$/g, '').replace(/\//g, '\\');
  if (!text) {
    return null;
  }
  var lower = text.toLowerCase();
  if (lower === 'this pc' || lower === 'thispc') {
    return 'thispc';
  }
  // Typing "Home" reaches Quick Access, the way it does in Win10.
  if (lower === 'home' || lower === 'quick access') {
    return HOME_PLACE;
  }
  if (lower === 'recycle bin' || lower === 'recyclebin') {
    return RECYCLE_BIN_PLACE;
  }
  if (/^[a-zA-Z]:/.test(text)) {
    // Absolute on C:. Normalise the drive letter and duplicate/trailing
    // separators the way Explorer does while you type.
    text = text.charAt(0).toUpperCase() + text.slice(1);
    text = text.replace(/\\{2,}/g, '\\');
    if (/^[a-zA-Z]:\\+$/.test(text)) {
      return text.charAt(0) + ':\\';
    }
    return text.replace(/\\+$/, '');
  }
  if (text.indexOf('\\') >= 0 || from === 'thispc' || from === HOME_PLACE || from === RECYCLE_BIN_PLACE) {
    return null;
  }
  // Bare name: resolved against the folder you are standing in.
  return joinPath(from, text);
}

var NAV = {
  back: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="#0078d7"/><path d="M12.5 6.5L9 10l3.5 3.5" fill="none" stroke="#fff" stroke-width="1.8"/></svg>',
  fwd: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="none" stroke="#999" stroke-width="1.4"/><path d="M7.5 6.5L11 10l-3.5 3.5" fill="none" stroke="#999" stroke-width="1.8"/></svg>',
  up: '<svg viewBox="0 0 20 20"><path d="M10 16V4M5.5 8.5L10 4l4.5 4.5" fill="none" stroke="#444" stroke-width="1.6"/></svg>',
  refresh: '<svg viewBox="0 0 20 20"><path d="M16.5 10a6.5 6.5 0 1 1-2-4.7" fill="none" stroke="#444" stroke-width="1.6"/><path d="M16.5 2.5v4h-4" fill="none" stroke="#444" stroke-width="1.6"/></svg>'
};

function el(tag, cls, html) {
  var node = document.createElement(tag);
  if (cls) {
    node.className = cls;
  }
  if (html != null) {
    node.innerHTML = html;
  }
  return node;
}

function formatSize(bytes) {
  if (bytes < 1024) {
    return bytes + ' B';
  }
  if (bytes < 1048576) {
    return Math.round(bytes / 1024) + ' KB';
  }
  if (bytes < 1073741824) {
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
  return (bytes / 1073741824).toFixed(2) + ' GB';
}

function formatDate(ms) {
  if (!ms) {
    return '';
  }
  var d = new Date(ms);
  var hours = d.getHours() % 12;
  if (hours === 0) {
    hours = 12;
  }
  var minutes = d.getMinutes();
  var suffix = d.getHours() < 12 ? 'AM' : 'PM';
  return (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear() + ' ' +
    hours + ':' + (minutes < 10 ? '0' + minutes : minutes) + ' ' + suffix;
}

function typeLabel(name, isDir) {
  if (isDir) {
    return 'File folder';
  }
  var dot = name.lastIndexOf('.');
  var ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
  if (ext === 'txt') {
    return 'Text Document';
  }
  if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'gif' || ext === 'bmp') {
    return 'Image';
  }
  if (ext === 'mp3' || ext === 'wav') {
    return 'Music';
  }
  if (ext === 'mp4' || ext === 'avi') {
    return 'Video';
  }
  if (ext === 'zip') {
    return 'Compressed (zipped) Folder';
  }
  if (ext === 'exe') {
    return 'Application';
  }
  return ext ? ext.toUpperCase() + ' File' : 'File';
}

function displayName(name, isDir, showExtensions) {
  if (isDir || showExtensions) {
    return name;
  }
  var dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
}

function crumbTrail(place) {
  // [{ label, place }] from the virtual This PC root down.
  if (place === RECYCLE_BIN_PLACE) {
    return [{ label: 'Recycle Bin', place: RECYCLE_BIN_PLACE }];
  }
  if (place === HOME_PLACE) {
    // Home is not inside This PC: it is its own root in the shell tree.
    return [{ label: 'Home', place: HOME_PLACE }];
  }
  var trail = [{ label: 'This PC', place: 'thispc' }];
  if (place !== 'thispc') {
    var parts = place.split('\\').filter(function (p) { return !!p; });
    var acc = '';
    parts.forEach(function (part, i) {
      acc = i === 0 ? part + '\\' : acc + part;
      if (i < parts.length - 1) {
        acc += '\\';
      }
      trail.push({ label: part.replace(/:$/, ''), place: acc });
    });
  }
  return trail;
}

export async function openExplorer(context, startPath) {
  var volume = await context.getVolume();
  var virtual = startPath === RECYCLE_BIN_PLACE;
  var win = context.createWindow({
    title: virtual ? 'Recycle Bin' : 'File Explorer',
    icon: virtual ? RECYCLE_BIN_SRC : EXPLORER_SRC,
    width: 980,
    height: 560
  });

  if (!volume.available && !virtual) {
    var dead = el('div', 'exp-unavailable');
    dead.textContent = 'Storage is unavailable. Serve the simulator over http(s) to browse files.';
    win.body.appendChild(dead);
    return win;
  }

  // First-run profile setup, just like a fresh Windows account.
  if (volume.available) {
    for (var f = 0; f < PROFILE_FOLDERS.length; f++) {
      try {
        await volume.makeDir(USER_BASE + '\\' + PROFILE_FOLDERS[f]);
      } catch (err) {
        // Already there.
      }
    }
  }

  var state = {
    place: startPath || HOME_PLACE,
    history: [],
    hi: -1,
    view: 'tiles',
    showExtensions: true,
    selected: {},
    collapsed: {},
    query: '',
    sortKey: 'name',
    sortAsc: true
  };

  var root = el('div', 'explorer');
  var addressEl, navEl, contentEl, statusEl, ribbonEl;

  function setTitle() {
    if (state.place === 'thispc' || state.place === HOME_PLACE) {
      // Both are shell pages inside explorer.exe, and Win10 titles the window
      // after the program for each of them.
      win.setTitle('File Explorer');
    } else if (state.place === RECYCLE_BIN_PLACE) {
      win.setTitle('Recycle Bin');
    } else {
      var parts = state.place.split('\\').filter(function (p) { return !!p; });
      var leaf = parts[parts.length - 1].replace(/\\$/, '');
      win.setTitle(leaf === 'C:' ? 'System (C:)' : leaf);
    }
  }

  function navigate(place, push) {
    if (push !== false) {
      state.history = state.history.slice(0, state.hi + 1);
      state.history.push(place);
      state.hi = state.history.length - 1;
    }
    state.place = place;
    state.selected = {};
    setTitle();
    render();
    // Opening something lands it in Quick Access's Recent list, the way
    // Win10 records every place you visit.
    if (place !== HOME_PLACE && place !== 'thispc' && place !== RECYCLE_BIN_PLACE) {
      noteUsed({
        place: place,
        name: leafName(place),
        type: 'dir'
      });
    }
  }

  function itemKey(item) {
    return (item.type === 'dir' ? 'd:' : 'f:') + item.name;
  }

  var lastTap = null;

  function wireItem(node, item, open) {
    node.addEventListener('click', function (event) {
      var additive = !!(event.ctrlKey || event.metaKey);
      var key = itemKey(item);
      if (additive) {
        if (state.selected[key]) {
          delete state.selected[key];
        } else {
          state.selected[key] = true;
        }
      } else {
        var now = Date.now();
        if (lastTap && lastTap.key === key && now - lastTap.time < DOUBLE_TAP_MS) {
          lastTap = null;
          open();
          return;
        }
        lastTap = { key: key, time: now };
        state.selected = {};
        state.selected[key] = true;
      }
      paintSelection();
    });
  }

  function paintSelection() {
    var nodes = contentEl.querySelectorAll('[data-key]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].classList.toggle('exp-selected', !!state.selected[nodes[i].getAttribute('data-key')]);
    }
  }

  function openItem(item, inPlace) {
    if (item.type === 'dir') {
      // Shell pages (Home, This PC) carry each row's exact path; a real
      // folder listing resolves the name against where you are standing.
      navigate(item.place || (inPlace + (inPlace.endsWith('\\') ? '' : '\\') + item.name));
    }
  }

  function setView(view) {
    state.view = view;
    if (ribbonEl && ribbonEl.refresh) {
      ribbonEl.refresh();
    }
    renderContent();
  }

  function setSort(key, asc) {
    state.sortKey = key;
    if (asc !== undefined) {
      state.sortAsc = asc;
    }
    renderContent();
  }

  // Win10 keeps folders first, then orders by the chosen column.
  function sortEntries(entries) {
    var dir = state.sortAsc ? 1 : -1;
    var value = function (item) {
      if (state.sortKey === 'date') {
        return item.modified || 0;
      }
      if (state.sortKey === 'size') {
        return item.size || 0;
      }
      if (state.sortKey === 'type') {
        return typeLabel(item.name, item.type === 'dir');
      }
      return item.name.toLowerCase();
    };
    return entries.slice().sort(function (a, b) {
      if (a.type !== b.type) {
        return a.type === 'dir' ? -1 : 1;
      }
      var av = value(a);
      var bv = value(b);
      if (av < bv) {
        return -1 * dir;
      }
      if (av > bv) {
        return 1 * dir;
      }
      return a.name.toLowerCase() < b.name.toLowerCase() ? -1 * dir : 0;
    });
  }

  // ---- address bar ----
  // Built once and updated in place: rebuilding it on every render would
  // destroy the text boxes mid-typing.
  var backBtn, fwdBtn, upBtn, crumbEl, refreshBtn;
  var searchWrap, searchInput, addrInput, recentEl;
  var addrEditing = false;
  var searchTimer = null;

  function buildAddress() {
    backBtn = el('button', 'exp-navbtn', NAV.back);
    backBtn.type = 'button';
    backBtn.setAttribute('aria-label', 'Back');
    backBtn.addEventListener('click', function () {
      if (state.hi > 0) {
        state.hi--;
        state.place = state.history[state.hi];
        state.selected = {};
        setTitle();
        render();
      }
    });

    fwdBtn = el('button', 'exp-navbtn', NAV.fwd);
    fwdBtn.type = 'button';
    fwdBtn.setAttribute('aria-label', 'Forward');
    fwdBtn.addEventListener('click', function () {
      if (state.hi < state.history.length - 1) {
        state.hi++;
        state.place = state.history[state.hi];
        state.selected = {};
        setTitle();
        render();
      }
    });

    upBtn = el('button', 'exp-navbtn', NAV.up);
    upBtn.type = 'button';
    upBtn.setAttribute('aria-label', 'Up');
    upBtn.addEventListener('click', function () {
      if (state.place === 'thispc') {
        return;
      }
      if (state.place === HOME_PLACE) {
        // Home sits above This PC in the shell tree.
        navigate('thispc');
        return;
      }
      if (state.place === RECYCLE_BIN_PLACE) {
        // No shell parent above the bin in this tree; land on This PC.
        navigate('thispc');
        return;
      }
      var parts = state.place.split('\\').filter(function (p) { return !!p; });
      if (parts.length <= 1) {
        navigate('thispc');
      } else {
        navigate(parts.slice(0, -1).join('\\') + (parts.length === 2 ? '\\' : ''));
      }
    });

    addressEl.appendChild(backBtn);
    addressEl.appendChild(fwdBtn);
    addressEl.appendChild(upBtn);

    crumbEl = el('div', 'exp-crumb');
    crumbEl.addEventListener('click', function (event) {
      var target = event.target;
      if (addrEditing || !target || !target.closest) {
        return;
      }
      if (target.closest('.exp-crumb-btn') || target.closest('.exp-navbtn')) {
        return;
      }
      // Empty stretch of the field: Win10 swaps crumbs for an editable path.
      enterAddressEdit();
    });
    refreshBtn = el('button', 'exp-navbtn', NAV.refresh);
    refreshBtn.type = 'button';
    refreshBtn.setAttribute('aria-label', 'Refresh');
    refreshBtn.addEventListener('click', function () {
      render();
    });
    addressEl.appendChild(crumbEl);

    // Recent-places drop-down Win10 opens beneath the address box.
    recentEl = el('div', 'exp-recent');
    addressEl.appendChild(recentEl);

    addrInput = document.createElement('input');
    addrInput.className = 'exp-addr-input';
    addrInput.type = 'text';
    addrInput.spellcheck = false;
    addrInput.setAttribute('aria-label', 'Address');
    addrInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        goToTypedPath(addrInput.value);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        exitAddressEdit();
      }
    });
    addrInput.addEventListener('blur', exitAddressEdit);

    searchWrap = el('div', 'exp-search');
    searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.setAttribute('aria-label', 'Search');
    searchInput.addEventListener('input', function () {
      if (searchTimer) {
        window.clearTimeout(searchTimer);
      }
      searchTimer = window.setTimeout(function () {
        searchTimer = null;
        applySearch();
      }, SEARCH_DEBOUNCE_MS);
    });
    searchInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        applySearch();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        if (searchInput.value) {
          searchInput.value = '';
          applySearch();
        } else {
          searchInput.blur();
        }
      }
    });
    // The magnifier sits at the right end of the box, Win10 style, and
    // runs the query when pressed.
    var searchIcon = el('button', 'exp-search-icon', SEARCH_SVG);
    searchIcon.type = 'button';
    searchIcon.setAttribute('aria-label', 'Search');
    searchIcon.addEventListener('click', function () {
      searchInput.focus();
      applySearch();
    });
    searchWrap.appendChild(searchInput);
    searchWrap.appendChild(searchIcon);
    addressEl.appendChild(searchWrap);
  }

  function renderAddress() {
    backBtn.disabled = state.hi <= 0;
    fwdBtn.disabled = state.hi >= state.history.length - 1;
    upBtn.disabled = state.place === 'thispc';
    if (!addrEditing) {
      renderCrumbs();
    }
    searchInput.placeholder = 'Search ' + searchScopeLabel(state.place);
  }

  function renderCrumbs() {
    while (crumbEl.firstChild) {
      crumbEl.removeChild(crumbEl.firstChild);
    }
    crumbEl.classList.toggle('exp-crumb-edit', addrEditing);
    if (addrEditing) {
      crumbEl.appendChild(addrInput);
    } else {
      crumbTrail(state.place).forEach(function (seg, i) {
        if (i > 0) {
          var sep = el('span', 'exp-crumb-sep');
          sep.textContent = '›';
          crumbEl.appendChild(sep);
        }
        var button = el('button', 'exp-crumb-btn');
        button.type = 'button';
        button.textContent = seg.label;
        button.addEventListener('click', function () {
          navigate(seg.place);
        });
        crumbEl.appendChild(button);
      });
    }
    crumbEl.appendChild(refreshBtn);
  }

  function enterAddressEdit() {
    if (addrEditing) {
      return;
    }
    addrEditing = true;
    addrInput.value = displayPath(state.place);
    renderCrumbs();
    addrInput.focus();
    addrInput.select();
    showRecent();
  }

  function exitAddressEdit() {
    if (!addrEditing) {
      return;
    }
    addrEditing = false;
    hideRecent();
    renderCrumbs();
  }

  // Leaving a folder reverts the address box and drops the search, the way
  // Win10 does when you navigate anywhere.
  function leavePlace() {
    exitAddressEdit();
    if (searchTimer) {
      window.clearTimeout(searchTimer);
      searchTimer = null;
    }
    if (state.query || searchInput.value) {
      state.query = '';
      searchInput.value = '';
    }
  }

  function hideRecent() {
    recentEl.classList.remove('on');
  }

  function showRecent() {
    var places = [];
    for (var i = state.history.length - 1; i >= 0 && places.length < 10; i--) {
      var place = state.history[i];
      if (place !== state.place && places.indexOf(place) < 0) {
        places.push(place);
      }
    }
    while (recentEl.firstChild) {
      recentEl.removeChild(recentEl.firstChild);
    }
    if (places.length === 0) {
      hideRecent();
      return;
    }
    places.forEach(function (entry) {
      var item = el('button', 'exp-recent-item');
      item.type = 'button';
      var img = document.createElement('img');
      img.src = recentIcon(entry);
      img.alt = '';
      img.draggable = false;
      var label = el('span', 'exp-recent-label');
      label.textContent = displayPath(entry);
      item.appendChild(img);
      item.appendChild(label);
      // Pressing an entry must not blur the box before its click lands.
      item.addEventListener('mousedown', function (event) {
        event.preventDefault();
      });
      item.addEventListener('click', function () {
        hideRecent();
        exitAddressEdit();
        navigate(entry);
      });
      recentEl.appendChild(item);
    });
    recentEl.classList.add('on');
  }

  function recentIcon(place) {
    if (place === 'thispc') {
      return THISPC_SRC;
    }
    if (place === HOME_PLACE) {
      return homeArt();
    }
    if (place === RECYCLE_BIN_PLACE) {
      return RECYCLE_BIN_SRC;
    }
    if (/^[a-zA-Z]:\\?$/.test(place)) {
      return DRIVE_SRC;
    }
    return folderArt(leafName(place));
  }

  function applySearch() {
    if (searchTimer) {
      window.clearTimeout(searchTimer);
      searchTimer = null;
    }
    var query = searchInput.value.trim();
    if (query === state.query) {
      return;
    }
    state.query = query;
    renderContent();
  }

  // ---- path entry ----
  // Win10 opens files from the address bar; with no file associations yet,
  // a typed/searched file lands in its own folder with itself selected.
  async function revealFile(place) {
    navigate(parentPath(place), false);
    state.selected = {};
    state.selected['f:' + leafName(place)] = true;
  }

  async function goToTypedPath(raw) {
    var text = String(raw || '').trim();
    if (!text) {
      return;
    }
    var bare = text.indexOf(':') < 0 && text.indexOf('\\') < 0;
    var place = normalizePlace(text, state.place);
    if (place === 'thispc' || place === HOME_PLACE || place === RECYCLE_BIN_PLACE) {
      exitAddressEdit();
      navigate(place);
      return;
    }
    if (!volume.available) {
      showPathError(text);
      return;
    }
    // Known user folders resolve from anywhere, like Win10 does for
    // "Documents" no matter where you are standing.
    if (bare && (!place || place === joinPath(state.place, text))) {
      try {
        var knownStat = await volume.stat(joinPath(USER_BASE, text));
        if (knownStat.type === 'dir') {
          exitAddressEdit();
          navigate(joinPath(USER_BASE, text));
          return;
        }
      } catch (err) {
        // Not a known folder — keep going with the typed candidate.
      }
    }
    if (!place) {
      showPathError(text);
      return;
    }
    var stat = null;
    try {
      stat = await volume.stat(place);
    } catch (err) {
      stat = null;
    }
    if (!stat) {
      showPathError(text);
      return;
    }
    exitAddressEdit();
    if (stat.type === 'dir') {
      navigate(place);
    } else {
      revealFile(place);
    }
  }

  // Win10 message box: glyph on the left, text on the right, buttons bottom
  // right. Used for "cannot find", replace confirmations and folder
  // properties, exactly like Explorer's own dialogs.
  function showMessageBox(opts) {
    var options = opts || {};
    var dlg = context.createWindow({
      title: options.title || 'File Explorer',
      icon: options.icon || EXPLORER_SRC,
      width: options.width || 440,
      height: options.height || 176
    });
    var box = el('div', 'exp-msgbox');
    var glyph = el('span', 'exp-msgbox-icon');
    glyph.innerHTML = options.info ? INFO_SVG : ERROR_SVG;
    var msg = el('div', 'exp-msgbox-text');
    msg.textContent = options.message || '';
    var actions = el('div', 'exp-msgbox-actions');
    (options.buttons || [{ label: 'OK' }]).forEach(function (spec) {
      var btn = el('button', 'exp-msgbox-btn' + (spec.primary ? ' is-primary' : ''), spec.label);
      btn.type = 'button';
      btn.addEventListener('click', function () {
        dlg.close();
        if (spec.action) {
          spec.action();
        }
      });
      actions.appendChild(btn);
    });
    box.appendChild(glyph);
    box.appendChild(msg);
    box.appendChild(actions);
    dlg.body.appendChild(box);
    return dlg;
  }

  function showPathError(text) {
    return showMessageBox({
      message: "Windows cannot find '" + text + "'. Check the spelling and try again."
    });
  }

  // ---- context menu actions ----
  async function pathExists(path) {
    try {
      await volume.stat(path);
      return true;
    } catch (err) {
      return false;
    }
  }

  function uniquePath(dir, name) {
    // Win10 names the second "New folder" "New folder (2)" and keeps the
    // extension outside the counter.
    var dot = name.lastIndexOf('.');
    var ext = dot > 0 ? name.slice(dot) : '';
    var stem = dot > 0 ? name.slice(0, dot) : name;
    function attempt(counter) {
      var candidate = counter === 0
        ? joinPath(dir, name)
        : joinPath(dir, stem + ' (' + counter + ')' + ext);
      return pathExists(candidate).then(function (taken) {
        return taken ? attempt(counter + 1) : candidate;
      });
    }
    return attempt(0);
  }

  function newFolder() {
    if (!volume.available || !writableHere()) {
      return;
    }
    uniquePath(state.place, 'New folder').then(function (path) {
      return volume.makeDir(path);
    }).then(function () {
      renderContent();
    }, function () {});
  }

  function newTextDocument() {
    if (!volume.available || !writableHere()) {
      return;
    }
    uniquePath(state.place, 'New Text Document.txt').then(function (path) {
      return volume.writeFile(path, '');
    }).then(function () {
      renderContent();
    }, function () {});
  }

  function writableHere() {
    return state.place !== 'thispc' && state.place !== HOME_PLACE &&
      state.place !== RECYCLE_BIN_PLACE && !state.query;
  }

  // Delete sends items to the Recycle Bin the way Win10 does: the payload is
  // moved under $Recycle.Bin\<SID> and a small $I record keeps the original
  // path so Restore can put it back.
  function recycleItems(places) {
    if (!volume.available) {
      return Promise.resolve();
    }
    return volume.makeDir(RECYCLE_BIN_ROOT).then(function () {
      return places.reduce(function (chain, place) {
        return chain.then(function () {
          var id = '$R' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
          var name = id + '_' + leafName(place);
          var record = {
            origin: place,
            deleted: Date.now()
          };
          return volume.writeFile(RECYCLE_BIN_ROOT + '\\' + id + '.json', JSON.stringify(record))
            .then(function () {
              return volume.move(place, joinPath(RECYCLE_BIN_ROOT, name));
            });
        });
      }, Promise.resolve());
    }).then(function () {
      renderContent();
    }, function () {});
  }

  function emptyRecycleBin() {
    if (!volume.available) {
      return;
    }
    // Everything under the bin SID goes: payloads and their $I records.
    volume.listDir(RECYCLE_BIN_ROOT).then(function (listed) {
      return listed.reduce(function (chain, entry) {
        return chain.then(function () {
          return volume.remove(joinPath(RECYCLE_BIN_ROOT, entry.name), true);
        });
      }, Promise.resolve());
    }).then(function () {
      renderContent();
    }, function () {});
  }

  function listBin() {
    return volume.listDir(RECYCLE_BIN_ROOT).then(function (listed) {
      return listed.filter(function (entry) {
        return entry.name.charAt(0) === '$R';
      });
    }, function () {
      return [];
    });
  }

  function binDisplayName(stored) {
    var cut = stored.indexOf('_');
    return cut >= 0 ? stored.slice(cut + 1) : stored;
  }

  function binId(stored) {
    return stored.slice(0, stored.indexOf('_') || stored.length);
  }

  function restoreBinItem(stored) {
    var id = binId(stored);
    volume.readFile(RECYCLE_BIN_ROOT + '\\' + id + '.json').then(function (file) {
      return file.text();
    }).then(function (text) {
      var record = JSON.parse(text);
      return volume.move(joinPath(RECYCLE_BIN_ROOT, stored), record.origin);
    }).then(function () {
      return volume.remove(RECYCLE_BIN_ROOT + '\\' + id + '.json');
    }).then(function () {
      renderContent();
    }, function () {});
  }

  // ---- inline rename (F2 / menu) ----
  function startRename(node, item) {
    if (!volume.available || !item.place) {
      return;
    }
    var label = node.expLabel;
    if (!label) {
      return;
    }
    var current = displayName(item.name, item.type === 'dir', state.showExtensions);
    var input = document.createElement('input');
    input.className = 'exp-rename';
    input.type = 'text';
    input.value = current;
    label.textContent = '';
    label.appendChild(input);
    input.focus();
    // Win10 selects the base name and leaves the extension untouched.
    var dot = current.lastIndexOf('.');
    input.setSelectionRange(0, dot > 0 ? dot : current.length);

    var settled = false;
    function finish(commit) {
      if (settled) {
        return;
      }
      settled = true;
      var next = input.value.trim();
      if (input.parentNode) {
        input.parentNode.removeChild(input);
      }
      label.textContent = current;
      if (!commit || !next || next === current) {
        return;
      }
      renameTo(item, next);
    }

    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        finish(true);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        finish(false);
      }
    });
    input.addEventListener('blur', function () {
      finish(true);
    });
  }

  function renameTo(item, nextName) {
    var parent = parentPath(item.place);
    var target = joinPath(parent, nextName);
    function apply() {
      volume.move(item.place, target).then(function () {
        renderContent();
      }, function () {});
    }
    pathExists(target).then(function (taken) {
      if (taken) {
        showMessageBox({
          info: true,
          message: 'There is already a file with the same name in this folder.',
          buttons: [
            { label: 'Cancel' },
            { label: 'Replace', primary: true, action: function () { apply(); } }
          ]
        });
        return;
      }
      apply();
    });
  }

  // ---- properties ----
  function showProperties(info) {
    var dlg = context.createWindow({
      title: info.name + ' Properties',
      icon: info.icon || EXPLORER_SRC,
      width: 400,
      height: 330
    });
    var sheet = el('div', 'exp-props');
    var sheetName = el('div', 'exp-props-name');
    var sheetArt = el('span', 'exp-props-art');
    var art = document.createElement('img');
    art.src = info.icon || FILE_SRC;
    art.alt = '';
    art.draggable = false;
    sheetArt.appendChild(art);
    var nameText = el('div', 'exp-props-title');
    nameText.textContent = info.name;
    sheetName.appendChild(sheetArt);
    sheetName.appendChild(nameText);
    sheet.appendChild(sheetName);

    var rows = el('div', 'exp-props-rows');
    info.rows.forEach(function (row) {
      var line = el('div', 'exp-props-row');
      var key = el('span', 'exp-props-key');
      key.textContent = row[0];
      var value = el('span', 'exp-props-val');
      value.textContent = row[1];
      line.appendChild(key);
      line.appendChild(value);
      rows.appendChild(line);
    });
    sheet.appendChild(rows);

    var actions = el('div', 'exp-msgbox-actions exp-props-actions');
    var ok = el('button', 'exp-msgbox-btn is-primary', 'OK');
    ok.type = 'button';
    ok.addEventListener('click', function () {
      dlg.close();
    });
    actions.appendChild(ok);
    sheet.appendChild(actions);
    dlg.body.appendChild(sheet);
    return dlg;
  }

  function itemProperties(item) {
    var icon = itemArtSrc(item);
    showProperties({
      name: item.name,
      icon: icon,
      rows: [
        ['Type of file:', item.type === 'dir' ? 'File folder' : typeLabel(item.name, false)],
        ['Location:', parentPath(item.place)],
        ['Size:', item.type === 'dir' ? '0 bytes' : formatSize(item.size || 0)],
        ['Modified:', formatDate(item.modified || 0) || '—']
      ]
    });
  }

  function folderProperties(place) {
    showProperties({
      name: displayPath(place),
      icon: place === 'thispc'
        ? THISPC_SRC
        : (place === HOME_PLACE
            ? homeArt()
            : (place === RECYCLE_BIN_PLACE ? RECYCLE_BIN_SRC : FOLDER_SRC)),
      rows: [
        ['Type of file:', 'File folder'],
        ['Location:', place === 'thispc' || place === HOME_PLACE ? 'Desktop' : parentPath(place)],
        ['Created by:', 'User'],
        ['Modified:', formatDate(Date.now())]
      ]
    });
  }

  function selectAllVisible() {
    state.selected = {};
    contentEl.querySelectorAll('[data-key]').forEach(function (node) {
      state.selected[node.getAttribute('data-key')] = true;
    });
    paintSelection();
  }

  // ---- search ----
  function searchRoot() {
    if (state.place === RECYCLE_BIN_PLACE) {
      return null;
    }
    // Home and This PC are shell pages: a search there covers the volume.
    if (state.place === 'thispc' || state.place === HOME_PLACE) {
      return 'C:\\';
    }
    return state.place;
  }

  async function collectSearch(dir, query, out, budget) {
    var listed = null;
    try {
      listed = await volume.listDir(dir);
    } catch (err) {
      return;
    }
    for (var i = 0; i < listed.length; i++) {
      if (out.length >= SEARCH_MAX_RESULTS || budget.visits >= SEARCH_MAX_VISITS) {
        return;
      }
      budget.visits++;
      var name = listed[i].name;
      if (name.charAt(0) === SYSTEM_ENTRY_PREFIX) {
        continue;
      }
      var full = joinPath(dir, name);
      if (name.toLowerCase().indexOf(query) >= 0) {
        var stat = null;
        try {
          stat = await volume.stat(full);
        } catch (err) {
          stat = null;
        }
        out.push({
          name: name,
          type: listed[i].type,
          size: stat ? stat.size : 0,
          modified: stat ? stat.modified : 0,
          place: full
        });
      }
      if (listed[i].type === 'dir') {
        // Win10 searches subfolders too.
        await collectSearch(full, query, out, budget);
      }
    }
  }

  function openResult(item) {
    if (item.type === 'dir') {
      navigate(item.place);
    } else {
      revealFile(item.place);
    }
  }

  // ---- context menus ----
  // Win10 Explorer menus: the item menu over a tile/row/drive, the folder
  // menu over empty space, and the bin menu inside the Recycle Bin.
  function viewSubmenu() {
    return [
      { label: 'Large icons', checked: state.view === 'tiles', action: function () { setView('tiles'); } },
      { label: 'List', checked: state.view === 'list', action: function () { setView('list'); } },
      { label: 'Details', checked: state.view === 'details', action: function () { setView('details'); } }
    ];
  }

  function sortSubmenu() {
    return [
      { label: 'Name', checked: state.sortKey === 'name', action: function () { setSort('name'); } },
      { label: 'Date modified', checked: state.sortKey === 'date', action: function () { setSort('date'); } },
      { label: 'Type', checked: state.sortKey === 'type', action: function () { setSort('type'); } },
      { label: 'Size', checked: state.sortKey === 'size', action: function () { setSort('size'); } },
      { separator: true },
      { label: 'Ascending', checked: state.sortAsc, action: function () { setSort(state.sortKey, true); } },
      { label: 'Descending', checked: !state.sortAsc, action: function () { setSort(state.sortKey, false); } }
    ];
  }

  function newSubmenu() {
    return [
      { label: 'Folder', icon: FOLDER_SRC, action: newFolder },
      { label: 'Text Document', icon: FILE_SRC, action: newTextDocument }
    ];
  }

  function selectionPlaces() {
    var nodes = contentEl.querySelectorAll('[data-place]');
    var places = [];
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute('data-key');
      if (state.selected[key] && nodes[i].getAttribute('data-place')) {
        places.push(nodes[i].getAttribute('data-place'));
      }
    }
    return places;
  }

  function binItemMenu(x, y, stored) {
    showContextMenu(x, y, [
      { label: 'Restore this item', action: function () { restoreBinItem(stored); } },
      { separator: true },
      { label: 'Cut', shortcut: 'Ctrl+X', disabled: true },
      { label: 'Delete', shortcut: 'Del', disabled: true },
      { separator: true },
      { label: 'Properties', shortcut: 'Alt+Enter', disabled: true }
    ]);
  }

  function itemMenu(x, y, item) {
    if (state.place === RECYCLE_BIN_PLACE && item.binName) {
      binItemMenu(x, y, item.binName);
      return;
    }
    var places = selectionPlaces();
    if (places.length === 0 && item.place) {
      places = [item.place];
    }
    var many = places.length > 1;
    var target = item.type === 'dir'
      ? function () { openItem(item, state.place); }
      : function () { revealFile(item.place); };

    showContextMenu(x, y, [
      { label: 'Open', action: target },
      { label: 'Open with', submenu: [{ label: 'No apps are installed', disabled: true }], disabled: item.type === 'dir' },
      { separator: true },
      { label: 'Cut', shortcut: 'Ctrl+X', disabled: true },
      { label: 'Copy', shortcut: 'Ctrl+C', disabled: true },
      { separator: true },
      { label: 'Delete', shortcut: 'Del', action: function () { recycleItems(places); } },
      { label: 'Rename', shortcut: 'F2', disabled: many || !item.place, action: function () { startRename(nodeFor(item), item); } },
      { separator: true },
      { label: 'Properties', shortcut: 'Alt+Enter', action: function () { itemProperties(item); } }
    ]);
  }

  function nodeFor(item) {
    var key = itemKey(item);
    var nodes = contentEl.querySelectorAll('[data-key]');
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].getAttribute('data-key') === key) {
        return nodes[i];
      }
    }
    return null;
  }

  function emptySpaceMenu(x, y) {
    var inBin = state.place === RECYCLE_BIN_PLACE;
    var items = [];
    if (inBin) {
      items.push({ label: 'Restore all items', action: function () { restoreAllBinItems(); } });
      items.push({ label: 'Empty Recycle Bin', disabled: !volume.available, action: emptyRecycleBin });
      showContextMenu(x, y, items);
      return;
    }
    items = [
      { label: 'View', submenu: viewSubmenu() },
      { label: 'Sort by', submenu: sortSubmenu() },
      { label: 'Refresh', shortcut: 'F5', action: function () { renderContent(); } },
      { separator: true },
      { label: 'Paste', shortcut: 'Ctrl+V', disabled: true },
      { label: 'Paste shortcut', shortcut: 'Ctrl+Shift+V', disabled: true },
      { separator: true },
      { label: 'New', submenu: newSubmenu(), disabled: !writableHere() || !volume.available },
      { separator: true },
      { label: 'Properties', shortcut: 'Alt+Enter', action: function () { folderProperties(state.place); } },
      { separator: true },
      { label: 'Open in Terminal', disabled: true },
      { label: 'Select all', shortcut: 'Ctrl+A', action: selectAllVisible }
    ];
    showContextMenu(x, y, items);
  }

  function restoreAllBinItems() {
    listBin().then(function (entries) {
      entries.forEach(function (entry) {
        restoreBinItem(entry.name);
      });
    });
  }

  function explorerMenu(x, y, target) {
    if (!target || !target.closest) {
      return;
    }
    var row = target.closest('[data-key]');
    if (row && contentEl.contains(row)) {
      var key = row.getAttribute('data-key');
      if (key.indexOf('drive:') === 0) {
        showContextMenu(x, y, [
          { label: 'Open', action: function () { navigate('C:\\'); } },
          { separator: true },
          { label: 'Manage', disabled: true },
          { separator: true },
          { label: 'Properties', shortcut: 'Alt+Enter', action: function () { folderProperties('C:\\'); } }
        ]);
        return;
      }
      var found = findItem(key);
      if (found) {
        // Right-press selects the item first, exactly like Win10.
        if (!state.selected[key] || Object.keys(state.selected).length > 1) {
          state.selected = {};
          state.selected[key] = true;
          paintSelection();
        }
        if (key.indexOf('f:') === 0) {
          found.type = 'file';
        }
        itemMenu(x, y, found);
      }
      return;
    }
    if (contentEl.contains(target)) {
      state.selected = {};
      paintSelection();
      emptySpaceMenu(x, y);
    }
  }

  function findItem(key) {
    var wanted = key.slice(2);
    var nodes = contentEl.querySelectorAll('[data-key]');
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var place = node.getAttribute('data-place') || '';
      var binName = node.getAttribute('data-bin') || '';
      var nodeKey = node.getAttribute('data-key');
      var name = binName ? binDisplayName(binName) : (node.expItem ? node.expItem.name : wanted);
      if (nodeKey === key) {
        return {
          name: name,
          type: nodeKey.indexOf('d:') === 0 ? 'dir' : 'file',
          place: place,
          binName: binName,
          size: node.expItem ? node.expItem.size : 0,
          modified: node.expItem ? node.expItem.modified : 0
        };
      }
    }
    return null;
  }

  function wireContextMenu() {
    root.addEventListener('contextmenu', function (event) {
      if (document.pointerLockElement) {
        return; // the routed path handles the locked case
      }
      if (!contentEl.contains(event.target)) {
        return;
      }
      event.preventDefault();
      explorerMenu(event.clientX, event.clientY, event.target);
    });

    root.addEventListener('simcontextmenu', function (event) {
      if (!contentEl.contains(event.target)) {
        return;
      }
      event.preventDefault();
      hideContextMenu();
      explorerMenu(event.detail.clientX, event.detail.clientY, event.target);
    });
  }

  // ---- window-wide shortcuts and outside-click handling ----
  function onDocClick(event) {
    if (!document.contains(root)) {
      removeDocListeners();
      return;
    }
    if (document.pointerLockElement && event.isTrusted) {
      // Pointer-locked: the real click is retargeted at the lock element
      // and says nothing about where the sim cursor actually pointed.
      return;
    }
    var target = event.target;
    if (!target || !target.closest || target.closest('.exp-address')) {
      return;
    }
    exitAddressEdit();
    if (document.activeElement === searchInput) {
      searchInput.blur();
    }
  }

  function onDocKey(event) {
    if (!document.contains(root)) {
      removeDocListeners();
      return;
    }
    if (!root.closest('.win-focused')) {
      return;
    }
    var key = (event.key || '').toLowerCase();
    if ((event.altKey && key === 'd') || (event.ctrlKey && key === 'l')) {
      event.preventDefault();
      enterAddressEdit();
    } else if ((event.ctrlKey && key === 'e') || event.key === 'F3') {
      event.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  }

  function removeDocListeners() {
    document.removeEventListener('click', onDocClick);
    document.removeEventListener('keydown', onDocKey);
  }

  // ---- nav pane ----
  // Home sits at the top on its own, then the pinned folders under Quick
  // access, then This PC with the drive under it. There is no OneDrive and no
  // network share in the simulator, so neither group exists here.
  var navSeq = 0;

  function navItems() {
    var home = { label: 'Home', place: HOME_PLACE, art: homeArt() };
    var seq = ++navSeq;
    getPinned().then(function (pinned) {
      // A newer render already painted the pane; this answer is stale.
      if (seq !== navSeq) {
        return;
      }
      // Home leads the list, then the pinned folders under Quick access, then
      // This PC with the drive under it.
      var rows = [home, { header: 'Quick access' }];
      pinned.forEach(function (name) {
        rows.push({
          label: name,
          place: joinPath(USER_BASE, name),
          art: folderArt(name)
        });
      });
      rows.push({ header: 'This PC' });
      rows.push({ label: 'This PC', place: 'thispc', art: THISPC_SRC });
      rows.push({ label: 'System (C:)', place: 'C:\\', art: DRIVE_SRC });
      while (navEl.firstChild) {
        navEl.removeChild(navEl.firstChild);
      }
      rows.forEach(function (item) {
        navEl.appendChild(navRow(item));
      });
    });
    return [navRow(home)];
  }

  function navRow(item) {
    if (item.header) {
      var header = el('div', 'exp-nav-header');
      header.textContent = item.header;
      return header;
    }
    var row = el('button', 'exp-nav-row' + (state.place === item.place ? ' exp-nav-active' : ''));
    row.type = 'button';
    var art = el('span', 'exp-nav-art');
    var img = document.createElement('img');
    img.src = item.art;
    img.alt = '';
    img.draggable = false;
    art.appendChild(img);
    var label = el('span', 'exp-nav-label');
    label.textContent = item.label;
    row.appendChild(art);
    row.appendChild(label);
    row.addEventListener('click', function () {
      navigate(item.place);
    });
    return row;
  }

  // The pins are stored, so the nav list is painted from them and repainted
  // whenever Home's grid unpins something.
  function renderNav() {
    navItems().forEach(function (node) {
      navEl.appendChild(node);
    });
  }

  // What the Home view needs from this window: how to open a folder, where
  // the profile lives, and how to repaint after a pin changes. `alive` tells a
  // view that answered late it has already been replaced by a newer page.
  function homeCtx(seq) {
    return {
      openFolder: function (place) { navigate(place); },
      userBase: function () { return USER_BASE; },
      stat: function (place) {
        return volume.stat(place).catch(function () { return null; });
      },
      alive: function () { return seq === renderSeq; },
      // Unpinning changes the nav pane's Quick access list too, so the whole
      // window repaints.
      refreshPins: function () { render(); }
    };
  }

  // ---- content ----
  function itemArtSrc(item) {
    // Known folders carry their own artwork, in listings as well as in the
    // Quick access grid.
    return homeItemArt({ name: item.name, type: item.type });
  }

  // data-place / data-bin let the context menu resolve an exact path, and
  // expItem / expLabel carry the item for rename and Properties.
  function tagItem(node, item, label) {
    if (item.place) {
      node.setAttribute('data-place', item.place);
    }
    if (item.binName) {
      node.setAttribute('data-bin', item.binName);
    }
    node.expItem = item;
    node.expLabel = label;
    return node;
  }

  function buildTile(item, open) {
    var tile = el('div', 'exp-tile');
    tile.setAttribute('data-key', itemKey(item));
    var art = el('span', 'exp-tile-art');
    var img = document.createElement('img');
    img.src = itemArtSrc(item);
    img.alt = '';
    img.draggable = false;
    art.appendChild(img);
    var label = el('span', 'exp-tile-label');
    label.textContent = displayName(item.name, item.type === 'dir', state.showExtensions);
    tile.appendChild(art);
    tile.appendChild(label);
    tagItem(tile, item, label);
    wireItem(tile, item, open);
    return tile;
  }

  function buildDetailRow(item, open) {
    var row = el('div', 'exp-detail-row');
    row.setAttribute('data-key', itemKey(item));
    var name = el('span', 'exp-detail-name');
    var art = el('span', 'exp-detail-art');
    var img = document.createElement('img');
    img.src = itemArtSrc(item);
    img.alt = '';
    img.draggable = false;
    art.appendChild(img);
    var text = el('span');
    text.textContent = displayName(item.name, item.type === 'dir', state.showExtensions);
    name.appendChild(art);
    name.appendChild(text);
    var date = el('span', 'exp-detail-date');
    date.textContent = formatDate(item.modified);
    var type = el('span', 'exp-detail-type');
    type.textContent = typeLabel(item.name, item.type === 'dir');
    var size = el('span', 'exp-detail-size');
    size.textContent = item.type === 'dir' ? '' : formatSize(item.size);
    row.appendChild(name);
    row.appendChild(date);
    row.appendChild(type);
    row.appendChild(size);
    tagItem(row, item, text);
    wireItem(row, item, open);
    return row;
  }

  function buildListRow(item, open) {
    var row = el('div', 'exp-list-row');
    row.setAttribute('data-key', itemKey(item));
    var img = document.createElement('img');
    img.src = itemArtSrc(item);
    img.alt = '';
    img.draggable = false;
    var text = el('span');
    text.textContent = displayName(item.name, item.type === 'dir', state.showExtensions);
    row.appendChild(img);
    row.appendChild(text);
    tagItem(row, item, text);
    wireItem(row, item, open);
    return row;
  }

  function renderItems(container, items, open) {
    if (state.view === 'details') {
      var head = el('div', 'exp-detail-head');
      ['Name', 'Date modified', 'Type', 'Size'].forEach(function (h) {
        var cell = el('span');
        cell.textContent = h;
        head.appendChild(cell);
      });
      container.appendChild(head);
      items.forEach(function (item) {
        container.appendChild(buildDetailRow(item, function () { open(item); }));
      });
      return;
    }
    var wrap = el('div', state.view === 'list' ? 'exp-list' : 'exp-tiles');
    items.forEach(function (item) {
      wrap.appendChild(state.view === 'list'
        ? buildListRow(item, function () { open(item); })
        : buildTile(item, function () { open(item); }));
    });
    container.appendChild(wrap);
  }

  function groupShell(title, count, key) {
    var group = el('div', 'exp-group');
    var header = el('button', 'exp-group-header');
    header.type = 'button';
    var chevron = el('span', 'exp-group-chevron');
    chevron.textContent = state.collapsed[key] ? '›' : '⌄';
    var text = el('span');
    text.textContent = title + ' (' + count + ')';
    header.appendChild(chevron);
    header.appendChild(text);
    header.addEventListener('click', function () {
      state.collapsed[key] = !state.collapsed[key];
      render();
    });
    group.appendChild(header);
    var body = el('div', 'exp-group-body' + (state.collapsed[key] ? ' exp-group-hidden' : ''));
    group.appendChild(body);
    return { group: group, body: body };
  }

  async function driveRow() {
    var space = await volume.getFreeSpace();
    var row = el('div', 'exp-drive');
    row.setAttribute('data-key', 'drive:C');
    var art = el('span', 'exp-drive-art');
    var img = document.createElement('img');
    img.src = DRIVE_SRC;
    img.alt = '';
    img.draggable = false;
    art.appendChild(img);
    var info = el('div', 'exp-drive-info');
    var name = el('div', 'exp-drive-name');
    name.textContent = 'System (C:)';
    info.appendChild(name);
    if (space.quota > 0) {
      var bar = el('div', 'exp-drive-bar');
      var fill = el('div', 'exp-drive-fill');
      fill.style.width = Math.min(100, Math.round((space.usage / space.quota) * 100)) + '%';
      bar.appendChild(fill);
      info.appendChild(bar);
      var sub = el('div', 'exp-drive-sub');
      sub.textContent = formatSize(space.quota - space.usage) + ' free of ' + formatSize(space.quota);
      info.appendChild(sub);
    }
    row.appendChild(art);
    row.appendChild(info);
    row.addEventListener('click', function () {
      navigate('C:\\');
    });
    row.addEventListener('dblclick', function () {
      navigate('C:\\');
    });
    return row;
  }

  var renderSeq = 0;

  async function renderContent() {
    // Typing in the search box re-renders on every pause, so an older walk
    // that finishes late must not paint over the newest results.
    var seq = ++renderSeq;
    while (contentEl.firstChild) {
      contentEl.removeChild(contentEl.firstChild);
    }
    var count = 0;
    if (state.query) {
      var results = [];
      var rootPlace = searchRoot();
      if (rootPlace && volume.available) {
        await collectSearch(rootPlace, state.query.toLowerCase(), results, { visits: 0 });
      }
      if (seq !== renderSeq) {
        return;
      }
      if (results.length === 0) {
        var none = el('div', 'exp-empty');
        none.textContent = 'No items match your search.';
        contentEl.appendChild(none);
      } else {
        renderItems(contentEl, results, openResult);
      }
      count = results.length;
    } else if (state.place === 'thispc' || state.place === HOME_PLACE) {
      // Home and This PC share the folder + drive groups; Home puts the Quick
      // access grid and its tabs above them.
      if (state.place === HOME_PLACE) {
        contentEl.appendChild(buildQuickAccessGroup(homeCtx(seq)));
        contentEl.appendChild(buildRecentTabs(homeCtx(seq)));
      }
      var folders = [];
      try {
        var home = await volume.listDir(USER_BASE);
        folders = home.filter(function (e) { return e.type === 'dir'; });
      } catch (err) {
        folders = [];
      }
      if (seq !== renderSeq) {
        return;
      }
      if (folders.length > 0) {
        var fg = groupShell('Folders', folders.length, 'folders');
        renderItems(fg.body, sortEntries(folders.map(function (e) {
          return { name: e.name, type: 'dir', size: 0, modified: 0, place: USER_BASE + '\\' + e.name };
        })), function (item) { openItem(item, state.place); });
        contentEl.appendChild(fg.group);
        count += folders.length;
      }
      var dg = groupShell('Devices and drives', 1, 'drives');
      dg.body.appendChild(await driveRow());
      if (seq !== renderSeq) {
        return;
      }
      contentEl.appendChild(dg.group);
      count += 1;
    } else if (state.place === RECYCLE_BIN_PLACE) {
      // The bin is a virtual shell folder: its items live under
      // $Recycle.Bin\<SID> and show their original names.
      var binned = await listBin();
      if (seq !== renderSeq) {
        return;
      }
      var binItems = [];
      for (var b = 0; b < binned.length; b++) {
        var stored = joinPath(RECYCLE_BIN_ROOT, binned[b].name);
        var binStat = null;
        try {
          binStat = await volume.stat(stored);
        } catch (err) {
          binStat = null;
        }
        binItems.push({
          name: binDisplayName(binned[b].name),
          type: binned[b].type,
          size: binStat ? binStat.size : 0,
          modified: binStat ? binStat.modified : 0,
          place: stored,
          binName: binned[b].name
        });
      }
      if (binItems.length === 0) {
        var binEmpty = el('div', 'exp-empty');
        binEmpty.textContent = 'This folder is empty.';
        contentEl.appendChild(binEmpty);
      } else {
        renderItems(contentEl, sortEntries(binItems), function () {});
        count = binItems.length;
      }
    } else {
      var entries = [];
      try {
        var listed = await volume.listDir(state.place);
        for (var i = 0; i < listed.length; i++) {
          // Hidden system entries ($Recycle.Bin and friends) stay out of
          // the listing, the way Win10 hides them.
          if (listed[i].name.charAt(0) === SYSTEM_ENTRY_PREFIX) {
            continue;
          }
          var full = joinPath(state.place, listed[i].name);
          var stat = null;
          try {
            stat = await volume.stat(full);
          } catch (err) {
            stat = null;
          }
          entries.push({
            name: listed[i].name,
            type: listed[i].type,
            size: stat ? stat.size : 0,
            modified: stat ? stat.modified : 0,
            place: full
          });
        }
      } catch (err) {
        entries = [];
      }
      if (seq !== renderSeq) {
        return;
      }
      if (entries.length === 0) {
        var empty = el('div', 'exp-empty');
        empty.textContent = 'This folder is empty.';
        contentEl.appendChild(empty);
      } else {
        renderItems(contentEl, sortEntries(entries), function (item) { openItem(item, state.place); });
      }
      count = entries.length;
    }
    if (seq !== renderSeq) {
      return;
    }
    statusEl.textContent = count + (count === 1 ? ' item' : ' items');
    paintSelection();
  }

  function render() {
    leavePlace();
    renderAddress();
    renderNav();
    renderContent();
  }

  addressEl = el('div', 'exp-address');
  navEl = el('div', 'exp-nav');
  contentEl = el('div', 'exp-content');
  statusEl = el('div', 'exp-status');
  buildAddress();
  wireContextMenu();

  var main = el('div', 'exp-main');
  main.appendChild(navEl);
  main.appendChild(contentEl);

  ribbonEl = buildRibbon({
    getView: function () { return state.view; },
    onView: function (view) { setView(view); },
    showExtensions: function () { return state.showExtensions; },
    onToggleExtensions: function (on) { state.showExtensions = on; renderContent(); }
  });
  root.appendChild(ribbonEl);
  root.appendChild(addressEl);
  root.appendChild(main);
  root.appendChild(statusEl);
  win.body.appendChild(root);

  // Address shortcuts and outside-click handling live at the document so
  // they work no matter which control inside the window has focus.
  document.addEventListener('click', onDocClick);
  document.addEventListener('keydown', onDocKey);

  state.history = [state.place];
  state.hi = 0;
  setTitle();
  render();
  return win;
}
