// What Microsoft Edge can reach.
//
// There is no internet in this world. The taskbar says so, the network API has
// nothing behind it, and a browser that invented pages would teach the wrong
// thing. So this module is the whole of the web as far as Edge is concerned: the
// handful of pages the browser carries with itself, one website that ships with
// Windows, the files on this machine that file:// addresses name, and - for
// every other address in existence - the page a browser shows when there is
// nothing to reach.
//
// It is also where the browser's rules about addresses live, because a rule about
// what an address may be is a rule about what Edge can reach:
//
//   - javascript: and vbscript: are never run. Edge takes the scheme off an
//     address bar entry that carries one and searches for the rest, which is
//     what a paste of a javascript: URL gets you.
//   - An address in a scheme this browser has no handler for is refused before
//     anything tries it, by name. Edge says "no handler" rather than "no
//     network", and the difference is the whole of the message.
//   - A file:// address is a place on this machine, and it is only ever
//     reachable from somewhere that is allowed to reach it. See mayNavigate.
//
// fileurl.js does the arithmetic of the file addresses themselves; this file
// only decides that they are addresses worth resolving.

import { fileUrlFor, pathOf, resolveFileUrl } from './fileurl.js';

// The new tab page's own address, which Edge does have.
export var NEW_TAB_URL = 'edge://newtab';

// Where a search goes. The page it lands on says there are no results, which is
// true here.
export var SEARCH_URL = 'https://www.bing.com/search?q=';

// The pages Edge carries, and the one address Windows ships with a browser.
var BUILT_IN = {
  'edge://newtab': { page: 'newtab', title: 'New tab' },
  'edge://favorites': { page: 'favorites', title: 'Favorites' },
  'edge://history': { page: 'history', title: 'History' },
  'edge://downloads': { page: 'downloads', title: 'Downloads' },
  'edge://settings': { page: 'settings', title: 'Settings' },
  'edge://about': { page: 'about', title: 'About Microsoft Edge' },
  'about:edge': { page: 'about', title: 'About Microsoft Edge' },
  'https://www.microsoft.com': { page: 'microsoft', title: 'Microsoft' }
};

// The schemes this browser has a handler for. Anything else with a scheme at
// all is refused by name, the way Edge refuses an address it has no program for.
var HANDLED = /^(https?|edge|about|file):/i;

// Schemes that must never run, whatever asks for them. Edge strips the scheme
// from one of these in the address bar and searches for what is left.
var NEVER_RUN = /^(javascript|vbscript):/i;

// A scheme of any kind, which is how a refused address is recognised.
//
// Two or more characters, because that is what a scheme is: RFC 3986 puts no
// upper limit on the first letter but requires one after it. It is also what
// keeps "C:\Users\User\a.html" out of this - a single letter and a colon is a
// drive, which is the only thing on this machine that looks like one, and a
// drive is not a URL scheme.
var ANY_SCHEME = /^([a-zA-Z][a-zA-Z0-9+.-]+):/;

// A Windows path as a person types it: C:\Users\... or \\server\share.
var WINDOWS_PATH = /^(?:[a-zA-Z]:[\\/]|\\\\)/;

export function schemeOf(text) {
  var match = ANY_SCHEME.exec(String(text == null ? '' : text).trim());
  return match ? match[1].toLowerCase() : '';
}

