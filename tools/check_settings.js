// Checks the Settings catalogue: that it is internally consistent, that every
// control it declares is one that exists, that every link goes somewhere, and
// that a stored value can never put a control into a state it cannot leave.
//
// It is pure, so it runs under node with no browser and no shell. The point of
// building it this way is that a mistake in 14 categories of declared settings
// is otherwise only findable by pressing every switch by hand.
//
// Run: node tools/check_settings.js

import { CATEGORIES, NAV_CATEGORIES, INDEX, pageById, allDefaults, normalizePageId, HOME_PAGE_ID } from '../js/apps/settings/catalogue.js';
import { KINDS, isKnownKind, keyOf, defaultOf, coerce, searchSettings } from '../js/apps/settings/schema.js';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as GLYPHS from '../js/apps/settings/glyphs.js';

var checks = 0;
var failures = [];

function ok(label, condition, detail) {
  checks += 1;
  if (!condition) {
    failures.push(label + (detail ? '\n    ' + detail : ''));
  }
}

function eq(label, got, want) {
  checks += 1;
  var a = JSON.stringify(got);
  var b = JSON.stringify(want);
  if (a !== b) {
    failures.push(label + '\n    got:  ' + a + '\n    want: ' + b);
  }
}

// --- the shape of the catalogue --------------------------------------------

ok('there are categories', CATEGORIES.length > 0);
// Thirteen, as Windows has since 19H2 removed Cortana. A fourteenth would be a
// tile for a feature the machine cannot have.
ok('the home screen has thirteen categories, as Windows has',
  CATEGORIES.length === 13, 'got ' + CATEGORIES.length);
ok('there is no Cortana tile, because Cortana left Windows in 19H2',
  CATEGORIES.every(function (category) { return category.id !== 'cortanaHome'; }));

