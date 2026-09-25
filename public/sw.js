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

// --- Web Push: אישור/דחיית ניקוב מרחוק, בלי לפתוח את האפליקציה ---
// לקוח סורק את ה-QR הקבוע בדוכן -> השרת שולח Push לכל מכשירי הצוות ->
// לחיצה על "אישור"/"דחייה" כאן מבצעת את הפעולה ישירות מה-service worker,
// בעזרת קוקי ה-session הקיים של הצוות (credentials:'include').

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  // שני סוגי push חולקים את אותו endpoint: "approval" (בקשת ניקוב מ-/scan,
  // צריכה כפתורי אישור/דחייה) ו-"broadcast" (הודעה ללקוחות, בלי פעולות -
  // ראו BroadcastToCustomers.tsx). ברירת מחדל "approval" לתאימות לאחור.
  const isBroadcast = data.kind === "broadcast";
  const title = data.title || (isBroadcast ? "קפה פיקולו" : "בקשת ניקוב חדשה");
  const options = {
    body: data.body || "לקוח מבקש ניקוב - לחצו לאישור",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    dir: "rtl",
    lang: "he",
    tag: data.approvalRequestId ? `approval-${data.approvalRequestId}` : undefined,
    data: { kind: data.kind || "approval", approvalRequestId: data.approvalRequestId },
    requireInteraction: !isBroadcast,
  };
  if (!isBroadcast) {
    options.actions = [
      { action: "approve", title: "אישור" },
      { action: "decline", title: "דחייה" },
    ];
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const notifData = event.notification.data || {};
  const approvalRequestId = notifData.approvalRequestId;

  if ((event.action === "approve" || event.action === "decline") && approvalRequestId) {
    const endpoint = `/api/approval-requests/${approvalRequestId}/${event.action}`;
    event.waitUntil(
      fetch(endpoint, { method: "POST", credentials: "include" })
        .then((response) => {
          if (response.ok) return;
          // fetch().catch() לא תופס תגובות שגיאה תקינות (401/404/409) -
          // רק כשל רשת - אז זו בדיקה נפרדת ומכוונת, כדי לא להיכשל בשקט.
          return response
            .json()
            .catch(() => ({}))
            .then((body) => {
              self.registration.showNotification("הפעולה לא הושלמה", {
                body: body.error || "יש לפתוח את הדשבורד ולנסות משם",
                icon: "/icons/icon-192.png",
                dir: "rtl",
                lang: "he",
              });
            });
        })
        .catch(() => {
          self.registration.showNotification("בעיית תקשורת", {
            body: "האישור לא נשלח - יש לפתוח את הדשבורד ולנסות משם",
            icon: "/icons/icon-192.png",
            dir: "rtl",
            lang: "he",
          });
        })
    );
    return;
  }

  // לחיצה על גוף ההתראה עצמו - פותח/ממקד את היעד המתאים: הודעת שידור
  // ללקוחות פותחת את הכרטיס האישי, בקשת ניקוב פותחת את דשבורד הצוות.
  const targetPath = notifData.kind === "broadcast" ? "/card" : "/staff/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if (client.url.includes(targetPath) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetPath);
      }
    })
  );
});
