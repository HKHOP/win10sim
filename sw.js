// Cache busting for a build-less static site.
//
// Every request is answered from the network first, and the network is asked
// to revalidate, so a device that opens the site always runs the code GitHub
// Pages is serving right now: a phone sitting on a cached js/core/*.js from
// last week never gets to run it. The cache is the offline fallback, and the
// fallback for a navigation when the network is gone.
//
// The site has no build step (the repo IS the build), so there are no hashed
// filenames to lean on and no cache headers we can set: this worker is the
// cache busting. Query strings on the <link>/<script> tags would only cover
// the files index.html names, not the module graph those files import.
//
// CACHE_VERSION is the knob: bump it whenever the strategy below changes and
// the entries the old strategy wrote are retired on activate.

var CACHE_VERSION = 'v1';
var CACHE_NAME = 'win10sim-' + CACHE_VERSION;

self.addEventListener('install', function (event) {
  // Nothing to precache: the emulated OS is meant to start from the newest
  // copy of itself, so taking over immediately is the whole point. The page
  // that installs this worker keeps running its already-loaded copy; the next
  // load is the first one served from here.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (names) {
        return Promise.all(names.map(function (name) {
          return name === CACHE_NAME ? null : caches.delete(name);
        }));
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') {
    return;
  }
  var url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    // Nothing off-site is ours to cache (there are no off-site requests).
    return;
  }

  event.respondWith(
    // cache: 'reload' is what makes this cache busting rather than just
    // caching: it skips the browser's HTTP cache, so the answer comes from
    // Pages rather than from a copy the browser kept for its own max-age.
    // Unchanged files still come back as cheap 304s.
    fetch(request, { cache: 'reload' })
      .then(function (response) {
        if (response && response.ok && response.type === 'basic') {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(request, copy);
          });
        }
        return response;
      })
      .catch(function () {
        // Offline (or Pages unreachable): the last copy we saw is the OS we
        // know how to boot, so it beats a failed load.
        return caches.match(request).then(function (cached) {
          return cached || caches.match(request, { ignoreSearch: true });
        });
      })
  );
});