// A local file, opened in Edge.
//
// The document itself is drawn by a browser, not by this project: it goes into
// an <iframe> and the browser renders it, which is the honest answer - writing
// an HTML renderer here would be a worse browser pretending to be a better one.
// What this module owns is everything around that, and most of it is restriction
// rather than drawing:
//
//   THE SANDBOX IS THE POINT. The frame carries `sandbox` WITHOUT
//   `allow-same-origin`, so the document runs in an origin of its own that
//   belongs to nothing. From inside it there is no route to this page, to the
//   emulated C: volume, to anything in the browser's profile, or to any other
//   document - which is the shape of a real local file's origin. It is enforced
//   by the browser rather than promised in a comment, and a document that tries
//   localStorage or reaches for its parent gets the same failure a real one
//   does. Scripts are allowed, because a local page's script is part of the page.
//
//   THE DOCUMENT CANNOT MOVE THE TAB. With no `allow-top-navigation`, a document
//   in this frame cannot navigate the window it is in. A link is caught before
//   the browser acts on it and handed to the tab, which then decides - see
//   mayNavigate - whether the tab will follow it.
//
//   NO ORIGIN, NO NETWORK. A fetch or an XHR from a document with no origin is
//   cross-origin to everything, so it is refused the way it is in a real browser.
//   There is no network here to refuse it to, but the restriction is the same one
//   and it is the same reason.
//
// Subresources are pulled in here rather than by the frame: an <iframe> given a
// document string resolves relative URLs against the page that holds the frame,
// which is not where a local file's images are. So the stylesheets, scripts and
// images a document asks for are read off the emulated volume and put in where
// the document can use them.

import { dirOf, resolveReference, isFollowable, fileUrlFor } from './fileurl.js';
import { mayNavigate } from './net.js';

// What the frame is allowed. `allow-same-origin` is deliberately absent, and so
// is `allow-top-navigation`: these are the two that would let a local document
// become a way into the machine it is sitting on.
var SANDBOX = 'allow-scripts allow-forms allow-popups allow-modals';

// The bridge the document talks to us over. It is a string because it goes into
// the document rather than into this module, and everything in it has to survive
// being run somewhere with no origin of its own.
var BRIDGE =
  'document.addEventListener("click",function(e){' +
  'var a=e.target&&e.target.closest?e.target.closest("a[href]"):null;' +
  'if(!a)return;' +
  'var href=a.getAttribute("href")||"";' +
  'if(!href||href.charAt(0)==="#")return;' +
  'e.preventDefault();' +
  'parent.postMessage({edgeLocalLink:href},"*");' +
  '},true);' +
  'function title(){try{parent.postMessage({edgeLocalTitle:document.title||""},"*");}catch(e){}}' +
  'title();' +
  'document.addEventListener("DOMContentLoaded",title);' +
  'window.addEventListener("load",title);' +
  'setTimeout(title,400);';

function page(className) {
  var node = document.createElement('div');
  node.className = 'edge-page ' + className;
  return node;
}

// Words on a page of its own, which is all a message needs.
function message(title, line) {
  var root = page('edge-local-message');
  var words = document.createElement('div');
  words.className = 'edge-local-message-words';
  var heading = document.createElement('h1');
  heading.textContent = title;
  var note = document.createElement('p');
  note.textContent = line;
  words.appendChild(heading);
  words.appendChild(note);
  root.appendChild(words);
  return root;
}

function notFound(entry) {
  return message(
    'This file could not be found',
    'Edge looked for ' + entry.path + ', and there is nothing there.'
  );
}

function noStorage(entry) {
  return message(
    'This file could not be opened',
    'There is no storage on this computer to read ' + entry.path + ' from. Serve the ' +
    'simulator over http or https and it will come.'
  );
}

// A navigation the browser refused. Edge refuses it and stays where it is,
// saying why, rather than arriving somewhere and reporting the problem there -
// so this replaces the page that asked, and the tab does not move.
export function buildRefusedPage(why, ops) {
  var root = message('Edge blocked this page', why);
  var button = document.createElement('button');
  button.type = 'button';
  button.className = 'edge-local-message-action';
  button.textContent = 'Go back';
  button.addEventListener('click', function () {
    if (ops && ops.onBack) {
      ops.onBack();
    }
  });
  root.querySelector('.edge-local-message-words').appendChild(button);
  return root;
}

