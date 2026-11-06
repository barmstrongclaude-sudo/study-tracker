/* Lets the installed app open with no connection. The app page checks the network first,
   so updates arrive on their own; everything else is served from the saved copy. */
var CACHE = "study-tracker-v2";
var SHELL = ["./", "index.html", "config.js", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", "icon-64.png"];
self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener("fetch", function(e){
  var req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  var sameOrigin = url.origin === location.origin;
  var isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if ((!sameOrigin && !isFont) || /\/(rest|auth)\/v1\//.test(url.pathname)) return; /* database traffic is never cached */
  if (req.mode === "navigate" || /(index\.html|config\.js)$/.test(url.pathname)){
    e.respondWith(fetch(req).then(function(r){
      var copy = r.clone(); caches.open(CACHE).then(function(c){ c.put(req.mode === "navigate" ? "index.html" : req, copy); }); return r;
    }).catch(function(){ return caches.match(req.mode === "navigate" ? "index.html" : req); }));
    return;
  }
  e.respondWith(caches.match(req).then(function(hit){
    return hit || fetch(req).then(function(r){
      var copy = r.clone(); caches.open(CACHE).then(function(c){ c.put(req, copy); }); return r;
    });
  }));
});
