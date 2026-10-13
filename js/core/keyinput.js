// The keys, and what pressing one does to a text field.
//
// The virtual keyboard is drawn and positioned by keyboard.js; this module is
// the other half of it - the layout tables, and the translation of a key press
// into what a hardware keyboard would have sent. Nothing here knows about the
// keyboard's own DOM, so the whole typing path can be exercised without one.
//
// A key press is delivered as the sequence a browser delivers for a real one -
// keydown, then beforeinput and input if the field accepted it, then keyup - so
// every app that already listens for keys keeps working. Notepad's Ctrl+S,
// Explorer's Enter-in-the-address-bar and a popup's Enter-to-submit are all
// ordinary keydown listeners, and none of them checks isTrusted.

import { DISPLAY_WIDTH } from '../global/constants.js';

// A printable key. `key` is what the listener reads and `code` is the physical
// key it came from, which is the pair a KeyboardEvent needs to look real.
function ch(key, label, code) {
  return {
    kind: 'char',
    key: key,
    label: label == null ? key : label,
    code: code || 'Key' + key.toUpperCase()
  };
}

// A key that does something rather than typing: a modifier, a layer switch, or
// an editing command. `special` is the event.key the browser is told.
function mod(kind, label, weight, special) {
  return {
    kind: kind,
    label: label,
    weight: weight || 1,
    key: special || kind
  };
}

function letters(text) {
  return text.split('').map(function (letter) {
    return ch(letter);
  });
}

function digits(text) {
  return text.split('').map(function (digit) {
    return ch(digit, digit, 'Digit' + digit);
  });
}

// Symmetry with the Windows touch keyboard: the letters page, the symbols page
// behind ?123, and the modifiers and the space bar along the bottom of both.
export var LETTERS_LAYER = {
  name: 'letters',
  rows: [
    letters('qwertyuiop'),
    letters('asdfghjkl'),
    [mod('shift', '⇧', 1.6)]
      .concat(letters('zxcvbnm'))
      .concat([mod('backspace', '⌫', 1.6, 'Backspace')]),
    [
      mod('layer', '?123', 1.6),
      mod('ctrl', 'Ctrl', 1.2),
      mod('alt', 'Alt', 1.2),
      mod('escape', 'Esc', 1.2, 'Escape'),
      mod('space', '', 4),
      mod('left', '←', 1.2, 'ArrowLeft'),
      mod('right', '→', 1.2, 'ArrowRight'),
      mod('enter', '↵', 1.6, 'Enter')
    ]
  ]
};

export var SYMBOLS_LAYER = {
  name: 'symbols',
  rows: [
    digits('1234567890'),
    [ch('-', '-', 'Minus'), ch('/', '/', 'Slash'), ch(':', ':', 'Semicolon'), ch(';', ';', 'Semicolon'),
      ch('(', '(', 'Digit9'), ch(')', ')', 'Digit0'), ch('$', '$', 'Digit4'),
      ch('&', '&', 'Digit7'), ch('@', '@', 'Digit2'), ch('"', '"', 'Quote')],
    // The comma and the period earn their place here: a filename needs them,
    // and a backslash or a tilde is work nobody does on a phone.
    [ch('!', '!', 'Digit1'), ch('#', '#', 'Digit3'), ch('%', '%', 'Digit5'),
      ch('^', '^', 'Digit6'), ch('*', '*', 'Digit8'), ch('+', '+', 'Equal'),
      ch('=', '=', 'Equal'), ch('_', '_', 'Minus'), ch(',', ',', 'Comma'),
      ch('.', '.', 'Period')],
    [
      mod('layer', 'ABC', 1.6, 'letters'),
      mod('ctrl', 'Ctrl', 1.2),
      mod('alt', 'Alt', 1.2),
      mod('escape', 'Esc', 1.2, 'Escape'),
      mod('space', '', 4),
      mod('left', '←', 1.2, 'ArrowLeft'),
      mod('right', '→', 1.2, 'ArrowRight'),
      mod('enter', '↵', 1.6, 'Enter')
    ]
  ]
};

// The field the emulated cursor last focused, if it is one text can go into.
export function editableTarget() {
  var active = document.activeElement;
  return active ? editableField(active) : null;
}

var FIELD_SELECTOR = 'input, textarea, [contenteditable=""], [contenteditable="true"]';

// Is this node itself a field text can go into? Used both for whatever has
// focus and for whatever is about to be pressed, so that the two agree on what
// counts as typeable.
function isEditable(node) {
  if (!node || node === document.body) {
    return false;
  }
  if (node.isContentEditable) {
    return true;
  }
  if (node.tagName === 'TEXTAREA') {
    return true;
  }
  if (node.tagName === 'INPUT') {
    var type = (node.getAttribute('type') || 'text').toLowerCase();
    // A checkbox, a button and a file picker are not typed into, and a select is
    // picked from rather than typed at.
    return ['text', 'password', 'search', 'email', 'url', 'tel', 'number', ''].indexOf(type) >= 0;
  }
  return false;
}

