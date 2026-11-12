const C = "dayflow-v1";
self.addEventListener("install", e => { e.waitUntil(caches.open(C).then(c => c.addAll(["/"]))); self.skipWaiting(); });
self.addEventListener("activate", e => e.waitUntil(clients.claim()));
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return; // jamais Supabase/Google en cache
  e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); return res; })
    .catch(() => caches.match(r).then(m => m || caches.match("/"))));
});
self.addEventListener("push", e => { const d = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(d.title || "DayFlow", { body: d.body, icon: "/icon-192.png" })); });
