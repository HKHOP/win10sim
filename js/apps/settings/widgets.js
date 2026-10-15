// The Settings widgets that draw a *list* rather than a single control.
//
// These are the pages where the rows come from the machine instead of from the
// declaration: what is installed, what starts at sign-in, which app may use the
// camera, how full the disk is. Asking the shell is the only way to get an
// honest answer - a hand-written list of installed programs would be a second,
// wrong answer to a question the app registry already knows how to answer.
//
// A list of switches stores one key per entry, built from the item's keyPrefix.
// Forty camera permissions are forty settings, not one object that grows, which
// is what lets a single one be reset and what lets "Find a setting" find it.

// The Apps & features, Start-up and volume-mixer lists all build real range
// inputs, so they all need the drag helper rather than only the value controls.
import { attachSlider } from './sliderdrag.js';

function el(tag, className, text) {
  var node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text != null) {
    node.textContent = text;
  }
  return node;
}

// A row with an icon, a name, a second line and room at the right for controls.
function appRow(app, options) {
  var row = el('div', 'set-app');
  var art = el('div', 'set-app-art');
  if (app.icon) {
    var img = document.createElement('img');
    img.src = app.icon;
    img.alt = '';
    art.appendChild(img);
  }
  var body = el('div', 'set-app-body');
  var name = el('div', 'set-app-name', app.name || app.id);
  body.appendChild(name);
  if (app.subtitle) {
    body.appendChild(el('div', 'set-app-sub', app.subtitle));
  }
  row.appendChild(art);
  row.appendChild(body);
  if (options && options.right) {
    row.appendChild(options.right);
  }
  return row;
}

function smallButton(label, onPress) {
  var button = el('button', 'set-small-button', label);
  button.type = 'button';
  button.addEventListener('click', onPress);
  return button;
}

function switchNode(on, label, onToggle) {
  var button = el('button', 'set-switch set-switch--compact');
  button.type = 'button';
  button.setAttribute('role', 'switch');
  button.setAttribute('aria-label', label);
  var track = el('span', 'set-switch-track');
  track.innerHTML = '<span class="set-switch-knob"></span>';
  var state = el('span', 'set-switch-state', on ? 'On' : 'Off');
  button.appendChild(track);
  button.appendChild(state);
  button.addEventListener('click', onToggle);
  button.setAttribute('aria-checked', on ? 'true' : 'false');
  return button;
}

// Apps & features: what is installed, with the three things you can do to it.
// The sizes are the ones Windows reports for its own bundled programs; nothing
// here is measured, because nothing is really installed.
var APP_SIZES = {
  edge: '4.62 MB',
  explorer: '21.4 MB',
  notepad: '256 KB',
  store: '1.02 MB',
  settings: '18.9 MB'
};

export function appsList(item, ops) {
  var elBox = el('div', 'set-list');
  var search = ops.filterFor('appsFeatures');
  function paint() {
    elBox.textContent = '';
    var apps = ops.apps();
    apps.filter(function (app) { return !app.hidden; })
      .filter(function (app) {
        return !search.query || app.name.toLowerCase().indexOf(search.query) >= 0;
      })
      .sort(function (a, b) {
        if (search.sort === 'size') {
          return (APP_SIZES[b.id] || '').localeCompare(APP_SIZES[a.id] || '');
        }
        return a.name.localeCompare(b.name);
      })
      .forEach(function (app) {
        var right = el('div', 'set-app-right');
        right.appendChild(smallButton('Uninstall', function () {
          ops.run('apps.uninstall', app.id);
        }));
        var manifest = ops.manifest(app.id);
        elBox.appendChild(appRow({
          id: app.id,
          name: app.name,
          icon: app.icon,
          subtitle: (manifest ? manifest.publisher : 'Microsoft Corporation') +
            '   ·   ' + (APP_SIZES[app.id] || '1.20 MB') +
            '   ·   ' + (manifest ? manifest.version : '10.0.19041.1')
        }, { right: right }));
      });
    if (!elBox.childElementCount) {
      elBox.appendChild(el('p', 'set-note', 'No apps match your search.'));
    }
  }
  ops.onFilter('appsFeatures', paint);
  paint();
  return { el: elBox, refresh: paint };
}

