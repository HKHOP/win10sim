// The two pages of the Windows touch keyboard.
//
// The keyboard itself is in keyboard.js; what a key *does* once it is pressed
// belongs to the field it lands in (textfield-keys.js). This is only what the
// keys are.
//
// A key is either a printable key - a label, the character it types, and the
// physical key it comes from, which is the pair a KeyboardEvent needs to look
// real - or a command: a modifier, a layer switch, or an editing key named by
// what it does.

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
