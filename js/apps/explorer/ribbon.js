// Explorer ribbon: tabbed command bar with grouped buttons. Only the
// Layout switcher (Tiles/List/Details) and the File-name-extensions toggle
// are wired; everything else is hoverable chrome for now. Icons below are
// minimal line glyphs local to the ribbon.

var IC = {
  save: '<svg viewBox="0 0 20 20"><path d="M4 2h9l3 3v13H4z" fill="none" stroke="#444" stroke-width="1.4"/><rect x="7" y="2" width="6" height="5" fill="#444"/><rect x="6" y="12" width="8" height="5" fill="none" stroke="#444" stroke-width="1.2"/></svg>',
  undo: '<svg viewBox="0 0 20 20"><path d="M8 5L3 9l5 4" fill="none" stroke="#444" stroke-width="1.6"/><path d="M3 9h9a4 4 0 0 1 0 8h-3" fill="none" stroke="#444" stroke-width="1.6"/></svg>',
  filter: '<svg viewBox="0 0 20 20"><path d="M3 3h14l-6 7v6l-2 1v-7z" fill="none" stroke="#444" stroke-width="1.4"/></svg>',
  down: '<svg viewBox="0 0 20 20"><path d="M5 8l5 5 5-5" fill="none" stroke="#444" stroke-width="1.6"/></svg>',
  upLine: '<svg viewBox="0 0 20 20"><path d="M10 16V4M5 9l5-5 5 5" fill="none" stroke="#444" stroke-width="1.6"/></svg>',
  help: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="#0078d7"/><text x="10" y="14.5" font-size="11" fill="#fff" text-anchor="middle" font-family="sans-serif">?</text></svg>',
  paneNav: '<svg viewBox="0 0 24 20"><rect x="1" y="1" width="7" height="18" fill="#0078d7"/><rect x="9" y="1" width="14" height="18" fill="none" stroke="#444" stroke-width="1.2"/></svg>',
  panePrev: '<svg viewBox="0 0 24 20"><rect x="1" y="1" width="14" height="18" fill="none" stroke="#444" stroke-width="1.2"/><rect x="16" y="1" width="7" height="18" fill="#0078d7"/></svg>',
  paneDet: '<svg viewBox="0 0 24 20"><rect x="1" y="1" width="22" height="11" fill="none" stroke="#444" stroke-width="1.2"/><rect x="1" y="13" width="22" height="6" fill="#0078d7"/></svg>',
  grid1: '<svg viewBox="0 0 20 20"><rect x="2" y="2" width="7" height="7" fill="none" stroke="#444"/><rect x="11" y="2" width="7" height="7" fill="none" stroke="#444"/><rect x="2" y="11" width="7" height="7" fill="none" stroke="#444"/><rect x="11" y="11" width="7" height="7" fill="none" stroke="#444"/></svg>',
  grid2: '<svg viewBox="0 0 20 20"><rect x="2" y="2" width="5" height="5" fill="none" stroke="#444"/><rect x="8" y="2" width="5" height="5" fill="none" stroke="#444"/><rect x="14" y="2" width="4" height="5" fill="none" stroke="#444"/><rect x="2" y="8" width="5" height="5" fill="none" stroke="#444"/><rect x="8" y="8" width="5" height="5" fill="none" stroke="#444"/><rect x="14" y="8" width="4" height="5" fill="none" stroke="#444"/><rect x="2" y="14" width="5" height="4" fill="none" stroke="#444"/><rect x="8" y="14" width="5" height="4" fill="none" stroke="#444"/><rect x="14" y="14" width="4" height="4" fill="none" stroke="#444"/></svg>',
  list: '<svg viewBox="0 0 20 20"><path d="M6 4h12M6 8h12M6 12h12M6 16h12" stroke="#444" stroke-width="1.4"/><circle cx="3" cy="4" r="1.2" fill="#444"/><circle cx="3" cy="8" r="1.2" fill="#444"/><circle cx="3" cy="12" r="1.2" fill="#444"/><circle cx="3" cy="16" r="1.2" fill="#444"/></svg>',
  details: '<svg viewBox="0 0 20 20"><rect x="2" y="2" width="16" height="4" fill="none" stroke="#444"/><path d="M2 8h16M2 11h16M2 14h16M2 17h16" stroke="#444" stroke-width="1.2"/></svg>',
  tiles: '<svg viewBox="0 0 20 20"><rect x="2" y="2" width="7" height="7" fill="#0078d7"/><path d="M11 4h7M11 7h7M11 12h7M11 15h7" stroke="#444" stroke-width="1.2"/></svg>',
  content: '<svg viewBox="0 0 20 20"><rect x="2" y="2" width="5" height="16" fill="none" stroke="#444"/><path d="M9 5h9M9 9h9M9 13h9" stroke="#444" stroke-width="1.2"/></svg>',
  sort: '<svg viewBox="0 0 20 20"><path d="M6 3v10M3 10l3 3 3-3" fill="none" stroke="#444" stroke-width="1.4"/><path d="M11 6h7M11 10h7M11 14h5" stroke="#444" stroke-width="1.4"/></svg>',
  group: '<svg viewBox="0 0 20 20"><rect x="3" y="2" width="14" height="4" fill="none" stroke="#444"/><rect x="3" y="8" width="14" height="4" fill="none" stroke="#444"/><rect x="3" y="14" width="14" height="4" fill="none" stroke="#444"/></svg>',
  columns: '<svg viewBox="0 0 20 20"><path d="M7 2v16M13 2v16" stroke="#444" stroke-width="1.4"/></svg>',
  eye: '<svg viewBox="0 0 20 20"><path d="M1 10s3-5 9-5 9 5 9 5-3 5-9 5-9-5-9-5z" fill="none" stroke="#444" stroke-width="1.4"/><circle cx="10" cy="10" r="2" fill="#444"/></svg>',
  gear: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="3" fill="none" stroke="#444" stroke-width="1.4"/><path d="M10 1v3M10 16v3M1 10h3M16 10h3M3.6 3.6l2.1 2.1M14.3 14.3l2.1 2.1M16.4 3.6l-2.1 2.1M5.7 14.3l-2.1 2.1" stroke="#444" stroke-width="1.4"/></svg>',
  props: '<svg viewBox="0 0 20 20"><rect x="4" y="2" width="12" height="16" fill="none" stroke="#444" stroke-width="1.4"/><path d="M7 6h6M7 9h6M7 12h4" stroke="#444" stroke-width="1.2"/><circle cx="14" cy="14" r="4" fill="#0078d7"/><path d="M14 12v2l1.5 1.5" stroke="#fff" stroke-width="1.2" fill="none"/></svg>'
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

function ribbonButton(icon, label, opts) {
  const options = opts || {};
  const button = el('button', 'ribbon-btn' + (options.active ? ' ribbon-active' : ''));
  button.type = 'button';
  const art = el('span', 'ribbon-art', icon);
  const text = el('span', 'ribbon-label');
  text.textContent = label;
  button.appendChild(art);
  button.appendChild(text);
  if (options.onClick) {
    button.addEventListener('click', options.onClick);
  }
  return button;
}

function ribbonCheck(label, checked, onChange) {
  const wrap = el('label', 'ribbon-check');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = !!checked;
  box.addEventListener('change', function () {
    onChange(box.checked);
  });
  const text = el('span');
  text.textContent = label;
  wrap.appendChild(box);
  wrap.appendChild(text);
  return wrap;
}

function ribbonGroup(title, children) {
  const group = el('div', 'ribbon-group');
  const items = el('div', 'ribbon-items');
  children.forEach(function (child) {
    items.appendChild(child);
  });
  const caption = el('div', 'ribbon-caption');
  caption.textContent = title;
  group.appendChild(items);
  group.appendChild(caption);
  return group;
}

function layoutGroup(callbacks) {
  const view = callbacks.getView();
  return ribbonGroup('Layout', [
    ribbonButton(IC.grid1, 'Extra large icons'),
    ribbonButton(IC.grid1, 'Large icons'),
    ribbonButton(IC.grid2, 'Medium icons'),
    ribbonButton(IC.grid2, 'Small icons'),
    ribbonButton(IC.list, 'List', { active: view === 'list', onClick: function () { callbacks.onView('list'); } }),
    ribbonButton(IC.details, 'Details', { active: view === 'details', onClick: function () { callbacks.onView('details'); } }),
    ribbonButton(IC.tiles, 'Tiles', { active: view === 'tiles', onClick: function () { callbacks.onView('tiles'); } }),
    ribbonButton(IC.content, 'Content')
  ]);
}

function showHideGroup(callbacks) {
  return ribbonGroup('Show/hide', [
    ribbonCheck('Item check boxes', false, function () {}),
    ribbonCheck('File name extensions', callbacks.showExtensions(), function (on) { callbacks.onToggleExtensions(on); }),
    ribbonCheck('Hidden items', false, function () {}),
    ribbonButton(IC.eye, 'Hide selected items')
  ]);
}

function groupsForTab(tab, callbacks) {
  if (tab === 'computer') {
    return [
      ribbonGroup('Location', [
        ribbonButton(IC.props, 'Properties'),
        ribbonButton(IC.gear, 'Open Settings')
      ]),
      ribbonGroup('System', [
        ribbonButton(IC.props, 'System properties'),
        ribbonButton(IC.gear, 'Manage')
      ])
    ];
  }
  if (tab === 'view') {
    return [
      ribbonGroup('Panes', [
        ribbonButton(IC.paneNav, 'Navigation pane'),
        ribbonButton(IC.panePrev, 'Preview pane'),
        ribbonButton(IC.paneDet, 'Details pane')
      ]),
      layoutGroup(callbacks),
      showHideGroup(callbacks)
    ];
  }
  return [
    ribbonGroup('Panes', [
      ribbonButton(IC.paneNav, 'Navigation pane'),
      ribbonButton(IC.panePrev, 'Preview pane'),
      ribbonButton(IC.paneDet, 'Details pane')
    ]),
    layoutGroup(callbacks),
    ribbonGroup('Current view', [
      ribbonButton(IC.sort, 'Sort by'),
      ribbonButton(IC.group, 'Group by'),
      ribbonButton(IC.columns, 'Add columns')
    ]),
    showHideGroup(callbacks),
    ribbonGroup('Options', [
      ribbonButton(IC.gear, 'Options')
    ])
  ];
}

export function buildRibbon(callbacks) {
  var currentTab = 'file';

  var root = el('div', 'exp-ribbon');

  var top = el('div', 'ribbon-top');
  var qat = el('div', 'ribbon-qat');
  [IC.save, IC.undo, IC.filter, IC.down].forEach(function (icon) {
    var button = el('button', 'ribbon-qat-btn', icon);
    button.type = 'button';
    qat.appendChild(button);
  });
  top.appendChild(qat);

  var tabs = el('div', 'ribbon-tabs');
  var tabButtons = {};
  ['file', 'computer', 'view'].forEach(function (tab) {
    var button = el('button', 'ribbon-tab' + (tab === currentTab ? ' ribbon-tab-active' : ''));
    button.type = 'button';
    button.textContent = tab === 'file' ? 'File' : tab === 'computer' ? 'Computer' : 'View';
    button.addEventListener('click', function () {
      currentTab = tab;
      Object.keys(tabButtons).forEach(function (key) {
        tabButtons[key].classList.toggle('ribbon-tab-active', key === tab);
      });
      paintGroups();
    });
    tabButtons[tab] = button;
    tabs.appendChild(button);
  });
  top.appendChild(tabs);

  var help = el('button', 'ribbon-help', IC.help);
  help.type = 'button';
  help.setAttribute('aria-label', 'Help');
  var collapse = el('button', 'ribbon-collapse');
  collapse.type = 'button';
  collapse.textContent = '^';
  collapse.setAttribute('aria-label', 'Minimize the Ribbon');
  collapse.addEventListener('click', function () {
    root.classList.toggle('ribbon-collapsed');
    collapse.classList.toggle('ribbon-collapse-open');
  });
  top.appendChild(collapse);
  top.appendChild(help);
  root.appendChild(top);

  var body = el('div', 'ribbon-body');
  root.appendChild(body);

  function paintGroups() {
    while (body.firstChild) {
      body.removeChild(body.firstChild);
    }
    groupsForTab(currentTab, {
      getView: callbacks.getView,
      onView: function (view) {
        callbacks.onView(view);
        paintGroups();
      },
      showExtensions: callbacks.showExtensions,
      onToggleExtensions: callbacks.onToggleExtensions
    }).forEach(function (group) {
      body.appendChild(group);
    });
  }
  paintGroups();
  // Context menus change the view too, so they can ask for a repaint.
  root.refresh = paintGroups;

  return root;
}
