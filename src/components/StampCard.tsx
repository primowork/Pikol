"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "./Logo";
import CupIcon from "./CupIcon";
import QrScanner from "./QrScanner";
import Confetti from "./Confetti";
import NotificationSubscribe from "./NotificationSubscribe";
import InstallPrompt from "./InstallPrompt";
import { BUSINESS_NAME, BUSINESS_TAGLINE } from "@/lib/config";
import type { CustomerCardState } from "@/types";

interface StampCardProps {
  customerId: string;
  initialName: string;
  initialStamps: number;
  stampsRequired: number;
  initialRewardsEarned: number;
  vapidPublicKey: string;
}

const POLL_INTERVAL_MS = 6000;

export default function StampCard({
  customerId,
  initialName,
  initialStamps,
  stampsRequired,
  initialRewardsEarned,
  vapidPublicKey,
}: StampCardProps) {
  const router = useRouter();
  const [stamps, setStamps] = useState(initialStamps);
  const [rewardsEarned, setRewardsEarned] = useState(initialRewardsEarned);
  const [justStampedAt, setJustStampedAt] = useState<number | null>(null);
  const [justCompletedAt, setJustCompletedAt] = useState<number | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // שומר את מזהה הלקוח כדי שהאייקון במסך הבית ("/card" הכללי, ה-start_url
  // הגלובלי של ה-PWA) ידע בפעם הבאה לאן להפנות.
  useEffect(() => {
    try {
      window.localStorage.setItem("pikol_customer_id", customerId);
    } catch {
      // localStorage חסום (מצב פרטי וכו') - לא קריטי, גישה ישירה עדיין עובדת
    }
  }, [customerId]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch(`/api/customers/${customerId}`, { cache: "no-store" });
        if (!res.ok || !isMountedRef.current) return;
        const data: CustomerCardState = await res.json();

        setStamps((prev) => {
          if (data.currentStamps > prev) {
            setJustStampedAt(Date.now());
            const justCompleted = prev < stampsRequired && data.currentStamps >= stampsRequired;
            if (justCompleted) setJustCompletedAt(Date.now());
            if (typeof navigator !== "undefined" && "vibrate" in navigator) {
              try {
                navigator.vibrate(justCompleted ? [100, 50, 100, 50, 200] : 200);
              } catch {
                // best effort - לא כל דפדפן/מכשיר תומך
              }
            }
          }
          return data.currentStamps;
        });
        setRewardsEarned(data.rewardsEarned);
      } catch {
        // תקלת רשת זמנית - ננסה שוב בפעימה הבאה, אין צורך להציג שגיאה
      }
    }

    const interval = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [customerId, stampsRequired]);

  useEffect(() => {
    if (justStampedAt === null) return;
    const timeout = window.setTimeout(() => setJustStampedAt(null), 700);
    return () => window.clearTimeout(timeout);
  }, [justStampedAt]);

  useEffect(() => {
    if (justCompletedAt === null) return;
    const timeout = window.setTimeout(() => setJustCompletedAt(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [justCompletedAt]);

  const rewardsAvailable = stamps >= stampsRequired;
  // מספר הכוסות המלאות בסבב הנוכחי: תומך בעודף (stamps>stampsRequired אם
  // לא מימשו עדיין), ומציג כרטיס מלא (לא ריק) כשה-stamps הוא כפולה מדויקת.
  const filledInRound = stamps === 0 ? 0 : ((stamps - 1) % stampsRequired) + 1;
  const justStampedIndex = justStampedAt !== null ? filledInRound - 1 : null;
  // סכום כל הניקובים אי-פעם: הניקובים בסבב הנוכחי, ועוד כל סבב שכבר מומש
  // (currentStamps מופחת ב-stampsRequired בכל מימוש, לא מתאפס ל-0).
  const totalCoffeesEver = stamps + rewardsEarned * stampsRequired;

  function handleScan(decodedText: string) {
    setScannerActive(false);

    let pathname = decodedText.trim();
    try {
      pathname = new URL(decodedText).pathname;
    } catch {
      // לא URL מלא - ממשיכים עם הטקסט הגולמי כמו שהוא
    }

    if (pathname === "/scan" || pathname.endsWith("/scan")) {
      router.push("/scan");
      return;
    }

    setScanError("זה לא נראה כמו קוד הדוכן של קפה פיקולו. אפשר לנסות שוב.");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-6 px-4 py-8 text-center">
      <Confetti active={justCompletedAt !== null} />
      <Logo size={96} priority />

      <div>
        <h1 className="text-2xl font-bold text-pikol-brown">{BUSINESS_NAME}</h1>
        <p className="text-sm text-pikol-brown/70">{BUSINESS_TAGLINE}</p>
      </div>

      <p className="text-lg">
        שלום <span className="font-semibold">{initialName}</span>, הנה הכרטיס שלך
      </p>

      <div
        className={`w-full rounded-3xl border-2 p-6 shadow-sm transition-colors ${
          rewardsAvailable
            ? "border-pikol-gold bg-pikol-gold/15"
            : "border-pikol-tan/40 bg-white/60"
        }`}
      >
        <div className="grid grid-cols-5 gap-3 sm:grid-cols-5">
          {Array.from({ length: stampsRequired }).map((_, index) => (
            <div key={index} className="flex justify-center">
              <CupIcon
                status={index < filledInRound ? "filled" : "empty"}
                justStamped={index === justStampedIndex}
              />
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm text-pikol-brown/70">
          {filledInRound} מתוך {stampsRequired} כוסות
        </p>

        {rewardsAvailable && (
          <p className="mt-3 rounded-xl bg-pikol-gold/30 px-3 py-2 font-semibold text-pikol-brown">
            מגיע לך משקה חינם! תראו את הכרטיס לבעל הקפה במעמד הקנייה 🎉
          </p>
        )}
      </div>

      {!rewardsAvailable && (
        <div className="flex w-full flex-col items-center gap-3 rounded-2xl border border-pikol-tan/40 bg-white/60 p-4">
          <p className="text-sm font-medium text-pikol-brown">בקשת ניקוב לקנייה נוספת</p>
          <p className="text-xs text-pikol-brown/60">
            סרקו את הקוד המוצג בדוכן - הצוות יאשר את הבקשה מהטלפון שלו
          </p>

          {!scannerActive && (
            <button
              type="button"
              onClick={() => {
                setScanError(null);
                setScannerActive(true);
              }}
              className="w-full rounded-full bg-pikol-brown px-6 py-4 text-lg font-semibold text-pikol-cream"
            >
              פתיחת מצלמה לסריקה
            </button>
          )}

          <QrScanner
            active={scannerActive}
            onScan={handleScan}
            unavailableMessage="לא הצלחנו לגשת למצלמה. אפשר ללחוץ למטה במקום."
          />

          {scannerActive && (
            <button
              type="button"
              onClick={() => setScannerActive(false)}
              className="w-full rounded-full border border-pikol-tan/50 px-6 py-2 text-sm text-pikol-brown"
            >
              ביטול סריקה
            </button>
          )}

          {scanError && <p className="text-sm text-red-700">{scanError}</p>}

          <Link href="/scan" className="text-xs text-pikol-teal underline">
            או לבקשת ניקוב בלי מצלמה
          </Link>
        </div>
      )}

      {totalCoffeesEver > 0 && (
        <p className="text-sm text-pikol-brown/60">שתיתם כבר {totalCoffeesEver} כוסות קפה בפיקולו! ☕</p>
      )}

      {rewardsEarned > 0 && (
        <p className="text-xs text-pikol-brown/50">
          סה&quot;כ מימשתם {rewardsEarned} משקאות חינם עד היום
        </p>
      )}

      <NotificationSubscribe
        vapidPublicKey={vapidPublicKey}
        subscribeUrl={`/api/customers/${customerId}/push-subscription`}
        buttonLabel="הפעלת התראות על מבצעים ועדכונים"
        subscribedLabel="התראות פעילות במכשיר הזה"
        unsupportedLabel="התראות לא נתמכות בדפדפן הזה."
      />

      <InstallPrompt />
    </main>
  );
}