// What Edge does with a search, and with anything typed into the address bar
// that is not an address: a word or two is a search, anything with a dot in it is
// a web address and is given https, and a Windows path is a file:// address,
// because that is what a person typing C:\ means to say.
export function normalizeAddress(text) {
  var value = String(text == null ? '' : text).trim();
  if (!value) {
    return '';
  }
  // javascript: and vbscript: never run. What is left of the address is
  // searched for, which is what Edge does with a paste of one.
  var run = /^javascript\s*:/i.exec(value) || /^vbscript\s*:/i.exec(value);
  if (run) {
    return SEARCH_URL + encodeURIComponent(value.slice(run[0].length).trim());
  }
  // A scheme this browser handles is taken as typed.
  if (HANDLED.test(value)) {
    return value;
  }
  // Any other scheme is passed on untouched to be refused by resolve(), which
  // knows how to name it. Refusing it here instead would leave the address bar
  // holding something the page cannot explain.
  if (ANY_SCHEME.test(value)) {
    return value;
  }
  // A path on this machine, however it was typed.
  if (WINDOWS_PATH.test(value)) {
    return fileUrlFor(value.replace(/\//g, '\\'));
  }
  if (/\s/.test(value)) {
    return SEARCH_URL + encodeURIComponent(value);
  }
  if (value.indexOf('.') > 0) {
    return 'https://' + value;
  }
  // A single word with no dot is a search in Edge, not a web address.
  return SEARCH_URL + encodeURIComponent(value);
}

// The answer for one address: which page draws it, what the tab calls itself,
// and whether the network is what stopped it.
export function resolve(address) {
  var url = normalizeAddress(address);
  if (!url) {
    return { page: 'newtab', url: NEW_TAB_URL, title: 'New tab', query: '' };
  }
  // Addresses are matched without regard to case, the way a browser matches them,
  // while the address bar keeps showing what was actually typed.
  var key = url.toLowerCase();
  if (key.indexOf(SEARCH_URL) === 0) {
    var words = url.slice(SEARCH_URL.length).replace(/\+/g, ' ');
    return {
      page: 'search',
      url: url,
      title: decodeURIComponent(words) + ' - Search',
      query: decodeURIComponent(words)
    };
  }
  // A file on this machine. It is the one address here that resolves to
  // something real, so it is resolved here rather than refused.
  if (/^file:/i.test(url)) {
    var local = resolveFileUrl(url);
    if (!local) {
      return refused(url, 'file', 'The address does not name a place on this computer.');
    }
    return {
      page: 'file',
      url: local.url,
      path: local.path,
      title: local.name,
      query: ''
    };
  }
  var hit = BUILT_IN[key.replace(/\/$/, '')] || BUILT_IN[key];
  if (hit) {
    return { page: hit.page, url: url, title: hit.title, query: '' };
  }
  // An address in a scheme with no handler behind it. Edge refuses these by name
  // rather than reporting a network failure: nothing went wrong with the
  // network - there is nothing here that could open such an address at all.
  //
  // The test is whether THIS browser has a handler for the scheme, not whether
  // the address is one of the built-in rooms: an ordinary https address has a
  // handler and is simply unreachable, which is a different message from an
  // ftp: address having no way to be opened at all.
  var scheme = schemeOf(url);
  if (scheme && !HANDLED.test(url)) {
    return refused(url, scheme, 'Edge has no program on this computer that can open ' + scheme + ': addresses.');
  }
  // Everything else is a page that cannot be reached, because there is nothing
  // out there to reach.
  return {
    page: 'error',
    url: url,
    title: url.replace(/^https?:\/\//i, '') + ' - Microsoft Edge',
    query: ''
  };
}

function refused(url, scheme, why) {
  return { page: 'blocked', url: url, scheme: scheme, title: url + ' - Microsoft Edge', query: '', why: why };
}

// Whether the browser will go from one kind of page to another, on a page's
// say-so rather than the address bar's.
//
// The rule that matters is the one Edge has had since it gave local files an
// origin of their own: a document from the web may not hand the browser a
// file:// address, because a page on the web must not be able to reach what is
// on your disk. Typing one into the address bar is not the same thing at all -
// that is the person asking - so it is the address bar that is unguarded here,
// and only links inside a page that are checked.
//
// A local document may follow a link to another local document, which is how a
// folder of files with pages in it works. The browser's own rooms are given the
// same trust, because they are the browser's own and hold no links of their own.
export function mayNavigate(fromPage, toUrl) {
  if (!/^file:/i.test(String(toUrl || ''))) {
    return true;
  }
  return LOCAL_OR_OWN.indexOf(fromPage) >= 0;
}

// The pages that stand on the same side of the rule as a local file: the
// browser's own rooms, and the local file itself.
//
// The two that are NOT here are the important part of the list. `microsoft` is a
// stand-in for a website and `search` is a page of results, so both are the web
// as far as this rule is concerned - a browser that let a search results page
// open a local file would have given the whole web a way onto the disk.
var LOCAL_OR_OWN = ['file', 'newtab', 'favorites', 'history', 'downloads', 'settings', 'about'];

// The name an address goes by where the browser shows one: a website is named by
// its host, an edge page is its own name, and a file is named by its own path -
// the way a browser shows it, because the whole of a file address is its name.
export function hostOf(url) {
  var value = String(url || '');
  if (/^file:/i.test(value)) {
    return pathOf(value) || value;
  }
  if (!/^https?:\/\//i.test(value)) {
    return value;
  }
  var match = /^https?:\/\/([^/]+)/i.exec(value);
  return match ? match[1] : value;
}

export function isInternal(url) {
  return /^(edge|about):/i.test(String(url || ''));
}

// Whether the address is one that names a file rather than a page of the web,
// which is what the browser's own menus ask when they offer to save or print.
export function isLocalFile(url) {
  return /^file:/i.test(String(url || ''));
}