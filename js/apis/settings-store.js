import { createPrefs } from './prefs.js';

// Every value the Settings app shows, as one table.
//
// Windows keeps most of this in the registry under HKCU\Software\Microsoft\
// Windows\CurrentVersion\..., which is per account rather than per machine -
// that is why a setting follows the profile instead of the PC. There is no
// registry here to write, so the table is a file in the profile, exactly the way
// Quick access (quickaccess.js) and the file-type defaults (associations.js)
// are kept: they are all profile-scoped facts that have to outlive the session.
//
// Keys are dotted paths rather than nested objects. A flat map is what has to
// be written and read as JSON, it makes "everything under personalisation"
// answerable without walking a tree, and it means a setting added later needs no
// migration for the ones already stored.
//
// The store is deliberately dumb: it holds path -> value and knows nothing about
// what any path means. The catalogue (js/apps/settings/catalogue.js) owns that,
// because the set of valid values belongs with the page that offers them -
// which is also where a stored value that is no longer offered gets replaced by
// the default it replaced.

// One hidden $-prefixed file in the profile, so it stays out of Explorer's
// listings the way Windows keeps its own records out of the user's way.
const SETTINGS_FILE = 'C:\\Users\\User\\AppData\\Local\\$Settings.json';

const store = createPrefs(SETTINGS_FILE, function () {
  return { values: {} };
});

// Attached once by the app registry, which owns the single (lazy) volume mount,
// so Settings and anything else that later reads a setting share one mount.
export function attachSettings(getVolume) {
  store.attach(getVolume);
}

let cache = null;
let ready = null;
let listeners = [];

// Subscribers hear every write, with the path and the value written, so a
// surface that shows one setting somewhere else can follow it. Win10 does the
// same thing: change "Show desktop background on Start" in Personalisation and
// Start follows immediately rather than at the next sign-in.
export function onSettingsChanged(fn) {
  listeners.push(fn);
  return function () {
    var at = listeners.indexOf(fn);
    if (at >= 0) {
      listeners.splice(at, 1);
    }
  };
}

function emit(path, value) {
  listeners.slice().forEach(function (fn) {
    try {
      fn(path, value);
    } catch (err) {
      // One bad subscriber must not stop the others hearing the change.
    }
  });
}

function state() {
  if (!cache) {
    cache = { values: {} };
  }
  if (!cache.values || typeof cache.values !== 'object') {
    // A store file that has been edited into nonsense is a store file with no
    // values in it, not a reason to refuse to start.
    cache.values = {};
  }
  return cache;
}

// Resolves once the stored table has been read. Everything that draws a setting
// awaits this first, so a control is never painted from a default that the
// profile had already overridden.
export function settingsReady() {
  if (!ready) {
    ready = store.read().then(function (read) {
      cache = state();
      cache.values = (read && read.values && typeof read.values === 'object') ? read.values : {};
      return cache;
    });
  }
  return ready;
}

// The stored value for a path, or undefined when the profile has never set it.
// Callers pair this with the catalogue's own default; see valueOf().
export function storedValue(path) {
  var values = state().values;
  return Object.prototype.hasOwnProperty.call(values, path) ? values[path] : undefined;
}

export function hasStored(path) {
  return Object.prototype.hasOwnProperty.call(state().values, path);
}

// Writes one value and persists it. Returns the value actually stored, which is
// not always the one asked for: see settings-store's note on the catalogue
// owning validation, and coerce() there.
export function setStored(path, value) {
  if (!path) {
    return Promise.resolve(undefined);
  }
  var next = state();
  next.values[path] = value;
  emit(path, value);
  return store.update(function (current) {
    if (!current.values || typeof current.values !== 'object') {
      current.values = {};
    }
    current.values[path] = value;
    return current;
  }).then(function () {
    return value;
  });
}

// Back to what Windows ships with, for one path or for all of them. Resetting
// all of them is what Settings' own "Restore defaults" does, and what the
// shortcut below the app's name does too.
export function resetStored(path) {
  if (!path) {
    var emptied = {};
    var had = Object.keys(state().values);
    state().values = emptied;
    had.forEach(function (key) {
      emit(key, undefined);
    });
    return store.update(function (current) {
      current.values = {};
      return current;
    });
  }
  var values = state().values;
  if (!Object.prototype.hasOwnProperty.call(values, path)) {
    return Promise.resolve();
  }
  delete values[path];
  emit(path, undefined);
  return store.update(function (current) {
    delete current.values[path];
    return current;
  });
}

// Every stored path, for "what has this profile actually changed?" - the
// question the checker asks, and the one a reset needs to answer.
export function storedPaths() {
  return Object.keys(state().values).sort();
}