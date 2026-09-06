// sw.js — service worker de SaisieABC.
//
// STRATEGIE : RESEAU D'ABORD, cache en repli.
// C'est le point important : TEYSSIER publie une nouvelle version du .html
// regulierement. Un cache prioritaire servirait indefiniment l'ancienne, et une
// mise a jour poussee sur GitHub Pages ne serait jamais vue. On tente donc
// toujours le reseau, on ne retombe sur le cache que hors ligne.
// Effet de bord voulu : l'appli reste utilisable sans connexion, avec la
// derniere version reellement chargee.
const CACHE = 'saisieabc-v1';
const BASE = ['./manifest.json', './icon-192.png', './icon-512.png', './icon-512-maskable.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASE).catch(() => {})));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    try {
      const net = await fetch(req);
      if (net && net.ok) {
        const c = await caches.open(CACHE);
        c.put(req, net.clone());
      }
      return net;
    } catch (err) {
      const hit = await caches.match(req);
      if (hit) return hit;
      throw err;
    }
  })());
});
