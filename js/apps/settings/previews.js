// The Settings widgets that draw a *picture* of something rather than a control.
//
// Background and lock screen previews, the accent-colour row, the display
// rearrange boxes, the disk-usage bars and the little charts. Each of these is
// a picture of a thing that is decided somewhere else on the same page, which
// is why they are here and not in the value controls: pressing them is not what
// changes anything.

import { DESKTOP_WALLPAPER_SRC, LOCK_WALLPAPER_SRC, THISPC_SRC, PICTURES_SRC } from '../../global/constants.js';
import { glyphFor } from './glyphmap.js';

function el(tag, className, text) {
  var node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text != null) {
    node.textContent = text;
  }
  return node;
}

// The desktop-and-Start-menu picture Win10 puts at the top of Personalisation >
// Background: a strip of the wallpaper with a small Start menu laid over it.
export function backgroundPreview(item, ops) {
  var frame = el('div', 'set-preview set-preview--desktop');
  var wall = document.createElement('img');
  wall.src = DESKTOP_WALLPAPER_SRC;
  wall.alt = '';
  frame.appendChild(wall);
  var menu = el('div', 'set-preview-menu');
  ['Most used', 'Recently added', 'All apps'].forEach(function (name, at) {
    var row = el('div', 'set-preview-tile' + (at === 0 ? ' is-active' : ''));
    row.appendChild(el('span', 'set-preview-tile-name', name));
    menu.appendChild(row);
  });
  frame.appendChild(menu);
  var sync = function () {
    var kind = ops.value('personalisation.background.kind');
    var picture = ops.value('personalisation.background.picture');
    var colour = ops.value('personalisation.background.colour');
    frame.classList.toggle('is-slideshow', kind === 'Slideshow');
    frame.classList.toggle('is-colour', kind === 'Solid colour');
    // A solid background has no picture in it, which is the whole difference
    // between the two kinds and the reason the preview has to follow.
    wall.hidden = kind === 'Solid colour';
    wall.style.opacity = picture ? '1' : '0.35';
    frame.style.setProperty('--preview-accent', '#' + (colour || '0078d7'));
  };
  sync();
  return { el: frame, sync: sync };
}

// The lock-screen picture: a wide, shallow strip, because the lock screen is
// wider than it is tall.
export function lockPreview(item, ops) {
  var frame = el('div', 'set-preview set-preview--lock');
  var wall = document.createElement('img');
  wall.src = LOCK_WALLPAPER_SRC;
  wall.alt = '';
  frame.appendChild(wall);
  var clock = el('div', 'set-preview-clock');
  frame.appendChild(clock);
  var sync = function () {
    clock.textContent = new Date().toLocaleTimeString();
  };
  sync();
  return { el: frame, sync: sync };
}

// The thumbnail row under "Choose your picture", with the chosen one marked.
//
// Windows fills this row with the wallpapers it ships plus whatever pictures are
// in the user's folder. This machine has one wallpaper, so the row has one
// picture in it and then the solid colours, which are the other kind of
// background the page offers. Listing five thumbnails that were the same picture
// cropped would look closer to the reference and be a lie about what is here.
export function backgroundPicker(item, ops) {
  var box = el('div', 'set-thumbs');
  var pic = document.createElement('button');
  pic.type = 'button';
  pic.className = 'set-thumb';
  pic.setAttribute('aria-label', 'Windows background');
  var picImg = document.createElement('img');
  picImg.src = DESKTOP_WALLPAPER_SRC;
  picImg.alt = '';
  pic.appendChild(picImg);
  pic.addEventListener('click', function () {
    ops.write(item.key, 'img0.jpg');
  });
  box.appendChild(pic);
  COLOURS.forEach(function (colour) {
    var cell = el('button', 'set-thumb set-thumb--colour');
    cell.type = 'button';
    cell.title = colour.name;
    cell.setAttribute('aria-label', colour.name);
    cell.style.background = '#' + colour.id;
    cell.addEventListener('click', function () {
      ops.write('personalisation.background.kind', 'Solid colour');
      ops.write('personalisation.background.colour', colour.id);
    });
    box.appendChild(cell);
  });
  var sync = function () {
    var chosen = ops.value(item.key);
    pic.classList.toggle('is-chosen', chosen === 'img0.jpg' || !chosen);
    Array.prototype.forEach.call(box.children, function (cell, at) {
      if (at > 0) {
        cell.classList.toggle('is-chosen', COLOURS[at - 1].id === ops.value('personalisation.background.colour'));
      }
    });
  };
  sync();
  return { el: box, sync: sync };
}

