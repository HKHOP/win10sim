// What Settings contains.
//
// Every category, every page and every setting is *declared*, not drawn: the
// pages modules below are data, and this file turns that data into the two
// shapes the app needs - a list of categories for the home grid and the nav
// pane, and a flat index by page id so a link, a search hit or a launch
// argument can name a page directly.
//
// The declaration is also the schema. A setting's default, the values it will
// accept and the text "Find a setting" matches it against all come from the one
// place it is written down, which is why they cannot drift apart.

import {
  SYSTEM,
  SYSTEM_PAGES
} from './pages/system.js';
import {
  DEVICES
} from './pages/devices.js';
import {
  NETWORK,
  PHONE
} from './pages/network.js';
import {
  PERSONALISATION
} from './pages/personalisation.js';
import {
  APPS,
  APPS_EXTRA_PAGES
} from './pages/apps.js';
import {
  ACCOUNTS,
  ACCOUNTS_EXTRA_PAGES,
  TIME_LANGUAGE
} from './pages/accounts.js';
import {
  GAMING,
  EASE_OF_ACCESS,
  SEARCH,
  CORTANA
} from './pages/personal.js';
import {
  PRIVACY,
  PRIVACY_EXTRA_PAGES,
  UPDATE_SECURITY,
  UPDATE_EXTRA_PAGES
} from './pages/security.js';

import {
  indexPages,
  searchSettings,
  defaultsOfPage,
  defaultsOfCategory,
  coerce,
  defaultOf
} from './schema.js';

// The home screen order, which is also the order the categories are read in
// below. It is Windows' own order - the two columns of pairs, then Privacy and
// Update & Security on the last row - because a Settings that ordered its tiles
// differently would be the thing you notice first.
//
// Cortana is here because Windows puts it here, and navHidden because Windows
// shows Cortana as a home tile *and* as a page inside Search rather than as a
// nav group of its own. It navigates to the page Search already owns; see
// indexPages' note on a page id belonging to the first category that claims it.
export var CATEGORIES = [
  SYSTEM,
  DEVICES,
  PHONE,
  NETWORK,
  PERSONALISATION,
  APPS,
  ACCOUNTS,
  TIME_LANGUAGE,
  GAMING,
  EASE_OF_ACCESS,
  SEARCH,
  {
    id: 'cortanaHome',
    title: 'Cortana',
    blurb: 'Cortana language, permissions, notifications',
    glyph: 'cortana',
    // The tile's target is the Cortana page that Search owns, so the home
    // screen and the nav pane cannot drift into showing two Cortanas.
    goto: 'cortana',
    navHidden: true,
    pages: [CORTANA]
  },
  PRIVACY,
  UPDATE_SECURITY
];

// The categories the nav pane draws, in the same order. A home-only tile is not
// a nav group.
export var NAV_CATEGORIES = CATEGORIES.filter(function (category) {
  return !category.navHidden;
});

// Pages reached by a link but not drawn in the nav, which is where Windows puts
// them. Declared separately from the category's own list so the nav cannot grow
// a row Windows does not have.
var EXTRA_PAGES = [
  { categoryId: 'system', pages: subPages(SYSTEM, SYSTEM_PAGES) },
  { categoryId: 'apps', pages: APPS_EXTRA_PAGES },
  { categoryId: 'accounts', pages: ACCOUNTS_EXTRA_PAGES },
  { categoryId: 'privacy', pages: PRIVACY_EXTRA_PAGES },
  { categoryId: 'update', pages: UPDATE_EXTRA_PAGES }
];

// Everything in `all` that is not already one of `category`'s own nav pages.
function subPages(category, all) {
  var own = {};
  (category.pages || []).forEach(function (page) {
    own[page.id] = true;
  });
  return all.filter(function (page) {
    return !own[page.id];
  });
}

export var INDEX = indexPages(CATEGORIES, EXTRA_PAGES);

export function pageById(id) {
  return INDEX.byId[id] || null;
}

export { searchSettings, defaultsOfPage, defaultsOfCategory, coerce, defaultOf };

// Every declared setting on the machine, as path -> default. What a first boot
// shows, and what "Restore defaults" puts back.
export function allDefaults() {
  var defaults = {};
  INDEX.order.forEach(function (page) {
    var pageDefaults = defaultsOfPage(page);
    Object.keys(pageDefaults).forEach(function (key) {
      defaults[key] = pageDefaults[key];
    });
  });
  return defaults;
}

// A page id is anything in the index. Home is not a page: it is the absence of
// one, and Windows treats it as the root the back button returns to.
export var HOME_PAGE_ID = '';

// What a link, a search hit or a launch argument may name a page by: its id
// ("display"), the route the nav shows it at ("system/display"), or its title
// ("Start-up"). Anything else answers null rather than guessing - landing on
// Home for a page name that does not exist would hide the mistake behind
// something that looks like it worked.
export function normalizePageId(raw) {
  var text = String(raw == null ? '' : raw).trim().toLowerCase();
  if (!text || text === 'home') {
    return HOME_PAGE_ID;
  }
  if (INDEX.byId[text]) {
    return text;
  }
  // A route is "<category>/<page>"; the page id is what is left after the
  // category, and the category is only there to say where in the nav it sits.
  var segments = text.split(/[\\/]+/).filter(function (part) { return !!part; });
  if (segments.length > 1) {
    var last = segments[segments.length - 1];
    if (INDEX.byId[last]) {
      return last;
    }
  }
  var byTitle = INDEX.order.filter(function (page) {
    return page.title.toLowerCase() === text || page.categoryTitle.toLowerCase() === text;
  });
  return byTitle.length ? byTitle[0].id : null;
}