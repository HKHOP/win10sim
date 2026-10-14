// The file dialog API: how an app asks the shell where a file goes (Save As) or
// which one to read (Open).
//
// An app does not draw a file dialog. It describes the one it wants and the
// shell builds it, and the promise answers with what the dialog settled on - or
// with null, which is the same distinction Windows draws between dismissing a
// dialog and answering it:
//
//     var answer = await showSaveAsDialog(context, {
//       title: 'Save As',
//       suggestedName: doc.path ? leafOf(doc.path) : 'Untitled.txt',
//       directory: currentDir(),
//       types: [
//         { label: 'Text Documents (*.txt)', extension: 'txt' },
//         { label: 'All Files (*.*)', extension: '' }
//       ],
//       onSave: function (result) {
//         return volume.writeFile(result.path, editor.value).then(null, false);
//       }
//     });
//     if (answer) { /* answer.path is where the bytes went */ }
//
// What the answer carries:
//   path        the whole path, drive letter included
//   directory   the folder it is in (the last crumb navigated to)
//   name        the name typed - with the extension appended when the chosen
//               type says there is one and the typist left it off, which is what
//               the Save as type row is for
//   type        the { label, extension } entry that was chosen
//   encoding    whatever the Encoding row answered, or undefined when the app
//               declared none
//
// `onSave` is the one hook, and it is the reason this is an API rather than a
// window: an app may write with a volume it was given, refuse a name it does
// not accept, or fail. It returns true (or nothing) to let the dialog close,
// false or a rejected promise to keep it open and let the app say why through
// setError. The dialog never writes a byte of its own, and never opens a file
// either - both are the app's to do, with the volume it was granted.
//
// Everything above the bottom row is shared with Open, which is the same
// browser with a different question under it: see browser.js.

import { CHEVRON_DOWN, CHEVRON_RIGHT } from '../../global/mdl2.js';
import { createTextField } from '../../core/textfield.js';
import { VOLUME_ROOT, leafOf, knownFolderPath } from './places.js';
import { createBrowser } from './browser.js';

