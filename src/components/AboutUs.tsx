"use client";

import { useState } from "react";

/**
 * איקון "קצת עלינו" בפינה השמאלית העליונה של הכרטיס - מראה לאיקון מתנת
 * יום ההולדת שיושב בפינה הימנית. פותח פופ-אפ עם סיפור בית הקפה, באותה
 * תבנית ויזואלית בדיוק כמו BirthdayGift.
 */
export default function AboutUs() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="קצת עלינו"
        className="fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-pikol-teal text-xl text-pikol-cream shadow-md"
      >
        ℹ️
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-pikol-brown/60 p-6">
          <div className="max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-3xl bg-pikol-cream p-6 text-right shadow-xl">
            <h2 className="mb-3 text-lg font-semibold text-pikol-brown">קצת עלינו</h2>

            <div className="space-y-3 text-sm leading-relaxed text-pikol-brown/80">
              <p>פיקולו — קטן באיטלקית — נולד מאהבה לקפה ומהרצון לפתוח מקום קטן, פשוט ושלי.</p>
              <p>
                אחרי עשור בתחום הקפה, בין עבודה כבריסטה, ניהול בר וקלייה, חזרתי משירות המילואים
                בלי עבודה. במקום לחפש את הדבר הבא, החלטתי לפתוח את המקום שלי — קטן ולעניין, כמה
                צעדים מכיכר דיזנגוף.
              </p>
              <p>
                הקפה הוא הלב של המקום. אני קולה את הקפה בבית הקלייה רות, ועובד עם 100% ערביקה
                בקלייה בינונית-פלוס, לצד קפה אתיופי וקולומביאני. אני שומר על מלאי קטן ומפוקח כדי
                שהקפה יהיה תמיד טרי.
              </p>
              <p>לצד הקפה תמצאו מאפים וכריכים טריים ממייזון קייזר.</p>
              <p>
                בסוף, פיקולו הוא בדיוק מה שהשם שלו אומר: מקום קטן, עם הרבה תשומת לב למה שנכנס
                לכוס.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 text-xs text-pikol-brown/50 underline"
            >
              סגירה
            </button>
          </div>
        </div>
      )}
    </>
  );
}
