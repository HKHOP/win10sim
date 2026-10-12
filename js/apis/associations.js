import { createPrefs } from './prefs.js';

// File type associations: which registered app opens which extension, which of
// them is the default, and what Windows calls that type of file.
//
// Windows keeps this in HKCR and fills it in as apps register themselves. An
// app here declares the same thing in its manifest; the shell keeps the list,
// answers "what opens this?", and remembers a choice the user makes. Only the
// choices need storing, so that is all this file holds.

const store = createPrefs('C:\\$FileTypes.json', function () {
  return { defaults: {} };
});

// One record per (app, extension), built from the manifests as apps register.
let handlers = [];

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

// What Explorer shows in a file's Type column: the name the apps gave the type
// when they registered it, or '' when nothing has claimed the extension.
export function typeFor(ext) {
  var found = handlersFor(ext);
  return found.length ? found[0].type : '';
}

// The app a double-click opens the file with. A remembered default only counts
// while that app still says it handles the type, so uninstalling an app cannot
// leave a file pointing at nothing.
export function defaultAppFor(ext) {
  var clean = String(ext || '').replace(/^\./, '').toLowerCase();
  var offered = handlersFor(clean);
  if (offered.length === 0) {
    return null;
  }
  var cache = store.read();
  return cache.then(function (state) {
    var remembered = state.defaults && state.defaults[clean];
    var stillThere = offered.some(function (entry) { return entry.appId === remembered; });
    return stillThere ? remembered : offered[0].appId;
  });
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
