"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// גובה "רצועת" שורת הכתובת של כרום באייפון (שורת סטטוס + שורת כתובת, בערך
// 104-118 פיקסלים לפי מדידות על מכשירים), עם מרווח. דף שנפתח עם גלילה קטנה
// מזה לפני שהמשתמש נגע במסך נחת מתחת לשורת הכתובת, זו לא גלילה אמיתית.
const TOOLBAR_BAND_PX = 160;
const STUCK_CHECK_DELAY_MS = 250;
const INTERACTION_EVENTS = ["touchstart", "pointerdown", "wheel", "keydown"];

function isChromeOnIos() {
  const userAgent = navigator.userAgent;
  return userAgent.includes("CriOS/") && /iPhone|iPad|iPod/.test(userAgent);
}

function setTopFix(px: number) {
  document.documentElement.style.setProperty("--ios-top-fix", `${px}px`);
}

/**
 * עקיפה לבאג של כרום באייפון בגרסאות iOS החדשות: כרום מנהל את שורת הכתובת
 * כשוליים של אזור הגלילה, ולפעמים (בעיקר בטעינה או בחזרה לטאב) הדף נפתח
 * כשהחלק העליון שלו, בערך בגובה שורת הכתובת, תקוע מתחתיה ואי אפשר לגלול
 * אליו. אין אצלנו שום נעילת גלילה - זה באג של הדפדפן - אבל אפשר לצמצם
 * אותו מצד הדף:
 * - נחיתה בתוך רצועת שורת הכתובת לפני שהמשתמש נגע: חוזרים לראש הדף.
 * - אם הדפדפן לא מאפשר לחזור לראש (תקוע): רווח עליון לגוף הדף בדיוק בגודל
 *   התקיעה, כדי שהלוגו והכותרת ייראו. מתאפס ונבדק מחדש בכל מעבר דף.
 * - אחרת: גלילה של פיקסל אחד ובחזרה, שמדמה את הגלילה הקצרה שמסנכרנת מחדש
 *   את שורת הכתובת (אצל משתמשים, גלילה קצרה למטה ובחזרה מתקנת את זה).
 * רץ רק בכרום באייפון, ואף פעם לא אחרי שהמשתמש התחיל לגלול בעצמו.
 */
export default function ChromeIosTopFix() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isChromeOnIos()) return;

    let touched = false;
    let frame = 0;
    let timer = 0;
    const markTouched = () => {
      touched = true;
    };

    function reconcile() {
      if (touched || window.location.hash) return;
      setTopFix(0);

      const landedY = window.scrollY;
      if (landedY > 0 && landedY <= TOOLBAR_BAND_PX) {
        window.scrollTo(0, 0);
        timer = window.setTimeout(() => {
          const stuckY = window.scrollY;
          if (!touched && stuckY > 0 && stuckY <= TOOLBAR_BAND_PX) setTopFix(stuckY);
        }, STUCK_CHECK_DELAY_MS);
        return;
      }

      if (landedY !== 0 || document.documentElement.scrollHeight <= window.innerHeight + 1) return;
      window.scrollTo(0, 1);
      frame = requestAnimationFrame(() => {
        if (!touched && window.scrollY <= 1) window.scrollTo(0, 0);
      });
    }

    // חזרה לדף מה-bfcache (למשל חזרה לטאב) היא נחיתה חדשה - בודקים שוב
    function handlePageShow(event: PageTransitionEvent) {
      if (!event.persisted) return;
      touched = false;
      reconcile();
    }

    INTERACTION_EVENTS.forEach((name) => window.addEventListener(name, markTouched, { passive: true }));
    window.addEventListener("pageshow", handlePageShow);
    frame = requestAnimationFrame(reconcile);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      INTERACTION_EVENTS.forEach((name) => window.removeEventListener(name, markTouched));
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [pathname]);

  return null;
}
