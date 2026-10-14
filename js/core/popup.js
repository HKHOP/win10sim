// The dropdown's chevron. Taken from the generated font glyphs rather than
// icons.js, which re-exports the shell's own set under friendlier names; a
// dialog is not part of that set, so the codepoint name is used as it stands.
import { CHEVRON_UP_DOWN } from '../global/mdl2.js';
import { WARNING_SVG, ERROR_SVG, INFO_SVG } from '../global/icons.js';
import { createTextField } from './textfield.js';

// The popup API: how an app asks the shell for a dialog.
//
// Windows dialogs are all one shape with different parts filled in - a title, a
// row of glyph and words, a set of controls, and a row of buttons. Rather than
// one function per shape, an app describes the dialog it wants and the shell
// builds it:
//
//     const answer = await context.popup({
//       title: 'Rename',
//       heading: 'Type a new name:',
//       fields: [{ type: 'text', name: 'name', value: 'notes.txt' }],
//       buttons: [
//         { label: 'OK', primary: true, value: 'ok' },
//         { label: 'Cancel', cancel: true }
//       ]
//     });
//     if (answer) { /* answer.values.name */ }
//
// The promise resolves with what the user pressed, or with null when the dialog
// was dismissed - which is the same distinction Windows draws between closing a
// dialog and answering it.
//
// `ownerId` is the window this dialog belongs to, which the shell passes as the
// focused window: Windows will not let an owner come up over its own dialog, and
// neither does this. `behind: true` is the one way out, for a dialog that is
// meant to be behind the window it was opened from and left there.
//
// A dialog can open another: `api.open({...})` hands back the same shape of
// handle, owned by this dialog, and this one stops answering presses while the
// child is up - which is what a modal child does in Windows.

// The three marks a message box leads with, taken from the Segoe MDL2 glyphs
// Windows itself draws them with (U+E7BA, U+E783, U+E946). They are filled with
// currentColor, so the shell colours them the way Windows colours them rather
// than a colour frozen into the path data.
var DIALOG_GLYPHS = {
  error: ERROR_SVG,
  warning: WARNING_SVG,
  info: INFO_SVG
};

var FIELD_TYPES = ['text', 'password', 'multiline', 'number', 'dropdown', 'checkbox', 'radio', 'listbox', 'slider', 'progress'];

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

// A <label for> only names a control by its id, and the shell's fields are not
// form controls - so they are given one anyway, which is what keeps clicking the
// label putting the caret in the box beside it.
function labelTarget(name) {
  return 'popup-' + name;
}

function normalizeField(spec, index) {
  var type = FIELD_TYPES.indexOf(spec.type) >= 0 ? spec.type : 'text';
  return {
    type: type,
    name: spec.name || 'field' + index,
    label: spec.label || '',
    value: spec.value,
    placeholder: spec.placeholder || '',
    options: spec.options || [],
    min: spec.min,
    max: spec.max,
    step: spec.step,
    rows: spec.rows,
    width: spec.width,
    hint: spec.hint || '',
    disabled: !!spec.disabled,
    // A field a popup validates rather than the user filling in.
    readOnly: !!spec.readOnly
  };
}

function valueOf(field, node) {
  if (field.type === 'checkbox') {
    return !!node.checked;
  }
  if (field.type === 'slider') {
    return Number(node.value);
  }
  if (field.type === 'number') {
    return node.value === '' ? null : Number(node.value);
  }
  return node.value;
}

