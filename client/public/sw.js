/* JAMB Quest PWA worker: offline study cache plus daily browser-push delivery. */
const ONE_SIGNAL_ROOT_WORKER = new URL(self.location.href).searchParams.get("onesignalRootWorker") === "1";
/* A stale direct /sw.js registration retains provider compatibility; the shared root
 * worker already loaded OneSignal before importing this script. */
if (!ONE_SIGNAL_ROOT_WORKER) importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

const UPGRADE_TEST_LEGACY = new URL(self.location.href).searchParams.get("upgradeFixture") === "legacy";
const CACHE_NAME = UPGRADE_TEST_LEGACY ? "jamb-quest-shell-v1-upgrade-fixture" : "jamb-quest-shell-v6";
const STUDY_PACK_CACHE = "jamb-quest-study-pack-v1";
const APP_SHELL = ["/", "/manifest.webmanifest", "/favicon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("jamb-quest-") && key !== CACHE_NAME && key !== STUDY_PACK_CACHE).map((key) => caches.delete(key)))).then(async () => {
    await self.clients.claim();
    if (UPGRADE_TEST_LEGACY) return;
    const openWindows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    await Promise.all(openWindows.map((client) => client.navigate(client.url).catch(() => undefined)));
  }));
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") void self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request, { cache: "no-store" }).then((response) => {
      const copy = response.clone();
      void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      return response;
    }).catch(() => caches.match(request).then((cached) => cached || caches.match("/"))));
    return;
  }
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok && (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/manus-storage/") || url.pathname.endsWith(".json"))) {
      const copy = response.clone();
      void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
    }
    return response;
  })));
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }
  event.waitUntil(self.registration.showNotification(payload.title || "JAMB Quest", {
    body: payload.body || "Your next comeback mission is ready.",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    tag: "jamb-quest-daily-reminder",
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    actions: [{ action: "practice", title: "Start practice" }],
    data: { url: payload.url || "/" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || "/"));
});
