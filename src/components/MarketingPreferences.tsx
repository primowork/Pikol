"use client";

import { useState } from "react";
import NotificationSubscribe from "./NotificationSubscribe";
import { BUSINESS_NAME, MARKETING_MIN_AGE } from "@/lib/config";

interface MarketingPreferencesProps {
  customerId: string;
  vapidPublicKey: string;
  optedIn: boolean;
  onOptedInChange: (optedIn: boolean) => void;
}

type OptOutStatus = "idle" | "saving" | "removed" | "error";

/**
 * דיוור בכרטיס הלקוח. הפעלת ההתראות היא הסכמה לקבל עדכונים ומבצעים, ולכן
 * טקסט ההסכמה מופיע מתחת לכפתור והשרת רושם אותה ביומן. "הפסקת עדכונים
 * ומבצעים" מוצג לכל מי שברשימת התפוצה, גם בלי התראות במכשיר הזה: ההסכמה
 * היא של הלקוח ולא של המכשיר, ומדיניות הפרטיות מבטיחה שאפשר להסיר אותה
 * כאן בכל עת.
 */
export default function MarketingPreferences({
  customerId,
  vapidPublicKey,
  optedIn,
  onOptedInChange,
}: MarketingPreferencesProps) {
  const [status, setStatus] = useState<OptOutStatus>("idle");
  // ההסרה מוחקת בשרת את מינויי ה-push של הלקוח. מפתח חדש מרכיב מחדש את
  // NotificationSubscribe, שבודק שוב מול השרת ומציג שוב את הכפתור.
  const [subscribeKey, setSubscribeKey] = useState(0);

  async function handleOptOut() {
    setStatus("saving");
    try {
      const res = await fetch(`/api/customers/${customerId}/marketing-opt-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "card" }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      onOptedInChange(false);
      setSubscribeKey((key) => key + 1);
      setStatus("removed");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <NotificationSubscribe
        key={subscribeKey}
        vapidPublicKey={vapidPublicKey}
        subscribeUrl={`/api/customers/${customerId}/push-subscription`}
        buttonLabel="הפעלת התראות על מבצעים ועדכונים"
        subscribedLabel="התראות פעילות במכשיר הזה"
        unsupportedLabel="התראות לא נתמכות בדפדפן הזה. באייפון צריך קודם להוסיף את הכרטיס למסך הבית ולפתוח אותו משם."
        consentNote={`בלחיצה אני מצהיר/ה שאני מעל גיל ${MARKETING_MIN_AGE} ומאשר/ת לקבל מ${BUSINESS_NAME} עדכונים, הטבות ומבצעים בהתראות לטלפון. אפשר להפסיק בכל עת כאן בכרטיס.`}
        onSubscribed={() => {
          onOptedInChange(true);
          setStatus("idle");
        }}
      />

      {optedIn && (
        <button
          type="button"
          onClick={handleOptOut}
          disabled={status === "saving"}
          className="text-xs text-pikol-brown/50 underline disabled:opacity-60"
        >
          {status === "saving" ? "מסיר…" : "הפסקת עדכונים ומבצעים"}
        </button>
      )}

      {status === "removed" && (
        <p className="text-xs text-pikol-brown/70">
          הוסרת מרשימת התפוצה. לא יישלחו אליך יותר עדכונים ומבצעים.
        </p>
      )}
      {status === "error" && <p className="text-xs text-red-700">ההסרה לא הצליחה, נסו שוב.</p>}
    </div>
  );
}
