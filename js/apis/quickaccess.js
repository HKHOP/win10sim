import { createPrefs } from './prefs.js';

// Quick Access: the pinned folder list and the recently-used list that live
// behind Explorer's Quick access page.
//
// Win10 keeps both per account in the registry, which is why they survive a
// reboot. They are the app's own store file rather than the registry, for the
// same reason: they belong to the profile and outlive the session.

const RECENT_MAX = 25;
// Win10's Quick access holds the profile's known folders out of the box.
const DEFAULT_PINNED = ['Desktop', 'Downloads', 'Documents', 'Music', 'Pictures', 'Videos'];

const store = createPrefs('C:\\$QuickAccess.json', function () {
  return { pinned: DEFAULT_PINNED.slice(), recent: [] };
});

// Attached once by the app registry, which owns the single (lazy) volume
// mount, so Explorer and Notepad share one store.
export function attachQuickAccess(getVolume) {
  store.attach(getVolume);
}

// A store file is data from the user's disk, not something the shell wrote
// this tick, so it gets checked before anything reads it.
function tidy(state) {
  state.pinned = (Array.isArray(state.pinned) ? state.pinned : [])
    .filter(function (name) { return typeof name === 'string'; });
  state.recent = (Array.isArray(state.recent) ? state.recent : [])
    .filter(function (entry) { return entry && typeof entry.place === 'string'; })
    .slice(0, RECENT_MAX);
  return state;
}

export async function getPinned() {
  return tidy(await store.read()).pinned.slice();
}

export async function isPinned(name) {
  return tidy(await store.read()).pinned.indexOf(name) >= 0;
}

// Returns the new pinned state of that folder.
export async function togglePin(name) {
  var state = await store.update(function (current) {
    tidy(current);
    var at = current.pinned.indexOf(name);
    if (at >= 0) {
      current.pinned.splice(at, 1);
    } else {
      current.pinned.push(name);
    }
    return current;
  });
  return state.pinned.indexOf(name) >= 0;
}

export async function getRecent() {
  return tidy(await store.read()).recent.slice();
}

// An item the user opened, most recent first. Win10 keys Recent off the place,
// so re-opening something moves it back to the top instead of duplicating it.
export async function noteUsed(entry) {
  if (!entry || !entry.place || entry.place === 'thispc' || entry.place === 'home') {
    return;
  }
  await store.update(function (state) {
    tidy(state);
    state.recent = state.recent
      .filter(function (row) { return row.place !== entry.place; });
    state.recent.unshift({
      place: entry.place,
      name: entry.name,
      type: entry.type === 'dir' ? 'dir' : 'file',
      at: Date.now()
    });
    state.recent = state.recent.slice(0, RECENT_MAX);
    return state;
  });
}

// Drops the in-memory copy, so the next read comes from the volume again.
export function forgetQuickAccess() {
  store.forget();
}