// The characters Windows refuses in a name. Windows itself names them all, so
// they are named the same way here.
var INVALID_NAME = /[\\/:*?"<>|]/;

// The one folder a dialog opens on when the app named none: the account's
// Documents, which is where Windows itself puts a saved document.
var DEFAULT_DIRECTORY = knownFolderPath('Documents');

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

// A relative folder under a base one: nothing when the relative part is empty,
// which is the case for a bare drive letter.
function joinPath(base, relative) {
  var head = String(base || '').replace(/\\+$/, '');
  var tail = String(relative || '').replace(/^\\+/, '').replace(/\\+$/, '');
  return tail ? head + '\\' + tail : head;
}

// A dropdown, drawn the way the shell's own popup draws one: a native select
// under a chevron, because a select is the control that already behaves the way
// Windows' combo box does.
function dropdown(field, onChange) {
  var select = document.createElement('select');
  select.className = 'sa-input sa-select';
  field.options.forEach(function (option) {
    var item = document.createElement('option');
    item.value = String(option.value != null ? option.value : option.label);
    item.textContent = option.label;
    select.appendChild(item);
  });
  select.value = String(field.value != null ? field.value : select.options[0].value);
  var wrap = el('span', 'sa-select-wrap');
  wrap.appendChild(select);
  var chevron = el('span', 'sa-select-chevron');
  chevron.innerHTML = CHEVRON_DOWN;
  wrap.appendChild(chevron);
  select.addEventListener('change', function () {
    if (onChange) {
      onChange(select.value);
    }
  });
  return { wrap: wrap, select: select };
}

// The dialog both questions are built from. `mode` is 'save' or 'open', and it
// is the only thing that makes them different: the labels, whether the name gets
// the chosen type's extension, and whether replacing is asked about.
//
// context is the object an app's launch() is handed (createWindow, popup,
// getVolume); the dialog is owned by the window the app names, so an app's own
// window cannot come up over the dialog it is waiting on.
function showFileDialog(context, spec, mode) {
  var options = spec || {};

  var types = (options.types && options.types.length)
    ? options.types
    : [{ label: 'All Files (*.*)', extension: '' }];
  var typeIndex = Math.max(0, Math.min(types.length - 1, options.typeIndex || 0));
  var startType = types[typeIndex];

  var state = {
    directory: options.directory || DEFAULT_DIRECTORY,
    name: options.suggestedName || 'Untitled',
    type: startType,
    encoding: options.encoding ? options.encoding.value : undefined,
    closed: false
  };

  // The volume this dialog reads and asks about. An app hands over its own
  // through the spec when it has one already (Notepad caches the one it was
  // given); otherwise the context's is used, which is the one it was granted.
  var getVolume = options.getVolume ||
    (context.getVolume ? function () { return context.getVolume(); } : null);

  // Declared here because onPick, which runs long before the rows below are
  // built, is where a chosen name and its type land.
  var nameField;
  var typeRow;

  var saving = mode === 'save';
  var defaultTitle = saving ? 'Save As' : 'Open';
  var primaryLabel = saving ? (options.saveLabel || 'Save') : (options.saveLabel || 'Open');
  // What the type row is called: the same dropdown answers a different question
  // depending on which way the file is going.
  var typeRowLabel = saving ? 'Save as type:' : 'Files of type:';
  // Saving appends the chosen type's extension, because the row says what the
  // file will be. Opening does not: the name in the box is the file to find,
  // and inventing an extension for it would look for the wrong one.
  var appendExtension = saving;

  var win = context.createWindow({
    title: options.title || defaultTitle,
    icon: options.icon || '',
    width: 700,
    height: 500,
    // A dialog is a dialog: Win10's Save As has a close button and nothing else,
    // and no resize grips.
    chrome: 'popup',
    minimizable: false,
    ownerId: options.owner
  });

  var root = el('div', 'sa-dialog');
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', options.title || defaultTitle);
  win.body.appendChild(root);

  // ---- the browser ----
  var browser = createBrowser({
    volume: null,
    startPath: state.directory,
    view: options.view,
    onNavigate: function (path) {
      state.directory = path;
    },
    onPick: function (entry) {
      if (entry.type !== 'dir') {
        // Choosing a file puts its name in the box, and with it the type that
        // name implies - which is what clicking a .png in the list does to the
        // Save as type row in Windows.
        nameField.value = entry.name;
        state.name = entry.name;
        var ext = entry.name.indexOf('.') >= 0
          ? entry.name.slice(entry.name.lastIndexOf('.') + 1).toLowerCase()
          : '';
        var match = types.filter(function (type) {
          return type.extension === ext;
        })[0];
        if (match) {
          state.type = match;
          typeRow.select.value = String(match.value != null ? match.value : match.label);
        }
        clearError();
      }
    },
    onMkdir: function (path) {
      makeFolder(path);
    }
  });
  root.appendChild(browser.el);
  // The volume mounts lazily, so the browser is on screen before it exists and
  // is handed it once it does. A dialog that waited would sit blank.
  if (getVolume) {
    getVolume().then(function (volume) {
      browser.setVolume(volume);
    }, function () {});
  }

  // ---- the bottom of the dialog ----

  var foot = el('div', 'sa-foot');

  // Win10's "Hide Folders": it puts the folder tree and the toolbar away, and
  // the file list takes the width they were using - the point of the button is
  // a dialog with room to see files in, not a dialog with nothing in it. The
  // label is the one Windows uses whatever the state is, and the chevron says
  // which way pressing it goes.
  var foldersOpen = true;
  var foldersBtn = el('button', 'sa-foot-toggle');
  foldersBtn.type = 'button';
  foldersBtn.innerHTML = CHEVRON_RIGHT;
  foldersBtn.appendChild(el('span', null, 'Hide Folders'));
  foldersBtn.setAttribute('aria-expanded', 'true');
  foldersBtn.addEventListener('click', function () {
    foldersOpen = !foldersOpen;
    root.classList.toggle('sa-no-folders', !foldersOpen);
    foldersBtn.setAttribute('aria-expanded', foldersOpen ? 'true' : 'false');
    foldersBtn.innerHTML = foldersOpen ? CHEVRON_RIGHT : CHEVRON_DOWN;
    foldersBtn.appendChild(el('span', null, 'Hide Folders'));
  });
  foot.appendChild(foldersBtn);

  if (options.encoding) {
    var encWrap = el('label', 'sa-foot-enc');
    encWrap.appendChild(el('span', 'sa-foot-label', options.encoding.label || 'Encoding:'));
    var encRow = dropdown(options.encoding, function (value) {
      state.encoding = value;
    });
    encWrap.appendChild(encRow.wrap);
    foot.appendChild(encWrap);
  }

  root.appendChild(foot);

  var form = el('div', 'sa-form');
  var fields = el('div', 'sa-fields');

  // File name.
  var nameRow = el('div', 'sa-field-row');
  var nameLabel = el('label', 'sa-field-label');
  nameLabel.textContent = 'File name:';
  nameLabel.setAttribute('for', 'sa-name');
  nameField = createTextField({
    className: 'sa-input sa-name-input',
    value: state.name,
    placeholder: 'File name',
    label: 'File name'
  });
  nameField.id = 'sa-name';
  nameRow.appendChild(nameLabel);
  nameRow.appendChild(nameField);
  fields.appendChild(nameRow);

  // Save as type.
  var typeRowEl = el('div', 'sa-field-row');
  var typeLabel = el('label', 'sa-field-label');
  typeLabel.textContent = typeRowLabel;
  typeRowEl.appendChild(typeLabel);
  typeRow = dropdown({
    options: types.map(function (type) {
      return { label: type.label, value: type.label };
    }),
    value: startType.label
  }, function (label) {
    state.type = types.filter(function (type) {
      return type.label === label;
    })[0] || startType;
    clearError();
  });
  typeRowEl.appendChild(typeRow.wrap);
  fields.appendChild(typeRowEl);

  // The reason a refused save is not worth retrying, under the row that refused
  // it. Windows puts it next to the thing that is wrong.
  var error = el('div', 'sa-error');
  error.hidden = true;
  fields.appendChild(error);
  form.appendChild(fields);

  var actions = el('div', 'sa-actions');
  var saveBtn = el('button', 'sa-btn is-primary');
  saveBtn.type = 'button';
  saveBtn.textContent = primaryLabel;
  var cancelBtn = el('button', 'sa-btn');
  cancelBtn.type = 'button';
  cancelBtn.textContent = 'Cancel';
  actions.appendChild(saveBtn);
  actions.appendChild(cancelBtn);
  form.appendChild(actions);
  root.appendChild(form);

  // ---- answering ----

  var resolveResult;
  var result = new Promise(function (resolve) {
    resolveResult = resolve;
  });

  function showError(text) {
    error.textContent = text;
    error.hidden = false;
  }

  function clearError() {
    error.hidden = true;
    error.textContent = '';
  }

  // The name box can hold a whole path, and Windows reads one there as a path:
  // typing "Budget\notes.txt" while looking in Documents means
  // Documents\Budget\notes.txt, not a Budget folder at the root of the drive.
  // These are the arithmetic behind that, and behind typing a folder to walk
  // into.
  function normaliseTyped(typed) {
    return String(typed || '').trim().replace(/\//g, '\\').replace(/\\+$/, '');
  }

  // The whole path the name box points at, with a relative one resolved
  // against the folder being looked at.
  function pathOfTyped(typed) {
    var text = normaliseTyped(typed);
    if (/^[a-zA-Z]:/.test(text)) {
      return text;
    }
    return joinPath(state.directory, text);
  }

  // The folder half of it, which is where a typed name will be written. A bare
  // drive letter is the drive root, not a folder called "C:".
  function folderOfTyped(typed) {
    var whole = pathOfTyped(typed);
    var at = whole.lastIndexOf('\\');
    if (at <= 0) {
      return VOLUME_ROOT;
    }
    var head = whole.slice(0, at);
    return /^[a-zA-Z]:$/.test(head) ? VOLUME_ROOT : head;
  }

  // What the dialog works out for itself, before the app is asked anything:
  // the name typed, made whole with the extension the chosen type says it has.
  function compute() {
    var typed = normaliseTyped(nameField.value);
    var directory = state.directory;
    var name = typed;
    if (typed.indexOf('\\') >= 0) {
      directory = folderOfTyped(typed);
      name = leafOf(pathOfTyped(typed));
    }
    var type = state.type;
    if (appendExtension && name && type && type.extension &&
      !new RegExp('\\.' + type.extension + '$', 'i').test(name) &&
      name.indexOf('.') < 0) {
      name += '.' + type.extension;
    }
    return {
      path: directory.replace(/\\$/, '') + '\\' + name,
      directory: directory,
      name: name,
      type: type,
      extension: type ? type.extension : '',
      encoding: state.encoding
    };
  }

  function validate(answer) {
    if (!answer.name) {
      showError('Please type a file name.');
      nameField.focus();
      return false;
    }
    if (INVALID_NAME.test(answer.name)) {
      showError('A file name can\'t contain any of the following characters:  \\ / : * ? " < > |');
      nameField.focus();
      return false;
    }
    return true;
  }

  function save() {
    var typed = normaliseTyped(nameField.value);
    // A name that is a path to a folder is a place to go, not a file to write:
    // Windows walks into it and leaves the name box for what goes inside. This
    // is the other half of entering a directory - the list needs a double-press,
    // and the name box needs this.
    if (typed.indexOf('\\') >= 0) {
      var walked = pathOfTyped(typed);
      statOf(walked).then(function (info) {
        if (info && info.type === 'dir') {
          state.directory = walked;
          browser.navigate(walked);
          nameField.value = '';
          clearError();
          return;
        }
        saveNow();
      });
      return;
    }
    saveNow();
  }

  function saveNow() {
    var answer = compute();
    if (!validate(answer)) {
      return;
    }
    // Opening a file that is not there is the app's business to report; saving
    // over one that is has to be asked about, the way Windows asks.
    if (!saving || options.confirmOverwrite === false) {
      runSave(answer);
      return;
    }
    exists(answer.path).then(function (already) {
      if (!already) {
        runSave(answer);
        return;
      }
      // Windows asks before it replaces, with the name of the thing it is about
      // to replace. Refusing leaves the dialog open on the same name, which is
      // the whole point of asking.
      context.popup({
        title: 'Confirm Save As',
        icon: options.icon || '',
        glyph: 'warning',
        heading: 'Confirm Save As',
        body: [
          answer.name + ' already exists.',
          'Do you want to replace it?'
        ],
        buttons: [
          { label: 'Yes', primary: true, value: 'yes' },
          { label: 'No', value: 'no' }
        ]
      }).result.then(function (pressed) {
        if (pressed && pressed.button === 'yes') {
          runSave(answer);
        }
      });
    });
  }

  function runSave(answer) {
    saveBtn.disabled = true;
    var outcome = typeof options.onSave === 'function'
      ? options.onSave(answer)
      : (typeof options.onOpen === 'function' ? options.onOpen(answer) : true);
    Promise.resolve(outcome).then(function (ok) {
      saveBtn.disabled = false;
      if (ok === false) {
        // The app refused: the dialog stays up, on the name that was refused,
        // and the app is the one that says why.
        if (options.onError) {
          options.onError(api);
        }
        return;
      }
      finish(answer);
    }, function (err) {
      // A failed write is the same refusal seen from the other side.
      saveBtn.disabled = false;
      showError(String((err && err.message) || err || 'The file could not be saved.'));
    });
  }

  function finish(answer) {
    if (state.closed) {
      return;
    }
    state.closed = true;
    win.close();
    resolveResult(answer);
  }

  function dismiss() {
    if (state.closed) {
      return;
    }
    state.closed = true;
    win.close();
    resolveResult(null);
  }

  // What the volume says about a path, or null when it says nothing - which is
  // the answer for a path that is not there and for a volume that is not
  // mounted. One lookup serves both questions the dialog asks of it.
  function statOf(path) {
    if (!getVolume) {
      return Promise.resolve(null);
    }
    return getVolume().then(function (volume) {
      if (!volume || !volume.available) {
        return null;
      }
      return volume.stat(path).then(function (info) {
        return info;
      }, function () {
        return null;
      });
    }, function () {
      return null;
    });
  }

  function exists(path) {
    return statOf(path).then(function (info) {
      return !!info;
    });
  }

  // New folder is the dialog's own write, and it is the only one: a folder made
  // here is a folder the app was going to let the person make anyway, and
  // without it the button is decoration. The first one is "New folder", and
  // every one after it counts up, exactly the way Windows does.
  function makeFolder(path) {
    if (!getVolume) {
      return;
    }
    getVolume().then(function (volume) {
      if (!volume || !volume.available) {
        return;
      }
      volume.listDir(path).then(function (entries) {
        var taken = {};
        entries.forEach(function (entry) {
          taken[entry.name.toLowerCase()] = true;
        });
        var name = 'New folder';
        var n = 2;
        while (taken[name.toLowerCase()]) {
          name = 'New folder (' + n + ')';
          n += 1;
        }
        volume.makeDir(path.replace(/\\$/, '') + '\\' + name).then(function () {
          browser.refresh();
        }, function () {});
      }, function () {});
    }, function () {});
  }

  saveBtn.addEventListener('click', save);
  cancelBtn.addEventListener('click', dismiss);

  // Enter in the name box saves; Escape cancels. Both are consumed here so the
  // window's own shortcuts never fire a second time behind the dialog.
  nameField.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      save();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      dismiss();
    }
  });
  win.body.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      dismiss();
      return;
    }
    if (event.key === 'Enter' && event.target !== nameField) {
      event.preventDefault();
      event.stopPropagation();
      save();
    }
  });

  // Closing by the caption button is a dismissal, not an answer.
  var originalClose = win.close;
  win.close = function () {
    if (!state.closed) {
      state.closed = true;
      resolveResult(null);
    }
    originalClose.call(win);
  };

  var api = {
    window: win,
    // What the dialog would answer right now.
    values: compute,
    setDirectory: function (path) {
      state.directory = path;
      browser.navigate(path);
    },
    setName: function (name) {
      nameField.value = name;
      state.name = name;
    },
    setType: function (label) {
      typeRow.select.value = label;
      state.type = types.filter(function (type) {
        return type.label === label;
      })[0] || startType;
    },
    // The reason a refused save is not worth retrying, put under the fields.
    setError: showError,
    save: save,
    close: dismiss,
    isOpen: function () { return !state.closed; },
    result: result
  };

  nameField.focus();
  nameField.select();

  return api;
}

// Save As: where does the file go. The app keeps the writing to itself.
export function showSaveAsDialog(context, spec) {
  return showFileDialog(context, spec, 'save');
}

// Open: which file to read. The same dialog, with the question under it turned
// the other way round, which is the only difference Win10 draws between the two.
export function showOpenDialog(context, spec) {
  return showFileDialog(context, spec, 'open');
}