// Start-up: what runs when you sign in, with the switch and the impact Windows
// reports beside it.
export function startupList(item, ops) {
  var elBox = el('div', 'set-list');
  function paint() {
    elBox.textContent = '';
    ops.apps().filter(function (app) { return !app.hidden; }).forEach(function (app) {
      var key = item.keyPrefix + '.' + app.id;
      var on = ops.value(key) === true;
      var impact = el('span', 'set-app-impact', on ? (app.id === 'edge' ? 'High impact' : 'No impact') : '');
      var right = el('div', 'set-app-right');
      right.appendChild(impact);
      right.appendChild(switchNode(on, app.name + ' at startup', function () {
        ops.write(key, !ops.value(key));
      }));
      elBox.appendChild(appRow({
        id: app.id,
        name: app.name,
        icon: app.icon,
        subtitle: (ops.manifest(app.id) || {}).publisher || 'Microsoft Corporation'
      }, { right: right }));
    });
  }
  paint();
  return { el: elBox, refresh: paint };
}

// The row above the start-up list: "Sort by: Name", which in Windows opens the
// sort options. It is drawn as the label plus the current answer, and pressing
// it cycles the answer - the list below it follows.
export function startupSort(item, ops) {
  var box = el('div', 'set-sort');
  var label = el('span', 'set-sort-label', 'Sort by:');
  var button = el('button', 'set-sort-button');
  button.type = 'button';
  var current = 'Name';
  function paint() {
    button.textContent = current + '  ' + '▾';
  }
  button.addEventListener('click', function () {
    current = current === 'Name' ? 'Impact' : 'Name';
    paint();
    ops.run('startup.sort', current);
  });
  paint();
  box.appendChild(label);
  box.appendChild(button);
  return { el: box };
}

// The "Add new" and Open Startup folder row Win10 puts under the start-up list.
export function startupBackground(item, ops) {
  var box = el('div', 'set-list set-list--plain');
  box.appendChild(smallButton('Add new', function () { ops.run('startup.addNew'); }));
  var folder = el('div', 'set-folder-row');
  folder.appendChild(el('span', 'set-app-name', 'Open Startup folder'));
  folder.appendChild(el('span', 'set-app-sub', 'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Startup'));
  var go = el('button', 'set-small-button', 'Open');
  go.type = 'button';
  go.addEventListener('click', function () { ops.run('startup.openFolder'); });
  folder.appendChild(go);
  box.appendChild(folder);
  return { el: box };
}

// One switch per app: "choose which apps can use your camera", "which apps send
// you notifications". Where the page names the apps it means, that list is used;
// otherwise it is every app there is, which is what Windows shows for a
// permission nothing has ever asked for.
export function perAppList(item, ops) {
  var elBox = el('div', 'set-list');
  var masterKey = item.keyPrefix.replace(/\.app$/, '');
  function paint() {
    elBox.textContent = '';
    var master = ops.value(masterKey);
    var apps = (item.apps && item.apps.length)
      ? item.apps.map(function (entry) { return { id: entry.appId, name: entry.title }; })
      : ops.apps().filter(function (app) { return !app.hidden; });
    apps.forEach(function (app) {
      var key = item.keyPrefix + '.' + app.id;
      var right = el('div', 'set-app-right');
      right.appendChild(switchNode(ops.value(key) === true && master === true, app.name + ' permission', function () {
        ops.write(key, !ops.value(key));
      }));
      elBox.appendChild(appRow(app, { right: right }));
    });
  }
  paint();
  return { el: elBox, refresh: paint };
}

// The grid of quick actions on System > Notifications & actions: a grid of
// cells, each with its own name, each a switch. Windows lets you drag them
// about; the order here is the order they are stored in.
var QUICK_ACTIONS = [
  'Note', 'New meeting', 'Search', 'Volume', 'Brightness', 'Focus assist',
  'All settings', 'Project', 'VPN', 'Screen snapshot', 'Nearby share', 'Mobile hotspot'
];

export function quickActions(item, ops) {
  var grid = el('div', 'set-quick-grid');
  QUICK_ACTIONS.forEach(function (name) {
    var key = item.keyPrefix + '.' + name.toLowerCase().replace(/[^a-z0-9]+/g, '');
    var cell = el('button', 'set-quick-cell');
    cell.type = 'button';
    cell.setAttribute('role', 'switch');
    cell.appendChild(el('span', 'set-quick-name', name));
    var on = ops.value(key) === true;
    cell.setAttribute('aria-checked', on ? 'true' : 'false');
    cell.setAttribute('aria-label', name + ' quick action');
    cell.classList.toggle('is-on', on);
    cell.addEventListener('click', function () {
      ops.write(key, !ops.value(key));
    });
    grid.appendChild(cell);
  });
  return { el: grid };
}