// The typeable field at or above this node. A press lands on the inside of a
// field - its padding, or a label drawn over it - so the node itself is not
// always the field.
export function editableField(node) {
  if (!node) {
    return null;
  }
  if (isEditable(node)) {
    return node;
  }
  var found = node.closest ? node.closest(FIELD_SELECTOR) : null;
  return found && isEditable(found) ? found : null;
}

// Hiding the phone's own keyboard.
//
// The browser asks for its keyboard as part of giving a field focus, and there
// is no way to decline afterwards: by the time a focusin handler runs, the
// keyboard is already on its way up. The only thing that works is to make the
// field not want one BEFORE the focus lands - inputmode is honoured on Android
// and ignored on iOS, so the one thing both respect is readonly. That is safe
// here because the typing in this module writes to the value directly: readonly
// stops the browser's keyboard, not our keys.
var suppressed = null;

export function suppressNativeKeyboard(field) {
  if (!field || suppressed === field) {
    return;
  }
  releaseNativeKeyboard();
  suppressed = field;
  if (field.dataset.simWasReadOnly == null) {
    field.dataset.simWasReadOnly = field.readOnly ? '1' : '';
    field.dataset.simInputMode = field.getAttribute('inputmode') || '';
  }
  field.readOnly = true;
  // Both are asked for: inputmode is what Android reads, readonly is what iOS
  // reads, and a browser that honours neither still leaves a field that has no
  // reason to open anything.
  field.setAttribute('inputmode', 'none');
}

export function releaseNativeKeyboard() {
  if (!suppressed) {
    return;
  }
  if (!suppressed.dataset.simWasReadOnly) {
    suppressed.readOnly = false;
  }
  if (suppressed.dataset.simInputMode) {
    suppressed.setAttribute('inputmode', suppressed.dataset.simInputMode);
  } else {
    suppressed.removeAttribute('inputmode');
  }
  delete suppressed.dataset.simWasReadOnly;
  delete suppressed.dataset.simInputMode;
  suppressed = null;
}

// Whether the virtual keyboard is on screen. The suppression above belongs to
// the keyboard's lifetime rather than to any one field, so a surface that
// focuses a field itself - a popup putting the caret in its first text box -
// can ask for the same treatment without knowing whether a keyboard exists.
var keyboardUp = false;

export function setKeyboardActive(up) {
  keyboardUp = !!up;
  if (!up) {
    releaseNativeKeyboard();
  }
}

export function suppressIfActive(field) {
  if (keyboardUp && field) {
    suppressNativeKeyboard(field);
  }
}

// Tapping a key must not take the field's focus away, or the selection in it
// collapses and the next key has nowhere to go. Callers prevent the default on
// the press, which is what stops the browser moving focus; this is the second
// half, for the browsers that move it anyway.
export function holdFocus(field, run) {
  if (!field || typeof field.focus !== 'function') {
    run(null);
    return;
  }
  // Where the caret was, in case putting focus back has to put it back too.
  var range = null;
  try {
    if (typeof field.selectionStart === 'number') {
      range = { start: field.selectionStart, end: field.selectionEnd };
    }
  } catch (err) {
    // A field with no caret to remember (see rangeOf).
  }
  var lost = document.activeElement !== field;
  if (lost) {
    try {
      field.focus({ preventScroll: true });
    } catch (err) {
      field.focus();
    }
    if (range) {
      try {
        field.selectionStart = range.start;
        field.selectionEnd = range.end;
      } catch (err2) {
        // Nothing to place it in.
      }
    }
  }
  run(field);
}

// --- typing ---------------------------------------------------------------

var TEXT_INPUTS = 'input:not([disabled]), textarea:not([disabled])';

function initFor(key, code, mods) {
  return {
    key: key,
    code: code || '',
    bubbles: true,
    cancelable: true,
    shiftKey: !!mods.shift,
    ctrlKey: !!mods.ctrl,
    altKey: !!mods.alt,
    metaKey: !!mods.meta,
    // Legacy fields some listeners still read; browsers that ignore them
    // derive the same values from `key`.
    keyCode: keyCodeFor(key),
    which: keyCodeFor(key),
    charCode: 0
  };
}

var KEY_CODES = {
  Backspace: 8,
  Tab: 9,
  Enter: 13,
  Escape: 27,
  ArrowLeft: 37,
  ArrowUp: 38,
  ArrowRight: 39,
  ArrowDown: 40,
  Delete: 46
};

function keyCodeFor(key) {
  if (KEY_CODES[key]) {
    return KEY_CODES[key];
  }
  // A single character's code is its character code, which is what the legacy
  // field wants.
  return key.length === 1 ? key.toUpperCase().charCodeAt(0) : 0;
}

// Where the caret is. Some input types (number, email) have no selection at
// all and throw when asked, and for those the whole value is the range.
function rangeOf(target) {
  try {
    var start = target.selectionStart;
    var end = target.selectionEnd;
    // A range that runs backwards would slice the text twice over. The DOM
    // keeps them in order, but code that sets selectionStart on its own can
    // leave them the other way round, and an inverted range must not double a
    // character into the field.
    return { start: start, end: Math.max(start, end) };
  } catch (err) {
    return { start: 0, end: target.value.length };
  }
}

