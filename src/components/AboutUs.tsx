"use client";

import { useState } from "react";
import { INSTAGRAM_URL } from "@/lib/config";

interface AboutUsProps {
  aboutUsText: string;
}

/**
 * כפתור "עלינו" בפינה השמאלית העליונה של הכרטיס - מראה לאיקון מתנת יום
 * ההולדת שיושב בפינה הימנית. טקסט ולא סמל בכוונה: אין סמל מוסכם ל"עלינו"
 * (בניגוד לחיפוש/הגדרות וכו'), ובאותו עיקרון כבר משתמש "כניסת צוות" למטה
 * בכרטיס הזה. פותח פופ-אפ עם סיפור בית הקפה, באותה תבנית ויזואלית בדיוק
 * כמו BirthdayGift.
 *
 * aboutUsText מגיע מ-src/lib/business-settings.ts (נערך ב-/staff/settings) -
 * שורה ריקה מפרידה בין פסקאות, בדיוק כמו textarea רגיל.
 */
export default function AboutUs({ aboutUsText }: AboutUsProps) {
  const [open, setOpen] = useState(false);
  const paragraphs = aboutUsText
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-full bg-pikol-teal px-4 py-2.5 text-sm font-semibold text-pikol-cream shadow-md"
      >
        עלינו
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-pikol-brown/60 p-6">
          <div className="max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-3xl bg-pikol-cream p-6 text-right shadow-xl">
            <h2 className="mb-3 text-lg font-semibold text-pikol-brown">קצת עלינו</h2>

            <div className="space-y-3 text-sm leading-relaxed text-pikol-brown/80">
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs text-pikol-brown/50 underline"
              >
                סגירה
              </button>

              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="עקבו אחרינו באינסטגרם"
                className="text-pikol-brown/50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
