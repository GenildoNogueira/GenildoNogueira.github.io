'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
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
"assets/NOTICES": "8521280c990a80c7dfaf9e8b16705026",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "57d849d738900cfd590e9adc7e208250",
"assets/shaders/ink_sparkle.frag": "92666cc97576adbea2e2d3061a953137",
"canvaskit/canvaskit.js": "971260b2fcb9a1c3b5fd69fb698cf9ba",
"canvaskit/canvaskit.wasm": "abce7d16c081c21404dfa6bcc0235972",
"favicon.png": "b5999196f82fa5565d0eebdda9b22659",
"flutter.js": "a85fcf6324d3c4d3ae3be1ae4931e9c5",
"icons/Icon-192.png": "fc4a26b9cd8cd4ee837065584943a712",
"icons/Icon-512.png": "a7d3c76f604e43b947488e61baa3ef62",
"icons/Icon-maskable-192.png": "657c996e7743218bd70976e0a921be1a",
"icons/Icon-maskable-512.png": "d4920b72e479b00d162f34e4a732c08b",
"index.html": "f8032b6961f842de805cd086906fc510",
"/": "f8032b6961f842de805cd086906fc510",
"main.dart.js": "f54b796d145e6a910090b83e7dd623eb",
"main.dart.js_1.part.js": "ca6b78000be6ab1ba87e6e3d6ec2c9c4",
"main.dart.js_2.part.js": "562b599c17bc2aa7176c41ab6b29c2cc",
"main.dart.js_3.part.js": "02f6d81dd227a0e197c635d78d476e54",
"main.dart.js_4.part.js": "60f3e6f92709dc8f317e6f9313d4f08d",
"main.dart.js_5.part.js": "bc8fef5727ca943c6bfb34d026d7ebf1",
"main.dart.js_6.part.js": "39c8369fc43ddc8f1ce04fe99a80ca53",
"main.dart.js_7.part.js": "da5370cef6ed797f71ab6ae10b77f3c8",
"main.dart.js_8.part.js": "35db145628c0cbf6d8740afb13a2f2ff",
"main.dart.js_9.part.js": "17a6675f79e5ad67a370439dc05e5e23",
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
        // Claim client to enable caching on first launch
        self.clients.claim();
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
      // Claim client to enable caching on first launch
      self.clients.claim();
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
