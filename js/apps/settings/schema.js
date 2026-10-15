// What a setting means, and what may be stored in one.
//
// Kept apart from the store (js/apis/settings-store.js) and from the pages that
// declare the settings, because this is the one piece of Settings that is pure:
// given an item and a value off disk it answers what the value should be, with
// no volume and no DOM. That is what makes it checkable under node.
//
// The rule it exists to enforce: **a stored value is only ever used if the
// setting that declares it still offers it.** A profile written by an older
// build, or a file someone edited by hand, must not be able to put a control
// into a state it has no way back out of - a dropdown showing a choice that is
// not in its list, a slider clamped outside its own range, a toggle set to a
// string. Anything unrecognised falls back to the declared default, which is
// also what "never set" means.

// Every kind of control a page may declare.
//
// It lives here rather than in the control builder because the two have to
// agree and nothing at runtime checks that they do: a page naming a kind the
// builder does not know draws nothing at all, and draws nothing *quietly*. So
// the list is data, the builder implements every entry, and
// tools/check_settings.js fails if a page declares a kind that is not on it.
//
// `value` says whether the kind holds a value that is persisted. One that does
// needs a `key` (or, for a list of per-app switches, a `keyPrefix`); one that
// does not must not have either, and the checker enforces both directions.
export var KINDS = {
  // --- hold a value under one key ---
  toggle: { value: true },
  checkbox: { value: true },
  slider: { value: true },
  select: { value: true },
  radio: { value: true },
  swatches: { value: true },
  backgroundPicker: { value: true },
  colourPicker: { value: true },
  themePicker: { value: true },
  protectionRow: { value: true },
  // The shapes the 1903 pages are actually made of, which the simpler kinds
  // above cannot describe:
  //   - a rule row: an icon, what triggers it, what it will do, and a switch
  //     (Focus assist's automatic rules);
  //   - a keyboard shortcut: its name, the grey "Windows shortcut" caption, and
  //     a box holding the keys (Game bar);
  //   - the text-size preview: a box showing sample text, the two A's, the
  //     slider, and Apply (Display).
  ruleRow: { value: true },
  shortcutBox: { value: true },
  textSample: { value: true },

  // --- hold a value per entry, under a key prefix ---
  // These are the pages that list many switches: one per app to allow camera
  // access, one per app to start at sign-in. Each entry gets its own key, built
  // from the prefix and the entry's id, so a page of forty switches is still
  // forty independent settings rather than one growing object.
  quickActions: { value: true, list: true },
  lockStatusApps: { value: true, list: true },
  appsList: { value: true, list: true },
  startupList: { value: true, list: true },
  perAppList: { value: true, list: true },

  // --- ask the shell to do something ---
  button: { value: false },
  link: { value: false },

  // --- draw something that is not a control ---
  text: { value: false },
  note: { value: false },
  // "Get help" and "Give feedback", each with the mark Windows puts beside it.
  // The pair travels together on every page that has them, so it is one item
  // rather than two buttons a page has to remember to put in the same group.
  helpLinks: { value: false },
  specList: { value: false },
  usageChart: { value: false },
  storageUsage: { value: false },
  storageBreakdown: { value: false },
  dataUsage: { value: false },
  sitePermissions: { value: false },
  profileCard: { value: false },
  clock: { value: false },
  languageList: { value: false },
  deviceList: { value: false },
  appVolumeList: { value: false },
  accountList: { value: false },
  cameraList: { value: false },
  featureList: { value: false },
  protectionHistory: { value: false },
  displayBoxes: { value: false },
  backgroundPreview: { value: false },
  lockPreview: { value: false },
  themePreview: { value: false },
  appsFilter: { value: false },
  startupSort: { value: false },
  startupBackground: { value: false },
  defaultApps: { value: false }
};

export function isKnownKind(kind) {
  return Object.prototype.hasOwnProperty.call(KINDS, kind);
}

// The key a value-holding item is stored under, or '' for one that is not.
// A list item has a prefix rather than a key: the key is made per entry.
export function keyOf(item) {
  if (!item) {
    return '';
  }
  if (item.key) {
    return item.key;
  }
  return KINDS[item.kind] && KINDS[item.kind].list ? (item.keyPrefix || '') : '';
}