// spec: see the comment at the top. ownerId is the window this dialog belongs
// to. Returns a handle with the window, the live values, and a promise for what
// the user pressed.
export function openPopup(context, spec, ownerId) {
  var options = spec || {};
  var state = {
    closed: false,
    values: {},
    fields: []
  };

  // Windows sizes a dialog to what it has to say: a one-line message is a short
  // box, a form with fields is a tall one. The window manager has no
  // content-sizing, so the height is worked out here.
  function naturalHeight() {
    var lines = 0;
    var paragraphs = Array.isArray(options.body) ? options.body : (options.body ? [options.body] : []);
    paragraphs.forEach(function (line) {
      // Roughly how many wrapped lines a sentence of this length takes at this
      // width; close enough that no dialog is a scrollbar it should not have.
      var perLine = Math.max(20, Math.floor(((options.width || 460) - 90) / 7));
      lines += Math.max(1, Math.ceil(String(line && line.url ? line.label || line.url : line || '').length / perLine));
    });
    var height = 74 + lines * 18;
    if (options.heading) {
      height += 22;
    }
    height += (options.fields || []).length * 38;
    height += 48;
    return Math.max(170, Math.min(560, height));
  }

  var win = context.createWindow({
    title: options.title || context.name || 'Dialog',
    icon: options.icon || '',
    width: options.width || 460,
    height: options.height || naturalHeight(),
    // A dialog is a dialog: no maximise, no resize grips.
    chrome: 'popup',
    minimizable: options.minimizable !== false,
    // Which window it belongs to, and whether this is the one dialog that is
    // allowed to sit behind it.
    ownerId: options.owner !== undefined ? options.owner : ownerId,
    behindOwner: !!options.behind
  });

  var root = el('div', 'popup');
  win.body.appendChild(root);

  // ---- heading and body ----
  // The glyph and the words sit in one row, the way Windows sets them, and a
  // dialog with no glyph gets the words at the left edge instead of a gap.
  var glyph = DIALOG_GLYPHS[options.glyph];
  var shownIcon = options.glyph ? glyph : (options.icon ? '<img alt="" draggable="false" src="' + options.icon + '">' : '');
  var head = el('div', 'popup-head' + (shownIcon ? '' : ' popup-head-plain'));
  if (shownIcon) {
    // The kind rides along in a class so the skin can colour the mark the way
    // Windows colours it - the glyph itself is currentColor.
    var mark = el('span', 'popup-glyph popup-glyph-' + (options.glyph || 'icon'));
    // A mark is markup - the shell's own outlines, or an image element for an app
    // that brought its own - so it is put in as such. Everything else el() is
    // handed is a word, and a word goes in as text: handed the glyph as text, a
    // dialog printed its own source code across the message.
    mark.innerHTML = shownIcon;
    head.appendChild(mark);
  }
  var text = el('div', 'popup-text');
  if (options.heading) {
    text.appendChild(el('h2', 'popup-heading', options.heading));
  }
  var paragraphs = Array.isArray(options.body) ? options.body : (options.body ? [options.body] : []);
  paragraphs.forEach(function (line) {
    if (line === null || line === undefined || line === '') {
      return;
    }
    var node = el(line.url ? 'a' : 'p', 'popup-body');
    if (line.url) {
      node.href = line.url;
      node.textContent = line.label || line.url;
      node.target = '_blank';
      node.rel = 'noreferrer';
    } else {
      node.textContent = line;
    }
    text.appendChild(node);
  });
  head.appendChild(text);
  root.appendChild(head);

  // ---- fields ----
  var form = el('div', 'popup-fields');
  var nodes = {};
  var hints = {};

  (options.fields || []).forEach(function (raw, index) {
    var field = normalizeField(raw, index);
    state.fields.push(field);
    var row = el('div', 'popup-row popup-row-' + field.type);
    if (field.label) {
      var label = el(field.type === 'checkbox' ? 'span' : 'label', 'popup-label', field.label);
      if (field.type !== 'checkbox' && field.type !== 'radio') {
        label.setAttribute('for', labelTarget(field.name));
      }
      row.appendChild(label);
    }

    var node;
    if (field.type === 'dropdown') {
      node = document.createElement('select');
      node.className = 'popup-input popup-select';
      field.options.forEach(function (option) {
        var item = document.createElement('option');
        item.value = String(option.value);
        item.textContent = option.label;
        if (String(option.value) === String(field.value)) {
          item.selected = true;
        }
        node.appendChild(item);
      });
      // Win10 puts the chevron on the right edge of the closed box.
      var arrow = el('span', 'popup-caret', CHEVRON_UP_DOWN);
      var wrap = el('span', 'popup-select-wrap');
      wrap.appendChild(node);
      wrap.appendChild(arrow);
      row.appendChild(wrap);
      node = wrap;
      nodes[field.name] = wrap.querySelector('select');
    } else if (field.type === 'listbox') {
      node = document.createElement('select');
      node.className = 'popup-input popup-listbox';
      node.multiple = true;
      node.size = Math.min(6, Math.max(3, field.options.length));
      field.options.forEach(function (option) {
        var item = document.createElement('option');
        item.value = String(option.value);
        item.textContent = option.label;
        node.appendChild(item);
      });
      if (Array.isArray(field.value)) {
        Array.prototype.forEach.call(node.options, function (item) {
          item.selected = field.value.indexOf(item.value) >= 0;
        });
      }
      row.appendChild(node);
      nodes[field.name] = node;
    } else if (field.type === 'checkbox') {
      node = document.createElement('input');
      node.type = 'checkbox';
      node.className = 'popup-check';
      node.checked = !!field.value;
      row.insertBefore(node, row.firstChild);
      nodes[field.name] = node;
    } else if (field.type === 'radio') {
      var group = el('div', 'popup-radios');
      field.options.forEach(function (option) {
        var line = el('label', 'popup-radio');
        var radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'popup-radio-' + field.name;
        radio.value = String(option.value);
        radio.checked = String(option.value) === String(field.value);
        radio.addEventListener('change', function () {
          field.value = radio.value;
          changed(field);
        });
        line.appendChild(radio);
        line.appendChild(el('span', null, option.label));
        group.appendChild(line);
      });
      row.appendChild(group);
      nodes[field.name] = group.querySelector('input');
      nodes[field.name].__group = group;
    } else if (field.type === 'slider') {
      node = document.createElement('input');
      node.type = 'range';
      node.className = 'popup-slider';
      node.min = String(field.min != null ? field.min : 0);
      node.max = String(field.max != null ? field.max : 100);
      node.step = String(field.step != null ? field.step : 1);
      node.value = String(field.value != null ? field.value : node.min);
      row.appendChild(node);
      nodes[field.name] = node;
    } else if (field.type === 'progress') {
      node = el('div', 'popup-progress');
      var fill = el('div', 'popup-progress-fill');
      var percent = Math.max(0, Math.min(100, Number(field.value) || 0));
      fill.style.width = percent + '%';
      node.appendChild(fill);
      row.appendChild(node);
      nodes[field.name] = node;
    } else if (field.type === 'multiline') {
      node = createTextField({
        multiline: true,
        value: field.value == null ? '' : field.value,
        placeholder: field.placeholder,
        readOnly: field.readOnly,
        disabled: field.disabled,
        className: 'popup-input popup-multiline',
        label: field.label
      });
      node.id = labelTarget(field.name);
      if (field.rows) {
        node.style.height = (field.rows * 16 + 10) + 'px';
      }
      row.appendChild(node);
      nodes[field.name] = node;
    } else {
      node = createTextField({
        type: field.type === 'password' ? 'password' : 'text',
        value: field.value == null ? '' : field.value,
        placeholder: field.placeholder,
        readOnly: field.readOnly,
        disabled: field.disabled,
        className: 'popup-input',
        label: field.label
      });
      node.id = labelTarget(field.name);
      if (field.readOnly) {
        node.readOnly = true;
      }
      row.appendChild(node);
      nodes[field.name] = node;
    }

    if (field.width) {
      row.style.gridTemplateColumns = 'auto minmax(0,' + field.width + ')';
    }
    // A hint node exists whenever the field declares one, even an empty one,
    // so a popup can set a hint later without having declared it up front.
    if (typeof field.hint === 'string') {
      var hint = el('div', 'popup-hint', field.hint);
      hints[field.name] = hint;
      row.appendChild(hint);
    }
    if (field.type !== 'checkbox' && field.type !== 'radio' && field.type !== 'progress') {
      node.addEventListener('input', function () { changed(field); });
      if (field.type === 'dropdown' || field.type === 'listbox') {
        node.addEventListener('change', function () { changed(field); });
      }
      // Enter in a single-line field submits, as it does in Win10 dialogs.
      if (field.type === 'text' || field.type === 'password' || field.type === 'number') {
        node.addEventListener('keydown', function (event) {
          if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            press(defaultButton());
          }
        });
      }
    }
    form.appendChild(row);
  });

  if (state.fields.length) {
    root.appendChild(form);
  }

  function readValues() {
    state.fields.forEach(function (field) {
      var node = nodes[field.name];
      if (!node) {
        return;
      }
      if (field.type === 'radio') {
        var picked = nodes[field.name].__group.querySelector('input:checked');
        state.values[field.name] = picked ? picked.value : '';
        return;
      }
      // A progress bar shows something rather than being answered.
      if (field.type === 'progress') {
        return;
      }
      state.values[field.name] = valueOf(field, node);
    });
    return state.values;
  }

  function changed(field) {
    readValues();
    if (hints[field.name] && hints[field.name].classList.contains('is-error')) {
      hints[field.name].classList.remove('is-error');
    }
    if (typeof options.onChange === 'function') {
      options.onChange(field.name, state.values[field.name], state.values, api);
    }
  }

  // ---- buttons ----
  var actions = el('div', 'popup-actions');
  var buttons = options.buttons && options.buttons.length
    ? options.buttons
    : [{ label: 'OK', primary: true, value: 'ok' }];
  var defaultValue = options.defaultButton || (buttons.find(function (b) { return b.primary; }) || buttons[0]).value;

  function defaultButton() {
    return buttons.filter(function (b) { return b.value === defaultValue; })[0] || buttons[0];
  }

  buttons.forEach(function (spec2) {
    var button = el('button', 'popup-btn' + (spec2.primary ? ' is-primary' : ''));
    button.type = 'button';
    button.textContent = spec2.label;
    if (spec2.disabled) {
      button.disabled = true;
    }
    button.addEventListener('click', function () { press(spec2); });
    actions.appendChild(button);
  });
  root.appendChild(actions);

  // ---- closing ----
  var resolveResult;
  var result = new Promise(function (resolve) {
    resolveResult = resolve;
  });

  function finish(button, values) {
    if (state.closed) {
      return;
    }
    state.closed = true;
    win.close();
    resolveResult(button ? { button: button.value, values: values } : null);
  }

  // A button may refuse the close (a popup that validates), by returning false
  // from onSubmit.
  function press(button) {
    if (!button || button.disabled) {
      return;
    }
    var values = readValues();
    if (typeof options.onSubmit === 'function') {
      if (options.onSubmit(button.value, values, api) === false) {
        return;
      }
    }
    if (typeof options.onButton === 'function') {
      options.onButton(button.value, values, api);
    }
    if (button.keepOpen) {
      return;
    }
    finish(button, values);
  }

  // Escape dismisses; Enter presses the default button - both consumed here so
  // the window's own shortcuts never fire a second time behind the dialog.
  //
  // The listener is on the dialog's whole body rather than on the content,
  // because a dialog with nothing in it to focus - a message box, a question
  // with two buttons and no fields - left every key to the shell behind it:
  // Enter did nothing at all, which on a keyboard (or on the phone's own) reads
  // as a dialog whose buttons are dead. Stopping the keys as well as handling
  // them is what keeps a global shortcut from firing behind a dialog.
  win.body.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && options.closeOnEscape !== false) {
      event.preventDefault();
      event.stopPropagation();
      finish(null, readValues());
      return;
    }
    if (event.key === 'Enter') {
      var tag = event.target && event.target.tagName;
      if (tag === 'TEXTAREA' || tag === 'BUTTON') {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      press(defaultButton());
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
    root: root,
    // The live values, as a plain object.
    values: function () { return readValues(); },
    setValue: function (name, value) {
      var field = state.fields.filter(function (f) { return f.name === name; })[0];
      var node = nodes[name];
      if (!field || !node) {
        return false;
      }
      if (field.type === 'checkbox') {
        node.checked = !!value;
      } else if (field.type === 'slider' || field.type === 'progress') {
        node.value = String(value);
        if (field.type === 'progress') {
          node.firstChild.style.width = Math.max(0, Math.min(100, Number(value) || 0)) + '%';
        }
      } else {
        node.value = value == null ? '' : value;
      }
      changed(field);
      return true;
    },
    enable: function (name, on) {
      var node = nodes[name];
      if (node) {
        node.disabled = !on;
      }
    },
    setHint: function (name, text2, isError) {
      var hint = hints[name];
      if (!hint) {
        return false;
      }
      hint.textContent = text2 || '';
      hint.classList.toggle('is-error', !!isError);
      return true;
    },
    setTitle: function (text2) { win.setTitle(text2); },
    // Press a button by its value, the way a caller would from outside.
    press: function (value) {
      press(buttons.filter(function (b) { return b.value === value; })[0]);
    },
    // A dialog inside this one. The child is owned by this dialog, so it stays
    // above it, and this dialog stops taking presses while the child is up -
    // which is what a modal child does in Windows. The presses come back when
    // the child closes, however it closes.
    open: function (childSpec) {
      var blocker = el('div', 'popup-blocked');
      blocker.setAttribute('aria-hidden', 'true');
      win.body.appendChild(blocker);
      var child = openPopup(context, childSpec, win.id);
      child.result.then(function () {
        if (blocker.parentNode) {
          blocker.parentNode.removeChild(blocker);
        }
      }, function () {});
      return child;
    },
    close: function () { finish(null, readValues()); },
    focus: function (name) {
      var node = nodes[name];
      if (node && node.focus) {
        node.focus();
        if (node.select) {
          node.select();
        }
      }
    },
    isOpen: function () { return !state.closed; },
    result: result
  };

  // A dialog takes the keyboard when it opens, the way a Win32 dialog does. What
  // is focused is the content rather than the default button: Enter on a real
  // button answers the dialog on the browser's own, and this dialog answers it
  // itself - and most message boxes have nothing in them worth focusing.
  root.tabIndex = -1;
  root.focus();

  // An app usually wants the textbox it named to be ready for typing.
  var firstText = state.fields.filter(function (f) { return f.type === 'text' || f.type === 'password'; })[0];
  if (firstText) {
    api.focus(firstText.name);
  }

  return api;
}

export { DIALOG_GLYPHS };
