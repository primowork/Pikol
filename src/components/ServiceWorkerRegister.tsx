"use client";

import { useEffect } from "react";

/** רושם את ה-service worker (public/sw.js) פעם אחת בטעינת האפליקציה. */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("רישום ה-service worker נכשל:", err);
      });
    }
  }, []);

  return null;
}
