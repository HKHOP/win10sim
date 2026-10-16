// The controls a Settings page is made of.
//
// One function per kind, all reached through buildItem(), so a page does not
// know how a switch is drawn - it declares that there is one. Each control
// reads its value through ops.value(key) and writes through ops.write(key,
// value), which is what keeps persistence in one place: nothing here touches
// the store, so nothing here can forget to.
//
// A control that has been drawn also answers sync(), which puts it back into
// step with the store. That matters because two pages can show the same setting
// (the Wi-Fi switch is on both the Wi-Fi and the Airplane mode page, and "Show
// app list" belongs to the Start menu as well as to Personalisation): a write
// from either has to be reflected by both, and the way it is done is by asking
// the control to re-read rather than by rebuilding the page under the user.

import { CHEVRON_SVG } from '../../global/icons.js';
import { defaultOf } from './schema.js';
import { glyphFor } from './glyphmap.js';
import { createTextField } from '../../core/textfield.js';
import { attachSlider } from './sliderdrag.js';

// The open list: how much of it there is, and how close to the box it sits.
// Both are the same numbers Windows uses for a flyout - a list is never taller
// than about ten entries before it scrolls.
var MENU_MAX_H = 260;
var MENU_OPTION_H = 32;
var MENU_GAP = 2;

function row(className, labelText) {
  var el = document.createElement('div');
  el.className = 'set-row' + (className ? ' ' + className : '');
  if (labelText) {
    var label = document.createElement('div');
    label.className = 'set-row-label';
    label.textContent = labelText;
    el.appendChild(label);
  }
  return el;
}

// The Win10 switch: a track, a knob, and the word On or Off beside it. The word
// is part of the control rather than a caption, because Windows puts it inside
// the switch's own row and a switch with no label on it is not a setting you
// can tell the state of.
//
// One switch for the whole app, in one colour. Several of the reference
// screenshots show switches in amber, gold or teal; that is the accent colour of
// the machine they were taken on, and this machine's accent is the default blue.
// A second switch colour would be a claim that some settings are special, and
// there are none.
//
// Built once here and handed out, because two places need it: a plain setting
// row, and a rule row (Focus assist's automatic rules) which is the same switch
// with a picture and two lines of words in front of it. Two copies of this would
// be two places for the knob's one-pixel offset to be right in one and wrong in
// the other.
function switchNode(label, onToggle) {
  var field = document.createElement('button');
  field.type = 'button';
  field.className = 'set-switch';
  field.setAttribute('role', 'switch');
  var track = document.createElement('span');
  track.className = 'set-switch-track';
  track.innerHTML = '<span class="set-switch-knob"></span>';
  var state = document.createElement('span');
  state.className = 'set-switch-state';
  field.appendChild(track);
  field.appendChild(state);
  field.addEventListener('click', onToggle);
  field.setAttribute('aria-label', label || 'Setting');
  return { field: field, state: state };
}

// Puts a switch into the state the store says it is in.
function paintSwitch(node, on, label) {
  node.field.setAttribute('aria-checked', on ? 'true' : 'false');
  node.field.setAttribute('aria-label', (label || 'Setting') + ': ' + (on ? 'on' : 'off'));
  node.state.textContent = on ? 'On' : 'Off';
  // The class goes on the switch itself, not the row, so that this and the
  // compact switches down a list of apps are told "on" the same way and one
  // CSS rule can move both knobs.
  node.field.classList.toggle('is-on', on);
}

function switchControl(item, ops) {
  var el = row('set-row--switch');
  var node = switchNode(item.label, function () {
    ops.write(item.key, !ops.value(item.key));
  });
  el.appendChild(node.field);

  return {
    el: el,
    sync: function () {
      paintSwitch(node, ops.value(item.key) === true, item.label);
    }
  };
}

