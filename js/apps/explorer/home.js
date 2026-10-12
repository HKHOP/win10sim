import {
  FOLDER_SRC,
  FILE_SRC,
  QUICK_ACCESS_SRC,
  DESKTOP_FOLDER_SRC,
  DOWNLOADS_SRC,
  DOCUMENTS_SRC,
  PICTURES_SRC,
  MUSIC_SRC,
  VIDEOS_SRC,
  ACCOUNT_NAME
} from '../../global/constants.js';
import { getPinned, togglePin, getRecent } from '../../apis/quickaccess.js';

// Explorer's Quick access page: the grid of pinned folders and the
// Recent / Favorites / Shared tabs underneath it, the way Win10 lays it out.
// This PC is a different page (Explorer shows drives and folders only), which
// is why it lives here rather than in the shared shell renderers.

// Win10 gives each known folder its own artwork instead of the plain folder
// glyph, both in the Quick access grid and in any listing of them.
var KNOWN_FOLDER_ART = {
  Desktop: DESKTOP_FOLDER_SRC,
  Downloads: DOWNLOADS_SRC,
  Documents: DOCUMENTS_SRC,
  Music: MUSIC_SRC,
  Pictures: PICTURES_SRC,
  Videos: VIDEOS_SRC
};

// A pin drawn the way Win10 draws it once the folder is in Quick access.
var PIN_ART_ON =
  '<svg viewBox="0 0 16 16" aria-hidden="true">' +
  '<path d="M9.5 1.5l5 5-1.2 1.2-1.6-.5-2.4 2.4.4 2.6-1.1 1.1-3-3-3.5 3.5-.7-.7 3.5-3.5-3-3L3 6.5l2.6.4L8 4.5l-.5-1.6z" fill="#0078d7"/>' +
  '</svg>';

export function folderArt(name) {
  return KNOWN_FOLDER_ART[name] || FOLDER_SRC;
}

export function itemArt(item) {
  if (item.type === 'dir') {
    return folderArt(item.name);
  }
  return FILE_SRC;
}

export function quickAccessArt() {
  return QUICK_ACCESS_SRC;
}

// "3:04 PM", "Yesterday, 3:04 PM" - Win10's Activity column wording.
function activityTime(ms) {
  var when = new Date(ms || 0);
  var time = when.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  var today = new Date();
  var sameDay = when.toDateString() === today.toDateString();
  if (sameDay) {
    return time;
  }
  var yesterday = new Date(today.getTime() - 86400000);
  if (when.toDateString() === yesterday.toDateString()) {
    return 'Yesterday, ' + time;
  }
  return when.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' }) + ' ' + time;
}

// ---- builders ----
// Each returns a DOM node the caller appends, so Explorer owns the page order.

