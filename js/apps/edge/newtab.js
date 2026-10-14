// Edge's new tab page: the picture, the mark in the middle of it, the search box,
// and the row of shortcuts underneath.
//
// The picture Edge shows here is a Bing photograph of somewhere in the world,
// which is Microsoft's own artwork and not something this project can ship, so
// this draws a lake instead: the same shape of thing - sky, hills, water, the
// mark floating in the middle - in SVG. The Edge mark over it is the real one
// from assets/.

import { createTextField } from '../../core/textfield.js';
import { SEARCH_SVG, HISTORY_SVG, DOWNLOAD_SVG, FAVORITE_SVG, SETTING_SVG, HELP_SVG } from './edgeglyphs.js';

// The shortcuts under the search box. Edge fills this row with the sites you
// visit most; there is nothing to visit here, so it carries the pages the
// browser itself has - the ones that answer, rather than the ones that cannot be
// reached.
var SHORTCUTS = [
  { label: 'Favorites', url: 'edge://favorites', art: FAVORITE_SVG },
  { label: 'History', url: 'edge://history', art: HISTORY_SVG },
  { label: 'Downloads', url: 'edge://downloads', art: DOWNLOAD_SVG },
  { label: 'Settings', url: 'edge://settings', art: SETTING_SVG },
  { label: 'About Edge', url: 'edge://about', art: HELP_SVG }
];

// The drawn lake. Kept as one SVG rather than a stack of positioned shapes so it
// scales with the window without any arithmetic.
var ARTWORK =
  '<svg class="edge-newtab-art" viewBox="0 0 1366 768" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
  '<defs>' +
  '<linearGradient id="edge-sky" x1="0" y1="0" x2="0" y2="1">' +
  '<stop offset="0" stop-color="#8fc6e8"/><stop offset="0.55" stop-color="#c9e6f5"/>' +
  '<stop offset="1" stop-color="#eaf6fb"/></linearGradient>' +
  '<linearGradient id="edge-water" x1="0" y1="0" x2="0" y2="1">' +
  '<stop offset="0" stop-color="#bfe2f2"/><stop offset="0.5" stop-color="#8ecbe8"/>' +
  '<stop offset="1" stop-color="#5fa8d2"/></linearGradient>' +
  '</defs>' +
  '<rect width="1366" height="430" fill="url(#edge-sky)"/>' +
  // Three ranges of hills, each nearer and darker than the one behind it.
  '<path d="M0 372 L170 296 L330 350 L540 246 L780 356 L1000 274 L1220 348 L1366 300 L1366 432 L0 432 Z" fill="#a9c6d8" opacity="0.65"/>' +
  '<path d="M0 398 L250 338 L430 384 L700 318 L980 388 L1200 346 L1366 392 L1366 434 L0 434 Z" fill="#86a9c0" opacity="0.8"/>' +
  '<rect y="430" width="1366" height="338" fill="url(#edge-water)"/>' +
  // The far shore's reflection, then a few ripples across the near water.
  '<path d="M250 430 L700 430 L760 470 L180 470 Z" fill="#7fa9c4" opacity="0.35"/>' +
  '<path d="M980 430 L1220 430 L1260 452 L940 452 Z" fill="#7fa9c4" opacity="0.28"/>' +
  '<g fill="#ffffff" opacity="0.22">' +
  '<rect x="120" y="486" width="260" height="3" rx="1.5"/>' +
  '<rect x="430" y="520" width="360" height="3" rx="1.5"/>' +
  '<rect x="860" y="470" width="240" height="3" rx="1.5"/>' +
  '<rect x="250" y="588" width="440" height="4" rx="2"/>' +
  '<rect x="820" y="640" width="330" height="4" rx="2"/>' +
  '<rect x="80" y="690" width="520" height="4" rx="2"/>' +
  '</g>' +
  '</svg>';

export function buildNewTab(ops) {
  var page = document.createElement('div');
  page.className = 'edge-page edge-newtab';
  page.innerHTML = ARTWORK;

  var middle = document.createElement('div');
  middle.className = 'edge-newtab-middle';

  var mark = document.createElement('img');
  mark.className = 'edge-newtab-mark';
  mark.src = 'assets/microsoft-edge.png';
  mark.alt = 'Microsoft Edge';
  mark.draggable = false;
  middle.appendChild(mark);

  var box = document.createElement('div');
  box.className = 'edge-newtab-search';
  var glass = document.createElement('span');
  glass.className = 'edge-newtab-glass';
  glass.innerHTML = SEARCH_SVG;
  var field = createTextField({
    placeholder: 'Search the web',
    label: 'Search the web',
    className: 'edge-newtab-field'
  });
  box.appendChild(glass);
  box.appendChild(field);
  middle.appendChild(box);
  page.appendChild(middle);

  var tiles = document.createElement('div');
  tiles.className = 'edge-newtab-tiles';
  SHORTCUTS.forEach(function (shortcut) {
    var tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'edge-tile';
    var art = document.createElement('span');
    art.className = 'edge-tile-art';
    art.innerHTML = shortcut.art;
    var label = document.createElement('span');
    label.className = 'edge-tile-label';
    label.textContent = shortcut.label;
    tile.appendChild(art);
    tile.appendChild(label);
    tile.addEventListener('click', function () {
      ops.onNavigate(shortcut.url);
    });
    tiles.appendChild(tile);
  });
  page.appendChild(tiles);

  field.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    var text = field.value;
    if (!text.trim()) {
      return;
    }
    ops.onNavigate(text);
  });
  // Edge focuses the search box as soon as the new tab page opens.
  ops.onReady(function () {
    field.focus();
  });

  return page;
}