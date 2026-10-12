// A per-profile preference file on the volume: the Quick access pins and the
// recent list behind it, the file-type defaults, and anything else a profile
// remembers between visits. Each store is one hidden $-prefixed file at C:,
// which is why it stays out of Explorer's listings, the same way Windows keeps
// its own records out of the user's way.
//
// Writes are debounced: walking the tree touches a store on every folder
// visited, and each touch would otherwise hit storage.

const DEFAULT_SAVE_DELAY_MS = 400;

export function createPrefs(file, fallback, opts) {
  const options = opts || {};
  const saveDelayMs = options.saveDelayMs || DEFAULT_SAVE_DELAY_MS;
  const defaults = typeof fallback === 'function' ? fallback : function () { return fallback; };

  let getVolume = null;
  let cache = null;
  let loading = null;
  let timer = null;

  async function load() {
    if (cache) {
      return cache;
    }
    if (!loading) {
      loading = (async function () {
        var next = defaults();
        var volume = getVolume ? await getVolume() : null;
        if (volume && volume.available) {
          try {
            var stored = await volume.readFile(file);
            var parsed = JSON.parse(await stored.text());
            if (parsed && typeof parsed === 'object') {
              Object.assign(next, parsed);
            }
          } catch (err) {
            // Nothing stored yet: a first run keeps the defaults.
          }
        }
        cache = next;
        return cache;
      })();
    }
    return loading;
  }

  function schedule() {
    if (timer) {
      window.clearTimeout(timer);
    }
    timer = window.setTimeout(function () {
      timer = null;
      if (!getVolume || !cache) {
        return;
      }
      getVolume().then(function (volume) {
        if (!volume || !volume.available) {
          return null;
        }
        return volume.writeFile(file, JSON.stringify(cache));
      }, function () {});
    }, saveDelayMs);
  }

  return {
    // The volume arrives as a getter, never as its result: no app should have
    // to wait on storage it may never touch.
    attach(getter) {
      getVolume = getter;
    },
    read() {
      return load();
    },
    // `mutate` receives the live state and may change it in place. The file is
    // written back once the burst of changes settles.
    update(mutate) {
      return load().then(function (state) {
        mutate(state);
        schedule();
        return state;
      });
    },
    // Drops the in-memory copy so the next read comes from the volume again.
    forget() {
      cache = null;
      loading = null;
    }
  };
}