// The default for an item that does not name one, by kind. Every kind that
// holds a value has an answer here, so an item can leave `default` out without
// the table being unsure what an unset setting is.
var KIND_DEFAULTS = {
  toggle: false,
  ruleRow: false,
  checkbox: false,
  slider: 0,
  // The text-size preview is a slider wearing a box, so it starts where Windows
  // starts: at the size it already is.
  textSample: 100,
  // A keyboard shortcut starts as the combination Windows has already assigned.
  shortcutBox: '',
  select: '',
  radio: '',
  text: '',
  number: 0,
  // A row that draws something in this accent - a chosen picture, an accent
  // colour, a protection tile - is unset until it is pointed at something.
  swatches: 'default',
  backgroundPicker: '',
  colourPicker: '',
  themePicker: '',
  protectionRow: ''
};

export function defaultOf(item) {
  if (item && Object.prototype.hasOwnProperty.call(item, 'default')) {
    return item.default;
  }
  var byKind = KIND_DEFAULTS[item && item.kind];
  if (typeof byKind === 'function') {
    return byKind(item);
  }
  // Arrays and objects are copied per item so one item's default can never be
  // mutated into another's - the toggle list on the lock screen page is exactly
  // the kind of thing that would be edited in place.
  return Array.isArray(byKind) ? byKind.slice() : byKind;
}

// The set of values an item will accept, or null when it takes anything of its
// own type. An empty option list on a select means the options live elsewhere
// (a build function), so nothing can be checked and only the type is.
function allowedValues(item) {
  if (item.kind === 'toggle' || item.kind === 'checkbox' || item.kind === 'ruleRow') {
    return [true, false];
  }
  if (item.kind === 'select' || item.kind === 'radio') {
    if (!Array.isArray(item.options) || item.options.length === 0) {
      return null;
    }
    return item.options.map(function (option) {
      return option && typeof option === 'object' ? option.value : option;
    });
  }
  if (item.kind === 'swatches') {
    return null;
  }
  return null;
}

// The value an item should actually show, given what is on disk. Never throws
// and never returns undefined for a known kind: a setting that cannot be
// resolved is a setting showing its default, not a blank control.
export function coerce(item, raw) {
  if (raw === undefined || raw === null) {
    return defaultOf(item);
  }
  if (item.kind === 'toggle' || item.kind === 'checkbox' || item.kind === 'ruleRow') {
    return typeof raw === 'boolean' ? raw : defaultOf(item);
  }
  if (item.kind === 'number') {
    var num = Number(raw);
    return isFinite(num) ? num : defaultOf(item);
  }
  if (item.kind === 'shortcutBox') {
    // A key combination is whatever the reader typed. It is not checked against
    // a list, because the list is the thing being edited: there is no answer
    // that can be called wrong here.
    return String(raw);
  }
  // The text-size preview holds a number in a fixed range, exactly as the plain
  // slider it wraps does, so it is clamped and stepped by the same code rather
  // than having a second rule of its own to keep in step.
  if (item.kind === 'slider' || item.kind === 'textSample') {
    var val = Number(raw);
    if (!isFinite(val)) {
      return defaultOf(item);
    }
    var min = numberOr(item.min, 0);
    var max = numberOr(item.max, 100);
    // A step is a multiple of itself from the minimum, not from zero, so a
    // slider that starts at 5 and steps by 5 lands on 5, 10, 15 - snapping to a
    // multiple of 5 from zero would offer 0, which is off the end.
    var step = numberOr(item.step, 1);
    if (step > 0) {
      val = min + Math.round((val - min) / step) * step;
    }
    return Math.max(min, Math.min(max, val));
  }
  if (item.kind === 'select' || item.kind === 'radio') {
    if (typeof raw !== 'string') {
      return defaultOf(item);
    }
    var allowed = allowedValues(item);
    if (!allowed || allowed.indexOf(raw) >= 0) {
      return raw;
    }
    return defaultOf(item);
  }
  if (item.kind === 'swatches' || item.kind === 'text') {
    return typeof raw === 'string' ? raw : defaultOf(item);
  }
  if (item.kind === 'protectionRow') {
    // A protection tile is "on this device" or "not checked"; anything else is
    // a file that was edited rather than a state the page knows how to show.
    return raw === 'protected' || raw === 'attention' ? raw : defaultOf(item);
  }
  return raw;
}

function numberOr(value, fallback) {
  var num = Number(value);
  return isFinite(num) ? num : fallback;
}

// The value a control writes: the same value shown, so a switch that is on and
// pressed goes off rather than storing something the page cannot show.
export function normalize(item, value) {
  return coerce(item, value);
}

// --- Lookup ----------------------------------------------------------------

