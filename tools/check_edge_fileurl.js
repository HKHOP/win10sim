// A check for the file:// arithmetic Edge uses to name a local file. Pure, so it
// runs under node without the shell.
//
// Run: node tools/check_edge_fileurl.js

import {
  fileUrlFor,
  pathOf,
  resolveFileUrl,
  leafOf,
  dirOf,
  resolveReference,
  isFollowable
} from '../js/apps/edge/fileurl.js';
import {
  normalizeAddress,
  resolve,
  mayNavigate,
  SEARCH_URL
} from '../js/apps/edge/net.js';

var checks = 0;
var failures = [];

function eq(label, got, want) {
  checks += 1;
  var a = JSON.stringify(got);
  var b = JSON.stringify(want);
  if (a !== b) {
    failures.push(label + '\n    got:  ' + a + '\n    want: ' + b);
  }
}

// --- path -> URL, the way a browser writes it in the address bar ---
eq('drive root', fileUrlFor('C:\\'), 'file:///C:/');
eq('a folder is marked as one', fileUrlFor('C:\\Users\\User\\Documents', true), 'file:///C:/Users/User/Documents/');
eq('a file is not', fileUrlFor('C:\\Users\\User\\Documents\\a.html'), 'file:///C:/Users/User/Documents/a.html');
eq('lowercase drive is raised', fileUrlFor('c:\\Temp', true), 'file:///C:/Temp/');
eq('space is encoded', fileUrlFor('C:\\My Documents\\a.html'), 'file:///C:/My%20Documents/a.html');
eq('trailing separator is not doubled', fileUrlFor('C:\\Users\\', true), 'file:///C:/Users/');

// --- URL -> path, every spelling a browser accepts ---
eq('three slashes', pathOf('file:///C:/Users/User/a.html'), 'C:\\Users\\User\\a.html');
eq('two slashes', pathOf('file://C:/Users/User/a.html'), 'C:\\Users\\User\\a.html');
eq('one slash', pathOf('file:/C:/Users/User/a.html'), 'C:\\Users\\User\\a.html');
eq('no slash', pathOf('file:C:/Users/User/a.html'), 'C:\\Users\\User\\a.html');
eq('backslashes as typed', pathOf('file:///C:\\Users\\User\\a.html'), 'C:\\Users\\User\\a.html');
eq('localhost authority', pathOf('file://localhost/C:/Users/a.html'), 'C:\\Users\\a.html');
eq('percent-encoded space', pathOf('file:///C:/My%20Documents/a.html'), 'C:\\My Documents\\a.html');
eq('root', pathOf('file:///C:/'), 'C:\\');
eq('root bare drive', pathOf('file:///C:'), 'C:\\');

// --- refused ---
eq('no drive is refused', pathOf('file:///Users/User/a.html'), null);
eq('not a file url', pathOf('https://example.com'), null);
eq('a stray percent is a literal', pathOf('file:///C:/100%/a.html'), 'C:\\100%\\a.html');

// --- the whole answer ---
var r = resolveFileUrl('file:///C:/Users/User/Documents/page.html');
eq('resolved name', r.name, 'page.html');
eq('resolved dir', r.dir, 'C:\\Users\\User\\Documents\\');
eq('resolved url round-trips', r.url, 'file:///C:/Users/User/Documents/page.html');
eq('refused address resolves to nothing', resolveFileUrl('file:///nope'), null);

// --- leaves and folders ---
eq('leaf of file', leafOf('C:\\Users\\User\\a.html'), 'a.html');
eq('leaf of root', leafOf('C:\\'), '');
eq('dir of file', dirOf('C:\\Users\\User\\a.html'), 'C:\\Users\\User\\');
eq('dir of root', dirOf('C:\\'), 'C:\\');

