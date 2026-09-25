"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

interface NotificationSubscribeProps {
  vapidPublicKey: string;
  /** לאן נשלח POST {subscription} - שונה בין צוות (session) ללקוח (id בנתיב). */
  subscribeUrl: string;
  buttonLabel: string;
  subscribedLabel: string;
  unsupportedLabel: string;
}

type SubscribeState = "idle" | "subscribing" | "subscribed" | "denied" | "error";

function subscribeNoop() {
  return () => {};
}

function getPushSupportSnapshot() {
  return "serviceWorker" in navigator && "PushManager" in window;
}

function getServerPushSupportSnapshot() {
  return false;
}

/** ממיר את המפתח הציבורי (base64url) ל-Uint8Array - הפורמט ש-applicationServerKey דורש. */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * כפתור "הפעלת התראות" גנרי - נרשם ל-Web Push. משמש גם את הצוות (התראות
 * בקשת ניקוב מ-"/scan") וגם את הלקוח (עדכונים/מבצעים מבעל העסק), רק עם
 * subscribeUrl וטקסטים שונים - ה-URL הוא מה שקובע מי בפועל נרשם.
 *
 * isSupported דרך useSyncExternalStore (לא useState+useEffect) - כי
 * serviceWorker/PushManager לא קיימים בזמן server render, וזה גם נמנע
 * מ-setState סינכרוני בגוף ה-effect (בדיוק כמו InstallPrompt.tsx).
 */
export default function NotificationSubscribe({
  vapidPublicKey,
  subscribeUrl,
  buttonLabel,
  subscribedLabel,
  unsupportedLabel,
}: NotificationSubscribeProps) {
  const isSupported = useSyncExternalStore(
    subscribeNoop,
    getPushSupportSnapshot,
    getServerPushSupportSnapshot
  );
  const [state, setState] = useState<SubscribeState>("idle");

  useEffect(() => {
    if (!isSupported) return;

    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        if (subscription) setState("subscribed");
      })
      .catch(() => {
        // לא קריטי - הכפתור פשוט יישאר במצב "idle" והמשתמש יכול ללחוץ
      });
  }, [isSupported]);

  async function handleSubscribe() {
    if (!vapidPublicKey) {
      setState("error");
      return;
    }

    setState("subscribing");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const res = await fetch(subscribeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      if (!res.ok) {
        setState("error");
        return;
      }

      setState("subscribed");
    } catch {
      setState("error");
    }
  }

  if (!isSupported) {
    return (
      <p className="w-full rounded-xl border border-pikol-tan/40 bg-white/60 p-3 text-xs text-pikol-brown/60">
        {unsupportedLabel}
      </p>
    );
  }

  if (state === "subscribed") {
    return (
      <p className="w-full rounded-xl border border-pikol-teal/40 bg-pikol-teal/10 p-3 text-center text-sm text-pikol-brown">
        {subscribedLabel} ✓
      </p>
    );
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleSubscribe}
        disabled={state === "subscribing"}
        className="w-full rounded-full border border-pikol-teal px-4 py-2 text-sm font-semibold text-pikol-teal disabled:opacity-60"
      >
        {state === "subscribing" ? "מפעיל…" : buttonLabel}
      </button>
      {state === "denied" && (
        <p className="mt-1 text-xs text-red-700">
          ההרשאה נדחתה - יש לאפשר התראות בהגדרות הדפדפן כדי לקבל התראות אוטומטיות.
        </p>
      )}
      {state === "error" && (
        <p className="mt-1 text-xs text-red-700">משהו השתבש בהפעלת ההתראות, נסו שוב.</p>
      )}
    </div>
  );
}
