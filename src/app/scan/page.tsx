"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { BUSINESS_NAME } from "@/lib/config";
import type { ApprovalRequestState } from "@/types";

const POLL_INTERVAL_MS = 3000;

type ScreenState = "creating" | "waiting" | "approved" | "declined" | "expired" | "error";

/**
 * יעד ה-QR הקבוע שמוצג בדוכן עצמו (לא ה-QR האישי שבכרטיס). לקוח שכבר
 * נרשם וסרק את הקוד מגיע לכאן, מזהה את עצמו מ-localStorage (אותו מפתח
 * וקריאה סינכרונית ישירה כמו ב-card/page.tsx הקיים), ויוצר בקשת אישור
 * ששולחת Web Push לצוות.
 *
 * קריאת ה-localStorage וה-redirect נשארים בדיוק כמו התבנית הקיימת
 * והמאומתת ב-card/page.tsx (effect סינכרוני חד-פעמי, לא useSyncExternalStore -
 * זה נמנע ממרוץ מול resync של hydration שעלול לגרום ל-redirect שגוי
 * לפני שהערך האמיתי מסונכרן). setCustomerId נקרא בתוך הפונקציה
 * המקוננת (כמו setScreen למטה), לא ישירות בגוף ה-effect.
 */
export default function ScanPage() {
  const router = useRouter();
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [screen, setScreen] = useState<ScreenState>("creating");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestIdRef = useRef<string | null>(null);

  useEffect(() => {
    let storedId: string | null = null;
    try {
      storedId = window.localStorage.getItem("pikol_customer_id");
    } catch {
      storedId = null;
    }

    if (!storedId) {
      router.replace("/join");
      return;
    }

    let cancelled = false;

    async function createRequest() {
      setCustomerId(storedId);

      try {
        const res = await fetch("/api/approval-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerId: storedId }),
        });
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          setErrorMessage(data.error ?? "משהו השתבש, נסו שוב");
          setScreen("error");
          return;
        }

        requestIdRef.current = data.approvalRequestId;
        setScreen("waiting");
      } catch {
        if (cancelled) return;
        setErrorMessage("בעיית תקשורת - נסו שוב");
        setScreen("error");
      }
    }

    createRequest();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (screen !== "waiting") return;

    let cancelled = false;

    async function poll() {
      const requestId = requestIdRef.current;
      if (!requestId) return;

      try {
        const res = await fetch(`/api/approval-requests/${requestId}`, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data: ApprovalRequestState = await res.json();

        if (data.status === "PENDING") return;

        if (data.status === "APPROVED" && typeof navigator !== "undefined" && "vibrate" in navigator) {
          try {
            navigator.vibrate(200);
          } catch {
            // best effort
          }
        }

        setScreen(data.status === "APPROVED" ? "approved" : data.status === "DECLINED" ? "declined" : "expired");
      } catch {
        // תקלת רשת זמנית - ננסה שוב בפעימה הבאה
      }
    }

    const interval = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [screen]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-4 py-8 text-center">
      <Logo size={96} priority />
      <div>
        <h1 className="text-xl font-bold text-pikol-brown">{BUSINESS_NAME}</h1>
      </div>

      {screen === "creating" && <p className="text-pikol-brown/70">רק רגע…</p>}

      {screen === "waiting" && (
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full border-4 border-pikol-teal/30 border-t-pikol-teal" />
          <p className="text-lg font-semibold text-pikol-brown">ממתינים לאישור בעל הקפה…</p>
          <p className="text-sm text-pikol-brown/60">אל תסגרו את המסך הזה</p>
        </div>
      )}

      {screen === "approved" && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-pikol-gold bg-pikol-gold/15 p-6">
          <p className="text-lg font-semibold text-pikol-brown">הניקוב אושר! ☕️</p>
          {customerId && (
            <Link href={`/card/${customerId}`} className="text-sm text-pikol-teal underline">
              לצפייה בכרטיס שלי
            </Link>
          )}
        </div>
      )}

      {screen === "declined" && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-pikol-tan/40 bg-white/60 p-6">
          <p className="text-pikol-brown">הבקשה נדחתה. אפשר לפנות לבעל הקפה בקופה.</p>
          {customerId && (
            <Link href={`/card/${customerId}`} className="text-sm text-pikol-teal underline">
              לצפייה בכרטיס שלי
            </Link>
          )}
        </div>
      )}

      {screen === "expired" && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-pikol-tan/40 bg-white/60 p-6">
          <p className="text-pikol-brown">הבקשה פגה תוקף. אפשר לסרוק את הקוד בדוכן שוב.</p>
          {customerId && (
            <Link href={`/card/${customerId}`} className="text-sm text-pikol-teal underline">
              לצפייה בכרטיס שלי
            </Link>
          )}
        </div>
      )}

      {screen === "error" && (
        <p className="text-sm text-red-700">{errorMessage ?? "משהו השתבש, נסו שוב"}</p>
      )}
    </main>
  );
}
