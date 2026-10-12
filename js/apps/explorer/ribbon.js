// Explorer ribbon: the command bar Win10 puts under the title bar - a tab row
// (File / Computer / View), then the selected tab's groups, each a cluster of
// commands with its name captioned underneath and a hairline between groups.
//
// Two button shapes, both from Win10: a large tile (icon above, label below)
// for the commands a group leads with, and a small button (icon beside the
// label) for everything else. Only the Layout switcher (Tiles/List/Details),
// the file-name-extensions toggle and Properties do anything yet; the rest is
// hoverable chrome, as it is in a real window until the shell grows the
// commands behind it. The icons are line glyphs local to the ribbon.

var IC = {
  // Clipboard
  paste: '<svg viewBox="0 0 20 20"><path d="M6 3h8v3H6z" fill="none" stroke="#444" stroke-width="1.3"/><path d="M4.5 4.5h11v12h-11z" fill="none" stroke="#444" stroke-width="1.3"/><path d="M8 9h4M8 12h4" stroke="#444" stroke-width="1.2"/></svg>',
  copy: '<svg viewBox="0 0 20 20"><path d="M6 2h8v3h2v13H6z" fill="none" stroke="#444" stroke-width="1.3"/><path d="M6 2H3v13h2" fill="none" stroke="#444" stroke-width="1.3"/></svg>',
  cut: '<svg viewBox="0 0 20 20"><circle cx="5" cy="15" r="2.2" fill="none" stroke="#444" stroke-width="1.3"/><circle cx="15" cy="15" r="2.2" fill="none" stroke="#444" stroke-width="1.3"/><path d="M6.5 13L15 3M13.5 13L5 3" stroke="#444" stroke-width="1.3"/></svg>',
  trash: '<svg viewBox="0 0 20 20"><path d="M4 5h12l-1 12H5z" fill="none" stroke="#444" stroke-width="1.3"/><path d="M3 5h14M8 5V3h4v2M8 8v6M12 8v6" fill="none" stroke="#444" stroke-width="1.2"/></svg>',
  // Organize
  props: '<svg viewBox="0 0 20 20"><rect x="4" y="2" width="12" height="16" fill="none" stroke="#444" stroke-width="1.3"/><path d="M7 6h6M7 9h6M7 12h4" stroke="#444" stroke-width="1.2"/><circle cx="14" cy="14" r="4" fill="#0078d7"/><path d="M14 12v2l1.5 1.5" stroke="#fff" stroke-width="1.2" fill="none"/></svg>',
  openWith: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="3" fill="none" stroke="#444" stroke-width="1.3"/><path d="M10 1v3M10 16v3M1 10h3M16 10h3M3.6 3.6l2.1 2.1M14.3 14.3l2.1 2.1M16.4 3.6l-2.1 2.1M5.7 14.3l-2.1 2.1" stroke="#444" stroke-width="1.3"/></svg>',
  // Windows
  uninstall: '<svg viewBox="0 0 20 20"><rect x="2" y="6" width="12" height="6" fill="none" stroke="#444" stroke-width="1.3"/><path d="M14 9l4 4M18 9l-4 4" stroke="#444" stroke-width="1.3"/><circle cx="5" cy="15" r="1.4" fill="#444"/></svg>',
  driveOpt: '<svg viewBox="0 0 20 20"><path d="M10 15a6 6 0 1 1 6-6" fill="none" stroke="#444" stroke-width="1.3"/><path d="M16 4v5h-5" fill="none" stroke="#444" stroke-width="1.3"/></svg>',
  // Help
  gear: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="3" fill="none" stroke="#444" stroke-width="1.3"/><path d="M10 1v3M10 16v3M1 10h3M16 10h3M3.6 3.6l2.1 2.1M14.3 14.3l2.1 2.1M16.4 3.6l-2.1 2.1M5.7 14.3l-2.1 2.1" stroke="#444" stroke-width="1.3"/></svg>',
  sysProps: '<svg viewBox="0 0 20 20"><rect x="2" y="3" width="16" height="11" fill="none" stroke="#444" stroke-width="1.3"/><path d="M7 17h6M10 14v3" stroke="#444" stroke-width="1.3"/></svg>',
  // Panes
  paneNav: '<svg viewBox="0 0 32 32"><rect x="2" y="3" width="9" height="26" fill="#0078d7"/><rect x="13" y="3" width="17" height="26" fill="none" stroke="#444" stroke-width="1.4"/></svg>',
  panePrev: '<svg viewBox="0 0 32 32"><rect x="2" y="3" width="17" height="26" fill="none" stroke="#444" stroke-width="1.4"/><rect x="21" y="3" width="9" height="26" fill="#0078d7"/></svg>',
  paneDet: '<svg viewBox="0 0 32 32"><rect x="2" y="3" width="28" height="16" fill="none" stroke="#444" stroke-width="1.4"/><rect x="2" y="21" width="28" height="8" fill="#0078d7"/></svg>',
  // Layout
  xlarge: '<svg viewBox="0 0 20 20"><rect x="3" y="3" width="14" height="14" fill="none" stroke="#444" stroke-width="1.3"/></svg>',
  large: '<svg viewBox="0 0 20 20"><rect x="2" y="2" width="7" height="7" fill="none" stroke="#444"/><rect x="11" y="2" width="7" height="7" fill="none" stroke="#444"/><rect x="2" y="11" width="7" height="7" fill="none" stroke="#444"/><rect x="11" y="11" width="7" height="7" fill="none" stroke="#444"/></svg>',
  medium: '<svg viewBox="0 0 20 20"><rect x="2" y="2" width="4" height="4" fill="none" stroke="#444"/><rect x="8" y="2" width="4" height="4" fill="none" stroke="#444"/><rect x="14" y="2" width="4" height="4" fill="none" stroke="#444"/><rect x="2" y="8" width="4" height="4" fill="none" stroke="#444"/><rect x="8" y="8" width="4" height="4" fill="none" stroke="#444"/><rect x="14" y="8" width="4" height="4" fill="none" stroke="#444"/><rect x="2" y="14" width="4" height="4" fill="none" stroke="#444"/><rect x="8" y="14" width="4" height="4" fill="none" stroke="#444"/><rect x="14" y="14" width="4" height="4" fill="none" stroke="#444"/></svg>',
  small: '<svg viewBox="0 0 20 20"><path d="M2 4h3v3H2zM7 4h3v3H7zM12 4h3v3h-3zM17 4h1v3h-1zM2 9h3v3H2zM7 9h3v3H7zM12 9h3v3h-3zM17 9h1v3h-1zM2 14h3v3H2zM7 14h3v3H7zM12 14h3v3h-3zM17 14h1v3h-1z" fill="none" stroke="#444" stroke-width="1"/></svg>',
  list: '<svg viewBox="0 0 20 20"><path d="M6 4h12M6 8h12M6 12h12M6 16h12" stroke="#444" stroke-width="1.4"/><circle cx="3" cy="4" r="1.2" fill="#444"/><circle cx="3" cy="8" r="1.2" fill="#444"/><circle cx="3" cy="12" r="1.2" fill="#444"/><circle cx="3" cy="16" r="1.2" fill="#444"/></svg>',
  details: '<svg viewBox="0 0 20 20"><rect x="2" y="2" width="16" height="4" fill="none" stroke="#444"/><path d="M2 8h16M2 11h16M2 14h16M2 17h16" stroke="#444" stroke-width="1.2"/></svg>',
  tiles: '<svg viewBox="0 0 20 20"><rect x="2" y="2" width="7" height="7" fill="#0078d7"/><path d="M11 4h7M11 7h7M11 12h7M11 15h7" stroke="#444" stroke-width="1.2"/></svg>',
  content: '<svg viewBox="0 0 20 20"><rect x="2" y="2" width="5" height="16" fill="none" stroke="#444"/><path d="M9 5h9M9 9h9M9 13h9" stroke="#444" stroke-width="1.2"/></svg>',
  // Current view
  sort: '<svg viewBox="0 0 20 20"><path d="M6 3v10M3 10l3 3 3-3" fill="none" stroke="#444" stroke-width="1.4"/><path d="M11 6h7M11 10h7M11 14h5" stroke="#444" stroke-width="1.4"/></svg>',
  group: '<svg viewBox="0 0 20 20"><rect x="3" y="2" width="14" height="4" fill="none" stroke="#444"/><rect x="3" y="8" width="14" height="4" fill="none" stroke="#444"/><rect x="3" y="14" width="14" height="4" fill="none" stroke="#444"/></svg>',
  columns: '<svg viewBox="0 0 20 20"><path d="M7 2v16M13 2v16" stroke="#444" stroke-width="1.4"/></svg>',
  // Show/hide
  eye: '<svg viewBox="0 0 20 20"><path d="M1 10s3-5 9-5 9 5 9 5-3 5-9 5-9-5-9-5z" fill="none" stroke="#444" stroke-width="1.4"/><circle cx="10" cy="10" r="2" fill="#444"/></svg>',
  // Ribbon chrome
  save: '<svg viewBox="0 0 20 20"><path d="M4 2h9l3 3v13H4z" fill="none" stroke="#444" stroke-width="1.4"/><rect x="7" y="2" width="6" height="5" fill="#444"/><rect x="6" y="12" width="8" height="5" fill="none" stroke="#444" stroke-width="1.2"/></svg>',
  undo: '<svg viewBox="0 0 20 20"><path d="M8 5L3 9l5 4" fill="none" stroke="#444" stroke-width="1.6"/><path d="M3 9h9a4 4 0 0 1 0 8h-3" fill="none" stroke="#444" stroke-width="1.6"/></svg>',
  down: '<svg viewBox="0 0 20 20"><path d="M5 8l5 5 5-5" fill="none" stroke="#444" stroke-width="1.6"/></svg>',
  help: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="#0078d7"/><text x="10" y="14.5" font-size="11" fill="#fff" text-anchor="middle" font-family="sans-serif">?</text></svg>',
  upCaret: '<svg viewBox="0 0 20 20"><path d="M5 12l5-5 5 5" fill="none" stroke="#444" stroke-width="1.5"/></svg>',
  back: '<svg viewBox="0 0 20 20"><path d="M11 4L5 10l6 6" fill="none" stroke="#444" stroke-width="1.6"/></svg>'
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

// The small command: icon beside the label.
function ribbonButton(icon, label, opts) {
  var options = opts || {};
  var button = el('button', 'ribbon-btn' + (options.active ? ' ribbon-active' : ''));
  button.type = 'button';
  if (options.disabled) {
    button.disabled = true;
  }
  button.appendChild(el('span', 'ribbon-art', icon));
  button.appendChild(el('span', 'ribbon-label')).textContent = label;
  if (options.dropdown) {
    button.appendChild(el('span', 'ribbon-caret', IC.down));
  }
  if (options.onClick) {
    button.addEventListener('click', options.onClick);
  }
  return button;
}

// The large command a group leads with: icon above, label below.
function ribbonTile(icon, label, opts) {
  var options = opts || {};
  var button = el('button', 'ribbon-tile' + (options.active ? ' ribbon-active' : ''));
  button.type = 'button';
  if (options.disabled) {
    button.disabled = true;
  }
  button.appendChild(el('span', 'ribbon-art', icon));
  button.appendChild(el('span', 'ribbon-label')).textContent = label;
  if (options.onClick) {
    button.addEventListener('click', options.onClick);
  }
  return button;
}

function ribbonCheck(label, checked, onChange) {
  var wrap = el('label', 'ribbon-check');
  var box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = !!checked;
  box.addEventListener('change', function () {
    onChange(box.checked);
  });
  wrap.appendChild(box);
  wrap.appendChild(el('span')).textContent = label;
  return wrap;
}

function ribbonGroup(title, children, opts) {
  var options = opts || {};
  var group = el('div', 'ribbon-group');
  var items = el('div', 'ribbon-items' +
    (options.grid ? ' ribbon-items-' + options.grid : '') +
    (options.stack ? ' ribbon-items-stack' : ''));
  children.forEach(function (child) {
    items.appendChild(child);
  });
  group.appendChild(items);
  group.appendChild(el('div', 'ribbon-caption')).textContent = title;
  return group;
}

// Layout is a four-across grid in Win10: the four icon sizes on the top row
// (which read as checkable choices) and the four views under them.
function layoutGroup(callbacks) {
  var view = callbacks.getView();
  return ribbonGroup('Layout', [
    ribbonCheck('Extra large icons', false, function () {}),
    ribbonCheck('Large icons', false, function () {}),
    ribbonCheck('Medium icons', false, function () {}),
    ribbonCheck('Small icons', false, function () {}),
    ribbonButton(IC.list, 'List', { active: view === 'list', onClick: function () { callbacks.onView('list'); } }),
    ribbonButton(IC.details, 'Details', { active: view === 'details', onClick: function () { callbacks.onView('details'); } }),
    ribbonButton(IC.tiles, 'Tiles', { active: view === 'tiles', onClick: function () { callbacks.onView('tiles'); } }),
    ribbonButton(IC.content, 'Content', { dropdown: true })
  ], { grid: 'layout' });
}

function showHideGroup(callbacks) {
  return ribbonGroup('Show/hide', [
    ribbonCheck('Item check boxes', false, function () {}),
    ribbonCheck('File name extensions', callbacks.showExtensions(), function (on) { callbacks.onToggleExtensions(on); }),
    ribbonCheck('Hidden items', false, function () {}),
    ribbonButton(IC.eye, 'Hide selected items')
  ]);
}

function panesGroup() {
  return ribbonGroup('Navigation pane', [
    ribbonTile(IC.paneNav, 'Navigation pane', { active: true })
  ]);
}

function computerGroups(callbacks) {
  // The tall Paste button leads the Clipboard group, with Copy, Move and
  // Delete stacked beside it, the way Win10 arranges that group.
  var stack = el('div', 'ribbon-stack');
  stack.appendChild(ribbonButton(IC.copy, 'Copy', { dropdown: true }));
  stack.appendChild(ribbonButton(IC.cut, 'Move to'));
  stack.appendChild(ribbonButton(IC.trash, 'Delete', { dropdown: true }));
  return [
    ribbonGroup('Clipboard', [ribbonTile(IC.paste, 'Paste'), stack], { grid: 'clip' }),
    ribbonGroup('Organize', [
      ribbonTile(IC.props, 'Properties', { onClick: callbacks.onProperties }),
      ribbonButton(IC.openWith, 'Open with', { dropdown: true })
    ], { stack: true }),
    ribbonGroup('Windows', [
      ribbonButton(IC.uninstall, 'Uninstall or change a program', { disabled: true }),
      ribbonButton(IC.driveOpt, 'Drive Optimization', { disabled: true })
    ], { stack: true }),
    ribbonGroup('Help', [
      ribbonButton(IC.gear, 'Manage'),
      ribbonButton(IC.sysProps, 'System properties', { disabled: true }),
      ribbonButton(IC.openWith, 'File Explorer Options', { dropdown: true })
    ], { stack: true })
  ];
}

function viewGroups(callbacks) {
  return [
    panesGroup(),
    layoutGroup(callbacks),
    ribbonGroup('Current view', [
      ribbonButton(IC.sort, 'Sort by', { dropdown: true }),
      ribbonButton(IC.group, 'Group by', { dropdown: true }),
      ribbonButton(IC.columns, 'Add columns', { disabled: true })
    ], { stack: true }),
    showHideGroup(callbacks),
    ribbonGroup('Options', [
      ribbonTile(IC.gear, 'Options')
    ])
  ];
}

function groupsForTab(tab, callbacks) {
  if (tab === 'computer') {
    return computerGroups(callbacks);
  }
  return viewGroups(callbacks);
}

// ---- File tab (Backstage) ----
// Win10's File tab is not a ribbon at all: it takes over the whole command area
// with a list of the places and commands this window can go, the chosen one
// spelled out on the right.
var BACKSTAGE_TEXT = {
  quickaccess: 'The folders you pin show up here, along with the places you visit most.',
  thispc: 'The drives, folders and devices attached to this PC.',
  quick: 'Choose which folders Quick access shows, and how far back it remembers them.',
  options: 'Change how File Explorer searches, shows files and opens folders.',
  pin: 'Pin this folder to Quick access so it stays one click away.'
};

function backstage(host, leave, callbacks) {
  var view = el('div', 'ribbon-backstage');

  var column = el('div', 'ribbon-back-column');
  var back = el('button', 'ribbon-back', IC.back);
  back.type = 'button';
  back.setAttribute('aria-label', 'Back');
  back.addEventListener('click', leave);
  column.appendChild(back);

  var detail = el('div', 'ribbon-back-detail');

  var ITEMS = [
    { id: 'quickaccess', label: 'Quick access', group: 'Places' },
    { id: 'thispc', label: 'This PC', group: 'Places' },
    { id: 'quick', label: 'Quick access settings', group: 'Settings' },
    { id: 'options', label: 'File Explorer Options', group: 'Settings' },
    { id: 'pin', label: 'Pin to Quick access', group: 'Settings', disabled: true },
    { id: 'props', label: 'Properties', group: 'Settings', action: 'properties' }
  ];

  function show(id) {
    var entry = ITEMS.filter(function (item) { return item.id === id; })[0];
    if (!entry) {
      return;
    }
    while (detail.firstChild) {
      detail.removeChild(detail.firstChild);
    }
    var title = el('h2', 'ribbon-back-title');
    title.textContent = entry.label;
    detail.appendChild(title);
    if (entry.action === 'properties') {
      // Properties leaves the backstage and opens the folder's own sheet,
      // which is where the shell already has it.
      leave();
      callbacks.onProperties();
      return;
    }
    var blurb = el('p', 'ribbon-back-blurb');
    blurb.textContent = BACKSTAGE_TEXT[entry.id] || 'Not available in the simulator.';
    detail.appendChild(blurb);
    column.querySelectorAll('.ribbon-back-item').forEach(function (node) {
      node.classList.toggle('ribbon-back-item-on', node.getAttribute('data-id') === id);
    });
  }

  var lastGroup = null;
  ITEMS.forEach(function (item) {
    if (item.group !== lastGroup) {
      column.appendChild(el('div', 'ribbon-back-group')).textContent = item.group;
      lastGroup = item.group;
    }
    var button = el('button', 'ribbon-back-item');
    button.type = 'button';
    button.setAttribute('data-id', item.id);
    button.textContent = item.label;
    if (item.disabled) {
      button.disabled = true;
    }
    button.addEventListener('click', function () {
      show(item.id);
    });
    column.appendChild(button);
  });

  view.appendChild(column);
  view.appendChild(detail);
  host.appendChild(view);
  show(ITEMS[0].id);
}

export function buildRibbon(callbacks) {
  var currentTab = 'computer';
  // The tab behind the backstage, so Back and Properties return to the ribbon
  // the user was looking at rather than to a default.
  var lastRibbonTab = 'computer';

  var root = el('div', 'exp-ribbon');

  var top = el('div', 'ribbon-top');
  var qat = el('div', 'ribbon-qat');
  [IC.save, IC.undo, IC.down].forEach(function (icon) {
    var button = el('button', 'ribbon-qat-btn', icon);
    button.type = 'button';
    qat.appendChild(button);
  });
  top.appendChild(qat);

  var tabs = el('div', 'ribbon-tabs');
  var tabButtons = {};
  [['file', 'File'], ['computer', 'Computer'], ['view', 'View']].forEach(function (entry) {
    var tab = entry[0];
    var button = el('button', 'ribbon-tab ribbon-tab-' + tab +
      (tab === 'computer' ? ' ribbon-tab-active' : ''));
    button.type = 'button';
    button.textContent = entry[1];
    button.addEventListener('click', function () {
      setTab(tab);
    });
    tabButtons[tab] = button;
    tabs.appendChild(button);
  });
  top.appendChild(tabs);

  var collapse = el('button', 'ribbon-collapse', IC.upCaret);
  collapse.type = 'button';
  collapse.setAttribute('aria-label', 'Minimize the Ribbon');
  collapse.addEventListener('click', function () {
    var collapsed = root.classList.toggle('ribbon-collapsed');
    collapse.classList.toggle('ribbon-collapse-open', collapsed);
  });
  top.appendChild(collapse);

  var help = el('button', 'ribbon-help', IC.help);
  help.type = 'button';
  help.setAttribute('aria-label', 'Help');
  top.appendChild(help);
  root.appendChild(top);

  var body = el('div', 'ribbon-body');
  root.appendChild(body);

  function setTab(tab) {
    currentTab = tab;
    if (tab !== 'file') {
      lastRibbonTab = tab;
    }
    Object.keys(tabButtons).forEach(function (key) {
      tabButtons[key].classList.toggle('ribbon-tab-active', key === tab && key !== 'file');
    });
    paint();
  }

  function paint() {
    while (body.firstChild) {
      body.removeChild(body.firstChild);
    }
    // The File tab is Backstage, not another ribbon.
    if (currentTab === 'file') {
      backstage(body, function () { setTab(lastRibbonTab); }, callbacks);
      return;
    }
    groupsForTab(currentTab, {
      getView: callbacks.getView,
      onView: function (view) {
        callbacks.onView(view);
        paint();
      },
      showExtensions: callbacks.showExtensions,
      onToggleExtensions: callbacks.onToggleExtensions,
      onProperties: callbacks.onProperties
    }).forEach(function (group) {
      body.appendChild(group);
    });
  }

  // Explorer starts on the Computer tab: Win10 opens on Computer/This PC, not
  // on the backstage the File tab would show.
  setTab('computer');

  // Context menus change the view too, so they can ask for a repaint.
  root.refresh = paint;

  return root;
}
