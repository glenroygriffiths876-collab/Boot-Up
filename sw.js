/* Boot-Up Café lightweight offline shell: never queues or pretends to send orders. */
const CACHE = 'bootup-v2';
const SHELL = ['./','./index.html','./styles.css','./main.js','./catalog.js','./assets/bootup-icon.svg','./assets/icon-192.png','./assets/icon-512.png','./manifest.webmanifest'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET' || new URL(req.url).origin!==self.location.origin) return;
  if(req.mode==='navigate') {
    event.respondWith(fetch(req).then(res=>{
      if(res.ok)caches.open(CACHE).then(cache=>cache.put('./index.html',res.clone()));
      return res;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{
    if(res.ok && new URL(req.url).pathname.startsWith(new URL('./',self.registration.scope).pathname)) {
      const copy=res.clone();
      caches.open(CACHE).then(cache=>cache.put(req,copy));
    }
    return res;
  })));
});
