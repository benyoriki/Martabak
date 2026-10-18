// Network-first: data selalu terbaru; cache hanya cadangan offline.
const C='mb-v8',CORE=['./','index.html','style.css','script.js','logo.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(CORE)).catch(()=>{}).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const q=e.request;if(q.method!=='GET'||!q.url.startsWith(self.location.origin))return;
 e.respondWith(fetch(q).then(r=>{if(r.ok&&r.type==='basic'){const c=r.clone();caches.open(C).then(x=>x.put(q,c)).catch(()=>{})}return r}).catch(()=>caches.match(q).then(m=>m||caches.match('index.html'))))});
