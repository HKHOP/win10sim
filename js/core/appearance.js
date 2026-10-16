// Appearance: the stored Settings that describe how the shell *looks*, turned
// into something the shell can draw.
//
// Every control under Personalisation, Display and Ease of Access used to write
// a value into the profile's store that nothing read back - the pages described
// Windows rather than changing it. This module closes the loop for the settings
// whose effect is a visible fact about the shell: the accent colour, the colour
// mode, whether effects are transparent, which surfaces take the accent, the
// desktop and lock wallpapers, night light and brightness, high contrast, the
// colour filter, and the emulated pointer's size.
//
// It writes them onto the stage element as CSS custom properties and data
// attributes, so a surface that is pure CSS needs no code to follow a setting -
// it inherits the variable. A surface that has to *redraw* rather than restyle
// (the desktop repainting a slideshow) asks subscribeLook() and follows.
//
// Nothing here changes behaviour. Window snapping, taskbar auto-hide and the
// rest are read where they act, because a behaviour read far from where it
// happens is a behaviour nobody can find.

import { settingsReady, storedValue, onSettingsChanged } from '../apis/settings-store.js';
import { DESKTOP_WALLPAPER_SRC, LOCK_WALLPAPER_SRC } from '../global/constants.js';

var DEFAULT_ACCENT = '#0078d7';
// The two pictures this machine owns. There is no wallpaper gallery here, so a
// slideshow alternates between the desktop and the lock artwork rather than
// inventing a set of its own.
var SLIDESHOW_IMAGES = [DESKTOP_WALLPAPER_SRC, LOCK_WALLPAPER_SRC];
var INTERVAL_MS = {
  '5 seconds': 5000,
  '15 seconds': 15000,
  '30 seconds': 30000,
  '1 minute': 60000,
  '5 minutes': 300000,
  '15 minutes': 900000,
  '30 minutes': 1800000,
  '1 hour': 3600000
};
// How each "Choose a fit" draws the picture, as background-size / repeat pairs.
var FIT = {
  Fill: ['cover', 'no-repeat'],
  Fit: ['contain', 'no-repeat'],
  Stretch: ['100% 100%', 'no-repeat'],
  Tile: ['auto', 'repeat'],
  Center: ['auto', 'no-repeat']
};
// The colour filters of Ease of Access > Colour filters. Windows applies real
// colour matrices; the stylesheet draws these as CSS filters on the surfaces
// inside the stage (see css/appearance.css), which is exact for grayscale and
// invert and an approximation of the installed profiles for the tinted ones.
var FILTER_NAMES = ['Off', 'Grayscale', 'Inverted', 'Red-Green filter', 'Red-Blue filter', 'Green-Blue filter'];
// The high-contrast themes, as the flag the stylesheet switches on.
var CONTRAST_THEMES = {
  'None': '',
  'High contrast - White on black': 'white-on-black',
  'High contrast - Black on white': 'black-on-white',
  'High contrast - Yellow on black': 'yellow-on-black'
};

var stage = null;
var cursor = null;
var look = null;
var listeners = [];
// The slideshow's own state: a timer and where it has got to. Kept here rather
// than in the desktop so the lock screen and the desktop never disagree about
// which picture is showing.
var slideshow = { timer: null, index: 0 };

function text(path, allowed, fallback) {
  var value = storedValue(path);
  return allowed.indexOf(value) >= 0 ? value : fallback;
}

function flag(path, fallback) {
  var value = storedValue(path);
  return typeof value === 'boolean' ? value : fallback;
}

function accentColour() {
  var raw = String(storedValue('personalisation.colors.accent') || '').replace('#', '');
  return /^[0-9a-f]{6}$/i.test(raw) ? '#' + raw.toLowerCase() : DEFAULT_ACCENT;
}

function percent(path, fallback) {
  var value = Number(storedValue(path));
  return isFinite(value) ? Math.max(0, Math.min(100, value)) : fallback;
}

// The desktop's background, as the four values the desktop's stylesheet reads.
// A solid colour has no picture at all; the two picture kinds always show the
// one hero image this machine has.
function desktopWallpaper(kind, fit, colour) {
  if (kind === 'Solid colour') {
    return { image: 'none', size: 'auto', repeat: 'no-repeat', position: 'center', colour: colour };
  }
  if (kind === 'Slideshow') {
    return {
      image: 'url("' + SLIDESHOW_IMAGES[slideshow.index % SLIDESHOW_IMAGES.length] + '")',
      size: 'cover',
      repeat: 'no-repeat',
      position: 'center',
      colour: colour
    };
  }
  var pair = FIT[fit] || FIT.Fill;
  return {
    image: 'url("' + DESKTOP_WALLPAPER_SRC + '")',
    size: pair[0],
    repeat: pair[1],
    position: fit === 'Center' ? 'center' : 'center',
    colour: colour
  };
}