var seenCategoryIds = {};
// A page names its glyph the way the page is named - "appsFeatures",
// "cameraPrivacy" - and the builder resolves that to the export in glyphs.js
// by turning it into upper snake case. Converting it here as well is what lets
// a typo in a glyph name be a failed check rather than a blank icon on screen.
function exportNameFor(glyph) {
  return String(glyph || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toUpperCase() + '_SVG';
}

CATEGORIES.forEach(function (category) {
  ok('category has an id', !!(category && category.id), JSON.stringify(category && category.title));
  ok('category has a title', !!(category && category.title));
  ok('category has a blurb', !!(category && category.blurb), category && category.id);
  ok('category "' + (category && category.id) + '" has a unique id',
    !seenCategoryIds[category.id]);
  seenCategoryIds[category.id] = true;
  ok('category "' + category.id + '" has a glyph that exists (' + exportNameFor(category.glyph) + ')',
    typeof GLYPHS[exportNameFor(category.glyph)] === 'string');
  ok('category "' + category.id + '" has pages', (category.pages || []).length > 0);
});

// Every category that is not navHidden must appear in the nav, in order.
eq('the nav has one row per visible category', NAV_CATEGORIES.length,
  CATEGORIES.filter(function (category) { return !category.navHidden; }).length);

function pageGlyph(page) {
  return exportNameFor(page.glyph);
}

// --- pages -----------------------------------------------------------------

var pageIds = {};
INDEX.order.forEach(function (page) {
  ok('page "' + page.id + '" has a title', !!page.title);
  ok('page "' + page.id + '" has a glyph that exists',
    typeof GLYPHS[pageGlyph(page)] === 'string', 'glyph: ' + page.glyph);
  ok('page "' + page.id + '" has at least one group', (page.groups || []).length > 0);
  ok('page id "' + page.id + '" is unique', !pageIds[page.id], 'also declared by ' + pageIds[page.id]);
  pageIds[page.id] = page.categoryId;
});

ok('every nav page is drawn in the nav', INDEX.navOrder.length > 0);
INDEX.order.forEach(function (page) {
  if (!page.hidden) {
    var inNav = INDEX.navOrder.indexOf(page) >= 0;
    ok('page "' + page.id + '" claims to be visible and is', inNav);
  }
});

// --- items -----------------------------------------------------------------

var keys = {};
var kindsUsed = {};
INDEX.order.forEach(function (page) {
  page.groups.forEach(function (group) {
    // A group with no heading is a real thing in Windows: the four switches at the
  // top of Snap, the sentence above Focus assist's answers, the PC name on
  // Projecting to this PC. Only the id has to be there to name it in a failure.
  ok('group "' + (group.id || '') + '" in "' + page.id + '" has an id', !!group.id, JSON.stringify(group));
    ok('group "' + (group.id || group.title) + '" has items', (group.items || []).length > 0);
    group.items.forEach(function (item, at) {
      var where = page.id + ' > ' + (group.title || group.id) + ' > item ' + at;
      ok('item kind "' + item.kind + '" is one that exists (' + where + ')', isKnownKind(item.kind));
      kindsUsed[item.kind] = (kindsUsed[item.kind] || 0) + 1;
      var holdsValue = KINDS[item.kind] && KINDS[item.kind].value;
      if (holdsValue) {
        var key = keyOf(item);
        ok('a ' + item.kind + ' names where its value is stored (' + where + ')', !!key);
        // A key may be declared twice only when it is the same setting shown in
        // two places - which Windows does, and which is why the Airplane mode
        // page carries the Wi-Fi switch as well as the Wi-Fi page. Two different
        // settings sharing a key would mean one silently wins.
        if (key) {
          // A list kind's key is a prefix for entries made at runtime, not a
          // setting in its own right, so it is not a duplicate of anything and
          // has no default to compare against.
          if (KINDS[item.kind].list) {
            ok('a list prefix is a prefix (' + where + ')', key === item.keyPrefix);
          } else {
            var seenAt = keys[key];
            ok('key "' + key + '" holds one setting (' + where + ')',
              !seenAt || seenAt.kind === item.kind && seenAt.label === item.label,
              seenAt ? 'already declared as a ' + seenAt.kind + ' labelled "' + seenAt.label + '"' : '');
            if (!seenAt) {
              keys[key] = { kind: item.kind, label: item.label, where: where };
            }
          }
        }
      } else {
        ok('a ' + item.kind + ' stores no value (' + where + ')', !item.key && !item.keyPrefix);
      }
      if (item.kind === 'select' || item.kind === 'radio') {
        ok('a ' + item.kind + ' offers options (' + where + ')', Array.isArray(item.options) && item.options.length > 0);
        var values = {};
        (item.options || []).forEach(function (option) {
          var value = typeof option === 'object' ? option.value : option;
          ok('option "' + value + '" is offered once (' + where + ')', !values[value]);
          values[value] = true;
        });
        ok('a ' + item.kind + ' has a default that it offers (' + where + ')',
          Object.prototype.hasOwnProperty.call(values, defaultOf(item)),
          'default is ' + JSON.stringify(defaultOf(item)) + ', options are ' + JSON.stringify(Object.keys(values)));
      }
      if (item.kind === 'slider') {
        ok('a slider has a maximum above its minimum (' + where + ')', Number(item.max) > Number(item.min));
        ok('a slider has a step (' + where + ')', Number(item.step) > 0);
        var d = Number(defaultOf(item));
        ok('a slider default is inside its own range (' + where + ')',
          d >= item.min && d <= item.max, 'default ' + d + ' in [' + item.min + ',' + item.max + ']');
      }
      if (item.kind === 'link' && item.to) {
        ok('link "' + item.label + '" goes to a page that exists (' + where + ')',
          !!pageById(item.to), 'to: ' + item.to);
      }
    });
  });
});

// A page's help rail is not a group, so the loop above never sees it - and a
// rail link to a page nobody has is a link that lands on Home, which is the same
// failure the category tiles had.
INDEX.order.forEach(function (page) {
  (page.rail || []).forEach(function (section, at) {
    var where = page.id + ' > rail ' + (section.title || at);
    ok('a rail section has a heading (' + where + ')', !!section.title);
    ok('a rail section has something in it (' + where + ')',
      !!section.text || (section.links || []).length > 0);
    (section.links || []).forEach(function (link) {
      ok('rail link "' + link.label + '" says where it goes (' + where + ')',
        !!(link.to || link.action));
      ok('rail link "' + link.label + '" goes to a page that exists (' + where + ')',
        !link.to || !!pageById(link.to), 'to: ' + link.to);
    });
  });
});

// The nav pane draws a sub-heading once and indents the rows under it, so a
// page declaring one has to sit with the others that share it. A run broken by
// an unrelated page in the middle would draw the heading twice and strand one
// row outside it.
CATEGORIES.forEach(function (category) {
  var seen = {};
  var open = '';
  (category.pages || []).forEach(function (page) {
    var group = page.navGroup || '';
    if (group !== open) {
      ok('"' + category.title + '" opens "' + group + '" only once',
        !group || !seen[group], 'page: ' + page.id);
      seen[group] = true;
      open = group;
    }
  });
});

// Every kind the builder knows must actually be used, or it is dead weight.
Object.keys(KINDS).forEach(function (kind) {
  ok('kind "' + kind + '" is used by at least one page', kindsUsed[kind] > 0);
});

// --- every class the app draws is a class the stylesheet knows --------------
//
// A class the JS emits and the CSS does not define does not throw and does not
// look wrong in a diff. It draws as an unstyled element: a <button> with no rule
// is centred by the UA, so "Default apps" rendered each file type as a line of
// text floating in the middle of an empty box. Nothing else in the app would
// have noticed.
//
// The scan reads the two files rather than a hand-written list, so a class added
// to a widget is covered the moment it is added. Classes the JS emits only as a
// modifier are still expected to exist - a modifier with no base rule is the same
// mistake wearing a hat.
var HERE = dirname(fileURLToPath(import.meta.url));
var SETTINGS_DIR = join(HERE, '..', 'js', 'apps', 'settings');

function jsFilesIn(dir) {
  var out = [];
  readdirSync(dir, { withFileTypes: true }).forEach(function (entry) {
    var full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out = out.concat(jsFilesIn(full));
    } else if (entry.name.endsWith('.js')) {
      out.push(full);
    }
  });
  return out;
}

