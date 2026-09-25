"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import CupIcon, { type CupStatus } from "@/components/CupIcon";
import Confetti from "@/components/Confetti";
import { BUSINESS_NAME } from "@/lib/config";
import type { ApprovalRequestState, CustomerCardState } from "@/types";

const POLL_INTERVAL_MS = 3000;

type ScreenState =
  | "loading"
  | "selecting"
  | "creating"
  | "waiting"
  | "approved"
  | "declined"
  | "expired"
  | "error";

/**
 * יעד ה-QR הקבוע שמוצג בדוכן עצמו (לא ה-QR האישי שבכרטיס). לקוח שכבר
 * נרשם וסרק את הקוד מגיע לכאן, מזהה את עצמו מ-localStorage, בוחר כמה
 * ניקובים לבקש (הקשה על כוסות בכרטיס - בדיוק כמו בחירת דירוג), ורק
 * בלחיצה על כפתור אישור שולח את הבקשה בפועל ששולחת Web Push לצוות.
 *
 * קריאת ה-localStorage וה-redirect נשארים בדיוק כמו התבנית הקיימת
 * והמאומתת ב-card/page.tsx (effect סינכרוני חד-פעמי, לא useSyncExternalStore -
 * נמנע ממרוץ מול resync של hydration). כל setState נקרא בתוך פונקציה
 * מקוננת (א-סינכרונית או handler), לא ישירות בגוף effect.
 */
