/* Service worker Martabak Mas Bejo — network-first (kode/data selalu terbaru), cache hanya cadangan offline.
   v13: precache tahan-gagal, cocok-cache mengabaikan ?v=, batas waktu jaringan 4 dtk, fallback halaman hanya untuk navigasi. */
const V = 'mb-v14', NET_TIMEOUT = 4000;
const CORE = ['./', 'index.html', 'admin.html', 'style.css?v=11', 'script.js?v=14', 'admin.css?v=12', 'admin.js?v=14', 'logo.png', 'favicon.png?v=11', 'icon-512.png?v=11', 'icon-maskable.png?v=11', 'apple-touch-icon.png?v=11', 'manifest.json', 'manifest-admin.json', 'preview.jpg', 'img/asin-ayam-pedas.webp', 'img/asin-daging-sapi.webp', 'img/asin-hero.webp', 'img/asin-kebab-spesial.webp', 'img/asin-kornet-keju.webp', 'img/asin-sosis-keju.webp', 'img/asin-telur-spesial.webp', 'img/asin-umum.webp', 'img/hero.webp', 'img/manis-cokelat-keju.webp', 'img/manis-kacang-cokelat.webp', 'img/manis-keju-susu.webp', 'img/manis-nutella.webp', 'img/manis-oreo-cokelat.webp', 'img/manis-pandan-keju.webp', 'img/mix-spesial.webp'];

self.addEventListener('install', e => e.waitUntil(
  caches.open(V).then(c => Promise.allSettled(CORE.map(u => c.add(new Request(u, { cache: 'reload' }))))).then(() => self.skipWaiting())
));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(k => Promise.all(k.filter(x => x.startsWith('mb-') && x !== V && x !== V + '-font').map(x => caches.delete(x)))).then(() => self.clients.claim())
));
self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting() });

const fromCache = req => caches.match(req, { ignoreSearch: true });
const offlinePage = req => {
  if (req.mode === 'navigate') return caches.match(new URL(req.url).pathname.endsWith('admin.html') ? 'admin.html' : 'index.html', { ignoreSearch: true });
  return Promise.resolve(null);
};

const FONT = /^(fonts\.googleapis\.com|fonts\.gstatic\.com)$/;
self.addEventListener('fetch', e => {
  const q = e.request, u = new URL(q.url);
  if (q.method === 'GET' && FONT.test(u.hostname)) {          /* font Google: tampil juga saat offline */
    e.respondWith(caches.open(V + '-font').then(async c => { const hit = await c.match(q), net = fetch(q).then(r => { if (r.ok || r.type === 'opaque') c.put(q, r.clone()); return r }).catch(() => hit); return hit || net }));
    return;
  }
  if (q.method !== 'GET' || u.origin !== self.location.origin || q.headers.has('range')) return;
  e.respondWith((async () => {
    const net = fetch(q).then(r => {
      if (r.status === 200 && r.type === 'basic') { const cp = r.clone(); e.waitUntil(caches.open(V).then(c => c.put(q, cp)).catch(() => { })) }
      return r;
    });
    net.catch(() => { });
    try {
      const r = await Promise.race([net, new Promise(res => setTimeout(() => res(null), NET_TIMEOUT))]);
      if (r) return r;
      return (await fromCache(q)) || await net;               /* jaringan lambat: pakai cache bila ada */
    } catch (err) {                                           /* offline */
      return (await fromCache(q)) || (await offlinePage(q)) || new Response('Offline', { status: 503, statusText: 'Offline', headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
  })());
});