var settingsCss = readFileSync(join(HERE, '..', 'css', 'settings.css'), 'utf8');
var classScan = {};
jsFilesIn(SETTINGS_DIR).forEach(function (file) {
  var text = readFileSync(file, 'utf8');
  // Matches any set- token. A token that appears only as part of a custom
  // property name (--set-accent) is not a class and is filtered out below.
  var found = text.match(/set-[a-z0-9-]+/g) || [];
  found.forEach(function (name) {
    classScan[name] = true;
  });
});
Object.keys(classScan).sort().forEach(function (name) {
  // A custom property is written with two dashes; a class is written with one
  // and a dot in the stylesheet.
  var isProperty = settingsCss.indexOf('--' + name) >= 0;
  ok('class "' + name + '" has a rule in settings.css',
    isProperty || settingsCss.indexOf('.' + name) >= 0);
});

// And the other way: a class the stylesheet defines that nothing emits is a rule
// that can never apply. Not an error - modifiers are often written up front - but
// worth being able to see, so it is counted rather than hidden.
//
// A modifier whose name is assembled at runtime counts as emitted when its base
// is: Game bar's recording switch is `'set-switch--' + variant`, so
// .set-switch--amber is drawn by a page that only ever writes "set-switch".
var emitted = Object.keys(classScan);
var unusedRules = [];
var ruleRe = /\.((?:set)-[a-z0-9-]+)/g;
var ruleMatch;
while ((ruleMatch = ruleRe.exec(settingsCss))) {
  var name = ruleMatch[1];
  if (emitted.indexOf(name) >= 0) {
    continue;
  }
  // The base of a modifier: everything before the last "--".
  var base = name.replace(/--[a-z0-9-]+$/, '');
  if (base !== name && emitted.indexOf(base) >= 0) {
    continue;
  }
  unusedRules.push(name);
}
checks += 1;
if (unusedRules.length) {
  console.log('  note: ' + unusedRules.length + ' rule(s) in settings.css are not emitted by any ' +
    'module today: ' + unusedRules.join(', '));
}

