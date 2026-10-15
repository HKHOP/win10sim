import { createFieldView } from './textfield-view.js';
import { createKeyHandler } from './textfield-keys.js';
import { applyInputApi } from './textfield-input.js';
import { attachPointer } from './textfield-pointer.js';
import { isRawDevicePress, isSiteChromePress } from './cursor.js';

// A text field the emulated OS owns.
//
// The shell used <input> and <textarea> for every box it draws, which left the
// browser owning them: it raised its own keyboard over the desktop, it took the
// focus away from whatever was being typed into, and its text and caret could
// not be made to behave the way Windows' own do. This is the same box drawn by
// the shell instead. The text, the selection, the caret and the caret's blink
// are ours, so the browser has nothing to type into and nothing to raise a
// keyboard for.
//
// It answers the interface the old controls did, because that is what the apps
// already speak - .value, .selectionStart, .setSelectionRange(), .focus(),
// .scrollTop, .placeholder, .type, and the keydown/input/change/select events -
// so the code that uses a field is unchanged. Only the line that created the
// element is different.
//
// textfield-view.js draws it, textfield-keys.js says what each key does.

var FIELD_CLASS = 'sim-field';

// Every field the shell owns. The keyboard asks this list where the caret is,
// rather than asking the document: the keyboard's keys are buttons, and a button
// that has just been pressed holds the document's focus for itself.
var fields = [];

function registerField(field) {
  if (fields.indexOf(field) < 0) {
    fields.push(field);
  }
}

function unregisterField(field) {
  var at = fields.indexOf(field);
  if (at >= 0) {
    fields.splice(at, 1);
  }
}

export function isField(node) {
  return !!(node && node.classList && node.classList.contains(FIELD_CLASS));
}

// The field with the caret in it, whether or not the document agrees.
export function activeField() {
  var byDocument = isField(document.activeElement) ? document.activeElement : null;
  if (byDocument) {
    return byDocument;
  }
  for (var i = fields.length - 1; i >= 0; i--) {
    // A field whose window has been closed is not somewhere the caret can be.
    if (!fields[i].isConnected) {
      unregisterField(fields[i]);
      continue;
    }
    if (fields[i].hasCaret) {
      return fields[i];
    }
  }
  return null;
}

export function textFields() {
  return fields.slice();
}

function startOfWord(value, at) {
  var i = at;
  while (i > 0 && /\s/.test(value.charAt(i - 1))) {
    i--;
  }
  while (i > 0 && !/\s/.test(value.charAt(i - 1))) {
    i--;
  }
  return i;
}

function endOfWord(value, at) {
  var i = at;
  while (i < value.length && /\s/.test(value.charAt(i))) {
    i++;
  }
  while (i < value.length && !/\s/.test(value.charAt(i))) {
    i++;
  }
  return i;
}

