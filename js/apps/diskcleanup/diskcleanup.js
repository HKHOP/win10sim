import { DISK_CLEANUP_SRC } from '../../global/constants.js';
import { CATEGORIES, formatBytes } from './categories.js';

// Disk Cleanup (cleanmgr): the account's own junk is measured and really
// deleted, and everything Windows owns is measured the way the real tool
// measures it and reported only. categories.js says which is which.
//
// The order of what happens matches the real dialog: it opens straight away,
// the "calculating" progress dialog goes up over it while the folders are
// walked, and the sizes land in the list when that finishes.

var WINDOW_W = 434;
var WINDOW_H = 430;
// A fabricated category has no folders to walk, so there is no work for the
// progress bar to measure. It is left up long enough to be read instead of
// appearing and vanishing in the same frame.
var STEP_MS = 240;

// Categories that have been cleaned this session, so a fabricated one does not
// come back the moment the dialog is reopened. Windows' own copies of these
// files really do come back - they are written again by the next update, the
// next scan, the next upgrade - which is what happens on the next page load.
var reclaimed = {};

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

function sleep(ms) {
  return new Promise(function (resolve) {
    window.setTimeout(resolve, ms);
  });
}

// Every byte below one path, so a category's figure is what the folder really
// holds rather than what one file in it holds.
async function treeBytes(volume, path, depth) {
  if (depth > 12) {
    return 0;
  }
  var info = null;
  try {
    info = await volume.stat(path);
  } catch (err) {
    return 0;
  }
  if (!info || info.type !== 'dir') {
    return Number(info && info.size) || 0;
  }
  var listed = [];
  try {
    listed = await volume.listDir(path);
  } catch (err) {
    return 0;
  }
  var total = 0;
  for (var i = 0; i < listed.length; i++) {
    total += await treeBytes(volume, path + '\\' + listed[i].name, depth + 1);
  }
  return total;
}

// The "calculating" and "cleaning up" dialog. Both are the same shape - a line
// of words and a bar that fills - and both can be called off, which is what
// Cancel does: the run in progress reads cancelled() between steps.
function beginProgress(context, heading) {
  var handle = context.popup({
    title: 'Disk Cleanup',
    heading: heading,
    fields: [{ type: 'progress', name: 'progress', value: 0 }],
    buttons: [{ label: 'Cancel', value: 'cancel', cancel: true }]
  });
  var run = { cancelled: false, done: false };
  handle.result.then(function () {
    if (!run.done) {
      run.cancelled = true;
    }
  });
  return {
    cancelled: function () {
      return run.cancelled;
    },
    set: function (percent) {
      handle.setValue('progress', percent);
    },
    finish: function () {
      run.done = true;
      handle.close();
    }
  };
}

