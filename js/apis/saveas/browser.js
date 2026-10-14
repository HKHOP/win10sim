// The folder browser a file dialog is drawn around: the address row with back /
// forward / up and a breadcrumb trail, the toolbar with Organize, New folder and
// the view switcher, the navigation pane with its tree, and the file list.
//
// It is a widget rather than a dialog because two dialogs need exactly it - Save
// As asks where a file goes, Open asks which one to read - and the only thing
// that differs between them is the row of controls underneath. Save As
// (saveas.js, beside this) owns that row and its promise; everything above it
// lives here.
//
// The browser reads the volume it is handed and never writes. New folder asks
// its owner to do it, because a dialog that made a folder on an app's behalf
// would be granting itself a permission that app was never given.

// The glyphs the shell's own icon list does not name, taken from the generated
// font directly as popup.js does: a dialog is not part of the named set. Back,
// forward and refresh are MDL2's own; "up one level" is not one it has, so that
// arrow is drawn - see UP_SVG below.
import {
  BACK,
  FORWARD,
  REFRESH,
  SEARCH,
  NEW_FOLDER,
  HELP,
  LIST,
  TILES,
  FOLDER,
  DOCUMENT,
  CHEVRON_DOWN,
  CHEVRON_RIGHT
} from '../../global/mdl2.js';
import { createTextField } from '../../core/textfield.js';
import { FILE_SRC, DOUBLE_TAP_MS } from '../../global/constants.js';
import {
  VOLUME_ROOT,
  SYSTEM_DRIVE,
  shortcutPlaces,
  folderIcon,
  trailOf
} from './places.js';

// MDL2 has no "up" arrow, so the one Win10's address bar draws is drawn here.
var UP_SVG =
  '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">'
  + '<path d="M10 16V4.5M5.5 9L10 4.5 14.5 9" stroke="currentColor" stroke-width="1.6"/>'
  + '</svg>';

function el(tag, cls, text) {
  var node = document.createElement(tag);
  if (cls) {
    node.className = cls;
  }
  if (text != null) {
    node.textContent = text;
  }
  return node;
}

function glyph(mark, cls) {
  var span = el('span', cls || 'sa-glyph');
  span.innerHTML = mark;
  return span;
}

// A folder the dialog will not offer as somewhere to save: the folders Windows
// itself is made of, and the ones an install leaves behind. This is not a
// permission system - it is the same politeness Explorer's own Save As shows by
// not listing them as shortcuts, and a person can still walk into them from
// the tree.
function isHiddenName(name) {
  return String(name).charAt(0) === '$' ||
    String(name).toLowerCase() === 'system volume information';
}