// The row of apps on the lock screen that may show a quick status. Windows shows
// the first two filled and the rest as empty slots to drag apps into.
export function lockStatusApps(item, ops) {
  var row = el('div', 'set-lock-apps');
  var slots = 8;
  for (var i = 0; i < slots; i++) {
    var key = item.keyPrefix + '.' + i;
    var chosen = ops.value(key);
    var cell = el('button', 'set-lock-slot');
    cell.type = 'button';
    if (chosen) {
      var app = ops.app(chosen);
      cell.classList.add('is-filled');
      cell.appendChild(el('span', 'set-lock-name', app ? app.name : chosen));
      cell.setAttribute('aria-label', (app ? app.name : chosen) + ' shows quick status');
    } else {
      cell.appendChild(el('span', 'set-lock-plus', '+'));
      cell.setAttribute('aria-label', 'Choose an app');
    }
    cell.addEventListener('click', function () {
      ops.run('lockScreen.chooseApp', i);
    });
    row.appendChild(cell);
  }
  return { el: row };
}

// Default apps: what opens each kind of file. This one is real - it reads and
// writes the shell's own file-type table, so an app chosen here is the app a
// double-click uses.
export function defaultApps(item, ops) {
  var box = el('div', 'set-list');
  var rows = ops.defaultAppRows();
  function paint() {
    box.textContent = '';
    rows.forEach(function (rowInfo) {
      var row = el('button', 'set-default-row');
      row.type = 'button';
      var art = el('span', 'set-default-art', rowInfo.icon || '▢');
      row.appendChild(art);
      var body = el('span', 'set-default-body');
      body.appendChild(el('span', 'set-default-kind', rowInfo.kind));
      var app = ops.app(rowInfo.appId);
      body.appendChild(el('span', 'set-default-app', app ? app.name : 'Choose an app'));
      row.appendChild(body);
      row.addEventListener('click', function () {
        ops.run('defaultApps.choose', rowInfo.ext);
      });
      box.appendChild(row);
    });
  }
  paint();
  // Which app each type opens with is answered asynchronously, so the shell is
  // given this list's repaint and calls it when those answers land.
  if (typeof ops.onDefaultAppsPainted === 'function') {
    ops.onDefaultAppsPainted(paint);
  }
  return { el: box, refresh: paint };
}

// A chosen device, the way Sound shows the current output: an icon, the device
// name, and a mark on the one that is in use.
export function deviceRow(item, ops) {
  var row = el('button', 'set-device-row');
  row.type = 'button';
  row.appendChild(el('span', 'set-device-art', '◧'));
  var body = el('span', 'set-device-body');
  body.appendChild(el('span', 'set-device-name', item.label || 'Device'));
  row.appendChild(body);
  var mark = el('span', 'set-device-mark', '✓');
  row.appendChild(mark);
  var sync = function () {
    var on = ops.value(item.key) === 'speakers';
    mark.hidden = !on;
    row.classList.toggle('is-on', on);
  };
  row.addEventListener('click', function () {
    ops.run('sound.chooseOutput');
  });
  sync();
  return { el: row, sync: sync };
}

// The device lists Windows shows as "Your devices" and "Printers & scanners".
var DEVICE_SETS = {
  bluetooth: [
    { name: 'Surface Arc Touch Mouse', kind: 'Mouse and trackpad' },
    { name: 'Surface Headphones', kind: 'Audio / Video' },
    { name: 'Surface Pro 6', kind: 'Computer' }
  ],
  printers: [
    { name: 'Microsoft Print to PDF', kind: 'Ready' },
    { name: 'Microsoft XPS Document Writer', kind: 'Ready' }
  ]
};

export function deviceList(item, ops) {
  var box = el('div', 'set-list');
  (DEVICE_SETS[item.source] || []).forEach(function (device) {
    var row = el('div', 'set-device');
    row.appendChild(el('span', 'set-device-art', '◧'));
    var body = el('span', 'set-device-body');
    body.appendChild(el('span', 'set-device-name', device.name));
    body.appendChild(el('span', 'set-device-sub', device.kind));
    row.appendChild(body);
    var enable = switchNode(true, device.name, function () {
      ops.run('devices.toggle', device.name);
    });
    row.appendChild(enable);
    box.appendChild(row);
  });
  return { el: box };
}

