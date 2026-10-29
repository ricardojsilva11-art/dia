/* dia. — funciona sem rede e mostra as notificações (lembretes, avisos, resumo) */
const CACHE = "dia-v3";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request, {cache:"no-cache"}).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match("./index.html"))));
});

/* notificação enviada pelo servidor */
self.addEventListener("push", e => {
  let m = {};
  try{ m = e.data ? e.data.json() : {}; }catch(err){ m = {body:e.data ? e.data.text() : ""}; }
  const title = m.title || "dia.";
  e.waitUntil(self.registration.showNotification(title, {
    body:m.body || "", tag:m.tag || undefined, renotify:!!m.tag,
    icon:"icon-192.png", badge:"icon-192.png", data:{url:m.url || "./#hoje"}
  }));
});
/* tocar na notificação abre a app no sítio certo */
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const alvo = new URL((e.notification.data && e.notification.data.url) || "./#hoje", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({type:"window", includeUncontrolled:true}).then(list => {
    for (const c of list){
      if (c.url.startsWith(self.registration.scope)){ c.postMessage({abrir:new URL(alvo).hash}); return c.focus(); }
    }
    return self.clients.openWindow(alvo);
  }));
});