// Reading a document and putting it in the frame.
//
// ops: { getVolume, fromPage, onNavigate, onTitle, onRefused }
//   fromPage   what kind of page this document is, which is what decides
//              whether a link inside it may open a local file
//   onRefused  a link the browser will not follow, and why it will not
export function buildFilePage(entry, ops) {
  var root = page('edge-local');
  var view = document.createElement('iframe');
  view.className = 'edge-local-view';
  view.setAttribute('sandbox', SANDBOX);
  view.setAttribute('title', 'Local file');
  // Nothing is meant to load from out here, and saying so keeps a document that
  // asks for a remote stylesheet or an image from quietly trying.
  view.setAttribute('referrerpolicy', 'no-referrer');
  root.appendChild(view);

  var disposed = false;

  function onMessage(event) {
    if (disposed || event.source !== view.contentWindow) {
      return;
    }
    var data = event.data || {};
    if (typeof data.edgeLocalTitle === 'string') {
      if (ops.onTitle) {
        ops.onTitle(data.edgeLocalTitle);
      }
      return;
    }
    if (typeof data.edgeLocalLink === 'string') {
      follow(data.edgeLocalLink);
    }
  }

  // A link inside a local document is a place on this machine. It is resolved
  // against the document's own folder, refused if the browser may not go there,
  // and handed to the tab rather than to the frame - which could not have moved
  // the tab anyway, which is the point of not letting it.
  function follow(href) {
    if (!isFollowable(href)) {
      return;
    }
    var target = resolveReference(dirOf(entry.path), href);
    if (!target) {
      return;
    }
    var url = fileUrlFor(target);
    if (!mayNavigate(ops.fromPage, url)) {
      if (ops.onRefused) {
        ops.onRefused('A page on the web cannot open a file on this computer.');
      }
      return;
    }
    if (ops.onNavigate) {
      ops.onNavigate(url);
    }
  }

  document.addEventListener('message', onMessage);

  ops.getVolume().then(function (volume) {
    if (disposed) {
      return null;
    }
    if (!volume || !volume.available) {
      root.replaceChildren(noStorage(entry));
      return null;
    }
    return volume.stat(entry.path).then(function (info) {
      if (disposed) {
        return null;
      }
      if (info.type === 'dir') {
        // A file:// address naming a folder is a listing, the way a browser
        // shows one, rather than a document.
        return listFolder(root, volume, entry, ops);
      }
      return volume.readFile(entry.path).then(function (file) {
        return file.text();
      }).then(function (html) {
        if (disposed) {
          return null;
        }
        return inline(html, dirOf(entry.path), volume).then(function (prepared) {
          if (disposed) {
            return null;
          }
          view.srcdoc = prepared;
          if (ops.onTitle) {
            var found = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(prepared);
            ops.onTitle(found ? found[1].replace(/\s+/g, ' ').trim() : entry.title);
          }
          return null;
        });
      });
    }).catch(function () {
      // One answer for everything that went wrong on the way to a document: the
      // file is not there, or it is not something that can be read as one.
      if (!disposed) {
        root.replaceChildren(notFound(entry));
      }
    });
  }).catch(function () {
    if (!disposed) {
      root.replaceChildren(noStorage(entry));
    }
  });

  // A tab that goes somewhere else must not be left listening to a document
  // that is about to be thrown away.
  return {
    root: root,
    dispose: function () {
      disposed = true;
      document.removeEventListener('message', onMessage);
    }
  };
}

// A file:// folder is a listing, which is what a browser shows for one.
function listFolder(root, volume, entry, ops) {
  return volume.listDir(entry.path).then(function (entries) {
    if (!root.isConnected) {
      return;
    }
    var list = page('edge-local-index');
    var heading = document.createElement('h1');
    heading.textContent = entry.path;
    list.appendChild(heading);
    var items = document.createElement('ul');
    entries
      .slice()
      .sort(function (a, b) {
        return a.type === b.type ? a.name.localeCompare(b.name) : (a.type === 'dir' ? -1 : 1);
      })
      .forEach(function (item) {
        var row = document.createElement('li');
        var link = document.createElement('button');
        link.type = 'button';
        link.className = 'edge-local-index-link';
        link.textContent = item.type === 'dir' ? item.name + '/' : item.name;
        link.addEventListener('click', function () {
          var target = entry.path.replace(/\\+$/, '') + '\\' + item.name;
          if (ops.onNavigate) {
            ops.onNavigate(fileUrlFor(target, item.type === 'dir'));
          }
        });
        row.appendChild(link);
        items.appendChild(row);
      });
    if (!entries.length) {
      var none = document.createElement('li');
      none.className = 'edge-local-index-empty';
      none.textContent = 'This folder is empty.';
      items.appendChild(none);
    }
    list.appendChild(items);
    root.replaceChildren(list);
  });
}

