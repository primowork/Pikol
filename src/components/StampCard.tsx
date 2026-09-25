"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Logo from "./Logo";
import CupIcon from "./CupIcon";
import InstallPrompt from "./InstallPrompt";
import { BUSINESS_NAME, BUSINESS_TAGLINE } from "@/lib/config";
import type { CustomerCardState } from "@/types";

interface StampCardProps {
  customerId: string;
  initialName: string;
  initialStamps: number;
  stampsRequired: number;
  initialRewardsEarned: number;
  qrDataUrl: string;
}

const POLL_INTERVAL_MS = 6000;

export default function StampCard({
  customerId,
  initialName,
  initialStamps,
  stampsRequired,
  initialRewardsEarned,
  qrDataUrl,
}: StampCardProps) {
  const [stamps, setStamps] = useState(initialStamps);
  const [rewardsEarned, setRewardsEarned] = useState(initialRewardsEarned);
  const [justStampedAt, setJustStampedAt] = useState<number | null>(null);
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
            if (typeof navigator !== "undefined" && "vibrate" in navigator) {
              try {
                navigator.vibrate(200);
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
  }, [customerId]);

  useEffect(() => {
    if (justStampedAt === null) return;
    const timeout = window.setTimeout(() => setJustStampedAt(null), 700);
    return () => window.clearTimeout(timeout);
  }, [justStampedAt]);

  const rewardsAvailable = stamps >= stampsRequired;
  // מספר הכוסות המלאות בסבב הנוכחי: תומך בעודף (stamps>stampsRequired אם
  // לא מימשו עדיין), ומציג כרטיס מלא (לא ריק) כשה-stamps הוא כפולה מדויקת.
  const filledInRound = stamps === 0 ? 0 : ((stamps - 1) % stampsRequired) + 1;
  const justStampedIndex = justStampedAt !== null ? filledInRound - 1 : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-6 px-4 py-8 text-center">
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

      <div className="flex flex-col items-center gap-2 rounded-2xl border border-pikol-tan/40 bg-white/60 p-4">
        {/* data URL שנוצר בשרת - לא רלוונטי ל-next/image optimization */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="קוד QR אישי לזיהוי בקופה" width={200} height={200} />
        <p className="text-xs text-pikol-brown/60">
          הראו את הקוד הזה לבעל הקפה בכל קנייה כדי לקבל ניקוב
        </p>
        <p className="text-xs text-pikol-brown/40">
          הקוד הזה מיועד לצוות לסרוק בקופה. לבקש ניקוב בעצמכם בלי מצלמה -
          אתם כבר מזוהים, פשוט לחצו למטה.
        </p>
        {!rewardsAvailable && (
          <Link
            href="/scan"
            className="mt-1 w-full rounded-full border-2 border-pikol-teal px-4 py-2 text-sm font-semibold text-pikol-teal"
          >
            בקשת ניקוב לקנייה נוספת
          </Link>
        )}
      </div>

      {rewardsEarned > 0 && (
        <p className="text-xs text-pikol-brown/50">
          סה&quot;כ מימשתם {rewardsEarned} משקאות חינם עד היום
        </p>
      )}

      <InstallPrompt />
    </main>
  );
}