// One of Focus assist's automatic rules: the mark for what triggers it, the
// trigger's own name, what it will do when it fires, and the switch.
//
// It is a toggle on the inside - same key, same coercion, same persistence -
// because it is one. What makes it a different *kind* is the two lines of words
// and the icon in front, which is a shape the switch row cannot draw.
function ruleRowControl(item, ops) {
  var el = row('set-rule');
  var art = document.createElement('span');
  art.className = 'set-rule-art';
  art.innerHTML = glyphFor(item.icon) || '';
  if (!art.innerHTML) {
    // A row with no mark would be narrower than the ones around it, so the
    // space is kept and left empty rather than letting the row shift.
    art.classList.add('is-empty');
  }
  el.appendChild(art);
  var body = document.createElement('span');
  body.className = 'set-rule-body';
  var name = document.createElement('span');
  name.className = 'set-rule-name';
  name.textContent = item.label || '';
  body.appendChild(name);
  if (item.sublabel) {
    var sub = document.createElement('span');
    sub.className = 'set-rule-sub';
    sub.textContent = item.sublabel;
    body.appendChild(sub);
  }
  el.appendChild(body);
  var node = switchNode(item.label, function () {
    ops.write(item.key, !ops.value(item.key));
  });
  el.appendChild(node.field);
  return {
    el: el,
    sync: function () {
      paintSwitch(node, ops.value(item.key) === true, item.label);
    }
  };
}

// A checkbox: a box and a tick, with the label to its right rather than beside
// a switch. Windows uses this where a setting is one of a set rather than a
// yes or no.
function checkboxControl(item, ops) {
  var el = document.createElement('button');
  el.type = 'button';
  el.className = 'set-check';
  el.setAttribute('role', 'checkbox');
  var box = document.createElement('span');
  box.className = 'set-check-box';
  // The box and the tick are painted entirely by css/checkbox.css, out of the
  // real MDL2 check (U+E73E), so that this control and every native check box
  // in the shell are drawn from the one set of Win10 brushes and metrics.
  var text = document.createElement('span');
  text.className = 'set-check-text';
  text.textContent = item.label || '';
  el.appendChild(box);
  el.appendChild(text);
  el.addEventListener('click', function () {
    ops.write(item.key, !ops.value(item.key));
  });
  return {
    el: el,
    sync: function () {
      var on = ops.value(item.key) === true;
      el.setAttribute('aria-checked', on ? 'true' : 'false');
      el.classList.toggle('is-on', on);
    }
  };
}