export function buildQuickAccessGroup(ctx) {
  var group = document.createElement('div');
  group.className = 'exp-group exp-qa-group';

  var header = document.createElement('button');
  header.type = 'button';
  header.className = 'exp-group-header';
  var chevron = document.createElement('span');
  chevron.className = 'exp-group-chevron';
  header.appendChild(chevron);
  var label = document.createElement('span');
  header.appendChild(label);
  group.appendChild(header);

  var body = document.createElement('div');
  body.className = 'exp-group-body exp-qa-body';
  group.appendChild(body);

  var collapsed = false;

  function paint(pinned) {
    // Win10 counts the group the way it does everywhere else: title and count.
    label.textContent = 'Quick access (' + pinned.length + ')';
    chevron.textContent = collapsed ? '›' : '⌄';
    body.classList.toggle('exp-group-hidden', collapsed);
  }

  header.addEventListener('click', function () {
    collapsed = !collapsed;
    getPinned().then(paint);
  });

  // The store answers on its own time; until it does the group shows its
  // title and an open chevron rather than a count of zero.
  label.textContent = 'Quick access';
  chevron.textContent = '⌄';

  function paintPins(pinned) {
    while (body.firstChild) {
      body.removeChild(body.firstChild);
    }
    if (pinned.length === 0) {
      var none = document.createElement('div');
      none.className = 'exp-empty';
      none.textContent = 'Pin a folder to keep it here.';
      body.appendChild(none);
      return;
    }
    var grid = document.createElement('div');
    grid.className = 'exp-qa-grid';
    pinned.forEach(function (name) {
      grid.appendChild(buildPinCell(name, function () {
        return togglePin(name).then(function () {
          return getPinned();
        });
      }));
    });
    body.appendChild(grid);
  }

  function buildPinCell(name, onToggle) {
    var cell = document.createElement('div');
    cell.className = 'exp-qa-cell';

    var open = document.createElement('button');
    open.type = 'button';
    open.className = 'exp-qa-open';
    var art = document.createElement('span');
    art.className = 'exp-qa-art';
    var img = document.createElement('img');
    img.src = folderArt(name);
    img.alt = '';
    img.draggable = false;
    art.appendChild(img);
    var text = document.createElement('span');
    text.className = 'exp-qa-text';
    var title = document.createElement('span');
    title.className = 'exp-qa-name';
    title.textContent = name;
    // Win10 notes where a pinned folder is kept.
    var sub = document.createElement('span');
    sub.className = 'exp-qa-sub';
    sub.textContent = 'Stored locally';
    text.appendChild(title);
    text.appendChild(sub);
    open.appendChild(art);
    open.appendChild(text);
    open.addEventListener('click', function () {
      ctx.openFolder(ctx.userBase() + '\\' + name);
    });
    cell.appendChild(open);

    var pin = document.createElement('button');
    pin.type = 'button';
    pin.className = 'exp-qa-pin';
    pin.innerHTML = PIN_ART_ON;
    pin.title = 'Unpin from Quick access';
    pin.setAttribute('aria-label', 'Unpin ' + name + ' from Quick access');
    pin.addEventListener('click', function () {
      pin.disabled = true;
      onToggle().then(function () {
        pin.disabled = false;
        // Win10 drops the cell from the grid as soon as it is unpinned, and
        // the nav pane's Quick access list loses it at the same time.
        ctx.refreshPins();
      });
    });
    cell.appendChild(pin);
    return cell;
  }

  getPinned().then(function (pinned) {
    // A newer page may have taken over the window while the store answered.
    if (!ctx.alive()) {
      return;
    }
    paint(pinned);
    paintPins(pinned);
  });

  return group;
}