// A flat page list, built once. Every page is reachable both ways: from a
// category (for the nav pane) and by id alone (for a link, a search hit, and a
// launch argument).
//
// Two rules fall out of the way Windows lays Settings out. `extras` are pages
// reached only by a link - Night light, Advanced display - which is where
// Windows puts them too, so they are findable but not drawn in the nav. And a
// page id belongs to the *first* category that claims it: Cortana is a tile on
// the home screen and a page inside Search at the same time, and letting the
// second claim overwrite the first would move it in the nav.
export function indexPages(categories, extras) {
  var byId = {};
  var order = [];
  var navOrder = [];
  function add(page, category, drawInNav) {
    if (!page || !page.id || byId[page.id]) {
      return;
    }
    // The category is recorded on the page rather than passed around beside
    // it, so a page found by id still knows where it sits in the nav.
    var entry = {
      id: page.id,
      title: page.title,
      glyph: page.glyph,
      // The sub-heading a page sits under in the nav pane. Windows nests part of
      // the Privacy pane - "App permissions" holds six rows of its own - and a
      // flat list would flatten a hierarchy that is there on purpose.
      navGroup: page.navGroup || '',
      groups: page.groups || [],
      categoryId: category.id,
      categoryTitle: category.title,
      blurb: page.blurb || '',
      rail: page.rail || [],
      // True when the page only has a route, no row in the nav pane.
      hidden: !drawInNav
    };
    byId[page.id] = entry;
    order.push(entry);
    if (drawInNav) {
      navOrder.push(entry);
    }
  }
  categories.forEach(function (category) {
    // A navHidden category contributes its pages to the Home grid without
    // contributing a group to the nav pane.
    var drawInNav = !category.navHidden;
    (category.pages || []).forEach(function (page) {
      add(page, category, drawInNav);
    });
  });
  (extras || []).forEach(function (group) {
    // A sub-page is attached to the category whose page links to it, which the
    // caller declares: only the page that links here knows where a reader who
    // arrives would expect the nav to take them back to.
    var owner = categoryById(categories, group.categoryId) || { id: '', title: '' };
    (group.pages || []).forEach(function (page) {
      add(page, owner, false);
    });
  });
  return { byId: byId, order: order, navOrder: navOrder };
}

export function pageById(index, id) {
  return index.byId[id] || null;
}

// The categories with their pages, for the nav pane and the Home grid.
export function categoryById(categories, id) {
  for (var i = 0; i < categories.length; i++) {
    if (categories[i].id === id) {
      return categories[i];
    }
  }
  return null;
}

// Every declared setting under a page, flattened to
// { path, item, pageId, categoryId, label }. Used to build the defaults table
// and to search; `label` is what "Find a setting" matches against, so it has to
// be the text the user can see rather than the storage path.
export function settingsOfPage(page) {
  var out = [];
  (page.groups || []).forEach(function (group) {
    (group.items || []).forEach(function (item) {
      if (!item.key) {
        return;
      }
      out.push({
        path: item.key,
        item: item,
        pageId: page.id,
        categoryId: page.categoryId,
        pageTitle: page.title,
        categoryTitle: page.categoryTitle,
        groupTitle: group.title || '',
        label: item.label || group.title || page.title
      });
    });
  });
  return out;
}

export function settingsOfCategory(index, categoryId) {
  var out = [];
  index.order.forEach(function (page) {
    if (page.categoryId === categoryId) {
      out = out.concat(settingsOfPage(page));
    }
  });
  return out;
}

// Every default on one page, as path -> value. This is what a first boot shows
// and what "Restore defaults" puts back, taken from the declarations rather
// than from a second hand-written table that could drift away from them.
export function defaultsOfPage(page) {
  var defaults = {};
  (page.groups || []).forEach(function (group) {
    (group.items || []).forEach(function (item) {
      // A list kind has no single default: its entries are switches, made at
      // runtime from whatever is installed, and each one is stored under its
      // own key. There is nothing here to be the default of.
      if (item.key && !(KINDS[item.kind] && KINDS[item.kind].list)) {
        defaults[item.key] = defaultOf(item);
      }
    });
  });
  return defaults;
}

export function defaultsOfCategory(index, categoryId) {
  var defaults = {};
  index.order.forEach(function (page) {
    if (page.categoryId === categoryId) {
      var pageDefaults = defaultsOfPage(page);
      Object.keys(pageDefaults).forEach(function (key) {
        defaults[key] = pageDefaults[key];
      });
    }
  });
  return defaults;
}

// --- "Find a setting" ------------------------------------------------------

// A setting is findable by its own label, the label of the group it sits in, the
// page it is on and the category that page belongs to - which is what makes
// typing "notifications" find the toggle on System > Notifications & actions
// without the toggle itself having to say the word.
var STOP_WORDS = /\b(the|and|for|with|from|your|you|this|that|when|what|which|are|was|were|will|have|has)\b/g;