// The drop-down Settings uses for every choice with more than one answer and no
// room to show them all: a closed box showing the current answer, and a list
// that opens over the window.
//
// The list is placed in the shell's overlay rather than under the box, and it is
// positioned from the box's own rectangle. That is not fussiness: the page
// scrolls, so a list positioned inside it is clipped at the content edges and
// one near the bottom of a long page would be cut in half - and an absolutely
// positioned element with no positioned ancestor resolves against the whole
// window, which is what put it at the bottom left.
function selectControl(item, ops) {
  // Labelled here for the same reason the slider is: Windows puts a drop-down's
  // label above it, and the drop-down is as wide as the longest answer in it,
  // so there is no sensible column for the label to sit in beside it.
  var el = row('set-row--select', item.label);
  var field = document.createElement('button');
  field.type = 'button';
  field.className = 'set-select';
  field.setAttribute('aria-haspopup', 'listbox');
  field.setAttribute('aria-expanded', 'false');
  var value = document.createElement('span');
  value.className = 'set-select-value';
  var chevron = document.createElement('span');
  chevron.className = 'set-select-chevron';
  chevron.innerHTML = CHEVRON_SVG;
  field.appendChild(value);
  field.appendChild(chevron);
  el.appendChild(field);

  var menu = null;

  function close() {
    if (!menu) {
      return;
    }
    if (menu.parentNode) {
      menu.parentNode.removeChild(menu);
    }
    menu = null;
    field.setAttribute('aria-expanded', 'false');
    el.classList.remove('is-open');
    document.removeEventListener('mousedown', outside, true);
  }

  // Puts the list under the box, or above it when the window ends first. Windows
  // opens a drop-down upwards rather than let it run off the bottom of the
  // screen, and a settings page is mostly scrolling, so it happens often.
  function place() {
    var box = field.getBoundingClientRect();
    var frame = ops.overlay().getBoundingClientRect();
    // How tall the list would like to be, bounded by the longest list here.
    var wanted = Math.min(MENU_MAX_H, (item.options || []).length * MENU_OPTION_H + 2);
    var roomBelow = frame.bottom - box.bottom - MENU_GAP;
    var roomAbove = box.top - frame.top - MENU_GAP;
    var height = Math.min(wanted, Math.max(roomBelow, roomAbove));
    menu.style.left = (box.left - frame.left) + 'px';
    menu.style.width = box.width + 'px';
    menu.style.setProperty('--menu-h', Math.max(MENU_OPTION_H, height) + 'px');
    if (roomBelow >= height || roomBelow >= roomAbove) {
      menu.style.top = (box.bottom - frame.top + 1) + 'px';
    } else {
      menu.style.top = (box.top - frame.top - height - 1) + 'px';
    }
  }

  function open() {
    if (menu) {
      close();
      return;
    }
    menu = document.createElement('div');
    menu.className = 'set-select-menu';
    menu.setAttribute('role', 'listbox');
    var current = ops.value(item.key);
    (item.options || []).forEach(function (option) {
      var entry = document.createElement('button');
      entry.type = 'button';
      entry.className = 'set-select-option';
      entry.setAttribute('role', 'option');
      entry.textContent = option.label;
      if (option.value === current) {
        entry.setAttribute('aria-selected', 'true');
        entry.classList.add('is-current');
      }
      entry.addEventListener('click', function () {
        ops.write(item.key, option.value);
        close();
      });
      menu.appendChild(entry);
    });
    ops.overlay().appendChild(menu);
    place();
    field.setAttribute('aria-expanded', 'true');
    el.classList.add('is-open');
    // The list is placed after it is in the document, because its height is what
    // decides which side of the box it opens on.
    // A press outside the control puts the list away, the way any drop-down
    // does. isRawDevicePress is asked about first: a press on the virtual
    // keyboard is about the device, not about what is open on the screen.
    setTimeout(function () {
      document.addEventListener('mousedown', outside, true);
    }, 0);
  }

  function outside(event) {
    // The list is not a child of the control - it is placed in the page overlay
    // so it cannot be clipped - so it has to be named here as well. Without
    // this, the press that was aimed at an option reads as a press outside the
    // control, the list is taken down on the press-down, and the click that
    // follows lands on whatever the option was covering: choosing anything did
    // nothing at all.
    if (el.contains(event.target) || (menu && menu.contains(event.target))) {
      return;
    }
    close();
  }

  function onKey(event) {
    if (event.key === 'Escape' && menu) {
      close();
      // The menu consumed the Escape; the page must not also take it as
      // "go back", or one press would both close the list and navigate.
      event.stopPropagation();
    }
  }

  el.addEventListener('keydown', onKey);
  field.addEventListener('click', open);

  return {
    el: el,
    sync: function () {
      var current = ops.value(item.key);
      var found = (item.options || []).filter(function (option) { return option.value === current; })[0];
      value.textContent = found ? found.label : String(current);
      field.setAttribute('aria-label', (item.label || 'Setting') + ': ' + value.textContent);
    },
    dispose: close
  };
}

