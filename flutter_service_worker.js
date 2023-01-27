'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "404.html": "0a27a4163254fc8fce870c8cc3a3f94f",
"apple-touch-icon.png": "c068302142b33b5b71d09706d67729b9",
"assets/AssetManifest.bin": "e613b8402e5240843acf0bd3ffa66571",
"assets/AssetManifest.json": "c729ad3bda135fbf1c2abdfe6c2509f2",
"assets/assets/images/conjugado.png": "cd44f536b567b160651b35f7e05a1b55",
"assets/assets/images/logo_str3d.png": "ea9e4fcf2d3889d67f9e11b34927d60d",
"assets/assets/images/sem_image_background.png": "f180e8a8a2a97c30882568cab4351255",
"assets/assets/images/triangulo_down.png": "3796a35b9a657acc21082c884f3ddfce",
"assets/assets/images/triangulo_up.png": "4b69cb0648028012433bba0e6d054f18",
"assets/FontManifest.json": "dc3d03800ccca4601324923c0b1d6d57",
"assets/fonts/MaterialIcons-Regular.otf": "fe43a8c62878074ffdbbfcb4c1ad5b85",
"assets/NOTICES": "f7661466bb67968c36a5dfd39cd3ebea",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "57d849d738900cfd590e9adc7e208250",
"assets/shaders/ink_sparkle.frag": "92666cc97576adbea2e2d3061a953137",
"canvaskit/canvaskit.js": "678d9f53b0e5c5f22543631f43279fb9",
"canvaskit/canvaskit.wasm": "6972cd6e8f48c5f3c027416c7b2443a6",
"canvaskit/profiling/canvaskit.js": "5a0f05139f1d43c603dcfc67d15b1ec9",
"canvaskit/profiling/canvaskit.wasm": "09aacbc0d8b20c7ee684e310703e2d86",
"favicon.png": "b5999196f82fa5565d0eebdda9b22659",
"flutter.js": "1cfe996e845b3a8a33f57607e8b09ee4",
"icons/Icon-192.png": "fc4a26b9cd8cd4ee837065584943a712",
"icons/Icon-512.png": "a7d3c76f604e43b947488e61baa3ef62",
"icons/Icon-maskable-192.png": "657c996e7743218bd70976e0a921be1a",
"icons/Icon-maskable-512.png": "d4920b72e479b00d162f34e4a732c08b",
"index.html": "64cd7388ac1c453e0c4d8960da2320f2",
"/": "64cd7388ac1c453e0c4d8960da2320f2",
"main.dart.js": "7d2f8ca693cf3eb34a259140119efca5",
"main.dart.js_1.part.js": "527e048a18c0f67e187dc9b5a783a898",
"main.dart.js_2.part.js": "a912128fc478bf3fc2d4db0ae0507aaf",
"main.dart.js_3.part.js": "9e0539451469a441a3f662ec7253dce2",
"main.dart.js_4.part.js": "6eb56bb5176b01e4ba271903c70b8759",
"main.dart.js_5.part.js": "71f337e8242faff8a4951c311b7fb9e7",
"main.dart.js_6.part.js": "34b4ea794e50cb1b230c639fcae76578",
"main.dart.js_7.part.js": "09e60a6777a39c03ce9b79deeeee9e0a",
"manifest.json": "04fa08d6e7110c38c01fbebf2790a1c7",
"version.json": "894149b33c703bce4cd93fbca9865630"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "main.dart.js",
"index.html",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache only if the resource was successfully fetched.
        return response || fetch(event.request).then((response) => {
          if (response && Boolean(response.ok)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