// The app volume mixer: one slider per app, which is what Settings > Sound shows
// under "App volume and device preferences". They are real range inputs and they
// are draggable, through the same helper the value controls use - the emulated
// pointer cannot drive a native one (see sliderdrag.js).
export function appVolumeList(item, ops) {
  var box = el('div', 'set-list');
  var disposers = [];
  ops.apps().filter(function (app) { return !app.hidden; }).forEach(function (app) {
    var row = el('div', 'set-mixer-row');
    row.appendChild(el('span', 'set-mixer-name', app.name));
    var input = document.createElement('input');
    input.type = 'range';
    input.className = 'set-slider set-slider--slim';
    input.min = '0';
    input.max = '100';
    input.step = '1';
    input.setAttribute('aria-label', app.name + ' volume');
    var key = 'sound.app.' + app.id;
    var readout = el('span', 'set-slider-value');
    var slider = attachSlider(input, {
      min: 0,
      max: 100,
      step: 1,
      write: function (value) {
        ops.write(key, value);
      },
      paint: function (value) {
        readout.textContent = String(value);
      }
    });
    slider.sync(ops.value(key));
    disposers.push(slider.dispose);
    row.appendChild(input);
    row.appendChild(readout);
    box.appendChild(row);
  });
  return {
    el: box,
    dispose: function () {
      disposers.forEach(function (fn) { fn(); });
    }
  };
}

// Cameras, with the Configure and Disable pair Windows puts on each.
export function cameraList(item, ops) {
  var box = el('div', 'set-list');
  (item.cameras || []).forEach(function (camera) {
    var on = ops.value(camera.key) !== false;
    var right = el('div', 'set-app-right');
    right.appendChild(smallButton('Configure', function () { ops.run('cameras.configure', camera.name); }));
    var disable = smallButton('Disable', function () {
      ops.write(camera.key, !ops.value(camera.key));
    });
    disable.disabled = on;
    right.appendChild(disable);
    var row = appRow({ name: camera.name, icon: '', subtitle: '' }, { right: right });
    row.classList.add('set-app--wide');
    var mark = el('span', 'set-device-mark', '✓');
    mark.hidden = !on;
    row.insertBefore(mark, row.firstChild);
    box.appendChild(row);
  });
  return { el: box };
}

// Accounts. Every one of these lists is empty on this machine, and an empty list
// is the honest answer rather than an invitation to sign in to nothing.
export function accountList(item, ops) {
  var box = el('div', 'set-list');
  var local = ops.localAccounts();
  if (local.length) {
    local.forEach(function (account) {
      box.appendChild(appRow({ name: account.name, subtitle: account.kind, icon: '' }));
    });
  } else {
    box.appendChild(el('p', 'set-note', {
      local: 'There are no local security or user accounts on this PC.',
      other: 'There are no other accounts on this PC.',
      users: 'There are no user accounts on this PC.',
      email: 'There are no email accounts on this PC.'
    }[item.source] || 'There is nothing here.'));
  }
  return { el: box };
}

// Preferred languages: what is installed, and what is on top.
export function languageList(item, ops) {
  var box = el('div', 'set-list');
  var langs = [
    { name: 'English (United States)', input: 'English (United States) - QWERTY', top: true },
    { name: 'Deutsch (Deutschland)', input: 'Deutsch (Deutschland) - QWERTZ', top: false }
  ];
  langs.forEach(function (lang) {
    var row = el('div', 'set-language');
    var right = el('div', 'set-app-right');
    right.appendChild(el('span', 'set-app-sub', lang.input));
    right.appendChild(el('span', 'set-app-sub', lang.top ? 'Windows display language' : 'Options'));
    row.appendChild(el('span', 'set-language-name', lang.name));
    row.appendChild(right);
    box.appendChild(row);
  });
  return { el: box };
}

// Site permissions: what each website is allowed. There are no sites, because
// nothing has ever browsed anywhere.
export function sitePermissions(item, ops) {
  var box = el('div', 'set-list');
  var sites = ops.sites();
  if (!sites.length) {
    box.appendChild(el('p', 'set-note', 'No site has asked for anything on this PC.'));
    return { el: box };
  }
  sites.forEach(function (site) {
    var row = el('div', 'set-language');
    row.appendChild(el('span', 'set-language-name', site));
    row.appendChild(el('span', 'set-app-sub', 'Settings'));
    box.appendChild(row);
  });
  return { el: box };
}

