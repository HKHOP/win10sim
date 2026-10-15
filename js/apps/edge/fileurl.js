// file:// addresses, and the emulated filesystem underneath them.
//
// This is the whole of a local file's address, in both directions: what Windows
// puts in the address bar for one, and what the filesystem has to be asked for.
// It is kept apart from everything else because it is the only part with no
// browser in it - it is arithmetic over strings, which means it can be checked
// without running the shell.
//
// A file:// URL is `file:///` then the path with its separators as slashes:
// file:///C:/Users/User/Documents/page.html. Edge accepts the shorter spellings
// too (file://C:/..., file:/C:/...) and the address bar may be given a bare
// Windows path, which is what a person actually types.
//
// A trailing separator says "this names a folder", and a path does not say that
// by itself - only the filesystem does, by having something at it. So it is
// passed in rather than guessed at.

import { splitPath } from '../../apis/winpath.js';

// The drive root, which a file URL always names with its trailing separator.
const ROOT = 'C:\\';

function isDrive(text) {
  return /^[a-zA-Z]:/.test(String(text || ''));
}

// A bare "C:" and a "C:\" are the same folder, and the separator is what makes
// the second one say so.
function withRoot(text) {
  const value = String(text || '');
  if (/^[a-zA-Z]:$/.test(value)) {
    return value + '\\';
  }
  return value;
}

function decode(text) {
  try {
    return decodeURIComponent(text);
  } catch (err) {
    // A percent sign that is not an escape is a literal one in Windows.
    return text;
  }
}

// The display form of a path: drive, then segments, as slashes, with spaces
// percent-encoded the way a browser writes them into an address bar.
export function fileUrlFor(path, isFolder) {
  const text = String(path == null ? '' : path);
  const drive = /^\s*([a-zA-Z]):/.exec(text);
  const letter = drive ? drive[1].toUpperCase() : 'C';
  const segments = splitPath(text);
  const tail = segments.map((part) => encodeURIComponent(part)).join('/');
  const root = 'file:///' + letter + ':/';
  if (!tail) {
    return root;
  }
  return root + tail + (isFolder ? '/' : '');
}

// The path a file URL names, or null when it names nothing usable - which is
// what Edge does with a file address that has no drive in it.
export function pathOf(url) {
  const text = String(url == null ? '' : url).trim();
  if (!/^file:/i.test(text)) {
    return null;
  }
  // The authority of a local file is empty, or "localhost" on some systems. It
  // is dropped either way; a real one (a UNC share) names a machine this emulated
  // volume is not, and comes out with no drive in it and is refused below.
  const rest = text
    .slice(text.indexOf(':') + 1)
    .replace(/^\/+/, '')
    .replace(/^localhost\//i, '');
  if (!rest) {
    return ROOT;
  }
  const decoded = decode(rest).replace(/\//g, '\\');
  if (!isDrive(decoded)) {
    return null;
  }
  return withRoot(decoded.replace(/\\+$/, ''));
}

// Everything the tab strip and the page need about a local address.
export function resolveFileUrl(url, isFolder) {
  const path = pathOf(url);
  if (!path) {
    return null;
  }
  return {
    path: path,
    name: leafOf(path),
    dir: dirOf(path),
    url: fileUrlFor(path, isFolder)
  };
}

export function leafOf(path) {
  const parts = splitPath(path);
  return parts.length ? parts[parts.length - 1] : '';
}

// The folder a path is in. The drive is put back on, because splitPath drops it
// to compare names case-insensitively and a path is not a set of names.
export function dirOf(path) {
  const drive = /^\s*([a-zA-Z]):/.exec(String(path || ''));
  const parts = splitPath(path);
  parts.pop();
  if (!parts.length) {
    return ROOT;
  }
  return (drive ? drive[1].toUpperCase() + ':' : '') + '\\' + parts.join('\\') + '\\';
}

// Where a reference inside a document points, given the folder the document is
// in. An absolute reference is used as it stands - that is what "/C:/Temp/x"
// means in a document - and a relative one is resolved against the folder, the
// way a browser resolves it against the document's own address.
export function resolveReference(dir, ref) {
  const text = String(ref == null ? '' : ref).split('#')[0].split('?')[0].trim();
  if (!text) {
    return null;
  }
  // Already an address of its own: http:, mailto:, data:, and so on.
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(text)) {
    return null;
  }
  // A network-path reference (//server/share) names a machine, not a folder.
  if (text.indexOf('//') === 0) {
    return null;
  }
  // A root-absolute reference: the drive and path from the top of the volume.
  const rooted = /^\/([a-zA-Z]:(?:\/.*)?)$/.exec(text);
  if (rooted) {
    return withRoot(decode(rooted[1]).replace(/\//g, '\\'));
  }
  // Anything else beginning with a separator is a path on the web, not on here.
  if (text.charAt(0) === '/') {
    return null;
  }
  // The whole path is built and then folded, rather than folded segment by
  // segment: "." and ".." are about the path as a whole, and a folder that is
  // spelled with one is still that folder.
  const full = String(dir || ROOT).replace(/\\+$/, '') + '\\' + text.replace(/\//g, '\\');
  const drive = /^\s*([a-zA-Z]):/.exec(full);
  const segments = splitPath(full);
  return (drive ? drive[1].toUpperCase() + ':' : 'C:') + '\\' + segments.join('\\');
}

// Whether a reference in a document is one this browser will follow at all:
// another document on disk, or nothing. A mailto: is handed to the system, and
// there is no system here, so it is left alone rather than half-handled.
export function isFollowable(ref) {
  const text = String(ref == null ? '' : ref).trim();
  if (!text || text.charAt(0) === '#') {
    return false;
  }
  return !/^(mailto|tel|javascript|vbscript|data|blob):/i.test(text);
}

// The kinds of file a browser will hand to whatever is installed to open them.
// Naming this here rather than leaving it to the emulated shell is the point:
// Edge downloads nothing in this world, so a file it did not have before is a
// file it cannot have, whatever the web address on it says.
var OPENABLE = /\.(html?|xhtml|svg|pdf|md|txt|rtf|docx?|xlsx?|pptx?|csv|json|xml|png|jpe?g|gif|webp|bmp|ico|svgz|mp3|wav|m4a|mp4|webm|avi|mkv|zip|7z|rar)$/i;

export function isOpenable(name) {
  return OPENABLE.test(String(name || ''));
}