// The solid-colour row: a palette of squares, the chosen one ringed.
var COLOURS = [
  { id: '0078d7', name: 'Windows blue' },
  { id: '0070c0', name: 'Darker blue' },
  { id: '0099bc', name: 'Windows teal' },
  { id: '00b294', name: 'Windows green' },
  { id: '107c10', name: 'Dark green' },
  { id: 'e97000', name: 'Windows orange' },
  { id: 'e81123', name: 'Windows red' },
  { id: 'c30052', name: 'Windows pink' },
  { id: '8764b8', name: 'Windows purple' },
  { id: '744da9', name: 'Darker purple' },
  { id: 'e3008c', name: 'Windows magenta' },
  { id: '7a7574', name: 'Windows grey' }
];

// The two galleries on Personalisation > Colors. They are the same control over
// the same table - which colour is the accent - drawn twice, and the difference
// is only what is in them: Recent colours is a short row of what has been picked
// lately, Windows colors is the whole palette.
//
// Declared as two items rather than one with a heading is what lets the two have
// different contents without either of them having to know about the other. A
// single gallery would have made the palette look like history.
var RECENT_COLOURS = [
  { id: '0078d7', name: 'Windows blue' },
  { id: '0099bc', name: 'Windows teal' },
  { id: '7a7574', name: 'Windows grey' },
  { id: 'e81123', name: 'Windows red' },
  { id: 'e3008c', name: 'Windows magenta' }
];

export function colourRow(item, ops) {
  var palette = item.group === 'recent' ? RECENT_COLOURS : COLOURS;
  var box = el('div', 'set-colours' + (item.group === 'windows' ? ' set-colours--grid' : ''));
  palette.forEach(function (colour) {
    var cell = el('button', 'set-colour');
    cell.type = 'button';
    cell.title = colour.name;
    cell.setAttribute('aria-label', colour.name);
    cell.style.background = '#' + colour.id;
    cell.addEventListener('click', function () {
      ops.write(item.key, colour.id);
    });
    box.appendChild(cell);
  });
  var sync = function () {
    var chosen = ops.value(item.key);
    Array.prototype.forEach.call(box.children, function (cell, at) {
      cell.classList.toggle('is-chosen', palette[at].id === chosen);
    });
  };
  sync();
  return { el: box, sync: sync };
}

// The picture at the top of Personalisation > Colors: the desktop with the Start
// menu over it, tinted with the accent that is chosen at the time.
//
// It is the same picture the Background page draws, and for the same reason - a
// wallpaper previewed in isolation does not tell you what the accent does to it.
// What differs is what it follows: this one follows the accent colour rather than
// the picture, so it is a separate builder rather than a flag on the other.
export function colorsPreview(item, ops) {
  var frame = el('div', 'set-preview set-preview--desktop set-preview--colors');
  var wall = document.createElement('img');
  wall.src = DESKTOP_WALLPAPER_SRC;
  wall.alt = '';
  frame.appendChild(wall);
  var menu = el('div', 'set-preview-menu');
  ['Most used', 'Recently added', 'All apps'].forEach(function (name, at) {
    var row = el('div', 'set-preview-tile' + (at === 0 ? ' is-active' : ''));
    row.appendChild(el('span', 'set-preview-tile-name', name));
    menu.appendChild(row);
  });
  frame.appendChild(menu);
  var sync = function () {
    var accent = ops.value('personalisation.colors.accent') || '0078d7';
    frame.style.setProperty('--preview-accent', '#' + accent);
  };
  sync();
  return { el: frame, sync: sync };
}

export function colourPicker(item, ops) {
  var box = el('div', 'set-colours');
  COLOURS.forEach(function (colour) {
    var cell = el('button', 'set-colour');
    cell.type = 'button';
    cell.title = colour.name;
    cell.setAttribute('aria-label', colour.name);
    cell.style.background = '#' + colour.id;
    cell.addEventListener('click', function () {
      ops.write(item.key, colour.id);
    });
    box.appendChild(cell);
  });
  var sync = function () {
    var chosen = ops.value(item.key);
    Array.prototype.forEach.call(box.children, function (cell, at) {
      cell.classList.toggle('is-chosen', COLOURS[at].id === chosen);
    });
  };
  sync();
  return { el: box, sync: sync };
}

