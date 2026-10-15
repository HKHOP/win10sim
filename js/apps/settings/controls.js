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
import { attachSlider } from './sliderdrag.js';

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
function switchControl(item, ops) {
  var el = row('set-row--switch');
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
  field.addEventListener('click', function () {
    ops.write(item.key, !ops.value(item.key));
  });
  el.appendChild(field);

  return {
    el: el,
    sync: function () {
      var on = ops.value(item.key) === true;
      field.setAttribute('aria-checked', on ? 'true' : 'false');
      field.setAttribute('aria-label', (item.label || 'Setting') + ': ' + (on ? 'on' : 'off'));
      state.textContent = on ? 'On' : 'Off';
      // The class goes on the switch itself, not the row, so that this and the
      // compact switches down a list of apps are told "on" the same way and one
      // CSS rule can move both knobs.
      field.classList.toggle('is-on', on);
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
  box.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
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
// that comes down over the page when pressed.
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
    menu.remove();
    menu = null;
    field.setAttribute('aria-expanded', 'false');
    el.classList.remove('is-open');
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
    el.appendChild(menu);
    field.setAttribute('aria-expanded', 'true');
    el.classList.add('is-open');
    // A press outside the control puts the list away, the way any drop-down
    // does. isSiteChromePress is asked about first: a press on the virtual
    // keyboard is about the device, not about what is open on the screen.
    setTimeout(function () {
      document.addEventListener('mousedown', outside, true);
    }, 0);
  }
  function outside(event) {
    if (el.contains(event.target)) {
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
    dispose: function () {
      document.removeEventListener('mousedown', outside, true);
    }
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
  var input = document.createElement('input');
  input.type = 'range';
  input.className = 'set-slider';
  input.min = String(item.min);
  input.max = String(item.max);
  input.step = String(item.step || 1);
  input.setAttribute('aria-label', item.label || 'Setting');
  var readout = document.createElement('span');
  readout.className = 'set-slider-value';
  track.appendChild(input);
  track.appendChild(readout);
  el.appendChild(track);

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
    }
  });

  return {
    el: el,
    sync: function () {
      slider.sync(ops.value(item.key));
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
function buttonControl(item, ops) {
  var button = document.createElement('button');
  button.type = 'button';
  button.className = 'set-button' + (item.variant === 'primary' ? ' set-button--primary' : '');
  button.textContent = item.label || '';
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
  button.textContent = item.label || '';
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
  checkbox: checkboxControl,
  select: selectControl,
  slider: sliderControl,
  radio: radioControl,
  button: buttonControl,
  link: linkControl,
  text: function (item) { return paragraph('set-text', item.text); },
  note: function (item) { return paragraph('set-note', item.text); }
};

// The kinds whose builder lives in widgets.js, because they draw a list of rows
// and need the shell to answer questions (what is installed, how full the disk
// is) rather than just a stored value.
export var WIDGET_KINDS = [
  'appsList', 'startupList', 'perAppList', 'quickActions', 'lockStatusApps',
  'defaultApps', 'deviceList', 'deviceRow', 'appVolumeList', 'cameraList',
  'accountList', 'languageList', 'sitePermissions', 'featureList',
  'protectionRow', 'protectionHistory', 'storageUsage', 'storageBreakdown',
  'dataUsage', 'displayBoxes', 'backgroundPreview', 'backgroundPicker',
  'colourPicker', 'lockPreview', 'themePreview', 'themePicker', 'appsFilter',
  'startupSort', 'startupBackground', 'usageChart', 'specList', 'clock',
  'profileCard', 'swatches'
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
  if (control && control.el && item.label && !LABELLED_INSIDE[item.kind]) {
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
  return control;
}

// Kinds that draw their own label, so wrapping one in a labelled row would
// either duplicate the words or leave the control's own heading stranded.
var LABELLED_INSIDE = {
  checkbox: true,
  radio: true,
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
  storageUsage: true,
  storageBreakdown: true,
  dataUsage: true,
  displayBoxes: true,
  backgroundPreview: true,
  backgroundPicker: true,
  colourPicker: true,
  lockPreview: true,
  themePreview: true,
  themePicker: true,
  featureList: true,
  cameraList: true,
  appVolumeList: true,
  swatches: true
};