// A slider with the value shown as a number beside it, which is how Settings
// shows brightness, zoom and text size.
//
// It is a real range input, so the browser gives the keyboard arrows, the
// focus ring and the drag. It is given neither its own appearance nor its own
// width: Win10's slider is a two-pixel track with a narrow upright thumb, which
// no UA stylesheet produces, and its width is set to 0 with flex-grow doing the
// filling, because a range input's intrinsic width is whatever the browser
// feels like and does not reliably fill a column.
//
// The filled part of the track is drawn by a gradient over a custom property,
// since there is no other way to colour the left of a native track.
function sliderControl(item, ops) {
  // The label is drawn here, above the track, rather than being wrapped round
  // the control. buildItem puts a wrapped label *beside* the control in a
  // two-column grid, and in an `auto` column the track collapses to the width
  // of the number beside it - leaving a thumb with no track to sit on and
  // nothing to press.
  var el = row('set-row--slider', item.label);
  var track = document.createElement('div');
  track.className = 'set-slider-row';
  // Windows puts a mark at each end of some sliders and none at all on others:
  // a speaker by the master volume, a sun at both ends of the brightness, a leaf
  // and a bolt at the ends of the power mode. The names are glyph names, checked
  // by tools/check_settings.js, so a row cannot ask for a picture that is not
  // there.
  if (item.icon) {
    var art = document.createElement('span');
    art.className = 'set-slider-art';
    art.innerHTML = glyphFor(item.icon);
    track.appendChild(art);
  }
  var input = document.createElement('input');
  input.type = 'range';
  input.className = 'set-slider';
  input.min = String(item.min);
  input.max = String(item.max);
  input.step = String(item.step || 1);
  input.setAttribute('aria-label', item.label || 'Setting');
  track.appendChild(input);
  if (item.iconEnd) {
    var artEnd = document.createElement('span');
    artEnd.className = 'set-slider-art set-slider-art--end';
    artEnd.innerHTML = glyphFor(item.iconEnd);
    track.appendChild(artEnd);
  }
  // Not every slider shows its number. The power mode reads "Balanced" or
  // "Better performance", not "75", so it has no readout at all.
  var readout = document.createElement('span');
  readout.className = 'set-slider-value';
  if (item.showValue === false) {
    readout.hidden = true;
  }
  track.appendChild(readout);
  el.appendChild(track);
  if (item.endLabels) {
    // The two words under the ends of the track, which is how Windows says what
    // the ends of the slider mean without a caption on every value.
    var ends = document.createElement('div');
    ends.className = 'set-slider-ends';
    item.endLabels.forEach(function (text) {
      var word = document.createElement('span');
      word.className = 'set-slider-end-label';
      word.textContent = text;
      ends.appendChild(word);
    });
    el.appendChild(ends);
  }

  // The drag is ours rather than the browser's - see sliderdrag.js for why it
  // has to be, and for what the keyboard still gets from the UA.
  var slider = attachSlider(input, {
    min: item.min,
    max: item.max,
    step: item.step || 1,
    write: function (value) {
      ops.write(item.key, value);
    },
    paint: function (value) {
      readout.textContent = value + (item.suffix || '');
      paintLabel(value);
    }
  });

  // A slider whose label says where it is - "Power mode: Balanced" - rather than
  // just naming itself, which is how Windows reports a slider whose value has a
  // name as well as a number.
  var caption = el.querySelector('.set-row-label');
  var baseLabel = item.label || '';

  function paintLabel(value) {
    if (!caption || !item.labelFrom) {
      return;
    }
    var name = item.labelFrom[value];
    caption.textContent = name ? baseLabel + ': ' + name : baseLabel;
  }

  return {
    el: el,
    sync: function () {
      var value = ops.value(item.key);
      slider.sync(value);
      paintLabel(value);
    },
    dispose: slider.dispose
  };
}

// A group of answers shown as a list of radio rows, each with the explanation
// Windows writes under it. Used where the answers need saying rather than
// naming - Focus assist's three modes are the reason this exists.
function radioControl(item, ops) {
  var el = document.createElement('div');
  el.className = 'set-radios';
  (item.options || []).forEach(function (option) {
    var wrap = document.createElement('label');
    wrap.className = 'set-radio';
    var input = document.createElement('input');
    input.type = 'radio';
    input.className = 'set-radio-input';
    input.name = 'set-radio-' + item.key;
    input.value = option.value;
    input.addEventListener('change', function () {
      if (input.checked) {
        ops.write(item.key, option.value);
      }
    });
    var body = document.createElement('span');
    body.className = 'set-radio-body';
    var name = document.createElement('span');
    name.className = 'set-radio-name';
    name.textContent = option.label;
    body.appendChild(name);
    if (option.help) {
      var help = document.createElement('span');
      help.className = 'set-radio-help';
      help.textContent = option.help;
      body.appendChild(help);
    }
    // Focus assist's "Priority only" carries a link inside its own answer, under
    // the explanation - because "Customize your priority list" is the way out of
    // that answer, not a setting of its own, and Windows puts it there.
    if (option.link) {
      var jump = document.createElement('button');
      jump.type = 'button';
      jump.className = 'set-link set-link--small';
      jump.textContent = option.link.label || '';
      jump.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (option.link.to) {
          ops.navigate(option.link.to);
        } else if (option.link.action) {
          ops.run(option.link.action);
        }
      });
      body.appendChild(jump);
    }
    wrap.appendChild(input);
    wrap.appendChild(body);
    el.appendChild(wrap);
  });

  return {
    el: el,
    sync: function () {
      var current = ops.value(item.key);
      el.querySelectorAll('input').forEach(function (input) {
        input.checked = input.value === current;
      });
    }
  };
}

