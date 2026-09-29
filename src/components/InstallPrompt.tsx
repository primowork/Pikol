"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STANDALONE_QUERY = "(display-mode: standalone)";
const DISMISSED_UNTIL_KEY = "pikol_install_prompt_dismissed_until";
const DISMISS_DAYS = 14;

// useSyncExternalStore - לא useState+useEffect - כי window.matchMedia לא
// קיים בזמן server render (getServerSnapshot מחזיר false), וזה גם נמנע
// מ-setState סינכרוני בגוף ה-effect.
function subscribeToDisplayMode(callback: () => void) {
  const mql = window.matchMedia(STANDALONE_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getDisplayModeSnapshot() {
  return window.matchMedia(STANDALONE_QUERY).matches;
}

function getServerDisplayModeSnapshot() {
  return false;
}

/**
 * מציע ללקוח להוסיף את הכרטיס למסך הבית. באנדרואיד/כרום אפשר להציג כפתור
 * שמפעיל את תיבת ההתקנה הרשמית של הדפדפן (beforeinstallprompt). ב-iOS
 * Safari אין אירוע כזה בכלל - שם ההוספה היא ידנית דרך תפריט השיתוף,
 * ולכן מוצגת שם הנחיה טקסטואלית קבועה במקום כפתור.
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  // מוסתר עד שבודקים אם הלקוח כבר ביקש "לא עכשיו" - בלי הבזק של התיבה
  const [dismissed, setDismissed] = useState(true);
  const isStandalone = useSyncExternalStore(
    subscribeToDisplayMode,
    getDisplayModeSnapshot,
    getServerDisplayModeSnapshot
  );

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // "לא עכשיו" נזכר לשבועיים. קודם התיבה חזרה בכל פתיחה של הכרטיס.
  useEffect(() => {
    function restoreDismissal() {
      let dismissedUntil = 0;
      try {
        dismissedUntil = Number(window.localStorage.getItem(DISMISSED_UNTIL_KEY)) || 0;
      } catch {
        dismissedUntil = 0;
      }
      setDismissed(dismissedUntil > Date.now());
    }
    restoreDismissal();
  }, []);

  function handleDismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(
        DISMISSED_UNTIL_KEY,
        String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000)
      );
    } catch {
      // localStorage חסום - התיבה פשוט תחזור בפעם הבאה
    }
  }

  if (isStandalone || dismissed) return null;

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    setDeferredPrompt(null);
  }

  return (
    <div className="w-full rounded-2xl border border-pikol-tan/40 bg-white/60 p-4 text-center text-sm text-pikol-brown">
      {deferredPrompt ? (
        <button
          type="button"
          onClick={handleInstallClick}
          className="rounded-full bg-pikol-brown px-5 py-2 font-semibold text-pikol-cream"
        >
          הוספת הכרטיס למסך הבית
        </button>
      ) : (
        <p>
          כדי לשמור את הכרטיס בטלפון: פתחו את תפריט השיתוף ובחרו
          &quot;הוספה למסך הבית&quot;.
        </p>
      )}
      <button
        type="button"
        onClick={handleDismiss}
        className="mt-2 block w-full text-xs text-pikol-brown/60 underline"
      >
        לא עכשיו
      </button>
    </div>
  );
}