// Optional features and app execution aliases: a list with Install / Uninstall
// on each, which is the shape Windows uses for both.
export function featureList(item, ops) {
  var box = el('div', 'set-list');
  (item.features || []).forEach(function (feature) {
    var on = ops.value(feature.key) === true;
    var right = el('div', 'set-app-right');
    right.appendChild(smallButton(on ? 'Uninstall' : 'Install', function () {
      ops.write(feature.key, !ops.value(feature.key));
    }));
    var sub = item.alias
      ? (on ? (feature.alias || 'Enabled') : 'Disabled')
      : (on ? (feature.size || '') : '');
    box.appendChild(appRow({
      name: feature.name,
      icon: '',
      subtitle: sub
    }, { right: right }));
  });
  return { el: box };
}

// A Defender protection tile: the icon, what Windows says about it, and a
// Manage link. The state is a setting, so it survives being changed here.
export function protectionRow(item, ops) {
  var row = el('div', 'set-protection');
  row.appendChild(el('span', 'set-protection-art', item.icon === 'people' ? '☺' : '⬟'));
  var body = el('div', 'set-protection-body');
  body.appendChild(el('div', 'set-protection-title', item.label));
  var state = el('div', 'set-protection-state');
  body.appendChild(state);
  var detail = el('div', 'set-protection-detail');
  body.appendChild(detail);
  row.appendChild(body);
  var manage = el('button', 'set-link set-link--small', 'Manage');
  manage.type = 'button';
  manage.addEventListener('click', function () { ops.run('security.manage', item.key); });
  row.appendChild(manage);
  var sync = function () {
    var value = ops.value(item.key);
    state.textContent = value === 'protected' ? item.title : 'Attention needed';
    detail.textContent = value === 'protected' ? item.detail : 'Open Windows Security to see what to do.';
    row.classList.toggle('is-attention', value !== 'protected');
  };
  sync();
  return { el: row, sync: sync };
}

// Protection history: a list that is empty because nothing has been found.
export function protectionHistory(item, ops) {
  var box = el('div', 'set-list');
  var rows = item.rows || [];
  if (!rows.length) {
    box.appendChild(el('p', 'set-empty', item.empty || 'No items'));
    return { el: box };
  }
  rows.forEach(function (rowInfo) {
    box.appendChild(el('div', 'set-language', rowInfo));
  });
  return { el: box };
}

// Data usage: what used the network in the last thirty days.
export function dataUsage(item, ops) {
  var box = el('div', 'set-list');
  var max = (item.rows || []).reduce(function (top, rowInfo) {
    return Math.max(top, rowInfo.bytes);
  }, 0);
  (item.rows || []).forEach(function (rowInfo) {
    var row = el('div', 'set-usage-row');
    row.appendChild(el('span', 'set-mixer-name', rowInfo.name));
    var bar = el('span', 'set-bar');
    var fill = el('span', 'set-bar-fill');
    fill.style.width = (max ? Math.round((rowInfo.bytes / max) * 100) : 0) + '%';
    bar.appendChild(fill);
    row.appendChild(bar);
    row.appendChild(el('span', 'set-slider-value', bytesText(rowInfo.bytes)));
    box.appendChild(row);
  });
  return { el: box };
}

function bytesText(bytes) {
  if (!bytes) {
    return '0 B';
  }
  var units = ['B', 'KB', 'MB', 'GB'];
  var at = 0;
  var value = bytes;
  while (value >= 1024 && at < units.length - 1) {
    value /= 1024;
    at += 1;
  }
  return (value < 10 ? value.toFixed(2) : Math.round(value)) + ' ' + units[at];
}

// The Search this list, Sort by and Filter by row above the installed apps.
export function appsFilter(item, ops) {
  var box = el('div', 'set-filter');
  var field = document.createElement('input');
  field.type = 'search';
  field.className = 'set-filter-field';
  field.placeholder = 'Search this list';
  field.setAttribute('aria-label', 'Search this list');
  field.addEventListener('input', function () {
    ops.setFilter('appsFeatures', { query: field.value.trim().toLowerCase() });
  });
  var sort = el('button', 'set-filter-button', 'Sort by: Name  ▾');
  sort.type = 'button';
  sort.addEventListener('click', function () {
    var next = ops.filterFor('appsFeatures').sort === 'name' ? 'size' : 'name';
    ops.setFilter('appsFeatures', { sort: next });
    sort.textContent = 'Sort by: ' + (next === 'size' ? 'Size' : 'Name') + '  ▾';
  });
  box.appendChild(field);
  box.appendChild(sort);
  return { el: box };
}