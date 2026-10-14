import { FOLDER_SRC, FILE_SRC, NOTEPAD_RECENT_MAX } from '../../global/constants.js';
import { createTextField } from '../../core/textfield.js';

// Notepad's Open and Save As dialogs: the classic Win10 shape with a
// "Look in" path, a file list you navigate by double-clicking folders, a
// File name box, a type filter, and the Open / Save buttons. Both read and
// write the emulated C: volume, so they work with real files.

function splitPath(path) {
  return String(path || '').replace(/\//g, '\\').split('\\').filter(Boolean);
}

function joinPath(segments) {
  return segments.join('\\') || 'C:';
}

function parentPath(path) {
  var segments = splitPath(path);
  segments.pop();
  return joinPath(segments);
}

function baseName(path) {
  var segments = splitPath(path);
  return segments[segments.length - 1] || '';
}

function isTextFile(name) {
  return /\.txt$/i.test(name);
}

// The dialog shell, shared by Open and Save As: everything above the button
// row is identical apart from the button labels and what they do.
function fileDialog(context, opts) {
  var win = context.createWindow({
    title: opts.title,
    width: 560,
    height: 420
  });

  var state = {
    dir: opts.startDir,
    entries: [],
    selected: ''
  };

  var root = document.createElement('div');
  root.className = 'np-dialog np-filedlg';

  var lookRow = document.createElement('div');
  lookRow.className = 'np-filedlg-lookin';
  var lookLabel = document.createElement('label');
  lookLabel.className = 'np-label';
  lookLabel.textContent = 'Look in:';
  var lookInput = createTextField({
    className: 'np-input np-input-grow',
    value: state.dir,
    label: 'Look in'
  });
  lookInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      loadDir(lookInput.value.trim());
    }
  });
  lookRow.appendChild(lookLabel);
  lookRow.appendChild(lookInput);
  root.appendChild(lookRow);

  var upRow = document.createElement('div');
  upRow.className = 'np-filedlg-up';
  var upButton = document.createElement('button');
  upButton.type = 'button';
  upButton.className = 'np-filedlg-upbtn';
  upButton.title = 'Up one level';
  upButton.textContent = '↑';
  upButton.addEventListener('click', function () {
    loadDir(parentPath(state.dir));
  });
  upRow.appendChild(upButton);
  root.appendChild(upRow);

  var list = document.createElement('div');
  list.className = 'np-filedlg-list';
  root.appendChild(list);

  var nameRow = document.createElement('div');
  nameRow.className = 'np-field-row';
  var nameLabel = document.createElement('label');
  nameLabel.className = 'np-label';
  nameLabel.textContent = 'File name:';
  var nameInput = createTextField({
    className: 'np-input np-input-grow',
    value: opts.initialName || '',
    label: 'File name'
  });
  nameRow.appendChild(nameLabel);
  nameRow.appendChild(nameInput);
  root.appendChild(nameRow);

  var typeRow = document.createElement('div');
  typeRow.className = 'np-field-row';
  var typeLabel = document.createElement('label');
  typeLabel.className = 'np-label';
  typeLabel.textContent = opts.typeLabel + ':';
  var typeSelect = document.createElement('select');
  typeSelect.className = 'np-select';
  ['Text Documents (*.txt)', 'All Files (*.*)'].forEach(function (label) {
    var option = document.createElement('option');
    option.value = label;
    option.textContent = label;
    typeSelect.appendChild(option);
  });
  typeSelect.value = opts.typeLabel + ' (*.txt)';
  typeSelect.addEventListener('change', function () {
    renderList();
  });
  typeRow.appendChild(typeLabel);
  typeRow.appendChild(typeSelect);
  root.appendChild(typeRow);

  var buttonRow = document.createElement('div');
  buttonRow.className = 'np-dialog-buttons';
  var accept = document.createElement('button');
  accept.type = 'button';
  accept.className = 'np-dialog-button is-default';
  accept.textContent = opts.acceptLabel;
  var cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'np-dialog-button';
  cancel.textContent = 'Cancel';
  buttonRow.appendChild(accept);
  buttonRow.appendChild(cancel);
  root.appendChild(buttonRow);

  function close() {
    if (win && win.close) {
      win.close();
    }
  }

  function currentPath() {
    var name = nameInput.value.trim();
    if (!name) {
      return '';
    }
    if (name.indexOf('\\') >= 0) {
      return name;
    }
    return state.dir + '\\' + name;
  }

  function accept_() {
    var path = currentPath();
    if (!path) {
      return;
    }
    close();
    opts.onAccept(path);
  }

  accept.addEventListener('click', accept_);
  cancel.addEventListener('click', close);
  nameInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      accept_();
    }
  });
  list.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      openSelected();
    }
  });
  win.body.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  });

  function entryFromNode(node) {
    while (node && node !== list) {
      if (node.dataset && node.dataset.name) {
        return node.dataset;
      }
      node = node.parentNode;
    }
    return null;
  }

  function selectEntry(name) {
    state.selected = name;
    nameInput.value = name;
    var rows = list.querySelectorAll('.np-filedlg-item');
    for (var i = 0; i < rows.length; i++) {
      rows[i].classList.toggle('is-selected', rows[i].dataset.name === name);
    }
  }

  function openSelected() {
    var name = state.selected;
    if (!name) {
      accept_();
      return;
    }
    var entry = state.entries.filter(function (item) { return item.name === name; })[0];
    if (entry && entry.type === 'dir') {
      loadDir(state.dir + '\\' + name);
      return;
    }
    accept_();
  }

  function renderList() {
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }
    var showAll = typeSelect.value.indexOf('All Files') === 0;
    state.entries.filter(function (entry) {
      return showAll || entry.type === 'dir' || isTextFile(entry.name);
    }).forEach(function (entry) {
      var row = document.createElement('div');
      row.className = 'np-filedlg-item';
      row.dataset.name = entry.name;
      row.tabIndex = 0;
      var icon = document.createElement('img');
      icon.className = 'np-filedlg-icon';
      icon.src = entry.type === 'dir' ? FOLDER_SRC : FILE_SRC;
      icon.alt = '';
      icon.draggable = false;
      var label = document.createElement('span');
      label.className = 'np-filedlg-name';
      label.textContent = entry.name;
      row.appendChild(icon);
      row.appendChild(label);
      row.addEventListener('click', function () {
        selectEntry(entry.name);
      });
      row.addEventListener('dblclick', openSelected);
      list.appendChild(row);
    });
    state.selected = '';
  }

  function loadDir(path) {
    var volume = opts.getVolume();
    state.dir = path;
    lookInput.value = path;
    upButton.disabled = splitPath(path).length <= 1;
    volume.then(function (vol) {
      if (!vol || !vol.available) {
        return;
      }
      return vol.listDir(path);
    }).then(function (entries) {
      state.entries = entries || [];
      renderList();
    }).catch(function () {
      // Win10 says the folder could not be found rather than failing
      // silently: the list simply stays empty.
      state.entries = [];
      renderList();
    });
  }

  win.body.appendChild(root);
  loadDir(state.dir);
  nameInput.focus();
  nameInput.select();
  return { window: win, close: close };
}

export function showOpenDialog(context, opts) {
  return fileDialog(context, {
    title: 'Open',
    getVolume: opts.getVolume,
    startDir: opts.startDir,
    initialName: opts.initialName,
    typeLabel: 'Files of type',
    acceptLabel: 'Open',
    onAccept: opts.onAccept
  });
}

export function showSaveAsDialog(context, opts) {
  return fileDialog(context, {
    title: 'Save As',
    getVolume: opts.getVolume,
    startDir: opts.startDir,
    initialName: opts.initialName,
    typeLabel: 'Save as type',
    acceptLabel: 'Save',
    onAccept: opts.onAccept
  });
}

// Notepad's File ▸ Recent documents: the last few paths, most recent first,
// capped the way the real menu is.
export function pushRecent(list, path) {
  var next = [path];
  list.forEach(function (item) {
    if (item !== path && next.length < NOTEPAD_RECENT_MAX) {
      next.push(item);
    }
  });
  return next;
}