export default function ScanPage() {
  const router = useRouter();
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerState, setCustomerState] = useState<CustomerCardState | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(0);
  const [screen, setScreen] = useState<ScreenState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [justApprovedAt, setJustApprovedAt] = useState<number | null>(null);
  const [justCompletedAt, setJustCompletedAt] = useState<number | null>(null);
  const requestIdRef = useRef<string | null>(null);
  const stampsRequired = customerState?.stampsRequired ?? 10;
  const currentStamps = customerState?.currentStamps ?? 0;

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

    async function loadCustomer() {
      try {
        const res = await fetch(`/api/customers/${storedId}`, { cache: "no-store" });
        if (cancelled) return;

        if (!res.ok) {
          setErrorMessage("לא נמצא כרטיס - אפשר להיכנס מחדש");
          setScreen("error");
          return;
        }

        const data: CustomerCardState = await res.json();
        setCustomerId(storedId);
        setCustomerState(data);
        setScreen("selecting");
      } catch {
        if (cancelled) return;
        setErrorMessage("בעיית תקשורת - נסו שוב");
        setScreen("error");
      }
    }

    loadCustomer();
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

        if (data.status === "APPROVED") {
          setJustApprovedAt(Date.now());
          const willComplete = currentStamps + selectedQuantity >= stampsRequired;
          if (willComplete) setJustCompletedAt(Date.now());
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            try {
              navigator.vibrate(willComplete ? [100, 50, 100, 50, 200] : 200);
            } catch {
              // best effort
            }
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
  }, [screen, currentStamps, selectedQuantity, stampsRequired]);

  useEffect(() => {
    if (justCompletedAt === null) return;
    const timeout = window.setTimeout(() => setJustCompletedAt(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [justCompletedAt]);

  async function handleConfirm() {
    if (!customerId || selectedQuantity < 1) return;
    setScreen("creating");

    try {
      const res = await fetch("/api/approval-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, quantity: selectedQuantity }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? "משהו השתבש, נסו שוב");
        setScreen("error");
        return;
      }

      requestIdRef.current = data.approvalRequestId;
      setScreen("waiting");
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate([80, 60, 80]);
        } catch {
          // best effort
        }
      }
    } catch {
      setErrorMessage("בעיית תקשורת - נסו שוב");
      setScreen("error");
    }
  }

  function handleRetry() {
    setSelectedQuantity(0);
    setScreen("selecting");
  }

  const filledInRound = currentStamps === 0 ? 0 : ((currentStamps - 1) % stampsRequired) + 1;
  const canSelect = screen === "selecting" && !customerState?.rewardsAvailable;

  function cupStatus(index: number): CupStatus {
    if (index < filledInRound) return "filled";
    if (index < filledInRound + selectedQuantity) {
      return screen === "approved" ? "filled" : "pending";
    }
    return "empty";
  }

  const showGrid = customerState && !customerState.rewardsAvailable;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-4 py-8 text-center">
      <Confetti active={justCompletedAt !== null} />
      <Logo size={96} priority />
      <div>
        <h1 className="text-xl font-bold text-pikol-brown">{BUSINESS_NAME}</h1>
      </div>

      {screen === "loading" && <p className="text-pikol-brown/70">רק רגע…</p>}

      {customerState?.rewardsAvailable && (screen === "selecting" || screen === "error") && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-pikol-gold bg-pikol-gold/15 p-6">
          <p className="text-lg font-semibold text-pikol-brown">מגיע לכם משקה חינם! 🎉</p>
          <p className="text-sm text-pikol-brown/70">דברו עם הצוות בקופה למימוש - אין צורך בעוד ניקובים כרגע.</p>
          {customerId && (
            <Link href={`/card/${customerId}`} className="text-sm text-pikol-teal underline">
              לצפייה בכרטיס שלי
            </Link>
          )}
        </div>
      )}

      {showGrid && (screen === "selecting" || screen === "creating" || screen === "waiting" || screen === "approved") && (
        <div className="w-full rounded-3xl border-2 border-pikol-tan/40 bg-white/60 p-6 shadow-sm">
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: stampsRequired }).map((_, index) => (
              <div key={index} className="flex justify-center">
                <CupIcon
                  status={cupStatus(index)}
                  justStamped={screen === "approved" && justApprovedAt !== null && index >= filledInRound && index < filledInRound + selectedQuantity}
                  onClick={canSelect && index >= filledInRound ? () => setSelectedQuantity(index - filledInRound + 1) : undefined}
                />
              </div>
            ))}
          </div>

          {screen === "selecting" && (
            <p className="mt-4 text-sm text-pikol-brown/70">
              {selectedQuantity > 0
                ? `נבחרו ${selectedQuantity} ${selectedQuantity === 1 ? "ניקוב" : "ניקובים"} - הקישו על כוס כדי לשנות`
                : "כמה קפות קניתם? הקישו על אחת הכוסות הריקות"}
            </p>
          )}

          {screen === "selecting" && selectedQuantity > 0 && (
            <button
              type="button"
              onClick={handleConfirm}
              className="mt-4 w-full rounded-full bg-pikol-brown px-6 py-3 font-semibold text-pikol-cream"
            >
              בקשת {selectedQuantity === 1 ? "ניקוב" : `${selectedQuantity} ניקובים`} לאישור
            </button>
          )}

          {screen === "creating" && <p className="mt-4 text-sm text-pikol-brown/60">שולח בקשה…</p>}

          {screen === "waiting" && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-pulse rounded-full border-4 border-pikol-teal/30 border-t-pikol-teal" />
              <p className="font-semibold text-pikol-brown">ממתינים לאישור בעל הקפה…</p>
              <p className="text-xs text-pikol-brown/60">אל תסגרו את המסך הזה</p>
            </div>
          )}

          {screen === "approved" && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <p className="font-semibold text-pikol-brown">הניקוב אושר! ☕️</p>
              {customerId && (
                <Link href={`/card/${customerId}`} className="text-sm text-pikol-teal underline">
                  לצפייה בכרטיס שלי
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {screen === "declined" && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-pikol-tan/40 bg-white/60 p-6">
          <p className="text-pikol-brown">הבקשה נדחתה. אפשר לפנות לבעל הקפה בקופה.</p>
          <button type="button" onClick={handleRetry} className="text-sm text-pikol-teal underline">
            לנסות שוב
          </button>
        </div>
      )}

      {screen === "expired" && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-pikol-tan/40 bg-white/60 p-6">
          <p className="text-pikol-brown">הבקשה פגה תוקף. אפשר לבקש שוב.</p>
          <button type="button" onClick={handleRetry} className="text-sm text-pikol-teal underline">
            לנסות שוב
          </button>
        </div>
      )}

      {screen === "error" && !customerState?.rewardsAvailable && (
        <p className="text-sm text-red-700">{errorMessage ?? "משהו השתבש, נסו שוב"}</p>
      )}
    </main>
  );
}
