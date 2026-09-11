// Service worker מינימלי: קאשינג cache-first רק לנכסים סטטיים קבועי-שם
// (אייקונים, manifest). שום ניווט HTML ושום קריאת /api/* לא נשמרים
// בקאש - הנתונים האלה תלויי-רשת, ולקוח ב-offline לא אמור לראות מספר
// ניקובים ישן כאילו הוא עדכני.
//
// לא ניתן "לחמם" מראש (precache) את קבצי ה-JS/CSS של Next עצמו כי
// שמותיהם משתנים לפי hash של התוכן ולא ידועים מראש כאן.

const CACHE_NAME = "pikol-shell-v1";

const SHELL_ASSETS = [
  "/manifest.json",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-192-maskable.png",
  "/icons/icon-512-maskable.png",
  "/icons/apple-touch-icon.png",
  "/icons/logo-round.png",
  "/icons/logo-256.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

function isCacheableStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/favicon.ico" ||
    url.pathname === "/manifest.json"
  );
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) return; // תמיד ישר לרשת
  if (!isCacheableStaticAsset(url)) return; // ניווטי HTML - גם ישר לרשת

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return response;
      });
    })
  );
});