// --- coercion: a stored value can never strand a control --------------------

var toggle = { kind: 'toggle' };
eq('an unset toggle is off', coerce(toggle, undefined), false);
eq('a stored true stays true', coerce(toggle, true), true);
eq('a stored "true" is not a toggle being true', coerce(toggle, 'true'), false);
eq('a stored 1 is not a toggle being true', coerce(toggle, 1), false);

var select = { kind: 'select', default: 'b', options: [{ value: 'a' }, { value: 'b' }] };
eq('an unset select takes its default', coerce(select, undefined), 'b');
eq('a stored option is kept', coerce(select, 'a'), 'a');
eq('an option that no longer exists falls back', coerce(select, 'z'), 'b');
eq('a number is not an option', coerce(select, 3), 'b');

var slider = { kind: 'slider', min: 0, max: 100, step: 25, default: 0 };
eq('a slider default is honoured', coerce(slider, undefined), 0);
eq('a slider clamps high', coerce(slider, 4000), 100);
eq('a slider clamps low', coerce(slider, -4000), 0);
eq('a slider snaps to its step', coerce(slider, 60), 50);
eq('a slider snaps down as well as up', coerce(slider, 70), 75);
eq('a slider rejects nonsense', coerce(slider, 'bright'), 0);
eq('a slider rejects NaN', coerce(slider, NaN), 0);

// A slider that does not start at zero must step from its own minimum, or it
// offers a value below where it begins.
var offset = { kind: 'slider', min: 5, max: 25, step: 5, default: 5 };
eq('an offset slider steps from its minimum', coerce(offset, 12), 10);
eq('an offset slider never offers below its minimum', coerce(offset, 2), 5);

// A per-app switch is stored under a prefix and one key per entry, so there is
// no whole-item value to coerce - which is the point of splitting it that way.
eq('a per-app list stores no value of its own', keyOf({ kind: 'perAppList', keyPrefix: 'privacy.camera.app' }), 'privacy.camera.app');
eq('a per-app list with no prefix stores nothing', keyOf({ kind: 'perAppList' }), '');
eq('a control that stores nothing names no key', keyOf({ kind: 'text' }), '');

// --- defaults --------------------------------------------------------------

var defaults = allDefaults();
eq('there are defaults', Object.keys(defaults).length > 100, true);
Object.keys(defaults).forEach(function (key) {
  checks += 1;
  if (defaults[key] === undefined) {
    failures.push('default for "' + key + '" is undefined - a setting with no value to show');
  }
});
// Every key the store can hold is one the catalogue declared.
eq('every declared key has a default', Object.keys(defaults).length, Object.keys(keys).length);

// --- searching -------------------------------------------------------------

eq('an empty query finds nothing', searchSettings(INDEX, '').length, 0);
eq('a query of stop words finds nothing', searchSettings(INDEX, 'the and for').length, 0);
eq('nonsense finds nothing', searchSettings(INDEX, 'qqqqzzzz').length, 0);

var night = searchSettings(INDEX, 'night light');
ok('"night light" finds something', night.length > 0);
// The page outranks the setting, which is Windows' own answer: "Night light"
// names a page you go to.
eq('"night light" finds the night light page first', night[0] && night[0].pageId, 'nightlight');
var nightSetting = night.filter(function (hit) { return !hit.pageHit; });
ok('"night light" finds the night light setting too', nightSetting.length > 0);
eq('and the setting is the one that switches it on',
  nightSetting[0] && nightSetting[0].path, 'display.nightLight');