// The pointer is sized 1..5 by the "Choose a pointer size" dropdown, drawn at
// half again per step so step 5 is about three times the default - which is the
// order of the real thing.
function pointerScale() {
  var value = String(storedValue('ease.pointerSize') || '');
  var step = parseInt(value.charAt(0), 10);
  return isFinite(step) && step > 0 ? 1 + (step - 1) * 0.5 : 1;
}

// The accent, and whether glyphs drawn on it should be white or black. Windows
// puts white on every accent in its palette except the lightest yellows, so the
// decision is made from the colour's own luminance rather than a list that would
// need updating whenever the palette (js/apps/settings/previews.js) does.
function onAccent(accent) {
  var r = parseInt(accent.substr(1, 2), 16);
  var g = parseInt(accent.substr(3, 2), 16);
  var b = parseInt(accent.substr(5, 2), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 165 ? '#000000' : '#ffffff';
}

function computeLook() {
  var accent = accentColour();
  var kind = text('personalisation.background.kind', ['Picture', 'Solid colour', 'Slideshow'], 'Picture');
  var fit = text('personalisation.background.fit', Object.keys(FIT), 'Fill');
  var background = String(storedValue('personalisation.background.colour') || '').replace('#', '');
  var colour = /^[0-9a-f]{6}$/i.test(background) ? '#' + background : DEFAULT_ACCENT;
  var theme = text('ease.contrastTheme', Object.keys(CONTRAST_THEMES), 'None');
  // Windows: turning High contrast on applies the chosen theme; with none chosen
  // it still puts the machine into high contrast, white on black.
  var contrastOn = flag('ease.contrast', false);
  var contrast = contrastOn || theme !== 'None'
    ? (CONTRAST_THEMES[theme] || 'white-on-black')
    : '';
  var slideshowOn = kind === 'Slideshow' || text('personalisation.lock.kind', ['Windows spotlight', 'Picture', 'Slideshow'], 'Windows spotlight') === 'Slideshow';

  return {
    accent: accent,
    accentRgb: [1, 3, 5].map(function (at) { return parseInt(accent.substr(at, 2), 16); }).join(', '),
    onAccent: onAccent(accent),
    transparent: flag('personalisation.colors.transparent', true),
    accentStart: flag('personalisation.colourOn.start', true),
    accentTitlebars: flag('personalisation.colourOn.titlebars', false),
    accentLock: flag('personalisation.colourOn.lockScreen', false),
    wallpaper: desktopWallpaper(kind, fit, colour),
    wallpaperKind: kind,
    lockWallpaper: 'url("' + LOCK_WALLPAPER_SRC + '")',
    lockOnSignIn: flag('personalisation.lock.onSignIn', true),
    // The screen is drawn as if the panel were at its shipped 51%: brightness
    // can only ever be *taken away* from here, because there is nothing brighter
    // to draw with. Below the shipped level the black overlay follows the slider
    // so it visibly dims; at or above it the overlay is gone.
    dim: Math.max(0, percent('display.brightness', 51) >= 51 ? 0 : (51 - percent('display.brightness', 51)) / 51),
    nightLight: flag('display.nightLight', false) || text('nightlight.schedule', ['Off', 'Sunset to sunrise', 'Set hours', 'Always on'], 'Off') === 'Always on',
    nightLightStrength: percent('nightlight.strength', 60) / 100,
    colorFilter: text('ease.colorFilter', FILTER_NAMES, 'Off'),
    contrast: contrast,
    animations: flag('ease.animations', true),
    pointerScale: pointerScale(),
    showDesktopIcons: flag('personalisation.theme.desktopIcons', true),
    desktopIconSize: text('personalisation.theme.desktopIconSize', ['Small icons', 'Medium icons', 'Large icons'], 'Medium icons'),
    slideshow: slideshowOn,
    slideshowInterval: String(storedValue('personalisation.background.slideshowInterval') || '30 minutes'),
    shuffle: flag('personalisation.background.shuffle', false),
    // Personalisation > Taskbar.
    taskbarWhere: text('personalisation.taskbar.where', ['Bottom', 'Top', 'Left', 'Right'], 'Bottom'),
    taskbarAutoHide: flag('personalisation.taskbar.autoHideDesktop', false) || flag('personalisation.taskbar.autoHideTablet', false),
    taskbarSmallIcons: flag('personalisation.taskbar.smallIcons', false),
    taskbarPeek: flag('personalisation.taskbar.peek', false),
    // "Combine taskbar buttons": only the two "show labels" choices and plain
    // "Never" put the window's name on the bar; the rest stay icon-only.
    taskbarLabels: ['Never', 'Never, show labels', 'Always, show labels'].indexOf(
      text('personalisation.taskbar.combine', ['Never', 'When taskbar is full', 'Always, hide labels', 'Always, show labels', 'Never, show labels'], 'Always, hide labels')
    ) >= 0,
    // Personalisation > Start.
    startRecentlyAdded: flag('personalisation.start.showRecentlyAdded', true),
    startMostUsed: flag('personalisation.start.showMostUsed', false),
    startSuggestions: flag('personalisation.start.showSuggestions', true),
    startFullScreen: flag('personalisation.start.useFullScreen', false)
  };
}

function apply() {
  if (!stage) {
    return;
  }
  var style = stage.style;
  style.setProperty('--accent', look.accent);
  style.setProperty('--accent-rgb', look.accentRgb);
  style.setProperty('--accent-on', look.onAccent);
  // Start and the taskbar wear the accent only while "Start, taskbar and action
  // center" asks them to; off, they fall back to a neutral grey the way Windows
  // leaves them.
  style.setProperty('--shell-accent', look.accentStart ? look.accent : '#767676');
  style.setProperty('--wallpaper-image', look.wallpaper.image);
  style.setProperty('--wallpaper-size', look.wallpaper.size);
  style.setProperty('--wallpaper-repeat', look.wallpaper.repeat);
  style.setProperty('--wallpaper-position', look.wallpaper.position);
  style.setProperty('--wallpaper-colour', look.wallpaper.colour);
  style.setProperty('--lock-wallpaper', look.lockWallpaper);
  style.setProperty('--signin-image', look.lockOnSignIn ? look.lockWallpaper : 'none');
  style.setProperty('--dim', String(look.dim));
  style.setProperty('--nightlight', look.nightLight ? String(look.nightLightStrength) : '0');

  stage.dataset.transparency = look.transparent ? 'on' : 'off';
  stage.dataset.colorFilter = look.colorFilter;
  stage.dataset.contrast = look.contrast;
  stage.dataset.desktopIcons = look.showDesktopIcons ? 'on' : 'off';
  stage.dataset.desktopIconSize = look.desktopIconSize.split(' ')[0].toLowerCase();
  stage.classList.toggle('accent-titlebars', look.accentTitlebars);
  stage.classList.toggle('reduce-motion', !look.animations);

  if (cursor && typeof cursor.setSizeScale === 'function') {
    cursor.setSizeScale(look.pointerScale);
  }
  syncSlideshow();
}

function announce() {
  listeners.slice().forEach(function (fn) {
    try {
      fn(look);
    } catch (err) {
      // One bad listener must not stop the others redrawing.
    }
  });
}

function syncSlideshow() {
  if (slideshow.timer) {
    window.clearInterval(slideshow.timer);
    slideshow.timer = null;
  }
  if (!look.slideshow) {
    return;
  }
  var every = INTERVAL_MS[look.slideshowInterval] || INTERVAL_MS['30 minutes'];
  slideshow.timer = window.setInterval(function () {
    slideshow.index = look.shuffle
      ? Math.floor(Math.random() * SLIDESHOW_IMAGES.length)
      : slideshow.index + 1;
    look.wallpaper = desktopWallpaper(look.wallpaperKind, text('personalisation.background.fit', Object.keys(FIT), 'Fill'), look.wallpaper.colour);
    if (stage) {
      stage.style.setProperty('--wallpaper-image', look.wallpaper.image);
    }
    announce();
  }, every);
}

export function initAppearance(stageEl) {
  stage = stageEl;
  // The two things Settings can lay over the whole screen - the brightness dim
  // and the night-light warm - are elements rather than colors, so they are
  // born here, inside the stage and above everything in it, with their opacity
  // driven by the custom properties apply() writes.
  if (stage && !stage.querySelector('.sim-screen-dim')) {
    var dim = document.createElement('div');
    dim.className = 'sim-screen-dim';
    var warm = document.createElement('div');
    warm.className = 'sim-screen-warm';
    stage.appendChild(dim);
    stage.appendChild(warm);
  }
  look = computeLook();
  apply();
  onSettingsChanged(function () {
    look = computeLook();
    apply();
    announce();
  });
  return settingsReady().then(function () {
    look = computeLook();
    apply();
    announce();
    return look;
  });
}

// The emulated pointer is created after the stage, so it is handed over once it
// exists; until then the size setting waits.
export function attachCursor(cursorApi) {
  cursor = cursorApi;
  if (look && typeof cursor.setSizeScale === 'function') {
    cursor.setSizeScale(look.pointerScale);
  }
}

export function getLook() {
  return look || (look = computeLook());
}

// For the surfaces that have to redraw rather than restyle - the desktop's
// wallpaper, the lock screen. Called immediately with the current look so a
// subscriber never has to wait for the first change to learn the state.
export function subscribeLook(fn) {
  listeners.push(fn);
  fn(getLook());
  return function () {
    var at = listeners.indexOf(fn);
    if (at >= 0) {
      listeners.splice(at, 1);
    }
  };
}