// A button that does something rather than storing something. Settings is full
// of these - Uninstall, Identify, Reset - and none of them is a setting.
//
// `icon` puts a mark in front of the words, which is how Windows draws the ones
// that name an object rather than an action - "Add Bluetooth or other device",
// "Troubleshoot", "Camera". `wide` makes it span the page, which is what the
// one button at the top of the Bluetooth page does.
function buttonControl(item, ops) {
  var button = document.createElement('button');
  button.type = 'button';
  button.className = 'set-button' +
    (item.variant === 'primary' ? ' set-button--primary' : '') +
    (item.wide ? ' set-button--wide' : '');
  // The mark goes in as its own element so it can sit beside the words rather
  // than inside them; the gap is the mark's own right margin, so the words
  // themselves are just the button's text.
  if (item.icon) {
    var art = document.createElement('span');
    art.className = 'set-button-art';
    art.innerHTML = glyphFor(item.icon);
    button.appendChild(art);
  }
  button.appendChild(document.createTextNode(item.label || ''));
  button.addEventListener('click', function () {
    ops.run(item.action);
  });
  return { el: button };
}

// A link. Blue, because in Settings a link is somewhere to go, and the words are
// the sentence rather than a noun - "Get help", "Night light settings".
function linkControl(item, ops) {
  var button = document.createElement('button');
  button.type = 'button';
  button.className = 'set-link';
  if (item.icon) {
    var art = document.createElement('span');
    art.className = 'set-button-art';
    art.innerHTML = glyphFor(item.icon);
    button.appendChild(art);
  }
  button.appendChild(document.createTextNode(item.label || ''));
  button.addEventListener('click', function () {
    // A link with a page goes to that page; one with an action runs it. Win10
    // has both on the same rows and the difference is only in what pressing it
    // does.
    if (item.to) {
      ops.navigate(item.to);
    } else if (item.action) {
      ops.run(item.action);
    }
  });
  return { el: button };
}

// "Get help" and "Give feedback", each with the mark Windows puts beside it, in
// one group. They are the last thing on every page that ends with them, and they
// are always the same two, so a page declares the pair rather than repeating it.
function helpLinksControl(item, ops) {
  var el = row('set-help');
  (item.links || []).forEach(function (entry) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'set-help-row';
    var art = document.createElement('span');
    art.className = 'set-help-art';
    art.innerHTML = glyphFor(entry.icon) || '';
    button.appendChild(art);
    button.appendChild(document.createTextNode(entry.label || ''));
    button.addEventListener('click', function () {
      ops.run(entry.action);
    });
    el.appendChild(button);
  });
  return { el: el };
}

// A keyboard shortcut: the thing it does, the grey "Windows shortcut" caption
// Windows writes above the keys, and a box holding the keys themselves.
//
// The box is the shell's own text field rather than an <input>, for the reason
// "Find a setting" is one: it takes a caret and never raises the phone's
// keyboard over the desktop.
function shortcutBoxControl(item, ops) {
  var el = row('set-shortcut');
  var label = document.createElement('div');
  label.className = 'set-shortcut-label';
  var name = document.createElement('span');
  name.className = 'set-shortcut-name';
  name.textContent = item.label || '';
  var cap = document.createElement('span');
  cap.className = 'set-shortcut-cap';
  cap.textContent = item.caption || 'Windows shortcut';
  label.appendChild(name);
  label.appendChild(cap);
  el.appendChild(label);
  var field = createTextField({
    value: ops.value(item.key),
    label: item.label ? item.label + ' shortcut' : 'Shortcut',
    className: 'set-shortcut-field'
  });
  // Written on blur rather than on every keystroke: Windows saves the
  // combination when you leave the box, not as you type, and a half-typed "Win"
  // has no business being the stored shortcut.
  field.addEventListener('blur', function () {
    ops.write(item.key, field.value);
  });
  el.appendChild(field);
  return {
    el: el,
    sync: function () {
      var current = ops.value(item.key);
      if (field.value !== current) {
        field.value = current;
      }
    }
  };
}