// Putting a document's own files where the document can reach them.
//
// The frame is handed a string, so a relative URL in it would be resolved
// against the page that holds the frame rather than against the folder the
// document is in. Reading the stylesheet, script or image here and substituting
// it is what makes "a folder with an html file and a style.css in it" work the
// way it does in a real browser, instead of quietly dropping half the page.
function inline(html, dir, volume) {
  var doc;
  try {
    doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
  } catch (err) {
    return Promise.resolve(String(html || ''));
  }

  var jobs = [];
  doc.querySelectorAll('link[rel~="stylesheet"][href], script[src], img[src], source[src]')
    .forEach(function (node) {
      var tag = node.tagName.toLowerCase();
      var attr = tag === 'link' ? 'href' : 'src';
      var target = resolveReference(dir, node.getAttribute(attr));
      if (!target) {
        // Not on this machine: a remote resource, or one of the schemes a
        // document may not load. It is left exactly as it was, and will fail the
        // way it fails in a browser with no network - which is the truth.
        return;
      }
      jobs.push(substitute(node, tag, attr, target, volume));
    });

  return Promise.all(jobs).then(function () {
    // The bridge goes into the document rather than being appended after it: a
    // document handed to a frame as a string is parsed on its own terms, and a
    // script is a script wherever the parser decides to put it - but this way
    // there is nothing to decide.
    var bridge = doc.createElement('script');
    bridge.textContent = BRIDGE;
    (doc.head || doc.documentElement).appendChild(bridge);
    return doc.documentElement.outerHTML;
  });
}

// One reference, put in place of the reference.
function substitute(node, tag, attr, target, volume) {
  var isImage = tag === 'img' || tag === 'source';
  return volume.readFile(target).then(function (file) {
    if (isImage) {
      // An image is bytes, and the only way to hand bytes to a document that
      // has no origin is to spell them out.
      return file.arrayBuffer().then(function (buffer) {
        node.setAttribute(attr, 'data:' + guessType(target) + ';base64,' + base64(buffer));
      });
    }
    // A stylesheet and a script are both text, so both stay text - one as a
    // <style> and one as a <script>, which is the same thing with a different
    // tag name.
    return file.text().then(function (text) {
      var replacement = document.createElement(tag === 'script' ? 'script' : 'style');
      replacement.textContent = text;
      var type = node.getAttribute('type');
      if (type) {
        replacement.setAttribute('type', type);
      }
      if (node.parentNode) {
        node.parentNode.replaceChild(replacement, node);
      }
    });
  }, function () {
    // A file the document asks for that is not there: the reference is dropped,
    // which is what a browser does with a missing subresource - the page still
    // renders, just without that one thing.
    node.setAttribute(attr, '');
  });
}

// The type an image is declared as. The emulated volume does not record a MIME
// type for anything, and a browser that guessed wrong about an image would show
// a broken one, so it is guessed from the name the way a server guesses.
function guessType(path) {
  var name = String(path || '').toLowerCase();
  if (/\.png$/.test(name)) return 'image/png';
  if (/\.jpe?g$/.test(name)) return 'image/jpeg';
  if (/\.gif$/.test(name)) return 'image/gif';
  if (/\.webp$/.test(name)) return 'image/webp';
  if (/\.bmp$/.test(name)) return 'image/bmp';
  if (/\.ico$/.test(name)) return 'image/x-icon';
  if (/\.svg$/.test(name)) return 'image/svg+xml';
  return 'application/octet-stream';
}

// Base64 for a buffer, without a library and without a data-URL round trip.
function base64(buffer) {
  var bytes = new Uint8Array(buffer);
  var out = '';
  var step = 0x8000;
  for (var at = 0; at < bytes.length; at += step) {
    out += String.fromCharCode.apply(null, bytes.subarray(at, at + step));
  }
  return btoa(out);
}