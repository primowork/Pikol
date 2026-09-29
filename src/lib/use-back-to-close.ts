"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * חלון קופץ שנסגר בכפתור/החלקת "חזרה" של הטלפון, במקום שהדפדפן יעזוב את
 * כל העמוד (למשל מהכרטיס חזרה לטופס ההצטרפות). בפתיחה נדחפת רשומת
 * היסטוריה עם אותה כתובת, ו"חזרה" רק מוציאה אותה וסוגרת את החלון. סגירה
 * מתוך החלון (כפתור, רקע, Escape) מוציאה את אותה רשומה בעצמה, כדי שחזרה
 * נוספת תתנהג כרגיל. בזמן שהחלון פתוח העמוד שמאחוריו לא נגלל.
 *
 * Next.js משלב pushState ידני בראוטר שלו (מעתיק את המצב הפנימי לרשומה
 * החדשה), כך ש"חזרה" לאותה כתובת לא טוענת את העמוד מחדש.
 *
 * closeForNavigation: כשסוגרים כדי לעבור לעמוד אחר, קוראים לזה לפני
 * הסגירה ומנווטים עם router.replace - הרשומה של החלון מוחלפת בעמוד החדש
 * במקום לחזור אחורה באמצע המעבר.
 */
export function useBackToClose(open: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  const entryIdRef = useRef<string | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    const entryId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    entryIdRef.current = entryId;
    window.history.pushState({ pikolModal: entryId }, "");

    function handlePopState() {
      if (entryIdRef.current !== entryId) return;
      entryIdRef.current = null;
      onCloseRef.current();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;

      // נסגר מתוך החלון: מוציאים את הרשומה שלו, אבל רק אם היא עדיין הרשומה
      // הנוכחית - אם בינתיים עברנו לעמוד אחר, חזרה עכשיו הייתה מבטלת את המעבר
      if (entryIdRef.current === entryId) {
        entryIdRef.current = null;
        if (window.history.state?.pikolModal === entryId) {
          window.history.back();
        }
      }
    };
  }, [open]);

  const closeForNavigation = useCallback(() => {
    entryIdRef.current = null;
  }, []);

  return { closeForNavigation };
}