// --- a reference inside a document ---
var docs = 'C:\\Users\\User\\Documents\\';
eq('sibling', resolveReference(docs, 'other.html'), 'C:\\Users\\User\\Documents\\other.html');
eq('subfolder', resolveReference(docs, 'sub/other.html'), 'C:\\Users\\User\\Documents\\sub\\other.html');
eq('up one', resolveReference(docs, '../Desktop/a.html'), 'C:\\Users\\User\\Desktop\\a.html');
// Two ups out of Documents is the account folder's parent, not the account: the
// first ".." is Documents, the second is User.
eq('up two', resolveReference(docs, '../../Music/a.html'), 'C:\\Users\\Music\\a.html');
eq('absolute root path', resolveReference(docs, '/C:/Temp/a.html'), 'C:\\Temp\\a.html');
eq('absolute drive root', resolveReference(docs, '/C:/'), 'C:\\');
eq('dot slash', resolveReference(docs, './a.html'), 'C:\\Users\\User\\Documents\\a.html');
eq('dot dot in the middle', resolveReference(docs, 'sub/../a.html'), 'C:\\Users\\User\\Documents\\a.html');
eq('up past the drive stays at the root', resolveReference('C:\\', '../../a.html'), 'C:\\a.html');
eq('fragment is not part of the path', resolveReference(docs, 'a.html#top'), 'C:\\Users\\User\\Documents\\a.html');
eq('query is not part of the path', resolveReference(docs, 'a.html?v=2'), 'C:\\Users\\User\\Documents\\a.html');

// --- what a document may not hand the browser ---
eq('another file is followable', isFollowable('other.html'), true);
eq('a folder is followable', isFollowable('../'), true);
eq('mailto is not', isFollowable('mailto:someone@example.com'), false);
eq('tel is not', isFollowable('tel:+441234'), false);
eq('javascript is not', isFollowable('javascript:alert(1)'), false);
eq('data is not', isFollowable('data:text/html,<b>x'), false);
eq('a bare fragment is not', isFollowable('#top'), false);
eq('nothing is not', isFollowable(''), false);

// --- the rules the address bar and the links obey ---
// These are the restrictions, and they are the part worth checking: a browser
// that opens local files without them is a way into the disk.
var fileUrl = 'file:///C:/Users/User/Documents/a.html';

// Typing is the person asking, so the address bar has no restriction beyond the
// scheme rules - it is mayNavigate that only ever gates a page's own links.
eq('a local file may follow a local file', mayNavigate('file', fileUrl), true);
eq('a page of the browser may not', mayNavigate('microsoft', fileUrl), false);
eq('a search may not', mayNavigate('search', fileUrl), false);
eq('a local file may follow anything else', mayNavigate('file', 'https://example.com'), true);
eq('nothing is refused going to the web', mayNavigate('microsoft', 'https://example.com'), true);
eq('nothing is refused going nowhere', mayNavigate('file', 'edge://newtab'), true);

// --- what the address bar makes of what was typed ---
eq('a windows path is a file address', normalizeAddress('C:\\Users\\User\\a.html'), 'file:///C:/Users/User/a.html');
eq('a file address is kept', normalizeAddress('file:///C:/a.html'), 'file:///C:/a.html');
eq('an edge page is kept', normalizeAddress('edge://newtab'), 'edge://newtab');
eq('a bare host is given https', normalizeAddress('example.com'), 'https://example.com');
eq('two words are a search', normalizeAddress('hello world'), SEARCH_URL + 'hello%20world');
eq('one word is a search', normalizeAddress('hello'), SEARCH_URL + 'hello');
eq('nothing is nothing', normalizeAddress('  '), '');

// The scheme rules, which are the other half.
eq('javascript: is searched for, never run', normalizeAddress('javascript:alert(1)'), SEARCH_URL + 'alert(1)');
eq('vbscript: likewise', normalizeAddress('vbscript:msgbox'), SEARCH_URL + 'msgbox');
eq('an unhandled scheme is left to be refused', normalizeAddress('ftp://files.example.com'), 'ftp://files.example.com');

// --- and what resolve makes of the result ---
eq('a real file resolves to a file page', resolve('file:///C:/Users/User/Documents/a.html').page, 'file');
eq('an unhandled scheme is blocked by name', resolve('ftp://files.example.com').page, 'blocked');
eq('the refusal names the scheme', resolve('ftp://files.example.com').scheme, 'ftp');
eq('an ordinary site is unreachable, not blocked', resolve('https://example.com').page, 'error');
eq('a built-in page is itself', resolve('edge://history').page, 'history');
eq('a search is a search', resolve('hello world').page, 'search');
eq('a javascript address becomes a search', resolve('javascript:alert(1)').page, 'search');
eq('a file address with no drive is refused', resolve('file:///nope').page, 'blocked');

if (failures.length) {
  console.log('Edge file:// arithmetic has ' + failures.length + ' failure(s) of ' + checks + ':');
  failures.forEach(function (f) {
    console.log('  ' + f);
  });
  process.exit(1);
}
console.log('Edge file:// arithmetic is sound: ' + checks + ' checks passed.');