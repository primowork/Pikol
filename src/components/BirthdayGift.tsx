"use client";

import { useState, type FormEvent } from "react";

interface BirthdayGiftProps {
  customerId: string;
  initialBirthday: string | null;
  marketingOptIn: boolean;
}

/**
 * איקון מתנה קבוע בפינת המסך - בלחיצה נפתח פופ-אפ שמבטיח קפה חינם
 * ביום ההולדת ואוסף את התאריך. אפשר לפתוח שוב כדי לעדכן תאריך שכבר
 * נשמר (input מתמלא מראש מ-initialBirthday). אם הלקוח עדיין לא הסכים
 * לדיוור שיווקי (marketingOptIn), מוצגת כאן תיבת הסכמה ייעודית ליום
 * הולדת - הזדמנות נוספת להסכים בלי לחזור על כל טופס ההצטרפות.
 */
export default function BirthdayGift({ customerId, initialBirthday, marketingOptIn }: BirthdayGiftProps) {
  const [open, setOpen] = useState(false);
  const [birthday, setBirthday] = useState(initialBirthday ?? "");
  const [birthdayMarketingOptIn, setBirthdayMarketingOptIn] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!birthday) return;
    setStatus("saving");

    try {
      const res = await fetch(`/api/customers/${customerId}/birthday`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthday,
          ...(marketingOptIn ? {} : { marketingOptIn: birthdayMarketingOptIn }),
        }),
      });

      if (!res.ok) {
        setStatus("error");
        return;
      }

      setStatus("saved");
      window.setTimeout(() => setOpen(false), 1200);
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="מתנת יום הולדת"
        className="fixed right-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-pikol-gold text-xl shadow-md"
      >
        🎁
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-pikol-brown/60 p-6">
          <div className="w-full max-w-sm rounded-3xl bg-pikol-cream p-6 text-center shadow-xl">
            <p className="text-3xl">🎂</p>
            <p className="mt-2 text-lg font-semibold text-pikol-brown">מגיע לך קפה חינם ביום ההולדת!</p>
            <p className="mt-1 text-sm text-pikol-brown/70">ספרו לנו מתי, ונדאג להפתיע אתכם</p>

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
                  <label className="mt-1 flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={birthdayMarketingOptIn}
                      onChange={(event) => setBirthdayMarketingOptIn(event.target.checked)}
                      className="mt-0.5"
                    />
                    <span>אני מאשר/ת לשלוח לי ברכות והטבות יום הולדת ייעודיות.</span>
                  </label>
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