export function openDiskCleanup(context) {
  var win = context.createWindow({
    title: 'Disk Cleanup for (C:)',
    width: WINDOW_W,
    height: WINDOW_H,
    icon: DISK_CLEANUP_SRC,
    // A Win32 dialog, not a document window: no maximise button and no resize
    // grips, which is the chrome the shell already draws for `popup`.
    chrome: 'popup'
  });

  var volume = null;
  var items = [];
  var rows = [];
  var includeSystem = false;
  var busy = true;

  var root = el('div', 'dc-root');
  root.appendChild(el('p', 'dc-intro',
    'You can use Disk Cleanup to reduce the number of unnecessary files on your drive ' +
    'to free up disk space and help your computer run faster. It removes temporary ' +
    'files, empties the Recycle Bin, and removes a variety of system files and other ' +
    'items that you no longer need.'));

  var listEl = el('div', 'dc-list');
  listEl.setAttribute('role', 'group');
  listEl.setAttribute('aria-label', 'Files to delete');
  root.appendChild(listEl);

  // Windows puts the description of whatever is highlighted under the list.
  var descEl = el('div', 'dc-desc');
  root.appendChild(descEl);

  var totalRow = el('div', 'dc-total');
  totalRow.appendChild(el('span', 'dc-total-label', 'Total amount of disk space you gain:'));
  var totalValue = el('span', 'dc-total-value', '0 bytes');
  totalRow.appendChild(totalValue);
  root.appendChild(totalRow);

  var actions = el('div', 'dc-actions');
  var systemBtn = el('button', 'dc-btn dc-system', 'Clean up system files');
  systemBtn.type = 'button';
  var spacer = el('span', 'dc-spacer');
  var okBtn = el('button', 'dc-btn dc-ok dc-primary', 'OK');
  okBtn.type = 'button';
  var cancelBtn = el('button', 'dc-btn dc-cancel', 'Cancel');
  cancelBtn.type = 'button';
  actions.appendChild(systemBtn);
  actions.appendChild(spacer);
  actions.appendChild(okBtn);
  actions.appendChild(cancelBtn);
  root.appendChild(actions);

  win.body.appendChild(root);

  function chosen() {
    return items.filter(function (item) {
      return item.checked && item.size > 0;
    });
  }

  function updateTotal() {
    var total = chosen().reduce(function (sum, item) {
      return sum + item.size;
    }, 0);
    totalValue.textContent = formatBytes(total);
    okBtn.disabled = busy || total === 0;
  }

  function selectRow(index) {
    rows.forEach(function (row, at) {
      row.el.classList.toggle('is-selected', at === index);
    });
    descEl.textContent = rows[index] ? rows[index].item.def.description : '';
  }

  function paint() {
    listEl.textContent = '';
    rows = [];
    items.forEach(function (item, index) {
      var row = el('label', 'dc-row');
      var check = document.createElement('input');
      check.type = 'checkbox';
      check.className = 'dc-check';
      check.checked = item.checked;
      check.disabled = item.size === 0 && !item.def.paths;
      check.addEventListener('change', function () {
        item.checked = check.checked;
        item.touched = true;
        updateTotal();
      });
      row.appendChild(check);
      row.appendChild(el('span', 'dc-name', item.def.name));
      row.appendChild(el('span', 'dc-size', formatBytes(item.size)));
      row.addEventListener('click', function () {
        selectRow(index);
      });
      // A checkbox toggled from the keyboard still has to move the highlight,
      // which is where the description follows from.
      check.addEventListener('focus', function () {
        selectRow(index);
      });
      listEl.appendChild(row);
      rows.push({ el: row, item: item, check: check });
    });
    selectRow(0);
    updateTotal();
  }

  // Walk every folder a category names, in the order the categories are
  // declared. One path at a time, because the drive's layer above the disk is
  // not something to hammer with parallel reads.
  function measure(def) {
    if (!def.paths) {
      var held = reclaimed[def.id] ? 0 : (def.fake || 0);
      return sleep(STEP_MS).then(function () {
        return { def: def, size: held, entries: [] };
      });
    }
    if (!volume || !volume.available) {
      return Promise.resolve({ def: def, size: 0, entries: [] });
    }
    var entries = [];
    var paths = def.paths.slice();
    var at = 0;
    function nextPath() {
      if (at >= paths.length) {
        return Promise.resolve({
          def: def,
          size: entries.reduce(function (sum, entry) { return sum + entry.bytes; }, 0),
          entries: entries
        });
      }
      var parent = paths[at++];
      return volume.listDir(parent).catch(function () {
        // A folder that is not on this drive is a folder with nothing in it.
        return [];
      }).then(function (listed) {
        var index = 0;
        function nextChild() {
          if (index >= listed.length) {
            return nextPath();
          }
          var child = parent + '\\' + listed[index++].name;
          return treeBytes(volume, child, 0).then(function (bytes) {
            entries.push({ path: child, bytes: bytes });
            return nextChild();
          });
        }
        return nextChild();
      });
    }
    return nextPath();
  }

  function scan(withProgress) {
    var defs = CATEGORIES.filter(function (def) {
      return !def.system || includeSystem;
    });
    var progress = withProgress
      ? beginProgress(context,
        'Disk Cleanup is calculating how much space you will be able to free on (C:).')
      : null;
    var found = [];
    var at = 0;
    busy = true;
    updateTotal();
    function next() {
      if (at >= defs.length || (progress && progress.cancelled())) {
        return Promise.resolve();
      }
      var def = defs[at];
      return measure(def).then(function (item) {
        // A category is offered ticked when Windows offers it ticked, and left
        // alone once the person has said for themselves.
        if (!item.touched) {
          item.checked = def.defaultOn !== false && item.size > 0;
        }
        found.push(item);
        at++;
        if (progress) {
          progress.set(Math.round((at / defs.length) * 100));
        }
        return next();
      });
    }
    return next().then(function () {
      if (progress) {
        progress.finish();
      }
      items = found;
      busy = false;
      paint();
    });
  }

  function cleanItem(item) {
    if (!item.def.removable) {
      // Windows' own: the figure is all there is to hand back.
      reclaimed[item.def.id] = true;
      return Promise.resolve(item.size);
    }
    var freed = 0;
    var at = 0;
    function next() {
      if (at >= item.entries.length) {
        return Promise.resolve(freed);
      }
      var entry = item.entries[at++];
      return volume.remove(entry.path, true).then(function () {
        freed += entry.bytes;
        return next();
      }, function () {
        // Windows refuses to give up its own files even when a category names
        // them; the rest of the folder still goes.
        return next();
      });
    }
    return next();
  }

  function clean() {
    var picked = chosen();
    if (!picked.length) {
      return;
    }
    var progress = beginProgress(context,
      'Disk Cleanup is cleaning up unnecessary files on your computer.');
    busy = true;
    updateTotal();
    var at = 0;
    function next() {
      if (at >= picked.length || progress.cancelled()) {
        return Promise.resolve();
      }
      return cleanItem(picked[at++]).then(function () {
        progress.set(Math.round((at / picked.length) * 100));
        return next();
      });
    }
    next().then(function () {
      progress.finish();
      // Whatever the call left behind is what the list should now say, so it is
      // measured again rather than assumed.
      return scan(true);
    });
  }

  okBtn.addEventListener('click', function () {
    if (!busy) {
      clean();
    }
  });
  cancelBtn.addEventListener('click', function () {
    win.close();
  });
  systemBtn.addEventListener('click', function () {
    if (busy) {
      return;
    }
    includeSystem = true;
    systemBtn.disabled = true;
    systemBtn.hidden = true;
    scan(true);
  });

  // The dialog answers Enter and Escape itself so the shell's own shortcuts
  // never fire a second time behind it. The listener sits at the document
  // because a dialog with nothing focused inside it - which is what it is until
  // the first press - would otherwise send the key straight past both buttons.
  function onDocKey(event) {
    if (!document.contains(root)) {
      document.removeEventListener('keydown', onDocKey);
      return;
    }
    // A dialog that does not have the focus, or has a progress dialog of its own
    // up in front of it, is not the one being answered.
    if (!root.closest('.win-focused') || busy) {
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      win.close();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      clean();
    }
  }
  document.addEventListener('keydown', onDocKey);

  // Until the drive answers, there is nothing to show but the shape of the
  // dialog - which is what Windows shows too.
  okBtn.disabled = true;
  context.getVolume().then(function (vol) {
    volume = vol;
    return scan(false);
  }, function () {
    volume = null;
    return scan(false);
  });

  return win;
}