// The text-size preview on Display: a box showing sample text at the size you
// have chosen, the small A and the large A with the slider between them, the
// sentence Windows writes under it, and Apply.
//
// Apply is the whole point of the shape, and the reason it is worth building
// rather than dropping in a plain slider: nothing is written to the store until
// Apply is pressed, so the size on screen is a preview of a change, not a change
// made. That is why the button is greyed until the slider has been moved - which
// is what a screenshot of the page with nothing touched shows.
function textSampleControl(item, ops) {
  var el = row('set-row--sample');
  var box = document.createElement('div');
  box.className = 'set-sample-box';
  var text = document.createElement('span');
  text.className = 'set-sample-text';
  text.textContent = item.sample || 'Sample text';
  box.appendChild(text);
  el.appendChild(box);

  var scale = document.createElement('div');
  scale.className = 'set-sample-scale';
  var small = document.createElement('span');
  small.className = 'set-sample-a set-sample-a--small';
  small.textContent = 'A';
  var lane = document.createElement('div');
  lane.className = 'set-sample-lane';
  var input = document.createElement('input');
  input.type = 'range';
  input.className = 'set-slider';
  input.min = String(item.min);
  input.max = String(item.max);
  input.step = String(item.step || 1);
  input.setAttribute('aria-label', (item.label || 'Text size'));
  lane.appendChild(input);
  var large = document.createElement('span');
  large.className = 'set-sample-a set-sample-a--large';
  large.textContent = 'A';
  scale.appendChild(small);
  scale.appendChild(lane);
  scale.appendChild(large);
  el.appendChild(scale);

  var note = document.createElement('p');
  note.className = 'set-text';
  note.textContent = item.hint ||
    'Drag the slider until the sample text is easy to read, then click Apply.';
  el.appendChild(note);

  var apply = document.createElement('button');
  apply.type = 'button';
  apply.className = 'set-button';
  apply.textContent = 'Apply';
  el.appendChild(apply);

  // What is in the store, which is what the preview is a preview *of*. It is the
  // only thing the preview compares against, so it is read rather than kept.
  function applied() {
    return ops.value(item.key);
  }
  function paint(value) {
    // 100% is the size the rest of Settings is drawn at, so the preview grows
    // from there rather than from zero.
    text.style.fontSize = (value / 100 * 16) + 'px';
    apply.disabled = value === applied();
  }

  var slider = attachSlider(input, {
    min: item.min,
    max: item.max,
    step: item.step || 1,
    write: function () {
      // Deliberately not a write: the store changes when Apply is pressed.
      paint(Number(input.value));
    },
    paint: function (value) {
      paint(value);
    }
  });

  apply.addEventListener('click', function () {
    ops.write(item.key, Number(input.value));
  });

  return {
    el: el,
    sync: function () {
      slider.sync(ops.value(item.key));
    },
    dispose: slider.dispose
  };
}

function paragraph(className, text) {
  var el = document.createElement('p');
  el.className = className;
  el.textContent = text || '';
  return { el: el };
}

// The map of kinds to builders. Every entry in schema.js's KINDS is here, and
// tools/check_settings.js fails if a page names a kind this table does not have
// - which is the only thing standing between a typo and a control that silently
// does not appear.
var BUILDERS = {
  toggle: switchControl,
  ruleRow: ruleRowControl,
  checkbox: checkboxControl,
  select: selectControl,
  slider: sliderControl,
  textSample: textSampleControl,
  shortcutBox: shortcutBoxControl,
  radio: radioControl,
  button: buttonControl,
  link: linkControl,
  helpLinks: helpLinksControl,
  text: function (item) { return paragraph('set-text', item.text); },
  note: function (item) { return paragraph('set-note', item.text); }
};

// The kinds whose builder lives in widgets.js, because they draw a list of rows
// and need the shell to answer questions (what is installed, how full the disk
// is) rather than just a stored value.
export var WIDGET_KINDS = [
  'appsList', 'startupList', 'perAppList', 'quickActions', 'lockStatusApps',
  'defaultApps', 'deviceList', 'pairedDevices', 'appVolumeList', 'cameraList',
  'accountList', 'languageList', 'sitePermissions', 'featureList',
  'protectionRow', 'protectionHistory', 'storageDrive', 'storageList',
  'dataUsage', 'displayBoxes', 'backgroundPreview', 'backgroundPicker',
  'colourPicker', 'lockPreview', 'themePreview', 'themePicker', 'appsFilter',
  'startupSort', 'startupBackground', 'usageChart', 'specList', 'clock',
  'profileCard', 'colorsPreview', 'colourRow', 'albumPicker', 'themeGallery'
];