// The albums a slideshow picks from, under "Choose albums for your slideshow".
//
// This machine has one album and no picture library behind it, so the row lists
// the one album and says so underneath rather than listing six that do not
// exist. It is a row and not a picker because a picker would imply there is more
// than one to choose.
export function albumPicker(item, ops) {
  var box = el('div', 'set-album');
  var row = el('button', 'set-album-row');
  row.type = 'button';
  var art = el('span', 'set-album-art');
  var icon = document.createElement('img');
  icon.src = PICTURES_SRC;
  icon.alt = '';
  art.appendChild(icon);
  row.appendChild(art);
  var body = el('span', 'set-device-body');
  body.appendChild(el('span', 'set-device-name', item.name || 'Pictures'));
  body.appendChild(el('span', 'set-device-sub', 'This folder'));
  row.appendChild(body);
  row.addEventListener('click', function () {
    ops.run('personalisation.background.chooseAlbum');
  });
  box.appendChild(row);
  return { el: box };
}

// The theme chooser on Personalisation > Themes: the current theme as a wide
// picture with the list of what it is made of beside it.
//
// The list is not decoration. Each row names a part of Windows - the background,
// the accent colour, the sounds, the pointer - and the value is the answer from
// the page that owns that setting, read out of the store. A theme preview that
// showed a picture and four invented captions would be the one page on this one
// that told a lie.
export function themePreview(item, ops) {
  var frame = el('div', 'set-theme-current');
  var art = el('div', 'set-preview set-preview--theme');
  var wall = document.createElement('img');
  wall.src = DESKTOP_WALLPAPER_SRC;
  wall.alt = '';
  art.appendChild(wall);
  frame.appendChild(art);
  var list = el('div', 'set-theme-parts');
  frame.appendChild(list);

  var sync = function () {
    var accent = ops.value('personalisation.colors.accent') || '0078d7';
    var picture = ops.value('personalisation.background.picture');
    var scheme = ops.value('sound.scheme');
    var parts = [
      { icon: 'picture', label: 'Background', value: picture ? 'img1' : 'Windows' },
      { icon: 'color', label: 'Color', value: accentName(accent) },
      { icon: 'sound', label: 'Sounds', value: scheme || 'Windows Default' },
      { icon: 'pointer', label: 'Mouse cursor', value: 'Windows Default' }
    ];
    list.textContent = '';
    parts.forEach(function (part) {
      var row = el('div', 'set-theme-part');
      var mark = el('span', 'set-theme-part-art');
      mark.innerHTML = glyphFor(part.icon) || '';
      row.appendChild(mark);
      var body = el('span', 'set-theme-part-body');
      body.appendChild(el('span', 'set-theme-part-label', part.label));
      body.appendChild(el('span', 'set-theme-part-value', part.value));
      row.appendChild(body);
      list.appendChild(row);
    });
  };
  sync();
  return { el: frame, sync: sync };
}

// The name of an accent colour, the same table the gallery writes from.
function accentName(hex) {
  var found = null;
  COLOURS.forEach(function (colour) {
    if (colour.id === hex) {
      found = colour.name;
    }
  });
  return found || 'Default blue';
}

// The gallery under "Change theme": a card per theme, the picture above the name.
//
// This machine has one wallpaper, so all three cards draw it - which is honest
// in a way a row of invented thumbnails would not be, and is why "Windows
// (light)" is drawn light: that is the one thing about it this machine does know,
// because the theme's whole subject is its background.
var GALLERY_THEMES = [
  { id: 'asus', name: 'ASUS', light: false },
  { id: 'windows', name: 'Windows', light: false },
  { id: 'windowsLight', name: 'Windows (light)', light: true }
];

export function themeGallery(item, ops) {
  var box = el('div', 'set-gallery');
  GALLERY_THEMES.forEach(function (theme) {
    var cell = el('button', 'set-gallery-card');
    cell.type = 'button';
    var shot = el('div', 'set-gallery-shot' + (theme.light ? ' is-light' : ''));
    var wall = document.createElement('img');
    wall.src = DESKTOP_WALLPAPER_SRC;
    wall.alt = '';
    shot.appendChild(wall);
    cell.appendChild(shot);
    cell.appendChild(el('span', 'set-gallery-name', theme.name));
    cell.addEventListener('click', function () {
      ops.write('personalisation.theme.current', theme.id);
    });
    box.appendChild(cell);
  });
  return { el: box };
}