export function buildRecentTabs(ctx) {
  var wrap = document.createElement('div');
  wrap.className = 'exp-qa-tabs';

  var TABS = [
    { id: 'recent', label: 'Recent' },
    { id: 'favorites', label: 'Favorites' },
    { id: 'shared', label: 'Shared' }
  ];

  var list = document.createElement('div');
  list.className = 'exp-qa-list';
  var active = 'recent';

  // The header and the rows share these widths so the columns line up, the
  // way a details view does in Win10.
  var COLUMNS = [
    { label: 'Name', cls: 'exp-qa-col-name' },
    { label: 'Date accessed', cls: 'exp-qa-col-date' },
    { label: 'Account', cls: 'exp-qa-col-account' },
    { label: 'Activity', cls: 'exp-qa-col-activity' }
  ];

  var head = document.createElement('div');
  head.className = 'exp-qa-row exp-qa-head';
  COLUMNS.forEach(function (column) {
    var cell = document.createElement('span');
    cell.className = 'exp-qa-cell-text ' + column.cls;
    cell.textContent = column.label;
    head.appendChild(cell);
  });
  list.appendChild(head);

  TABS.forEach(function (tab) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'exp-qa-tab';
    button.textContent = tab.label;
    button.addEventListener('click', function () {
      if (active === tab.id) {
        return;
      }
      active = tab.id;
      wrap.querySelectorAll('.exp-qa-tab').forEach(function (node) {
        node.classList.remove('exp-qa-tab-on');
      });
      button.classList.add('exp-qa-tab-on');
      paint();
    });
    if (tab.id === active) {
      button.classList.add('exp-qa-tab-on');
    }
    wrap.appendChild(button);
  });

  function row(name, path, at, art, isDir) {
    var node = document.createElement('div');
    node.className = 'exp-qa-row';
    var nameCell = document.createElement('span');
    nameCell.className = 'exp-qa-cell-text exp-qa-col-name';
    var icon = document.createElement('span');
    icon.className = 'exp-qa-row-art';
    var img = document.createElement('img');
    img.src = art;
    img.alt = '';
    img.draggable = false;
    icon.appendChild(img);
    var text = document.createElement('span');
    var title = document.createElement('span');
    title.className = 'exp-qa-row-name';
    title.textContent = name;
    var sub = document.createElement('span');
    sub.className = 'exp-qa-row-sub';
    sub.textContent = path;
    text.appendChild(title);
    text.appendChild(sub);
    nameCell.appendChild(icon);
    nameCell.appendChild(text);
    var dateCell = document.createElement('span');
    dateCell.className = 'exp-qa-cell-text exp-qa-col-date';
    dateCell.textContent = new Date(at || 0).toLocaleDateString([], {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
    var account = document.createElement('span');
    account.className = 'exp-qa-cell-text exp-qa-col-account';
    account.textContent = ACCOUNT_NAME;
    var activity = document.createElement('span');
    activity.className = 'exp-qa-cell-text exp-qa-col-activity';
    activity.textContent = activityTime(at);
    node.appendChild(nameCell);
    node.appendChild(dateCell);
    node.appendChild(account);
    node.appendChild(activity);
    if (isDir) {
      // A folder row opens on a single press, so it counts as a control for
      // the emulated pointer's hand cursor and its hover styling.
      node.setAttribute('role', 'button');
      node.tabIndex = 0;
      node.addEventListener('click', function () {
        ctx.openFolder(path);
      });
    }
    return node;
  }

  // Each paint owns the list until the next one starts: the store and the
  // folder stats both answer later, and a late answer from a tab you have
  // already left must not append its rows to the new one.
  var paintSeq = 0;

  function paint() {
    var seq = ++paintSeq;
    // The header row stays; everything under it is this paint's to rebuild.
    while (list.firstChild && list.firstChild !== head) {
      list.removeChild(list.firstChild);
    }
    function empty(text) {
      var none = document.createElement('div');
      none.className = 'exp-empty';
      none.textContent = text;
      list.appendChild(none);
    }
    if (active === 'shared') {
      // No homegroup and no network share exists in the simulator, so there is
      // nothing that could ever be shared with this account.
      empty('Nothing is shared with you.');
      return;
    }
    var source = active === 'favorites' ? getPinned() : getRecent();
    source.then(function (entries) {
      if (seq !== paintSeq || !ctx.alive()) {
        return;
      }
      if (entries.length === 0) {
        empty(active === 'favorites'
          ? 'Pin a folder to see it here.'
          : 'No items have been opened yet.');
        return;
      }
      if (active === 'favorites') {
        // Favorites lists the pinned folders with their own dates, not the
        // date they were last looked at.
        entries.forEach(function (name) {
          var path = ctx.userBase() + '\\' + name;
          ctx.stat(path).then(function (info) {
            if (seq !== paintSeq || !ctx.alive()) {
              return;
            }
            list.appendChild(row(name, path, info ? info.modified : 0, folderArt(name), true));
          });
        });
        return;
      }
      entries.forEach(function (entry) {
        var parent = String(entry.place).split('\\').slice(0, -1).join('\\');
        list.appendChild(row(
          entry.name,
          parent,
          entry.at,
          entry.type === 'dir' ? folderArt(entry.name) : FILE_SRC,
          entry.type === 'dir'
        ));
      });
    });
  }

  paint();
  wrap.appendChild(list);
  return wrap;
}
