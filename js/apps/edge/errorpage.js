// The page a browser shows when the network is not there.
//
// Edge's own page draws a dropped ice cream: the scoop on the ground with the
// cone fallen beside it, both looking unhappy about it. That is the shape
// Windows 10's Edge uses, so it is the shape drawn here - a scene rather than a
// face, because a face that is trying to look sad reads as broken, and a cone
// on the floor does not have to try.

import { hostOf } from './net.js';

// Line art in the page's own palette: the strokes the text uses, the paper fill
// the page uses. Drawn on a 200x140 scene so the ground the two pieces land on
// has room to be a ground.
var DROPPED =
  '<svg class="edge-error-art" viewBox="0 0 200 140" aria-hidden="true">' +
  // the ground
  '<path d="M14 120 H186" fill="none" stroke="#c8d2d8" stroke-width="3" stroke-linecap="round"/>' +
  // where it hit
  '<path d="M30 114 l-8 -5 M36 108 l-4 -9" fill="none" stroke="#c8d2d8" stroke-width="2.6" stroke-linecap="round"/>' +
  // the scoop, resting on the ground
  '<circle cx="64" cy="92" r="28" fill="#f7f9fa" stroke="#5b6b74" stroke-width="3"/>' +
  '<circle cx="54" cy="86" r="3.4" fill="#5b6b74"/>' +
  '<circle cx="74" cy="86" r="3.4" fill="#5b6b74"/>' +
  // a frown, not a smile: the control point sits below the ends of the curve
  '<path d="M53 100 Q64 109 75 100" fill="none" stroke="#5b6b74" stroke-width="3" stroke-linecap="round"/>' +
  // the cone, fallen beside it: the point on the ground, the open end to the side
  '<path d="M96 120 L172 92 V120 Z" fill="#f7f9fa" stroke="#5b6b74" stroke-width="3" stroke-linejoin="round"/>' +
  '<ellipse cx="172" cy="106" rx="9" ry="14" fill="#f7f9fa" stroke="#5b6b74" stroke-width="3"/>' +
  // the waffle
  '<path d="M112 116 L126 106 M122 119 L136 109" fill="none" stroke="#c8d2d8" stroke-width="2.4" stroke-linecap="round"/>' +
  '<circle cx="148" cy="102" r="2.6" fill="#5b6b74"/>' +
  '<circle cx="158" cy="102" r="2.6" fill="#5b6b74"/>' +
  '<path d="M146 110 Q153 119 160 110" fill="none" stroke="#5b6b74" stroke-width="2.6" stroke-linecap="round"/>' +
  '</svg>';

export function buildErrorPage(entry, ops) {
  var page = document.createElement('div');
  page.className = 'edge-page edge-error';

  var box = document.createElement('div');
  box.className = 'edge-error-box';

  var art = document.createElement('div');
  art.innerHTML = DROPPED;
  box.appendChild(art);

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