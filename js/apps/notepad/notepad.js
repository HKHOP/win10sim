import {
  NOTEPAD_SRC,
  NOTEPAD_DEFAULT_W,
  NOTEPAD_DEFAULT_H,
  NOTEPAD_FONT_PX,
  NOTEPAD_ZOOM_STEPS,
  NOTEPAD_DEFAULT_DIR,
  ACCOUNT_NAME
} from '../../global/constants.js';
import { buildMenuBar } from './menus.js';
import {
  showOpenDialog,
  showSaveAsDialog,
  pushRecent
} from './filedialog.js';
import {
  showMessageBox,
  showFindDialog,
  showReplaceDialog,
  showGoToDialog,
  showFontDialog,
  showAboutDialog
} from './dialogs.js';
import { noteUsed } from '../../apis/quickaccess.js';

// Microsoft Notepad, Win10 edition: menu bar, monospace editor, status bar,
// and the full command set (file I/O on the emulated C: volume, find and
// replace, go to line, time/date, word wrap, font, zoom).

function baseName(path) {
  var parts = String(path || '').split('\\');
  return parts[parts.length - 1] || '';
}

function parentDir(path) {
  var parts = String(path || '').split('\\');
  parts.pop();
  return parts.join('\\');
}

function timeStamp() {
  var now = new Date();
  var hours = now.getHours() % 12;
  if (hours === 0) {
    hours = 12;
  }
  var minutes = now.getMinutes();
  return hours + ':' + (minutes < 10 ? '0' + minutes : minutes) + ' ' +
    (now.getHours() < 12 ? 'AM' : 'PM') + ' ' +
    (now.getMonth() + 1) + '/' + now.getDate() + '/' + now.getFullYear();
}