function setCaret(target, at) {
  try {
    target.selectionStart = at;
    target.selectionEnd = at;
  } catch (err) {
    // A field with no caret to place (see rangeOf).
  }
}

// Put `text` in place of the given range and tell the field what happened, the
// way a browser reports an edit. An empty text is a deletion: the range goes
// and nothing takes its place.
function replaceRange(target, range, text, inputType) {
  var value = target.value;
  target.value = value.slice(0, range.start) + text + value.slice(range.end);
  setCaret(target, range.start + text.length);
  var removing = text === '';
  target.dispatchEvent(new InputEvent('input', {
    bubbles: true,
    cancelable: false,
    inputType: inputType,
    data: removing ? null : text
  }));
}

function insert(target, text) {
  if (!text) {
    return;
  }
  if (target.isContentEditable) {
    // A rich text region is only editable through the browser's own command,
    // which is also the only thing that fires the events it expects.
    document.execCommand('insertText', false, text);
    return;
  }
  var before = new InputEvent('beforeinput', {
    bubbles: true,
    cancelable: true,
    inputType: 'insertText',
    data: text
  });
  if (!target.dispatchEvent(before)) {
    // Something handled it and said no, the way a field that reformats its own
    // input does.
    return;
  }
  replaceRange(target, rangeOf(target), text, 'insertText');
}

function backspace(target) {
  if (target.isContentEditable) {
    document.execCommand('delete');
    return;
  }
  var range = rangeOf(target);
  if (range.start === range.end) {
    if (range.start === 0) {
      // Nothing before the caret to take.
      return;
    }
    // No selection, so the one character in front of the caret is the range.
    range = { start: range.start - 1, end: range.start };
  }
  var before = new InputEvent('beforeinput', {
    bubbles: true,
    cancelable: true,
    inputType: 'deleteContentBackward'
  });
  if (!target.dispatchEvent(before)) {
    return;
  }
  replaceRange(target, range, '', 'deleteContentBackward');
}

// Enter types a new line where there is room for one, and is otherwise left to
// the app: in Explorer's rename box, Enter is what accepts the name.
function enter(target) {
  if (target.isContentEditable || target.tagName === 'TEXTAREA') {
    insert(target, '\n');
  }
}

// Tab indents where it can and moves on where it cannot, which is what the Tab
// key does in a Windows app.
var TAB_TARGETS = TEXT_INPUTS + ', select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function tab(target) {
  if (target.isContentEditable || target.tagName === 'TEXTAREA') {
    insert(target, '\t');
    return;
  }
  var scope = document.getElementById('monitor-stage') || document;
  var items = [];
  var all = scope.querySelectorAll(TAB_TARGETS);
  for (var i = 0; i < all.length; i++) {
    if (all[i].getClientRects().length) {
      items.push(all[i]);
    }
  }
  if (!items.length) {
    return;
  }
  var at = items.indexOf(target);
  items[(at + 1) % items.length].focus();
}

function caretStep(target, key) {
  var range = rangeOf(target);
  var start = range.start;
  if (key === 'Home') {
    setCaret(target, 0);
  } else if (key === 'End') {
    setCaret(target, target.value.length);
  } else {
    setCaret(target, Math.max(0, Math.min(target.value.length, start + (key === 'ArrowRight' ? 1 : -1))));
  }
}

// Press one key. `target` is the field it goes to, or the body when nothing has
// focus - window-level listeners still see the event either way, which is how
// Escape closes a menu and Alt+Space opens a window's menu from the keyboard.
export function typeKey(spec, target, mods) {
  var key = spec.kind === 'char' && mods.shift ? spec.key.toUpperCase() : spec.key;
  if (spec.kind === 'space') {
    key = ' ';
  }
  var down = new KeyboardEvent('keydown', initFor(key, spec.code, mods));
  var accepted = target.dispatchEvent(down);

  if (accepted && editableTarget() === target) {
    if (mods.ctrl || mods.meta || mods.alt) {
      // A combination is a command, not text. Whoever wanted it has just had
      // its keydown, and nothing is typed.
    } else if (spec.kind === 'char') {
      insert(target, key);
    } else if (spec.kind === 'space') {
      insert(target, ' ');
    } else if (spec.kind === 'backspace') {
      backspace(target);
    } else if (spec.kind === 'enter') {
      enter(target);
    } else if (spec.kind === 'tab') {
      tab(target);
    } else if (spec.kind === 'left' || spec.kind === 'right') {
      caretStep(target, key);
    }
  }

  target.dispatchEvent(new KeyboardEvent('keyup', initFor(key, spec.code, mods)));
  return accepted;
}

// The scale the emulated monitor is drawn at, which is what turns the taskbar's
// height in emulated pixels into the height it occupies on this page.
export function stageScale(stage) {
  return stage ? stage.getBoundingClientRect().width / DISPLAY_WIDTH : 1;
}