function tokensOf(text) {
  return String(text || '')
    .toLowerCase()
    .replace(STOP_WORDS, ' ')
    .split(/[^a-z0-9+]+/)
    .filter(function (word) { return word.length > 0; });
}

// Ranked search over the whole catalogue: every declared setting, and every
// page.
//
// Pages are in the index because "Default apps" is a thing you go to in
// Settings, and a search that found no such thing when asked for "default apps"
// would be answering a narrower question than the box is asking. A page hit
// carries `pageHit: true` and no `path`, so the caller can draw it as a
// destination rather than as a setting to change.
//
// A setting is scored on where the words were found: its own name beats the
// group it sits in, which beats the page, which beats the category. Ties break
// on the shorter label, so "Night light" wins over "Night light (off until
// 9:00 PM)" for the same words.
export function searchSettings(index, query, limit) {
  var words = tokensOf(query);
  var max = limit || 25;
  if (!words.length) {
    return [];
  }
  var results = [];
  index.order.forEach(function (page) {
    settingsOfPage(page).forEach(function (entry) {
      var score = scoreEntry(entry, words);
      if (score > 0) {
        results.push({ entry: entry, score: score });
      }
    });
  });
  // A page outranks a setting of the same name, because going to the page is
  // the more useful answer and is what Windows does.
  index.order.forEach(function (page) {
    var score = scorePage(page, words);
    if (score > 0) {
      results.push({ entry: pageHit(page), score: score });
    }
  });
  results.sort(function (a, b) {
    return (b.score - a.score) || a.entry.label.length - b.entry.label.length;
  });
  return results.slice(0, max).map(function (hit) {
    return hit.entry;
  });
}

// A page, dressed as a result. It borrows the shape of a setting hit so the
// result list has one thing to draw, and says which it is.
function pageHit(page) {
  return {
    path: '',
    pageId: page.id,
    categoryId: page.categoryId,
    pageTitle: page.title,
    categoryTitle: page.categoryTitle,
    groupTitle: '',
    label: page.title,
    pageHit: true
  };
}

function scorePage(page, words) {
  var title = tokensOf(page.title);
  var category = tokensOf(page.categoryTitle);
  var blurb = tokensOf(page.blurb);
  var score = 0;
  var matchedAll = true;
  words.forEach(function (word) {
    var best = 0;
    if (contains(title, word)) { best = 120; }
    else if (contains(category, word)) { best = 40; }
    else if (contains(blurb, word)) { best = 25; }
    if (best === 0) {
      matchedAll = false;
      return;
    }
    score += best;
  });
  if (!matchedAll) {
    return 0;
  }
  var titleText = String(page.title || '').toLowerCase();
  var phrase = String(words.join(' '));
  if (titleText.indexOf(phrase) >= 0) {
    score += 50;
  }
  if (titleText.indexOf(phrase) === 0) {
    score += 25;
  }
  return score;
}

function scoreEntry(entry, words) {
  var labelTokens = tokensOf(entry.label);
  var group = tokensOf(entry.groupTitle);
  var page = tokensOf(entry.pageTitle);
  var category = tokensOf(entry.categoryTitle);
  var score = 0;
  var matchedAll = true;
  words.forEach(function (word) {
    var best = 0;
    if (contains(labelTokens, word)) { best = 100; }
    else if (contains(group, word)) { best = 60; }
    else if (contains(page, word)) { best = 30; }
    else if (contains(category, word)) { best = 20; }
    if (best === 0) {
      // Every word has to land somewhere. A setting that matches two of the
      // three words typed is not a hit for all three, and a result list that
      // said it was would be lying about what was searched for.
      matchedAll = false;
      return;
    }
    score += best;
  });
  if (!matchedAll) {
    return 0;
  }
  // Credit for matching the phrase as written, and more for *starting* with it.
  // Without the second part "night light" is a tie between the Night light
  // switch and the "Schedule night light" drop-down - both contain both words -
  // and the tiebreak on label length then prefers the shorter, which is the
  // drop-down. A setting whose name begins with what was typed is the one meant.
  var labelText = String(entry.label || '').toLowerCase();
  var phrase = String(words.join(' '));
  if (labelText.indexOf(phrase) >= 0) {
    score += 50;
  }
  if (labelText.indexOf(phrase) === 0) {
    score += 25;
  }
  return score;
}

function contains(tokens, word) {
  for (var i = 0; i < tokens.length; i++) {
    // A word typed in full matches a label word that starts with it, so
    // "batt" finds "battery"; a label word never matches a longer word typed.
    if (tokens[i] === word || tokens[i].indexOf(word) === 0) {
      return true;
    }
  }
  return false;
}