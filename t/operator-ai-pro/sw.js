const CACHE_NAME = 'operator-ai-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/tracker.html',
    '/css/main.css',
    '/css/landing.css',
    '/css/tracker.css',
    '/js/language.js',
    '/config.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