ok('a hit carries where it lives', night[0] && !!pageById(night[0].pageId));

ok('typing a category name finds something', searchSettings(INDEX, 'privacy').length > 0);
ok('typing a page name finds something', searchSettings(INDEX, 'default apps').length > 0);
ok('a hyphenated page name finds something', searchSettings(INDEX, 'notifications actions').length > 0);
ok('a prefix matches', searchSettings(INDEX, 'notif').length > 0);
ok('every word has to land somewhere',
  searchSettings(INDEX, 'night light zzzzz').length === 0);
ok('words may be given in any order',
  searchSettings(INDEX, 'light night').length === searchSettings(INDEX, 'night light').length);

// A hit must always be somewhere the user can actually go.
searchSettings(INDEX, 'toggle on off brightness night battery volume default apps').forEach(function (hit) {
  ok('search hit "' + hit.label + '" is on a page that exists', !!pageById(hit.pageId));
});

// "Find a setting" finds pages too, because a page is a thing you go to.
var defaultHits = searchSettings(INDEX, 'default apps');
ok('a page is findable', defaultHits.length > 0);
ok('the page itself is among its own results',
  defaultHits.some(function (hit) { return hit.pageHit && hit.pageId === 'defaultApps'; }));
ok('a page hit names no setting', defaultHits.filter(function (hit) { return hit.pageHit; })
  .every(function (hit) { return hit.path === ''; }));
ok('a page outranks a setting of the same name',
  defaultHits[0].pageHit === true, 'first hit is "' + defaultHits[0].label + '"');

// --- addressing a page -----------------------------------------------------

eq('nothing is Home', normalizePageId(''), HOME_PAGE_ID);
eq('nothing is Home, spelled as null', normalizePageId(null), HOME_PAGE_ID);
eq('a page id reaches its page', normalizePageId('display'), 'display');
eq('a page id is case-insensitive', normalizePageId('DISPLAY'), 'display');
// Every page must be reachable by the id the rest of the app knows it by. A page
// whose id does not survive its own lookup is not "hard to link to" - it is a
// door onto Home, because navigate() treats a null as Home and a home tile that
// lands on Home looks exactly like a tile that does nothing. Most ids are
// camelCase, so most ids used to fail this.
INDEX.order.forEach(function (page) {
  eq('page "' + page.id + '" is reachable by its own id', normalizePageId(page.id), page.id);
});
// And the category tiles are exactly this: each one navigates to a page id.
CATEGORIES.forEach(function (category) {
  var target = category.goto || (category.pages && category.pages[0] && category.pages[0].id);
  ok('the "' + category.title + '" tile goes somewhere that exists', !!pageById(target),
    'to: ' + target);
  eq('the "' + category.title + '" tile resolves', normalizePageId(target), target);
});
eq('a page id tolerates being trimmed', normalizePageId('  display '), 'display');
eq('a route reaches its page', normalizePageId('system/display'), 'display');
eq('a route with backslashes reaches its page', normalizePageId('system\\display'), 'display');
eq('a page title reaches its page', normalizePageId('Start-up'), 'startup');
eq('a category title reaches its first page', normalizePageId('Personalisation'), 'background');
eq('a page nobody has', normalizePageId('no-such-page'), null);
eq('Home by name is Home', normalizePageId('home'), HOME_PAGE_ID);

// --- report ----------------------------------------------------------------

if (failures.length) {
  console.error('Settings catalogue has ' + failures.length + ' problem(s) out of ' + checks + ' checks:\n');
  failures.forEach(function (line) { console.error('  - ' + line); });
  process.exit(1);
}
console.log('Settings catalogue is sound: ' + checks + ' checks passed, ' +
  CATEGORIES.length + ' categories, ' + INDEX.order.length + ' pages, ' +
  Object.keys(defaults).length + ' settings, ' + Object.keys(kindsUsed).length + ' control kinds.');