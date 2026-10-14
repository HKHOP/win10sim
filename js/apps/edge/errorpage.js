// The page a browser shows when the network is not there.
//
// Edge's own error page is a drawing of a face and the words "Hmmm... can't
// reach this page". The drawing is Edge's, so this draws a face of its own: the
// same idea, plainly, rather than a copy of Microsoft's illustration.

import { hostOf } from './net.js';

var FACE =
  '<svg class="edge-error-face" viewBox="0 0 96 96" aria-hidden="true">' +
  '<circle cx="48" cy="48" r="44" fill="#f7f9fa" stroke="#c8d2d8" stroke-width="2"/>' +
  '<circle cx="34" cy="40" r="4.5" fill="#5b6b74"/>' +
  '<circle cx="62" cy="40" r="4.5" fill="#5b6b74"/>' +
  '<path d="M26 54c6-4 14-4 20 0" fill="none" stroke="#5b6b74" stroke-width="3" stroke-linecap="round"/>' +
  '<path d="M30 72c6 5 30 5 36 0" fill="none" stroke="#5b6b74" stroke-width="3" stroke-linecap="round"/>' +
  '<path d="M48 56c-2 6-4 8-4 10a4 4 0 0 0 8 0c0-2-2-4-4-10z" fill="#5b6b74"/>' +
  '</svg>';

export function buildErrorPage(entry, ops) {
  var page = document.createElement('div');
  page.className = 'edge-page edge-error';

  var box = document.createElement('div');
  box.className = 'edge-error-box';

  var face = document.createElement('div');
  face.innerHTML = FACE;
  box.appendChild(face);

  var words = document.createElement('div');
  words.className = 'edge-error-words';
  var heading = document.createElement('h1');
  heading.textContent = "Hmmm\u2026 can't reach this page";
  var address = document.createElement('p');
  address.className = 'edge-error-address';
  address.textContent = hostOf(entry.url) || entry.url;
  var because = document.createElement('p');
  because.className = 'edge-error-because';
  because.textContent = 'This computer is not connected to the internet, so there is nothing to reach.';
  var again = document.createElement('p');
  again.className = 'edge-error-again';
  again.textContent = 'Try checking the connection, or open a new tab and start from there.';
  words.appendChild(heading);
  words.appendChild(address);
  words.appendChild(because);
  words.appendChild(again);
  box.appendChild(words);

  var button = document.createElement('button');
  button.type = 'button';
  button.className = 'edge-error-reload';
  button.textContent = 'Reload';
  button.addEventListener('click', function () {
    ops.onReload();
  });
  box.appendChild(button);

  page.appendChild(box);
  return page;
}