import { createPrefs } from './prefs.js';

// File type associations: which registered app opens which extension, which of
// them is the default, and what Windows calls that type of file.
//
// Windows keeps this in HKCR and fills it in as apps register themselves. An
// app here declares the same thing in its manifest; the shell keeps the list,
// answers "what opens this?", and remembers a choice the user makes. Only the
// choices need storing, so that is all this file holds.
//
// A file type is not the same thing as the apps that open it. The type is the
// shell's own record - the name Windows shows in the Type column, and the media
// type the format goes by - and an app claims it to become a handler. Registering
// .lnk here, for instance, is what makes a shortcut file call itself a Shortcut
// whether or not anything has claimed it yet.

// In the profile with the shell's other store files, because the root of C: is
// no longer a folder a program may write to. An older install has the file at
// the old path, which is read once and then taken away.
const store = createPrefs('C:\\Users\\User\\AppData\\Local\\$FileTypes.json', function () {
  return { defaults: {} };
}, { legacy: 'C:\\$FileTypes.json' });

// One record per (app, extension), built from the manifests as apps register.
let handlers = [];

// The shell's own file types, by extension.
let types = {};

// The types the shell knows before any app says anything. Windows has hundreds;
// these are the ones this build can actually produce a file in.
const BUILTIN_TYPES = [
  { ext: 'lnk', type: 'Shortcut' }
];

BUILTIN_TYPES.forEach(function (entry) { registerFileType(entry); });

// Declares (or corrects) a file type. Safe to call repeatedly: an app that
// registers the same type again replaces its own record.
export function registerFileType(entry) {
  if (!entry || !entry.ext) {
    return null;
  }
  var clean = String(entry.ext).replace(/^\./, '').toLowerCase();
  var record = {
    ext: clean,
    type: entry.type || '',
    mediaType: entry.mediaType || ''
  };
  types[clean] = record;
  return record;
}

export function typeInfoFor(ext) {
  var clean = String(ext || '').replace(/^\./, '').toLowerCase();
  return types[clean] || null;
}

function extensionOf(name) {
  var text = String(name || '');
  var dot = text.lastIndexOf('.');
  if (dot < 1) {
    return '';
  }
  return text.slice(dot + 1).toLowerCase();
}

// The volume arrives from the app registry, which owns the single mount.
export function attachAssociations(getVolume) {
  store.attach(getVolume);
}

// Called by the registry for every app that declares file types. Re-registering
// an app replaces what it claimed before, so a reloaded module cannot leave a
// stale copy of its own associations behind.
export function registerAssociations(appId, manifest) {
  handlers = handlers.filter(function (entry) { return entry.appId !== appId; });
  var declared = (manifest && manifest.associations) || [];
  declared.forEach(function (group) {
    var exts = group.ext || [];
    (Array.isArray(exts) ? exts : [exts]).forEach(function (ext) {
      var clean = String(ext).replace(/^\./, '').toLowerCase();
      if (!clean) {
        return;
      }
      // An app may introduce a type it knows about, the way an installer writes
      // the description into HKCR - but it does not overwrite a type the shell
      // already knows.
      if (group.type && !typeInfoFor(clean)) {
        registerFileType({ ext: clean, type: group.type });
      }
      handlers.push({
        appId: appId,
        ext: clean,
        type: group.type || '',
        // 'editor', 'viewer', 'handler' - what the app does with the file, the
        // way Windows records a ProgID's role. Nothing branches on it yet.
        role: group.role || 'handler'
      });
    });
  });
  return handlers.filter(function (entry) { return entry.appId === appId; });
}

// Everything registered for an extension, in registration order: the first app
// to claim a type is the one Windows would hand the file to first.
export function handlersFor(ext) {
  var clean = String(ext || '').replace(/^\./, '').toLowerCase();
  if (!clean) {
    return [];
  }
  return handlers.filter(function (entry) { return entry.ext === clean; });
}

// What Explorer shows in a file's Type column: the shell's own name for the
// type when it has one, and otherwise the name an app gave it when it claimed
// the extension.
export function typeFor(ext) {
  var known = typeInfoFor(ext);
  if (known && known.type) {
    return known.type;
  }
  var found = handlersFor(ext);
  return found.length ? found[0].type : '';
}

// The app a double-click opens the file with. A remembered default only counts
// while that app still says it handles the type, so uninstalling an app cannot
// leave a file pointing at nothing.
//
// The answer is always a promise, "nothing" included: a drive full of Windows
// files means most of what a person can click has no app behind it, and every
// caller is waiting for an answer rather than checking whether there is one.
export function defaultAppFor(ext) {
  var clean = String(ext || '').replace(/^\./, '').toLowerCase();
  var offered = handlersFor(clean);
  if (offered.length === 0) {
    return Promise.resolve(null);
  }
  var cache = store.read();
  return cache.then(function (state) {
    var remembered = state.defaults && state.defaults[clean];
    var stillThere = offered.some(function (entry) { return entry.appId === remembered; });
    return stillThere ? remembered : offered[0].appId;
  });
}

// Every extension anything has claimed, with the type's own name.
//
// This is the list behind Settings > Apps > Default apps: Windows shows one row
// per file type the machine can associate, and that list can only be the
// registered types - a hand-written list would go stale the moment an app
// claimed something, and would name types no app handles. Which app each type
// opens with is a separate question and an asynchronous one; see defaultAppFor.
export function registeredTypes() {
  var seen = {};
  var out = [];
  handlers.forEach(function (entry) {
    if (seen[entry.ext]) {
      return;
    }
    seen[entry.ext] = true;
    out.push({
      ext: entry.ext,
      type: entry.type || ''
    });
  });
  return out;
}

// "Always use this app": the choice outlives the session, per profile.
export function setDefaultApp(ext, appId) {
  var clean = String(ext || '').replace(/^\./, '').toLowerCase();
  if (!clean || !appId) {
    return Promise.resolve(null);
  }
  return store.update(function (state) {
    if (!state.defaults) {
      state.defaults = {};
    }
    state.defaults[clean] = appId;
  }).then(function () { return appId; });
}

export function forgetAssociations() {
  handlers = [];
  store.forget();
}

export { extensionOf };
