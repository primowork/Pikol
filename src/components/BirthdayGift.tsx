"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { BUSINESS_NAME, MARKETING_MIN_AGE } from "@/lib/config";
import { ageOn } from "@/lib/age";
import { useBackToClose } from "@/lib/use-back-to-close";

interface BirthdayGiftProps {
  customerId: string;
  initialBirthday: string | null;
  marketingOptIn: boolean;
  /** נקרא אחרי שמירה שבה הלקוח סימן גם את תיבת ההסכמה לדיוור. */
  onMarketingOptIn: () => void;
  hasBirthdayReward: boolean;
}

/** ימים עד ליום ההולדת הבא (0 אם היום הוא היום). מחושב מול "היום" של הדפדפן - קישוט, לא הזיכוי הרשמי (זה נגזר בשרת לפי שעון ישראל). */
function daysUntilNextBirthday(birthdayStr: string, today: Date): number {
  const [, month, day] = birthdayStr.split("-").map(Number);
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let next = new Date(today.getFullYear(), month - 1, day);
  if (next < todayMidnight) {
    next = new Date(today.getFullYear() + 1, month - 1, day);
  }
  return Math.round((next.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
}

/** היום לפי שעון הדפדפן, לבדיקת גיל בתיבת הדיוור (השרת בודק שוב לפי שעון ישראל). */
function localToday(): { year: number; month: number; day: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

/**
 * איקון מתנה קבוע בפינת המסך - בלחיצה נפתח פופ-אפ שמבטיח קפה חינם
 * בחודש יום ההולדת (תקנון, פרק 6) ואוסף את התאריך. אפשר לפתוח שוב כדי לעדכן תאריך שכבר
 * נשמר (input מתמלא מראש מ-initialBirthday). אם הלקוח עדיין לא הסכים
 * לדיוור שיווקי (marketingOptIn), מוצגת כאן תיבת הסכמה - הזדמנות נוספת
 * להסכים בלי לחזור על כל טופס ההצטרפות. הדיוור רק מגיל 18: התיבה כוללת
 * הצהרה, ולא מוצגת בכלל כשהתאריך שהוזן מראה גיל צעיר יותר. מתנת יום
 * ההולדת עצמה לא תלויה בהסכמה לדיוור.
 *
 * hasBirthdayReward (מהשרת - הזיכוי בפועל, ראו src/lib/birthday-reward.ts)
 * מפעיל אפקט זוהר על האיקון עצמו; כשאין זיכוי אבל יש תאריך שמור, מוצג
 * קאונטדאון ימים עד יום ההולדת הבא במקום הקופי השיווקי הרגיל.
 */
export default function BirthdayGift({
  customerId,
  initialBirthday,
  marketingOptIn,
  onMarketingOptIn,
  hasBirthdayReward,
}: BirthdayGiftProps) {
  const [open, setOpen] = useState(false);
  const [birthday, setBirthday] = useState(initialBirthday ?? "");
  // התאריך שכבר שמור בשרת - מתעדכן אחרי שמירה, כדי שהקאונטדאון יתאים לו מיד
  const [savedBirthday, setSavedBirthday] = useState(initialBirthday);
  const [birthdayMarketingOptIn, setBirthdayMarketingOptIn] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [daysUntilBirthday, setDaysUntilBirthday] = useState<number | null>(null);
  const [underMarketingAge, setUnderMarketingAge] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  useBackToClose(open, () => setOpen(false));

  useEffect(() => {
    function computeCountdown() {
      if (!savedBirthday || hasBirthdayReward) {
        setDaysUntilBirthday(null);
        return;
      }
      setDaysUntilBirthday(daysUntilNextBirthday(savedBirthday, new Date()));
    }
    computeCountdown();
  }, [savedBirthday, hasBirthdayReward]);

  useEffect(() => {
    function computeAge() {
      setUnderMarketingAge(Boolean(birthday) && ageOn(birthday, localToday()) < MARKETING_MIN_AGE);
    }
    computeAge();
  }, [birthday]);

  // פתיחה מחדש מתחילה נקי: בלי "נשמר!" מהפעם הקודמת, ובלי שהסגירה
  // האוטומטית שתוזמנה אחרי השמירה תסגור את החלון החדש באמצע
  function openModal() {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setStatus("idle");
    setOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!birthday) return;
    setStatus("saving");
    const optingIn = !marketingOptIn && birthdayMarketingOptIn && !underMarketingAge;

    try {
      const res = await fetch(`/api/customers/${customerId}/birthday`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthday, ...(optingIn ? { marketingOptIn: true } : {}) }),
      });

      if (!res.ok) {
        setStatus("error");
        return;
      }

      setStatus("saved");
      setSavedBirthday(birthday);
      if (optingIn) {
        setBirthdayMarketingOptIn(false);
        onMarketingOptIn();
      }
      closeTimerRef.current = window.setTimeout(() => {
        closeTimerRef.current = null;
        setOpen(false);
      }, 1200);
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        aria-label="מתנת יום הולדת"
        className={`fixed right-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-pikol-gold text-xl shadow-md ${
          hasBirthdayReward ? "animate-birthday-glow" : ""
        }`}
      >
        🎁
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-pikol-brown/60 p-6"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="מתנת יום הולדת"
            className="w-full max-w-sm rounded-3xl bg-pikol-cream p-6 text-center shadow-xl"
          >
            <p className="text-3xl">🎂</p>

            {hasBirthdayReward ? (
              <>
                <p className="mt-2 text-lg font-semibold text-pikol-brown">מזל טוב! 🎉</p>
                <p className="mt-1 text-sm text-pikol-brown/70">
                  הקפה החינם שלך לחודש יום ההולדת מחכה. אפשר לבקש מימוש בדוכן עד סוף החודש.
                </p>
              </>
            ) : daysUntilBirthday !== null ? (
              <>
                <p className="mt-2 text-lg font-semibold text-pikol-brown">
                  עוד {daysUntilBirthday === 1 ? "יום אחד" : `${daysUntilBirthday} ימים`} ליום ההולדת שלך!
                </p>
                <p className="mt-1 text-sm text-pikol-brown/70">בחודש יום ההולדת מגיע לך קפה חינם 🎈</p>
              </>
            ) : (
              <>
                <p className="mt-2 text-lg font-semibold text-pikol-brown">מגיע לך קפה חינם בחודש יום ההולדת!</p>
                <p className="mt-1 text-sm text-pikol-brown/70">ספרו לנו מתי, ונדאג להפתיע אתכם</p>
              </>
            )}

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <input
                type="date"
                required
                value={birthday}
                onChange={(event) => setBirthday(event.target.value)}
                className="rounded-xl border border-pikol-tan/50 px-4 py-3 text-center text-pikol-brown"
              />

              {!marketingOptIn && (
                <div className="text-right text-xs text-pikol-brown/70">
                  <p>למה אנחנו מבקשים את זה? כדי שנוכל לפנק אותך בהטבה יום הולדת מיוחדת! 🎈</p>
                  {!underMarketingAge && (
                    <label className="mt-1 flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={birthdayMarketingOptIn}
                        onChange={(event) => setBirthdayMarketingOptIn(event.target.checked)}
                        className="mt-0.5"
                      />
                      <span>
                        אני מעל גיל {MARKETING_MIN_AGE} ומאשר/ת לקבל מ{BUSINESS_NAME} עדכונים ומבצעים.
                        אפשר להפסיק בכל עת בכרטיס.
                      </span>
                    </label>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={status === "saving"}
                className="rounded-full bg-pikol-brown px-6 py-3 font-semibold text-pikol-cream disabled:opacity-60"
              >
                {status === "saved" ? "נשמר!" : "שמירה"}
              </button>
            </form>

            {status === "error" && <p className="mt-2 text-sm text-red-700">משהו השתבש, נסו שוב</p>}

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-3 text-xs text-pikol-brown/50 underline"
            >
              סגירה
            </button>
          </div>
        </div>
      )}
    </>
  );
}
