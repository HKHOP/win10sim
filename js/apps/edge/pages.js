// The pages Edge carries with itself: the ones the browser answers without
// asking the network for anything.
//
// They are drawn in Edge's own way - a heading, then the content - because that
// is what they are: not websites, the browser's own rooms.

import { hostOf } from './net.js';
import {
  FAVORITE_SVG,
  HISTORY_SVG,
  DOWNLOAD_SVG,
  SETTING_SVG,
  HELP_SVG,
  SEARCH_SVG,
  DELETE_SVG,
  COLLECTIONS_SVG
} from './edgeglyphs.js';

var EDGE_VERSION = 'Microsoft Edge 42.0.0.2062 (64-bit)';

function shell(className, heading, children) {
  var page = document.createElement('div');
  page.className = 'edge-page ' + className;
  var title = document.createElement('h1');
  title.className = 'edge-page-title';
  title.textContent = heading;
  page.appendChild(title);
  (children || []).forEach(function (child) {
    page.appendChild(child);
  });
  return page;
}

function empty(art, heading, line) {
  var box = document.createElement('div');
  box.className = 'edge-empty';
  var glyph = document.createElement('div');
  glyph.className = 'edge-empty-art';
  glyph.innerHTML = art;
  var words = document.createElement('div');
  var title = document.createElement('p');
  title.className = 'edge-empty-title';
  title.textContent = heading;
  var note = document.createElement('p');
  note.className = 'edge-empty-note';
  note.textContent = line;
  words.appendChild(title);
  words.appendChild(note);
  box.appendChild(glyph);
  box.appendChild(words);
  return box;
}

function rows(entries, emptyArt, emptyHeading, emptyLine) {
  if (!entries.length) {
    return empty(emptyArt, emptyHeading, emptyLine);
  }
  var list = document.createElement('div');
  list.className = 'edge-rows';
  entries.forEach(function (entry) {
    var row = document.createElement('button');
    row.type = 'button';
    row.className = 'edge-row';
    var art = document.createElement('span');
    art.className = 'edge-row-art';
    art.innerHTML = entry.art;
    var name = document.createElement('span');
    name.className = 'edge-row-name';
    name.textContent = entry.name;
    var where = document.createElement('span');
    where.className = 'edge-row-where';
    where.textContent = entry.where;
    row.appendChild(art);
    row.appendChild(name);
    row.appendChild(where);
    row.addEventListener('click', function () {
      entry.action();
    });
    list.appendChild(row);
  });
  return list;
}

function settingsSection(title, entries) {
  var section = document.createElement('section');
  section.className = 'edge-settings-group';
  var head = document.createElement('h2');
  head.textContent = title;
  var table = document.createElement('dl');
  entries.forEach(function (entry) {
    var name = document.createElement('dt');
    name.textContent = entry[0];
    var value = document.createElement('dd');
    value.textContent = entry[1];
    table.appendChild(name);
    table.appendChild(value);
  });
  section.appendChild(head);
  section.appendChild(table);
  return section;
}

function favorites(ops) {
  var page = shell('edge-favorites', 'Favorites', []);
  page.appendChild(rows(ops.favorites(), FAVORITE_SVG, 'No favorites yet',
    'A favorite is a page you keep here for quick access. The pages Edge carries cannot be reached from here.'));
  return page;
}

function history(ops) {
  var seen = ops.visited().filter(function (row) {
    return row.url.indexOf('edge://') !== 0;
  });
  var page = shell('edge-history', 'History', []);
  page.appendChild(rows(seen.map(function (row) {
    return {
      art: SEARCH_SVG,
      name: row.title || hostOf(row.url),
      where: hostOf(row.url),
      action: function () { ops.onNavigate(row.url); }
    };
  }), HISTORY_SVG, 'No history yet', 'Pages you visit are listed here, most recent first.'));
  return page;
}

function downloads(ops) {
  var page = shell('edge-downloads', 'Downloads', []);
  var list = ops.downloads();
  page.appendChild(rows(list, DOWNLOAD_SVG, 'Nothing has been downloaded',
    'Files you download are listed here, and so is the folder they go to.'));
  if (list.length) {
    var note = document.createElement('p');
    note.className = 'edge-page-note';
    note.textContent = 'Downloading needs a network, and this computer does not have one.';
    page.appendChild(note);
  }
  return page;
}