// options: value, type, placeholder, multiline, wrap, className, label,
//          readOnly, disabled
export function createTextField(options) {
  var opts = options || {};
  var doc = opts.document || document;

  var state = {
    value: opts.value == null ? '' : String(opts.value),
    start: 0,
    end: 0,
    // Which end of the selection the user is holding, so a drag or a shift+click
    // grows the selection from the end they started at.
    anchor: 0,
    readOnly: !!opts.readOnly,
    disabled: !!opts.disabled
  };

  var host = doc.createElement('div');
  host.className = FIELD_CLASS + (opts.multiline ? ' sim-field--multi' : '');
  if (opts.className) {
    host.className += ' ' + opts.className;
  }
  // Focusable, so .focus() works and the desktop's own typing and Tab reach it.
  // Not a form control, so none of what the browser does with one applies.
  host.setAttribute('tabindex', opts.disabled ? -1 : 0);
  host.setAttribute('role', 'textbox');
  host.setAttribute('aria-multiline', opts.multiline ? 'true' : 'false');
  if (opts.label) {
    host.setAttribute('aria-label', opts.label);
  }

  var view = createFieldView(host, {
    multiline: !!opts.multiline,
    password: opts.type === 'password'
  });

  var password = opts.type === 'password';
  var wrap = opts.wrap === 'off' ? 'off' : 'soft';
  var placeholder = opts.placeholder || '';
  var valueAtFocus = null;
  var lastNotified = '';

  // --- what is shown -----------------------------------------------------

  function shown() {
    // A password shows one bullet per character and never the character. Per
    // code unit, so an offset in the bullets is an offset in the text.
    return password ? new Array(state.value.length + 1).join('\u2022') : state.value;
  }

  function paint() {
    host.style.whiteSpace = opts.multiline
      ? (wrap === 'off' ? 'pre' : 'pre-wrap')
      : 'pre';
    // The skin asks a disabled or a readonly field to look like one, the way
    // the browser's own controls do.
    host.classList.toggle('is-disabled', state.disabled);
    host.classList.toggle('is-readonly', state.readOnly && !state.disabled);
    view.render({
      text: shown(),
      start: state.start,
      end: state.end,
      placeholder: password ? '' : placeholder,
      readOnly: state.readOnly,
      disabled: state.disabled
    });
    view.keepCaretVisible(state);
  }

  // --- editing -----------------------------------------------------------

  function fire(type, init) {
    var event = new Event(type, { bubbles: true, cancelable: type === 'beforeinput' });
    if (init) {
      for (var key in init) {
        if (Object.prototype.hasOwnProperty.call(init, key)) {
          event[key] = init[key];
        }
      }
    }
    host.dispatchEvent(event);
    return !event.defaultPrevented;
  }

  function report(inputType, data) {
    if (!fire('beforeinput', { inputType: inputType, data: data })) {
      // Something handled the edit itself and refused ours.
      return;
    }
    paint();
    fire('input', { inputType: inputType, data: data });
  }

  function replaceRange(start, end, text, kind) {
    if (state.disabled || state.readOnly) {
      return false;
    }
    keys.remember(kind || 'type');
    state.value = state.value.slice(0, start) + text + state.value.slice(end);
    state.start = state.anchor = state.end = start + text.length;
    report(text === '' ? 'deleteContent' : 'insertText', text === '' ? null : text);
    return true;
  }

  function insertText(text, kind) {
    replaceRange(state.start, state.end, text, kind || 'type');
  }

  function backspace(word) {
    var start = state.start;
    var end = state.end;
    if (start === end) {
      if (start === 0) {
        return false;
      }
      end = start;
      start = word ? startOfWord(state.value, start) : start - 1;
    }
    return replaceRange(start, end, '', 'delete');
  }

  function forwardDelete(word) {
    var start = state.start;
    var end = state.end;
    if (start === end) {
      if (start >= state.value.length) {
        return false;
      }
      end = word ? endOfWord(state.value, start) : start + 1;
    }
    return replaceRange(start, end, '', 'delete');
  }

  // --- the caret ---------------------------------------------------------

  function clamp() {
    var length = state.value.length;
    var low = Math.max(0, Math.min(state.start, length));
    var high = Math.max(0, Math.min(state.end, length));
    state.start = Math.min(low, high);
    state.end = Math.max(low, high);
  }

  function lineBounds(at) {
    var value = state.value;
    var start = value.lastIndexOf('\n', Math.max(0, at) - 1) + 1;
    var end = value.indexOf('\n', at);
    return { start: start, end: end < 0 ? value.length : end };
  }

  function setSelection(start, end, extend) {
    state.start = extend ? state.start : start;
    state.anchor = extend ? state.anchor : start;
    state.end = end;
    clamp();
    paint();
    view.keepCaretVisible(state);
    fire('select', { inputType: 'select' });
  }

  function moveTo(at, extend) {
    if (extend) {
      setSelection(state.start, at, true);
    } else {
      setSelection(at, at);
    }
  }

  function moveLine(direction, extend) {
    var bounds = lineBounds(state.start);
    var column = state.start - bounds.start;
    var at;
    if (direction < 0) {
      if (bounds.start === 0) {
        at = 0;
      } else {
        var above = lineBounds(bounds.start - 1);
        at = Math.min(above.start + column, above.end);
      }
    } else {
      if (bounds.end >= state.value.length) {
        at = state.value.length;
      } else {
        var below = lineBounds(bounds.end + 1);
        at = Math.min(below.start + column, below.end);
      }
    }
    moveTo(at, extend);
  }

  function movePage(direction, extend) {
    // A page is however many lines the field is tall enough to show.
    var line = view.caretHeight() || 16;
    var lines = Math.max(1, Math.floor(host.clientHeight / line) - 1);
    var at = state.start;
    for (var i = 0; i < lines; i++) {
      var bounds = lineBounds(at);
      if (direction < 0) {
        if (bounds.start === 0) { at = 0; break; }
        at = lineBounds(bounds.start - 1).start;
      } else {
        if (bounds.end >= state.value.length) { at = state.value.length; break; }
        at = lineBounds(bounds.end + 1).start;
      }
    }
    moveTo(at, extend);
  }

  // --- what the keys need from the field ---------------------------------

  var keys = createKeyHandler({
    isLocked: function () { return state.disabled || state.readOnly; },
    isMultiline: function () { return !!opts.multiline; },
    length: function () { return state.value.length; },
    selection: function () { return { start: state.start, end: state.end }; },
    selectedText: function () { return state.value.slice(state.start, state.end); },
    snapshot: function () {
      return { value: state.value, start: state.start, end: state.end };
    },
    restore: function (entry) {
      state.value = entry.value;
      state.start = state.anchor = entry.start;
      state.end = entry.end;
      paint();
    },
    report: report,
    replaceRange: replaceRange,
    insertText: insertText,
    backspace: backspace,
    forwardDelete: forwardDelete,
    selectAll: function () { setSelection(0, state.value.length); },
    moveTo: moveTo,
    moveLine: moveLine,
    movePage: movePage,
    wordBefore: function () { return startOfWord(state.value, state.start); },
    wordAfter: function () { return endOfWord(state.value, state.end); },
    lineStart: function () { return lineBounds(state.start).start; },
    lineEnd: function () { return lineBounds(state.start).end; }
  });

  // --- the pointer -------------------------------------------------------

  // A press outside the field, while it has the focus. See the focus listener
  // below for why the shell has to do this itself.
  //
  // The virtual keyboard is asked about first, and it matters more than it looks:
  // a finger on one of its keys lands on a button that takes a press, so a field
  // that took "outside" literally would lose its caret to every character typed
  // into it, and the next key would find no field to type into at all.
  var outsidePress = function (event) {
    if (event.target === host || (host.contains && host.contains(event.target))) {
      return;
    }
    if (isRawDevicePress(event)) {
      return;
    }
    if (isSiteChromePress(event)) {
      return;
    }
    host.blur();
  };

  var pointer = attachPointer(host, doc, {
    state: state,
    view: view,
    isDisabled: function () { return state.disabled; },
    lineBounds: lineBounds,
    setSelection: setSelection,
    paint: paint,
    keepCaretVisible: function () { view.keepCaretVisible(state); },
    fire: fire
  });

  host.addEventListener('keydown', function (event) {
    // The ring is for ARRIVING by keyboard, which is what Tab does. Typing is not
    // arriving: the person is already in the field, the caret says where they
    // are, and a ring round a box they are typing into is the debugging look
    // this ring was taken away for. :focus-visible could not have told the two
    // apart, because a text field matches it whenever it has the focus.
    if (event.key === 'Tab') {
      host.classList.add('is-keyboard-focus');
    } else {
      host.classList.remove('is-keyboard-focus');
    }
    keys.handle(event);
  });
  host.addEventListener('keyup', function () {
    // The status bar reads the caret, so it is told when the caret has moved -
    // and only then, which is what the old controls did.
    var now = state.start + ':' + state.end;
    if (now !== lastNotified) {
      lastNotified = now;
      fire('select', { inputType: 'select' });
    }
  });
  host.addEventListener('focus', function () {
    host.hasCaret = true;
    valueAtFocus = state.value;
    view.keepCaretVisible(state);
    // While the field has the focus, a press anywhere else takes it away - the
    // way clicking the page does in a browser.
    //
    // Nothing else can do it for us: the emulated cursor dispatches its presses,
    // and a dispatched event runs none of the browser's default actions, so no
    // blur ever happens on its own. A field that kept the focus went on taking
    // every key afterwards, which is what "it will not let go" looks like. The
    // listener lives only as long as the focus does, so a window full of fields
    // costs nothing, and a press the device made is ignored - that one landed on
    // the capture layer and says nothing about what was pressed.
    document.addEventListener('mousedown', outsidePress, true);
  });
  host.addEventListener('blur', function () {
    host.hasCaret = false;
    document.removeEventListener('mousedown', outsidePress, true);
    // The ring goes with the focus: a field that is not being typed in has
    // nothing to point at.
    host.classList.remove('is-keyboard-focus');
    // A field says what changed once the caret leaves it, as a real one does -
    // not after every keystroke.
    if (valueAtFocus != null && valueAtFocus !== state.value) {
      fire('change', { data: null });
    }
    valueAtFocus = null;
  });

  registerField(host);

  // --- the interface the apps speak --------------------------------------

  // Captured before the interface replaces them, so the field can still do what
  // the element it is does.
  var nativeFocus = host.focus;
  var nativeBlur = host.blur;

  applyInputApi(host, {
    state: state,
    view: view,
    // Passed as accessors, because the surface writes back to them: setting
    // .placeholder has to change the field, not a copy of it.
    get placeholder() { return placeholder; },
    set placeholder(next) { placeholder = next || ''; },
    get multiline() { return !!opts.multiline; },
    get wrap() { return wrap; },
    set wrap(next) { wrap = next === 'off' ? 'off' : 'soft'; },
    // What the field is, as the sign-in screen's show-password button asks for: the
    // mask, and nothing else. A field is a field; whether its characters show or
    // show as bullets is the one thing about its type that can change.
    type: function () { return password ? 'password' : 'text'; },
    setPassword: function (on) {
      password = !!on;
      paint();
    },
    paint: paint,
    clamp: clamp,
    nativeFocus: nativeFocus,
    nativeBlur: nativeBlur,
    setSelection: setSelection,
    keepCaretVisible: function () { view.keepCaretVisible(state); },
    insertText: insertText,
    execCommand: keys.execCommand,
    markClosed: function () {
      unregisterField(host);
      pointer.release();
    }
  });

  paint();
  return host;
}