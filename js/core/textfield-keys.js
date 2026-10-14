// What each key does to a text field.
//
// Split out of textfield.js because it is a different question from the one that
// file answers: the field is what it is (its text, its selection, its caret,
// what the apps can ask of it), while this is a translation of key events into
// edits - and it carries the two things that belong to a run of editing rather
// than to any one moment of it: the undo history and the clipboard.
//
// Everything here goes through the api the field hands over, so nothing in this
// file knows how the field stores or draws its text.

// Send one key to a field, the way a hardware keyboard would: a keydown, then a
// keyup, and whatever the field decided to do about it in between. The virtual
// keyboard's keys are buttons and take the document's focus for themselves, so
// the key goes straight to the field rather than to whatever has focus.
//
// This is the whole of what the virtual keyboard does. Everything else about it
// - which keys there are, where it sits, what the modifiers are set to - is the
// keyboard's own business; what a key *means* is the field's, and a field
// cannot tell a typed character from a typed one.
export function pressKey(spec, field, mods) {
  var state = mods || {};
  var key = spec.key;
  if (spec.kind === 'char' && state.shift) {
    key = spec.key.toUpperCase();
  } else if (spec.kind === 'space') {
    key = ' ';
  }
  var init = {
    key: key,
    code: spec.code || '',
    bubbles: true,
    cancelable: true,
    shiftKey: !!state.shift,
    ctrlKey: !!state.ctrl,
    altKey: !!state.alt,
    metaKey: !!state.meta
  };
  field.dispatchEvent(new KeyboardEvent('keydown', init));
  field.dispatchEvent(new KeyboardEvent('keyup', init));
}

// How long a pause ends a run of typing. Windows keeps a word you were typing as
// one undo step, and a word is a pause.
var UNDO_RUN_MS = 500;
var UNDO_LIMIT = 200;

export function createKeyHandler(api) {
  var undoStack = [];
  var redoStack = [];
  var lastKind = '';
  var lastAt = 0;
  var clipboard = null;

  function remember(kind) {
    var now = Date.now();
    if (kind === lastKind && now - lastAt < UNDO_RUN_MS && undoStack.length) {
      // Still the same word being typed: one step, not one per letter.
      lastAt = now;
      return;
    }
    undoStack.push(api.snapshot());
    if (undoStack.length > UNDO_LIMIT) {
      undoStack.shift();
    }
    redoStack.length = 0;
    lastKind = kind;
    lastAt = now;
  }

  function restore(entry) {
    api.restore(entry);
    lastKind = '';
    api.report('historyUndo', null);
  }

  function undo() {
    if (!undoStack.length) {
      return false;
    }
    redoStack.push(api.snapshot());
    restore(undoStack.pop());
    return true;
  }

  function redo() {
    if (!redoStack.length) {
      return false;
    }
    undoStack.push(api.snapshot());
    restore(redoStack.pop());
    return true;
  }

  // --- the clipboard -----------------------------------------------------

  function write(text) {
    clipboard = text;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        navigator.clipboard.writeText(text).catch(function () {});
      } catch (err) {
        // No clipboard to ask: the shell's own is the one that matters.
      }
    }
  }

  function read() {
    if (navigator.clipboard && navigator.clipboard.readText) {
      try {
        return navigator.clipboard.readText().then(function (text) {
          return text || clipboard || '';
        }).catch(function () {
          return clipboard || '';
        });
      } catch (err) {
        return Promise.resolve(clipboard || '');
      }
    }
    return Promise.resolve(clipboard || '');
  }

  function copySelection(cut) {
    var text = api.selectedText();
    if (!text) {
      return false;
    }
    write(text);
    if (cut) {
      api.replaceRange(api.selection().start, api.selection().end, '', 'delete');
    }
    return true;
  }

  function paste() {
    return read().then(function (text) {
      if (text) {
        api.insertText(text, 'paste');
      }
      return !!text;
    });
  }

  // --- the keys ----------------------------------------------------------

  function isPrintable(event) {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return false;
    }
    // A key the browser names with one character types that character.
    // Everything else is a command, and commands are matched by name below.
    return typeof event.key === 'string' && event.key.length === 1;
  }

  function handle(event) {
    if (event.defaultPrevented || api.isLocked()) {
      return;
    }
    var key = event.key;

    if ((event.ctrlKey || event.metaKey) && !event.altKey) {
      switch (key) {
        case 'z':
          event.preventDefault();
          if (event.shiftKey) {
            redo();
          } else {
            undo();
          }
          return;
        case 'y':
          event.preventDefault();
          redo();
          return;
        case 'a':
          event.preventDefault();
          api.selectAll();
          return;
        case 'c':
          event.preventDefault();
          copySelection(false);
          return;
        case 'x':
          event.preventDefault();
          copySelection(true);
          return;
        case 'v':
          event.preventDefault();
          paste();
          return;
        default:
          // Ctrl with a letter is the shell's shortcut, not ours, and it is
          // left to reach the listeners above us. Ctrl with a *named* key is
          // still an editing key though - Ctrl+Backspace takes a word, Ctrl+Left
          // goes to the word before - so those fall through to below.
          if (typeof key === 'string' && key.length === 1) {
            return;
          }
      }
    }

    if (isPrintable(event)) {
      event.preventDefault();
      api.insertText(key, 'type');
      return;
    }

    var shift = event.shiftKey;
    var ctrl = event.ctrlKey;
    switch (key) {
      case 'Backspace':
        event.preventDefault();
        api.backspace(ctrl || event.altKey);
        return;
      case 'Delete':
        event.preventDefault();
        api.forwardDelete(ctrl || event.altKey);
        return;
      case 'Enter':
        // In a one-line field Enter is the dialog's, and submits it.
        if (api.isMultiline()) {
          event.preventDefault();
          api.insertText('\n', 'enter');
        }
        return;
      case 'Tab':
        if (api.isMultiline() && !shift) {
          event.preventDefault();
          api.insertText('\t', 'tab');
        }
        return;
      case 'ArrowLeft':
        event.preventDefault();
        api.moveTo(shift ? api.selection().start - 1 : (ctrl ? api.wordBefore() : api.selection().start - 1), shift);
        return;
      case 'ArrowRight':
        event.preventDefault();
        api.moveTo(shift ? api.selection().end + 1 : (ctrl ? api.wordAfter() : api.selection().end + 1), shift);
        return;
      case 'ArrowUp':
      case 'ArrowDown':
        event.preventDefault();
        api.moveLine(key === 'ArrowUp' ? -1 : 1, shift);
        return;
      case 'Home':
        event.preventDefault();
        api.moveTo(ctrl ? 0 : api.lineStart(), shift);
        return;
      case 'End':
        event.preventDefault();
        api.moveTo(ctrl ? api.length() : api.lineEnd(), shift);
        return;
      case 'PageUp':
      case 'PageDown':
        event.preventDefault();
        api.movePage(key === 'PageUp' ? -1 : 1, shift);
        return;
      default:
        return;
    }
  }

  return {
    handle: handle,
    undo: undo,
    redo: redo,
    remember: remember,
    // The editing commands the old controls answered through
    // document.execCommand, which does nothing at all for a div.
    execCommand: function (name) {
      switch (name) {
        case 'undo':
          return undo();
        case 'redo':
          return redo();
        case 'selectAll':
          api.selectAll();
          return true;
        case 'copy':
          return copySelection(false);
        case 'cut':
          return copySelection(true);
        case 'paste':
          paste();
          return true;
        default:
          return false;
      }
    }
  };
}