function settings() {
  var page = shell('edge-settings', 'Settings', []);
  page.appendChild(settingsSection('Appearance', [
    ['Theme', 'Light'],
    ['Zoom', '100%'],
    ['Show favourites bar', 'Off']
  ]));
  page.appendChild(settingsSection('Search', [
    ['Search engine used in the address bar', 'Bing'],
    ['Search suggestions', 'Off']
  ]));
  page.appendChild(settingsSection('Privacy and security', [
    ['Send a "Do Not Track" request', 'Off'],
    ['SmartScreen filter', 'On']
  ]));
  page.appendChild(settingsSection('Downloads', [
    ['Location', 'C:\\Users\\User\\Downloads'],
    ['Ask where to save each file', 'Off']
  ]));
  page.appendChild(settingsSection('About', [
    ['Version', EDGE_VERSION],
    ['Profile', 'Personal - not signed in']
  ]));
  var note = document.createElement('p');
  note.className = 'edge-page-note';
  note.textContent = 'There are no settings left to change here: a browser with no network has very little to be tuned.';
  page.appendChild(note);
  return page;
}

function about(ops) {
  var page = shell('edge-about', 'About Microsoft Edge', []);
  var box = document.createElement('div');
  box.className = 'edge-about';
  var mark = document.createElement('img');
  mark.className = 'edge-about-mark';
  mark.src = 'assets/microsoft-edge.png';
  mark.alt = '';
  mark.draggable = false;
  var words = document.createElement('div');
  var version = document.createElement('p');
  version.className = 'edge-about-version';
  version.textContent = EDGE_VERSION;
  var line = document.createElement('p');
  line.className = 'edge-about-line';
  line.textContent = 'Microsoft Edge is the browser this computer uses. It is not connected to the internet, so the only pages it can show are the ones it carries with it.';
  var pages = document.createElement('p');
  pages.className = 'edge-about-line';
  pages.textContent = 'Try edge://favorites, edge://history, edge://downloads or edge://settings in the address bar.';
  words.appendChild(version);
  words.appendChild(line);
  words.appendChild(pages);
  box.appendChild(mark);
  box.appendChild(words);
  page.appendChild(box);
  return page;
}

function microsoft(ops) {
  var page = shell('edge-site', 'Microsoft', []);
  var banner = document.createElement('div');
  banner.className = 'edge-site-banner';
  var mark = document.createElement('span');
  mark.className = 'edge-site-word';
  mark.textContent = 'Microsoft';
  banner.appendChild(mark);
  page.appendChild(banner);
  var lead = document.createElement('p');
  lead.className = 'edge-site-lead';
  lead.textContent = 'This is the one website that comes with Windows. It is here to prove the point: nothing else out there can be reached.';
  page.appendChild(lead);
  page.appendChild(rows([
    {
      art: HELP_SVG,
      name: 'About Microsoft Edge',
      where: 'edge://about',
      action: function () { ops.onNavigate('edge://about'); }
    },
    {
      art: SETTING_SVG,
      name: 'Settings',
      where: 'edge://settings',
      action: function () { ops.onNavigate('edge://settings'); }
    },
    {
      art: COLLECTIONS_SVG,
      name: 'Favorites',
      where: 'edge://favorites',
      action: function () { ops.onNavigate('edge://favorites'); }
    }
  ], DELETE_SVG, 'Nothing to show', 'Everything else is unreachable.'));
  return page;
}

function search(entry, ops) {
  var page = shell('edge-site', entry.query + ' - Search', []);
  var none = document.createElement('div');
  none.className = 'edge-empty';
  var glyph = document.createElement('div');
  glyph.className = 'edge-empty-art';
  glyph.innerHTML = SEARCH_SVG;
  var words = document.createElement('div');
  var title = document.createElement('p');
  title.className = 'edge-empty-title';
  title.textContent = 'There are no results for "' + entry.query + '"';
  var note = document.createElement('p');
  note.className = 'edge-empty-note';
  note.textContent = 'Searching needs the internet, and this computer does not have any.';
  words.appendChild(title);
  words.appendChild(note);
  none.appendChild(glyph);
  none.appendChild(words);
  page.appendChild(none);
  return page;
}

// What every page is given: a way to navigate, the browser's own record of where
// it has been, and the rooms that hold what it has kept. Built here rather than
// in the window because it is the pages' side of the browser, not the window's.
export function createPageOps(deps) {
  return {
    onNavigate: deps.go,
    visited: deps.visited,
    favorites: function () {
      return deps.favorites.map(function (row) {
        return {
          art: FAVORITE_SVG,
          name: row.title,
          where: hostOf(row.url),
          action: function () { deps.go(row.url); }
        };
      });
    },
    downloads: function () {
      return [];
    }
  };
}

// Which page draws what. The one thing every page needs is a way back into the
// browser's own rooms, so each is given the same operations.
export function buildPage(page, entry, ops) {
  switch (page) {
    case 'favorites':
      return favorites(ops);
    case 'history':
      return history(ops);
    case 'downloads':
      return downloads(ops);
    case 'settings':
      return settings();
    case 'about':
      return about(ops);
    case 'microsoft':
      return microsoft(ops);
    case 'search':
      return search(entry, ops);
    default:
      return null;
  }
}