export function openNotepad(context, args) {
  var win = context.createWindow({
    title: 'Untitled - Notepad',
    width: NOTEPAD_DEFAULT_W,
    height: NOTEPAD_DEFAULT_H,
    icon: NOTEPAD_SRC
  });

  var doc = {
    path: '',
    dirty: false,
    wordWrap: false,
    statusBar: true,
    font: 'Consolas',
    size: NOTEPAD_FONT_PX,
    zoom: 100,
    recent: []
  };
  // The last find text carries into the next Find / Replace, like Win10.
  var lastFind = { text: '', replace: '' };

  var root = document.createElement('div');
  root.className = 'np-root';

  var menubar = buildMenuBar(menuApi());
  root.appendChild(menubar);

  var editorWrap = document.createElement('div');
  editorWrap.className = 'np-editor-wrap';
  var editor = document.createElement('textarea');
  editor.className = 'np-editor';
  editor.spellcheck = false;
  editor.setAttribute('autocomplete', 'off');
  editor.setAttribute('autocorrect', 'off');
  editor.setAttribute('aria-label', 'Notepad editor');
  editorWrap.appendChild(editor);
  root.appendChild(editorWrap);

  var status = document.createElement('div');
  status.className = 'np-statusbar';
  var statusPos = document.createElement('div');
  statusPos.className = 'np-status-pos';
  var statusZoom = document.createElement('div');
  statusZoom.className = 'np-status-zoom';
  status.appendChild(statusPos);
  status.appendChild(statusZoom);
  root.appendChild(status);

  win.body.appendChild(root);

  // --- Editor state ------------------------------------------------------

  function applyFont() {
    editor.style.fontFamily = '"' + doc.font + '", "Courier New", monospace';
    editor.style.fontSize = (doc.size * doc.zoom / 100) + 'px';
  }

  function applyWordWrap() {
    editor.wrap = doc.wordWrap ? 'soft' : 'off';
    editorWrap.classList.toggle('no-wrap', !doc.wordWrap);
  }

  function setStatusVisible() {
    status.hidden = !doc.statusBar;
  }

  function caretLineCol() {
    var upto = editor.value.slice(0, editor.selectionStart);
    var lines = upto.split('\n');
    return { line: lines.length, col: lines[lines.length - 1].length + 1 };
  }

  function refreshStatus() {
    var pos = caretLineCol();
    statusPos.textContent = 'Ln ' + pos.line + ', Col ' + pos.col;
    statusZoom.textContent = doc.zoom + '%';
  }

  function updateTitle() {
    var name = doc.path ? baseName(doc.path) : 'Untitled';
    win.setTitle(name + ' - Notepad');
  }

  function markDirty() {
    doc.dirty = true;
    updateTitle();
    refreshStatus();
  }

  // --- Commands ----------------------------------------------------------

  function replaceSelection(text) {
    var start = editor.selectionStart;
    var end = editor.selectionEnd;
    editor.value = editor.value.slice(0, start) + text + editor.value.slice(end);
    editor.selectionStart = editor.selectionEnd = start + text.length;
    markDirty();
  }

  // Edit ▸ Delete with no selection removes the character after the caret,
  // the way Del behaves in Notepad.
  function deleteForward() {
    if (editor.selectionStart !== editor.selectionEnd) {
      replaceSelection('');
      return;
    }
    var at = editor.selectionStart;
    if (at >= editor.value.length) {
      return;
    }
    editor.value = editor.value.slice(0, at) + editor.value.slice(at + 1);
    editor.setSelectionRange(at, at);
    markDirty();
  }

  // Paste through the browser's editing command first (it keeps undo and the
  // native caret behaviour), then fall back to the async clipboard for the
  // cases where a synthetic menu click blocks it.
  function pasteInto(target) {
    target.focus();
    var before = target.value;
    var ok = false;
    try {
      ok = document.execCommand('paste');
    } catch (err) {
      ok = false;
    }
    if (ok && target.value !== before) {
      markDirty();
      return;
    }
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(function (text) {
        if (text) {
          replaceSelection(text);
        }
      }).catch(function () {
        // Clipboard blocked: Ctrl+V still works in the editor.
      });
    }
  }

  // Finds from the caret, wrapping like Win10, and selects the hit so
  // Replace Next and F3 keep stepping through the document.
  function findNext(text, matchCase, backwards, fromStart) {
    if (!text) {
      return false;
    }
    lastFind.text = text;
    var haystack = editor.value;
    var needle = matchCase ? text : text.toLowerCase();
    var source = matchCase ? haystack : haystack.toLowerCase();
    var at = fromStart ? 0 : (backwards ? editor.selectionStart - 1 : editor.selectionEnd);
    var found = source.indexOf(needle, Math.max(0, at));
    if (found < 0) {
      // Wrap around the document, as Notepad does.
      found = source.indexOf(needle, 0);
    }
    if (found < 0) {
      return false;
    }
    editor.focus();
    editor.setSelectionRange(found, found + text.length);
    // Scroll the selection into view by nudging the scrollTop.
    var lineHeight = parseFloat(getComputedStyle(editor).lineHeight) || 17;
    var before = haystack.slice(0, found).split('\n').length - 1;
    editor.scrollTop = Math.max(0, (before - 3) * lineHeight);
    refreshStatus();
    return true;
  }

  function replaceOne(find, replace, matchCase) {
    if (editor.selectionStart === editor.selectionEnd) {
      if (!findNext(find, matchCase)) {
        return false;
      }
    }
    var selected = editor.value.slice(editor.selectionStart, editor.selectionEnd);
    var matches = matchCase ? selected === find : selected.toLowerCase() === find.toLowerCase();
    if (!matches) {
      return findNext(find, matchCase);
    }
    replaceSelection(replace);
    return true;
  }

  function replaceAll(find, replace, matchCase) {
    var source = editor.value;
    var parts = matchCase ? source.split(find) : source.split(new RegExp(escapeRe(find), 'gi'));
    if (parts.length < 2) {
      return 0;
    }
    editor.value = parts.join(replace);
    editor.setSelectionRange(0, 0);
    markDirty();
    return parts.length - 1;
  }

  function escapeRe(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function goToLine(line) {
    var lines = editor.value.split('\n');
    var index = Math.max(0, Math.min(lines.length - 1, line - 1));
    var offset = 0;
    for (var i = 0; i < index; i++) {
      offset += lines[i].length + 1;
    }
    editor.focus();
    editor.setSelectionRange(offset, offset);
    var lineHeight = parseFloat(getComputedStyle(editor).lineHeight) || 17;
    editor.scrollTop = Math.max(0, (index - 3) * lineHeight);
    refreshStatus();
  }

  function goToEnd() {
    editor.focus();
    var end = editor.value.length;
    editor.setSelectionRange(end, end);
    editor.scrollTop = editor.scrollHeight;
  }

  function currentDir() {
    return doc.path ? parentDir(doc.path) : NOTEPAD_DEFAULT_DIR;
  }

  function volumeReady() {
    return context.getVolume();
  }

  function confirmDiscard(then) {
    if (!doc.dirty) {
      then();
      return;
    }
    showMessageBox(context, {
      title: 'Notepad',
      message: 'Do you want to save changes to ' + (doc.path ? baseName(doc.path) : 'Untitled') + '?',
      buttons: ['Yes', 'No', 'Cancel'],
      onChoice: function (choice) {
        if (choice === 'Yes') {
          save(then);
        } else if (choice === 'No') {
          then();
        }
      }
    });
  }

  function doNew() {
    confirmDiscard(function () {
      doc.path = '';
      doc.dirty = false;
      editor.value = '';
      updateTitle();
      refreshStatus();
    });
  }

  function doOpen() {
    confirmDiscard(function () {
      showOpenDialog(context, {
        getVolume: volumeReady,
        startDir: currentDir(),
        initialName: doc.path ? baseName(doc.path) : '',
        onAccept: function (path) {
          loadFile(path);
        }
      });
    });
  }

  function openRecentPath(path) {
    confirmDiscard(function () {
      loadFile(path);
    });
  }

  function loadFile(path) {
    volumeReady().then(function (vol) {
      if (!vol || !vol.available) {
        // No storage (opened over file://): say so instead of claiming the
        // file is missing.
        return { unavailable: true };
      }
      return vol.readFile(path).then(function (file) {
        return { text: file.text() };
      });
    }).then(function (result) {
      if (result && result.unavailable) {
        showMessageBox(context, {
          title: 'Notepad',
          icon: 'error',
          message: 'Storage is unavailable, so \'' + path + '\' cannot be opened.'
        });
        return;
      }
      doc.path = path;
      doc.dirty = false;
      editor.value = (result && result.text) || '';
      doc.recent = pushRecent(doc.recent, path);
      // Opening a file is also what puts it in Explorer's Recent list.
      noteUsed({ place: path, name: baseName(path), type: 'file' });
      updateTitle();
      refreshStatus();
    }).catch(function () {
      showMessageBox(context, {
        title: 'Notepad',
        icon: 'error',
        message: 'Cannot find \'' + path + '\'. Check the spelling and try again.'
      });
    });
  }

  function save(then) {
    if (!doc.path) {
      saveAs(then);
      return;
    }
    writeFile(doc.path);
    if (then) {
      then();
    }
  }

  function saveAs(then) {
    showSaveAsDialog(context, {
      getVolume: volumeReady,
      startDir: currentDir(),
      initialName: doc.path ? baseName(doc.path) : '*.txt',
      onAccept: function (path) {
        writeFile(path, then);
      }
    });
  }

function writeFile(path, then) {
  volumeReady().then(function (vol) {
    if (!vol || !vol.available) {
      throw new Error('Storage is unavailable');
    }
    return vol.writeFile(finalSavePath(path), editor.value).then(finalSavePath.bind(null, path));
  }).then(function (finalPath) {
    doc.path = finalPath;
    doc.dirty = false;
    doc.recent = pushRecent(doc.recent, finalPath);
    noteUsed({ place: finalPath, name: baseName(finalPath), type: 'file' });
    updateTitle();
    if (then) {
      then();
    }
  }).catch(function () {
    showMessageBox(context, {
      title: 'Notepad',
      icon: 'error',
      message: 'Cannot save \'' + path + '\'. Check the path and try again.'
    });
  });
}

// The Save As box opens on Notepad's "*.txt" default. A name that still
// holds the wildcard (or nothing) becomes Untitled.txt, and a name with no
// extension gets one, exactly like Notepad's text-document filter.
function finalSavePath(path) {
  var name = baseName(path);
  if (!name || name.indexOf('*') >= 0) {
    name = 'Untitled.txt';
  } else if (!/\.[a-z0-9]+$/i.test(name)) {
    name += '.txt';
  }
  return parentDir(path) + '\\' + name;
}

  function setZoom(percent) {
    doc.zoom = percent;
    applyFont();
    refreshStatus();
  }

  function zoomStep(direction) {
    var at = NOTEPAD_ZOOM_STEPS.indexOf(doc.zoom);
    if (at < 0) {
      at = 0;
    }
    var next = Math.max(0, Math.min(NOTEPAD_ZOOM_STEPS.length - 1, at + direction));
    setZoom(NOTEPAD_ZOOM_STEPS[next]);
  }

  var commands = {
    newFile: doNew,
    open: doOpen,
    openRecent: openRecentPath,
    save: function () { save(); },
    saveAs: function () { saveAs(); },
    exit: function () {
      confirmDiscard(function () {
        win.api.close();
      });
    },
    pageSetup: function () {
      showMessageBox(context, { title: 'Page Setup', message: 'Page Setup is not available in this build.' });
    },
    print: function () {
      showMessageBox(context, { title: 'Print', message: 'Printing is not available in this build.' });
    },
    undo: function () { document.execCommand('undo'); },
    cut: function () { document.execCommand('cut'); },
    copy: function () { document.execCommand('copy'); },
    paste: function () { pasteInto(editor); },
    delete: function () { deleteForward(); },
    selectAll: function () { editor.focus(); editor.select(); },
    timeDate: function () { replaceSelection(timeStamp()); },
    find: function () {
      showFindDialog(context, {
        initial: lastFind.text,
        onFind: function (text, matchCase, up) {
          findNext(text, matchCase, up);
        }
      });
    },
    findNext: function () {
      if (lastFind.text) {
        findNext(lastFind.text, false, false);
      }
    },
    replace: function () {
      showReplaceDialog(context, {
        initial: lastFind.text,
        replacement: lastFind.replace,
        onFind: function (text, matchCase) {
          findNext(text, matchCase, false);
        },
        onReplace: function (find, replace, matchCase, all) {
          if (all) {
            replaceAll(find, replace, matchCase);
          } else {
            replaceOne(find, replace, matchCase);
          }
        }
      });
    },
    goTo: function () {
      showGoToDialog(context, {
        initial: caretLineCol().line,
        onGoTo: goToLine
      });
    },
    toggleWordWrap: function () {
      doc.wordWrap = !doc.wordWrap;
      applyWordWrap();
    },
    font: function () {
      showFontDialog(context, {
        font: doc.font,
        size: doc.size,
        onFont: function (family, size) {
          doc.font = family;
          doc.size = size;
          applyFont();
        }
      });
    },
    toggleStatusBar: function () {
      doc.statusBar = !doc.statusBar;
      setStatusVisible();
    },
    zoomIn: function () { zoomStep(1); },
    zoomOut: function () { zoomStep(-1); },
    zoomReset: function () { setZoom(100); },
    zoom100: function () { setZoom(100); },
    zoom200: function () { setZoom(200); },
    zoom400: function () { setZoom(400); },
    zoom500: function () { setZoom(500); },
    viewHelp: function () {
      showMessageBox(context, { title: 'Notepad Help', message: 'No help file is installed.' });
    },
    about: function () {
      showAboutDialog(context, { icon: NOTEPAD_SRC, user: ACCOUNT_NAME });
    }
  };

  function menuApi() {
    return {
      isChecked: function (key) {
        if (key === 'wordWrap') { return doc.wordWrap; }
        if (key === 'statusBar') { return doc.statusBar; }
        return key === doc.zoom;
      },
      isDisabled: function (key) {
        // Cut/Copy need a selection; Paste needs clipboard content.
        if (key === 'cut' || key === 'copy') {
          return editor.selectionStart === editor.selectionEnd;
        }
        if (key === 'paste') {
          return !hasClipboard();
        }
        return false;
      },
      getRecent: function () { return doc.recent; },
      run: function (command, arg) { runCommand(command, arg); }
    };
  }

  function hasClipboard() {
    // Reading the clipboard needs permission and can be blocked; Notepad
    // never greys Paste out in practice, so assume text is pasteable.
    return true;
  }

  // The menu bar maps a command id straight to this table.
  function runCommand(command, arg) {
    var fn = commands[command];
    if (fn) {
      fn(arg);
    }
  }

  // --- Events ------------------------------------------------------------

  editor.addEventListener('input', markDirty);
  editor.addEventListener('keyup', refreshStatus);
  editor.addEventListener('click', refreshStatus);
  editor.addEventListener('select', refreshStatus);

  // Keyboard shortcuts. Ctrl combinations map to the menu commands; plain
  // editing keys are left to the textarea itself.
  root.addEventListener('keydown', function (event) {
    var key = event.key.toLowerCase();

    if (event.altKey && key === 'z') {
      event.preventDefault();
      commands.toggleWordWrap();
      return;
    }
    if (event.ctrlKey || event.metaKey) {
      switch (key) {
        case 'n': event.preventDefault(); commands.newFile(); return;
        case 'o': event.preventDefault(); commands.open(); return;
        case 's':
          event.preventDefault();
          if (event.shiftKey) { commands.saveAs(); } else { commands.save(); }
          return;
        case 'f': event.preventDefault(); commands.find(); return;
        case 'h': event.preventDefault(); commands.replace(); return;
        case 'g': event.preventDefault(); commands.goTo(); return;
        case 'p': event.preventDefault(); commands.print(); return;
        case '=': case '+': event.preventDefault(); commands.zoomIn(); return;
        case '-': event.preventDefault(); commands.zoomOut(); return;
        case '0': event.preventDefault(); commands.zoomReset(); return;
      }
      return;
    }
    if (key === 'f3') { event.preventDefault(); commands.findNext(); return; }
    if (key === 'f4') { event.preventDefault(); commands.toggleStatusBar(); return; }
    if (key === 'f5' && event.target === editor) { event.preventDefault(); commands.timeDate(); return; }
  });

  // Init
  applyFont();
  applyWordWrap();
  setStatusVisible();
  refreshStatus();
  if (args && args.path) {
    loadFile(args.path);
  } else {
    editor.focus();
  }

  return win;
}