// Quick Access: the pinned folder list and the recently-used list that live
// behind Explorer's Home page.
//
// Win10 keeps both per account in the registry, which is why they survive a
// reboot. Here they live in one hidden file on the volume ($QuickAccess.json
// at C:\) so they survive a reload and stay out of every listing, exactly
// like the other $-prefixed system entries Explorer hides.

const STORE_PATH = 'C:\\$QuickAccess.json';

// Win10 shows the most recently used items first and keeps a working set; the
// home page only ever renders the first handful of them.
const RECENT_MAX = 25;
// Win10's Quick access holds the profile's known folders out of the box.
const DEFAULT_PINNED = ['Desktop', 'Downloads', 'Documents', 'Music', 'Pictures', 'Videos'];

var getMountedVolume = null;
var cache = null;
var loading = null;
var saveTimer = null;

// Attached once by the app registry, which owns the single (lazy) volume
// mount, so Explorer and Notepad share one store. It is kept as the getter,
// not its result, so no app has to wait on storage it may never touch.
export function attachQuickAccess(getVolume) {
  getMountedVolume = getVolume;
}

function fresh() {
  return { pinned: DEFAULT_PINNED.slice(), recent: [] };
}

async function load() {
  if (cache) {
    return cache;
  }
  if (!loading) {
    loading = (async function () {
      var next = fresh();
      var volume = getMountedVolume ? await getMountedVolume() : null;
      if (volume && volume.available) {
        try {
          var file = await volume.readFile(STORE_PATH);
          var parsed = JSON.parse(await file.text());
          if (parsed && Array.isArray(parsed.pinned)) {
            next.pinned = parsed.pinned.filter(function (name) { return typeof name === 'string'; });
          }
          if (parsed && Array.isArray(parsed.recent)) {
            next.recent = parsed.recent.filter(function (entry) {
              return entry && typeof entry.place === 'string';
            }).slice(0, RECENT_MAX);
          }
        } catch (err) {
          // No store yet: a first run keeps Win10's default pins.
        }
      }
      cache = next;
      return cache;
    })();
  }
  return loading;
}

// Writes are debounced: walking the tree notes an item per folder visited and
// each note would otherwise hit the volume.
function save() {
  if (saveTimer) {
    window.clearTimeout(saveTimer);
  }
  saveTimer = window.setTimeout(function () {
    saveTimer = null;
    if (!getMountedVolume || !cache) {
      return;
    }
    getMountedVolume().then(function (volume) {
      if (!volume || !volume.available) {
        return null;
      }
      return volume.writeFile(STORE_PATH, JSON.stringify(cache));
    }, function () {});
  }, 400);
}

export async function getPinned() {
  return (await load()).pinned.slice();
}

export async function isPinned(name) {
  return (await load()).pinned.indexOf(name) >= 0;
}

// Returns the new pinned state of that folder.
export async function togglePin(name) {
  var store = await load();
  var at = store.pinned.indexOf(name);
  if (at >= 0) {
    store.pinned.splice(at, 1);
    save();
    return false;
  }
  store.pinned.push(name);
  save();
  return true;
}

export async function getRecent() {
  return (await load()).recent.slice();
}

// An item the user opened, most recent first. Win10 keys Recent off the place,
// so re-opening something moves it back to the top instead of duplicating it.
export async function noteUsed(entry) {
  if (!entry || !entry.place || entry.place === 'thispc' || entry.place === 'home') {
    return;
  }
  var store = await load();
  var recent = store.recent.filter(function (row) { return row.place !== entry.place; });
  recent.unshift({
    place: entry.place,
    name: entry.name,
    type: entry.type === 'dir' ? 'dir' : 'file',
    at: Date.now()
  });
  store.recent = recent.slice(0, RECENT_MAX);
  save();
}

// Used by tests / a reset path so the next load reads the file again.
export function forgetQuickAccess() {
  cache = null;
  loading = null;
}