// Built here and filled in by widgets.js when it loads, so a page can name any
// kind without the two files having to import each other.
var widgets = {};
export function registerWidgets(map) {
  Object.keys(map).forEach(function (kind) {
    widgets[kind] = map[kind];
  });
}

export function hasBuilder(kind) {
  return !!(BUILDERS[kind] || widgets[kind]);
}

// The default a control starts at when it is first drawn, which is what the
// store would answer if nothing had been stored. Exposed so the shell can show
// a control before the store has finished loading.
export function startingValue(item) {
  return defaultOf(item);
}

export function buildItem(item, ops) {
  var build = BUILDERS[item.kind] || widgets[item.kind];
  if (!build) {
    // Unreachable while tools/check_settings.js is run: it fails on a kind with
    // no builder. Kept because "the page is blank" is the worst possible
    // failure for a screen full of settings, and this says so rather than
    // leaving an unexplained gap.
    var missing = document.createElement('p');
    missing.className = 'set-note set-note--missing';
    missing.textContent = 'This setting has no control (' + item.kind + ').';
    return { el: missing };
  }
  var control = build(item, ops);
  if (control && typeof control.sync === 'function') {
    control.sync();
  }
  // The label belongs beside most controls but inside the ones that draw their
  // own - a switch puts the word in the switch, a radio group is a list of
  // named answers - so the builder decides whether it needs one wrapped round.
  //
  // `labelHidden` is the other half of that: Windows sometimes puts the name of
  // a control in the heading above it rather than beside it, so the words are
  // there for the reader's benefit and for search, but not drawn twice.
  if (control && control.el && item.label && !item.labelHidden && !LABELLED_INSIDE[item.kind]) {
    var wrap = row('set-row--labelled');
    var label = document.createElement('div');
    label.className = 'set-row-label';
    label.textContent = item.label;
    wrap.appendChild(label);
    wrap.appendChild(control.el);
    control.el = wrap;
  }
  if (item.note) {
    var note = document.createElement('p');
    note.className = 'set-note';
    note.textContent = item.note;
    control.el.appendChild(note);
  }
  // A control Windows has greyed out because this machine cannot use it - every
  // projection setting on a PC that does not receive Miracast - is drawn exactly
  // as it is and simply stops answering. Disabling the elements rather than
  // drawing a separate "greyed" version is what stops a keydown or a stray
  // routed click from reaching a setting that is not there.
  if (item.disabled && control.el) {
    control.el.classList.add('is-disabled');
    control.el.setAttribute('aria-disabled', 'true');
    control.el.querySelectorAll('button, input, select, textarea').forEach(function (node) {
      node.disabled = true;
    });
  }
  return control;
}

// Kinds that draw their own label, so wrapping one in a labelled row would
// either duplicate the words or leave the control's own heading stranded.
var LABELLED_INSIDE = {
  checkbox: true,
  radio: true,
  ruleRow: true,
  helpLinks: true,
  shortcutBox: true,
  textSample: true,
  // A slider and a drop-down put their label above themselves rather than
  // beside them, which is what Windows does and what buildItem's two-column
  // wrapper cannot give them: in an `auto` column a full-width track collapses
  // to the width of whatever sits next to it.
  slider: true,
  select: true,
  quickActions: true,
  lockStatusApps: true,
  appsList: true,
  startupList: true,
  perAppList: true,
  defaultApps: true,
  appsFilter: true,
  startupSort: true,
  startupBackground: true,
  usageChart: true,
  specList: true,
  profileCard: true,
  clock: true,
  languageList: true,
  sitePermissions: true,
  protectionHistory: true,
  storageDrive: true,
  storageList: true,
  storageDrive: true,
  dataUsage: true,
  displayBoxes: true,
  backgroundPreview: true,
  backgroundPicker: true,
  colourPicker: true,
  colourRow: true,
  albumPicker: true,
  lockPreview: true,
  themePreview: true,
  themePicker: true,
  featureList: true,
  cameraList: true,
  pairedDevices: true,
  appVolumeList: true,
};
