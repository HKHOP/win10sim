// What Microsoft Edge can reach.
//
// There is no internet in this world. The taskbar says so, the network API has
// nothing behind it, and a browser that invented pages would teach the wrong
// thing. So this module is the whole of the web as far as Edge is concerned: the
// handful of pages the browser carries with itself, one website that ships with
// Windows, and - for every other address in existence - the page a browser shows
// when the network is not there.

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

var SCHEMES = /^(https?|edge|about|file|ftp|data):/i;

// What Edge does with a search, and with anything typed into the address bar
// that is not an address: a word or two is a search, anything with a dot in it
// is a web address and is given https, the way Edge does.
export function normalizeAddress(text) {
  var value = String(text == null ? '' : text).trim();
  if (!value) {
    return '';
  }
  if (SCHEMES.test(value)) {
    return value;
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
  var hit = BUILT_IN[key.replace(/\/$/, '')] || BUILT_IN[key];
  if (hit) {
    return { page: hit.page, url: url, title: hit.title, query: '' };
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

// The name an address goes by where the browser shows one: a website is named by
// its host, and an edge page is its own name, the way a browser shows it.
export function hostOf(url) {
  var value = String(url || '');
  if (!/^https?:\/\//i.test(value)) {
    return value;
  }
  var match = /^https?:\/\/([^/]+)/i.exec(value);
  return match ? match[1] : value;
}

export function isInternal(url) {
  return /^(edge|about):/i.test(String(url || ''));
}