// The contrast-theme chooser on Ease of Access > High contrast: a grid of
// previews, each one drawn in its own colours rather than described.
var CONTRAST_THEMES = [
  { id: 'None', name: 'None', fg: '#000', bg: '#fff' },
  { id: 'High contrast - White on black', name: 'White on black', fg: '#fff', bg: '#000' },
  { id: 'High contrast - Black on white', name: 'Black on white', fg: '#000', bg: '#fff' },
  { id: 'High contrast - Yellow on black', name: 'Yellow on black', fg: '#ff0', bg: '#000' }
];

export function themePicker(item, ops) {
  var grid = el('div', 'set-theme-grid');
  CONTRAST_THEMES.forEach(function (theme) {
    var cell = el('button', 'set-theme');
    cell.type = 'button';
    var sample = el('span', 'set-theme-sample');
    sample.style.background = theme.bg;
    sample.style.color = theme.fg;
    sample.textContent = 'Aa';
    cell.appendChild(sample);
    cell.appendChild(el('span', 'set-theme-name', theme.name));
    cell.addEventListener('click', function () {
      ops.write(item.key, theme.id);
    });
    grid.appendChild(cell);
  });
  var sync = function () {
    var chosen = ops.value(item.key);
    Array.prototype.forEach.call(grid.children, function (cell, at) {
      cell.classList.toggle('is-chosen', CONTRAST_THEMES[at].id === chosen);
    });
  };
  sync();
  return { el: grid, sync: sync };
}

// "Rearrange your displays": the two numbered boxes, the selected one filled,
// with the drag handles Windows puts on it.
export function displayBoxes(item, ops) {
  var frame = el('div', 'set-displays');
  var box = el('div', 'set-display-canvas');
  ['1', '2'].forEach(function (id, at) {
    var screen = el('button', 'set-display' + (at === 0 ? ' is-selected' : ''), id);
    screen.type = 'button';
    screen.setAttribute('aria-label', 'Display ' + id);
    screen.addEventListener('click', function () {
      Array.prototype.forEach.call(box.children, function (child, index) {
        child.classList.toggle('is-selected', index === at);
      });
      ops.run('display.select', id);
    });
    box.appendChild(screen);
  });
  frame.appendChild(box);
  return { el: frame };
}

// Storage: the "See what's new" tiles, and the category bars for the system
// drive. Both are read off the volume, which is the only place that knows how
// much of the disk is used.
export function storageUsage(item, ops) {
  var box = el('div', 'set-storage-tiles');
  var tiles = [
    { name: 'Temporary files', icon: '◱', key: 'storage.temp' },
    { name: 'Downloads', icon: '⇩', key: 'storage.downloads' },
    { name: 'Recycle Bin', icon: '⌫', key: 'storage.recycle' }
  ];
  tiles.forEach(function (tile) {
    var cell = el('button', 'set-storage-tile');
    cell.type = 'button';
    cell.appendChild(el('span', 'set-storage-art', tile.icon));
    cell.appendChild(el('span', 'set-storage-name', tile.name));
    cell.appendChild(el('span', 'set-storage-size', '0 bytes'));
    cell.addEventListener('click', function () {
      ops.run('storage.open', tile.key);
    });
    box.appendChild(cell);
  });
  return { el: box };
}

export function storageBreakdown(item, ops) {
  var box = el('div', 'set-storage');
  var rows = [
    { name: 'Apps & features', colour: '#0078d7', key: 'storage.apps' },
    { name: 'Documents', colour: '#00b294', key: 'storage.documents' },
    { name: 'Pictures, videos, music', colour: '#e97000', key: 'storage.media' },
    { name: 'Temporary files', colour: '#8764b8', key: 'storage.temp' },
    { name: 'System & reserved', colour: '#7a7574', key: 'storage.system' }
  ];
  function paint() {
    box.textContent = '';
    var total = ops.storageUsage();
    var bar = el('div', 'set-storage-bar');
    var legend = el('div', 'set-storage-legend');
    rows.forEach(function (rowInfo) {
      var bytes = ops.value(rowInfo.key) || 0;
      var part = el('span', 'set-storage-part');
      part.style.background = rowInfo.colour;
      part.style.width = (total.used ? Math.max(1, (bytes / total.used) * 100) : 0) + '%';
      bar.appendChild(part);
      var entry = el('div', 'set-storage-legend-row');
      var dot = el('span', 'set-storage-dot');
      dot.style.background = rowInfo.colour;
      entry.appendChild(dot);
      entry.appendChild(el('span', 'set-storage-legend-name', rowInfo.name));
      entry.appendChild(el('span', 'set-storage-legend-size', bytesText(bytes)));
      legend.appendChild(entry);
    });
    box.appendChild(el('div', 'set-storage-caption', 'C:  ' + bytesText(total.used) + ' used of ' + bytesText(total.total)));
    box.appendChild(bar);
    box.appendChild(legend);
  }
  paint();
  return { el: box, refresh: paint };
}