function sizeOf(entry) {
  if (entry.type === 'dir' || !entry.size) {
    return '';
  }
  var bytes = entry.size;
  if (bytes < 1024) {
    return bytes + ' B';
  }
  if (bytes < 1048576) {
    return Math.round(bytes / 1024) + ' KB';
  }
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function whenOf(entry) {
  if (!entry.modified) {
    return '';
  }
  var d = new Date(entry.modified);
  var hours = d.getHours() % 12;
  if (hours === 0) {
    hours = 12;
  }
  var minutes = d.getMinutes();
  return (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear() + ' ' +
    hours + ':' + (minutes < 10 ? '0' + minutes : minutes) +
    (d.getHours() < 12 ? ' AM' : ' PM');
}

function typeOf(entry) {
  if (entry.type === 'dir') {
    return 'File folder';
  }
  var dot = entry.name.lastIndexOf('.');
  var ext = dot >= 0 ? entry.name.slice(dot + 1).toLowerCase() : '';
  return ext ? ext.toUpperCase() + ' File' : 'File';
}

// Which artwork a file wears. Documents get the shell's document icon; anything
// else is the plain file icon, because inventing one per extension is the one
// thing this dialog is not for.
function fileIcon(name) {
  var dot = name.lastIndexOf('.');
  var ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
  if (ext === 'txt' || ext === 'md' || ext === 'rtf' || ext === 'log') {
    return DOCUMENT_ICON;
  }
  return FILE_SRC;
}

var DOCUMENT_ICON = FILE_SRC;

// opts: {
//   startPath,     where it opens
//   view,          'tiles' | 'list' | 'details'
//   onNavigate,    (path) called whenever the folder changes
//   onPick,        (entry) called when a file is chosen (click or Enter)
//   onMkdir,       (path) called by the New folder button
// }
//
// The volume is not handed over here: it mounts lazily, and a dialog that
// waited for it would sit blank on the screen. setVolume() takes it once it
// exists, and re-reads.
export function createBrowser(opts) {
  var volume = null;
  var state = {
    path: opts.startPath || VOLUME_ROOT,
    history: [],
    hi: -1,
    entries: [],
    selected: '',
    view: opts.view || 'tiles',
    // Which tree nodes are open. A folder's children are read the first time it
    // is opened and never again, the way a tree keeps its own expansion.
    open: {},
    loaded: {},
    query: ''
  };

  var root = el('div', 'sa-browser');

  // The last row opened by a double-tap, and when. One press selects, two open,
  // and the second only counts inside this window.
  var lastTap = null;

  // ---- address row ----
  var address = el('div', 'sa-addr');

  var backBtn = el('button', 'sa-addr-btn');
  backBtn.type = 'button';
  backBtn.innerHTML = BACK;
  backBtn.title = 'Back to previous folder';
  backBtn.setAttribute('aria-label', 'Back');
  backBtn.disabled = true;

  var fwdBtn = el('button', 'sa-addr-btn');
  fwdBtn.type = 'button';
  fwdBtn.innerHTML = FORWARD;
  fwdBtn.title = 'Forward to next folder';
  fwdBtn.setAttribute('aria-label', 'Forward');
  fwdBtn.disabled = true;

  var upBtn = el('button', 'sa-addr-btn');
  upBtn.type = 'button';
  upBtn.innerHTML = UP_SVG;
  upBtn.title = 'Up one level';
  upBtn.setAttribute('aria-label', 'Up one level');

  var pathBar = el('div', 'sa-addr-path');

  var refreshBtn = el('button', 'sa-addr-btn');
  refreshBtn.type = 'button';
  refreshBtn.innerHTML = REFRESH;
  refreshBtn.title = 'Refresh';
  refreshBtn.setAttribute('aria-label', 'Refresh');

  var searchWrap = el('div', 'sa-addr-search');
  searchWrap.appendChild(glyph(SEARCH));
  var searchField = createTextField({
    className: 'sa-input sa-addr-search-input',
    placeholder: 'Search',
    label: 'Search'
  });
  searchWrap.appendChild(searchField);

  address.appendChild(backBtn);
  address.appendChild(fwdBtn);
  address.appendChild(upBtn);
  address.appendChild(pathBar);
  address.appendChild(refreshBtn);
  address.appendChild(searchWrap);
  root.appendChild(address);

  // ---- toolbar ----
  var tools = el('div', 'sa-tools');

  var organizeBtn = el('button', 'sa-tools-btn');
  organizeBtn.type = 'button';
  organizeBtn.appendChild(el('span', null, 'Organize'));
  organizeBtn.appendChild(glyph(CHEVRON_DOWN, 'sa-glyph sa-glyph-sm'));

  var newFolderBtn = el('button', 'sa-tools-btn');
  newFolderBtn.type = 'button';
  newFolderBtn.innerHTML = NEW_FOLDER;
  newFolderBtn.appendChild(el('span', null, 'New folder'));
  newFolderBtn.title = 'New folder';
  newFolderBtn.setAttribute('aria-label', 'New folder');

  var views = el('div', 'sa-tools-views');
  [{ name: 'tiles', mark: TILES }, { name: 'list', mark: LIST }, { name: 'details', mark: LIST }]
    .forEach(function (item) {
      var button = el('button', 'sa-view-btn');
      button.type = 'button';
      button.dataset.view = item.name;
      button.innerHTML = item.mark;
      button.setAttribute('aria-label', item.name.charAt(0).toUpperCase() + item.name.slice(1) + ' view');
      button.addEventListener('click', function () {
        state.view = item.name;
        paintViewButtons();
        paintList();
      });
      views.appendChild(button);
    });

  var helpBtn = el('button', 'sa-tools-btn sa-tools-btn-icon');
  helpBtn.type = 'button';
  helpBtn.innerHTML = HELP;
  helpBtn.title = 'Get help';
  helpBtn.setAttribute('aria-label', 'Get help');

  tools.appendChild(organizeBtn);
  tools.appendChild(newFolderBtn);
  tools.appendChild(views);
  tools.appendChild(helpBtn);
  root.appendChild(tools);

  // ---- body: navigation pane + file list ----
  var body = el('div', 'sa-body');

  var nav = el('div', 'sa-nav');
  var navTree = el('div', 'sa-nav-section');
  var navShortcuts = el('div', 'sa-nav-section');
  nav.appendChild(navShortcuts);
  nav.appendChild(navTree);

  var listWrap = el('div', 'sa-list-wrap');
  var list = el('div', 'sa-list sa-view-' + state.view);
  var empty = el('div', 'sa-list-empty');
  empty.hidden = true;
  listWrap.appendChild(list);
  listWrap.appendChild(empty);

  body.appendChild(nav);
  body.appendChild(listWrap);
  root.appendChild(body);

  // ---- the Organize menu ----
  // This menu is the dialog's own, not the shell's context menu: borrowing that
  // would leave a dialog depending on the shell it is opened over. It is
  // anchored to its button and closed by a press anywhere else.
  var organizeMenu = null;

  function hideOrganize() {
    if (organizeMenu && organizeMenu.parentNode) {
      organizeMenu.parentNode.removeChild(organizeMenu);
    }
    organizeMenu = null;
    organizeBtn.classList.remove('is-open');
  }

  function showOrganize() {
    if (organizeMenu) {
      hideOrganize();
      return;
    }
    var menu = el('div', 'sa-menu');
    [
      {
        label: 'Select all',
        run: function () {
          state.selected = state.entries.length ? state.entries[0].name : '';
          paintList();
        }
      },
      {
        label: 'Invert selection',
        run: function () {
          var kept = state.entries.filter(function (entry) {
            return entry.name !== state.selected;
          });
          state.selected = kept.length ? kept[0].name : '';
          paintList();
        }
      }
    ].forEach(function (item) {
      var row = el('button', 'sa-menu-item');
      row.type = 'button';
      row.textContent = item.label;
      row.addEventListener('click', function () {
        hideOrganize();
        item.run();
      });
      menu.appendChild(row);
    });
    organizeBtn.parentNode.style.position = 'relative';
    organizeBtn.parentNode.appendChild(menu);
    organizeBtn.classList.add('is-open');
    organizeMenu = menu;
  }

  organizeBtn.addEventListener('click', function (event) {
    event.stopPropagation();
    showOrganize();
  });
  document.addEventListener('mousedown', function (event) {
    if (!organizeMenu) {
      return;
    }
    if (organizeMenu.contains(event.target) || organizeBtn.contains(event.target)) {
      return;
    }
    hideOrganize();
  }, true);

  // ---- reading the folder ----

  // The volume the dialog reads, handed over once it has mounted (saveas.js
  // mounts it lazily, so the browser is on screen before it exists).
  var volume = null;

  function readDir(path) {
    if (!volume || !volume.available) {
      return Promise.resolve([]);
    }
    return volume.listDir(path).then(function (entries) {
      return entries || [];
    }, function () {
      // A path that is not there reads as an empty folder rather than throwing:
      // Win10 says the folder cannot be found, and an empty list says it well
      // enough for a dialog that has nowhere else to go.
      return [];
    });
  }

  function childPath(parent, name) {
    return String(parent).replace(/\\$/, '') + '\\' + name;
  }

  // ---- navigation ----

  function navigate(path, push) {
    if (push !== false) {
      state.history = state.history.slice(0, state.hi + 1);
      state.history.push(path);
      state.hi = state.history.length - 1;
    }
    state.path = path;
    state.selected = '';
    state.query = '';
    searchField.value = '';
    searchField.placeholder = 'Search ' + trailLeaf(path);
    backBtn.disabled = state.hi <= 0;
    fwdBtn.disabled = state.hi >= state.history.length - 1;
    upBtn.disabled = trailOf(path).length < 2;
    paintTrail();
    paintNavSelection();
    load();
    if (opts.onNavigate) {
      opts.onNavigate(path);
    }
  }

  function trailLeaf(path) {
    var trail = trailOf(path);
    return trail.length ? trail[trail.length - 1].label : 'C:';
  }

  function paintTrail() {
    while (pathBar.firstChild) {
      pathBar.removeChild(pathBar.firstChild);
    }
    var crumbs = trailOf(state.path);
    crumbs.forEach(function (crumb, index) {
      if (index) {
        pathBar.appendChild(glyph(CHEVRON_RIGHT, 'sa-glyph sa-glyph-sm sa-crumb-sep'));
      }
      var button = el('button', 'sa-crumb' + (index === crumbs.length - 1 ? ' is-current' : ''));
      button.type = 'button';
      button.textContent = crumb.label;
      button.title = crumb.path;
      button.addEventListener('click', function () {
        navigate(crumb.path);
      });
      pathBar.appendChild(button);
    });
  }

  backBtn.addEventListener('click', function () {
    if (state.hi > 0) {
      state.hi -= 1;
      navigate(state.history[state.hi], false);
    }
  });
  fwdBtn.addEventListener('click', function () {
    if (state.hi < state.history.length - 1) {
      state.hi += 1;
      navigate(state.history[state.hi], false);
    }
  });
  upBtn.addEventListener('click', function () {
    var trail = trailOf(state.path);
    if (trail.length > 1) {
      navigate(trail[trail.length - 2].path);
    }
  });
  refreshBtn.addEventListener('click', load);
  newFolderBtn.addEventListener('click', function () {
    if (opts.onMkdir) {
      opts.onMkdir(state.path);
    }
  });
  searchField.addEventListener('input', function () {
    state.query = searchField.value.trim().toLowerCase();
    paintList();
  });

  function load() {
    readDir(state.path).then(function (entries) {
      state.entries = entries.filter(function (entry) {
        return !isHiddenName(entry.name);
      });
      state.selected = '';
      paintList();
    });
  }

  function visibleEntries() {
    if (!state.query) {
      return state.entries;
    }
    return state.entries.filter(function (entry) {
      return entry.name.toLowerCase().indexOf(state.query) >= 0;
    });
  }

  function openEntry(entry) {
    if (entry.type === 'dir') {
      navigate(childPath(state.path, entry.name));
      return;
    }
    if (opts.onPick) {
      opts.onPick(entry);
    }
  }

  // ---- the file list ----

  function paintList() {
    list.className = 'sa-list sa-view-' + state.view;
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }
    var entries = visibleEntries();
    if (!entries.length) {
      empty.hidden = false;
      empty.textContent = state.query
        ? 'No items match your search.'
        : 'This folder is empty.';
    } else {
      empty.hidden = true;
    }
    entries.forEach(function (entry) {
      list.appendChild(buildRow(entry));
    });
  }

  function buildRow(entry) {
    var isDir = entry.type === 'dir';
    var row = el('div', 'sa-item' + (entry.name === state.selected ? ' is-selected' : ''));
    row.dataset.name = entry.name;
    row.tabIndex = 0;

    var art = el('span', 'sa-item-icon');
    art.innerHTML = '<img alt="" draggable="false" src="' +
      (isDir ? folderIcon(entry.name) : fileIcon(entry.name)) + '">';
    row.appendChild(art);

    row.appendChild(el('span', 'sa-item-name', entry.name));

    if (state.view === 'details') {
      row.appendChild(el('span', 'sa-item-col', whenOf(entry)));
      row.appendChild(el('span', 'sa-item-col', typeOf(entry)));
      row.appendChild(el('span', 'sa-item-col', sizeOf(entry)));
    }

    // A single press chooses, as it does in Win10's Save As: the name goes into
    // the File name box and the row is lit. A second press on the same row
    // inside the double-tap window opens it.
    //
    // The double-tap is counted here rather than left to a `dblclick` listener
    // because the emulated cursor routes its presses as dispatched events, and a
    // browser only raises dblclick for a genuine mouse sequence - which the
    // emulated one never is. Explorer's own list counts them the same way.
    row.addEventListener('click', function (event) {
      event.stopPropagation();
      state.selected = entry.name;
      paintList();
      if (opts.onPick) {
        opts.onPick(entry);
      }
      var key = entry.type + ':' + entry.name;
      var now = Date.now();
      if (lastTap && lastTap.key === key && now - lastTap.time < DOUBLE_TAP_MS) {
        lastTap = null;
        openEntry(entry);
        return;
      }
      lastTap = { key: key, time: now };
    });
    row.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        openEntry(entry);
      }
    });
    return row;
  }

  function paintViewButtons() {
    var buttons = views.querySelectorAll('.sa-view-btn');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].classList.toggle('is-active', buttons[i].dataset.view === state.view);
    }
  }

  // ---- the navigation pane ----

  // A tree row. The chevron only appears on a folder, because only a folder can
  // be opened; the row itself navigates, and the chevron opens and shuts the
  // node in place, which is what a chevron means on every tree in Windows.
  function buildTreeRow(label, iconSrc, path) {
    var row = el('div', 'sa-nav-row');
    row.dataset.path = path;
    row.tabIndex = 0;

    var twisty = el('span', 'sa-nav-twisty');
    twisty.innerHTML = CHEVRON_RIGHT;
    row.appendChild(twisty);

    var art = el('span', 'sa-nav-icon');
    art.innerHTML = iconSrc
      ? '<img alt="" draggable="false" src="' + iconSrc + '">'
      : FOLDER;
    row.appendChild(art);

    row.appendChild(el('span', 'sa-nav-label', label));

    row.addEventListener('click', function (event) {
      // The chevron's press belongs to the chevron: it opens and shuts the node
      // without leaving the folder being looked at.
      var onTwisty = event.target === twisty || (twisty && twisty.contains(event.target));
      if (onTwisty) {
        event.stopPropagation();
        toggleNode(row);
        return;
      }
      navigate(path);
    });
    return row;
  }

  function paintNodeOpen(row) {
    var isOpen = !!state.open[row.dataset.path];
    row.classList.toggle('is-open', isOpen);
    var twisty = row.querySelector('.sa-nav-twisty');
    if (twisty) {
      twisty.innerHTML = isOpen ? CHEVRON_DOWN : CHEVRON_RIGHT;
    }
    if (row.__kids) {
      row.__kids.hidden = !isOpen;
    }
  }

  function toggleNode(row) {
    var path = row.dataset.path;
    state.open[path] = !state.open[path];
    paintNodeOpen(row);
    if (state.open[path] && !state.loaded[path]) {
      state.loaded[path] = true;
      var kids = el('div', 'sa-nav-kids');
      row.__kids = kids;
      row.appendChild(kids);
      readDir(path).then(function (entries) {
        entries.filter(function (entry) {
          return entry.type === 'dir' && !isHiddenName(entry.name);
        }).forEach(function (entry) {
          kids.appendChild(buildTreeRow(entry.name, folderIcon(entry.name), childPath(path, entry.name)));
        });
      });
    }
  }

  function buildShortcuts() {
    var head = el('div', 'sa-nav-head');
    head.textContent = 'Quick access';
    navShortcuts.appendChild(head);
    shortcutPlaces().forEach(function (place) {
      var row = el('div', 'sa-nav-row sa-nav-shortcut');
      row.dataset.path = place.path;
      row.tabIndex = 0;
      // A shortcut is a place, not a node: it has no chevron, because there is
      // nothing to open in place.
      row.appendChild(el('span', 'sa-nav-twisty'));
      var art = el('span', 'sa-nav-icon');
      art.innerHTML = '<img alt="" draggable="false" src="' + place.icon + '">';
      row.appendChild(art);
      row.appendChild(el('span', 'sa-nav-label', place.label));
      row.addEventListener('click', function (event) {
        event.stopPropagation();
        navigate(place.path);
      });
      navShortcuts.appendChild(row);
    });
  }

  function paintNavSelection() {
    var rows = nav.querySelectorAll('.sa-nav-row');
    for (var i = 0; i < rows.length; i++) {
      rows[i].classList.toggle('is-current', rows[i].dataset.path === state.path);
    }
  }

  paintViewButtons();
  buildShortcuts();
  var driveNode = buildTreeRow(SYSTEM_DRIVE.label, SYSTEM_DRIVE.icon, VOLUME_ROOT);
  navTree.appendChild(driveNode);
  // The drive is open on arrival, because its top level is where a person
  // starts looking for the account's folders.
  toggleNode(driveNode);
  navigate(state.path);

  return {
    el: root,
    navigate: navigate,
    currentPath: function () { return state.path; },
    // The volume, handed over once it has mounted. A read that has already been
    // answered with an empty list is not re-run, so the caller re-reads after
    // handing it over.
    setVolume: function (next) {
      volume = next;
      load();
    },
    // Re-read the folder, for a caller that has just written into it.
    refresh: load,
    setView: function (name) {
      state.view = name;
      paintViewButtons();
      paintList();
    }
  };
}