function bytesText(bytes) {
  if (!bytes) {
    return '0 bytes';
  }
  var units = ['bytes', 'KB', 'MB', 'GB', 'TB'];
  var at = 0;
  var value = bytes;
  while (value >= 1024 && at < units.length - 1) {
    value /= 1024;
    at += 1;
  }
  return (value < 10 && at > 0 ? value.toFixed(1) : Math.round(value)) + ' ' + units[at];
}

// The battery-usage chart on Power & sleep > Usage history: a horizontal bar per
// app, the longest first, which is the shape Windows draws it.
export function usageChart(item, ops) {
  var box = el('div', 'set-chart');
  var rows = (item.data || []).slice().sort(function (a, b) { return b.minutes - a.minutes; });
  var max = rows.reduce(function (top, rowInfo) { return Math.max(top, rowInfo.minutes); }, 0) || 1;
  rows.forEach(function (rowInfo) {
    var row = el('div', 'set-chart-row');
    row.appendChild(el('span', 'set-chart-name', rowInfo.name));
    var track = el('span', 'set-chart-track');
    var fill = el('span', 'set-chart-fill');
    fill.style.width = Math.round((rowInfo.minutes / max) * 100) + '%';
    track.appendChild(fill);
    row.appendChild(track);
    row.appendChild(el('span', 'set-chart-value', rowInfo.minutes + ' min'));
    box.appendChild(row);
  });
  return { el: box };
}

// A label-and-value list, which is what Device specifications, Windows
// specifications, Activation and the About page are all made of.
export function specList(item, ops) {
  var box = el('div', 'set-specs');
  (item.rows || []).forEach(function (rowInfo) {
    var row = el('div', 'set-spec');
    row.appendChild(el('span', 'set-spec-label', rowInfo.label));
    row.appendChild(el('span', 'set-spec-value', rowInfo.value));
    box.appendChild(row);
  });
  return { el: box };
}

// The current date and time, which updates while the page is open because the
// page is wrong the moment it stops.
export function clock(item, ops) {
  var box = el('div', 'set-clock');
  function paint() {
    var now = new Date();
    box.textContent = now.toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }) + '  ' + now.toLocaleTimeString();
  }
  paint();
  var timer = window.setInterval(paint, 1000);
  return { el: box, dispose: function () { window.clearInterval(timer); } };
}

// The profile card on Accounts > Your info: the avatar Windows shows for the
// signed-in account, and the three lines under it.
//
// The three lines are the account's name, then the kind of account ("Local
// Account"), then what it is ("Administrator") - and the last two are greyed
// because they are facts about the account rather than things you chose. They
// come from the declaration rather than from the store: an account's name and
// group are not settings, and "Your info" is the one page whose value is the
// person on it.
export function profileCard(item, ops) {
  var box = el('div', 'set-profile');
  var art = el('div', 'set-profile-art');
  var img = document.createElement('img');
  img.src = THISPC_SRC;
  img.alt = '';
  art.appendChild(img);
  box.appendChild(art);
  var body = el('div', 'set-profile-body');
  body.appendChild(el('div', 'set-profile-name', item.name || 'Not signed in'));
  if (item.accountType) {
    body.appendChild(el('div', 'set-profile-sub', item.accountType));
  }
  if (item.role) {
    body.appendChild(el('div', 'set-profile-sub', item.role));
  }
  box.appendChild(body);
  return { el: box };
}

export var PREVIEW_WIDGETS = {
  backgroundPreview: backgroundPreview,
  colorsPreview: colorsPreview,
  lockPreview: lockPreview,
  backgroundPicker: backgroundPicker,
  albumPicker: albumPicker,
  colourPicker: colourPicker,
  colourRow: colourRow,
  themePreview: themePreview,
  themeGallery: themeGallery,
  themePicker: themePicker,
  displayBoxes: displayBoxes,
  storageUsage: storageUsage,
  storageBreakdown: storageBreakdown,
  usageChart: usageChart,
  specList: specList,
  clock: clock,
  profileCard: profileCard
};
