// הנוסח הסופי של שידור ללקוחות. משותף לשרת (מה שנשלח בפועל ונשמר ביומן)
// ולתצוגה המקדימה בדשבורד, כדי שבעל העסק יראה בדיוק את מה שהלקוחות יקבלו.

/** סעיף 30א לחוק התקשורת: המילה "פרסומת" בתחילת ההודעה. */
export const BROADCAST_AD_LABEL = "פרסומת";

/** דרך ההסרה, בכל הודעה. באנדרואיד יש גם כפתור הסרה בהתראה עצמה (sw.js). */
export const BROADCAST_OPT_OUT_LINE = "להסרה: בכרטיס שלך ← הפסקת עדכונים ומבצעים";

/**
 * מוסיף את מה שהחוק דורש סביב הטקסט שבעל העסק כתב: "פרסומת" בתחילת
 * הכותרת (אם הוא לא כתב את זה בעצמו), ובסוף הגוף שם העסק, טלפון אם
 * הוגדר בהגדרות, ודרך ההסרה. senderLine מגיע מהשרת (getBroadcastSenderLine).
 */
export function formatCustomerBroadcast(title: string, body: string, senderLine: string) {
  const trimmedTitle = title.trim();
  return {
    title: trimmedTitle.startsWith(BROADCAST_AD_LABEL) ? trimmedTitle : `${BROADCAST_AD_LABEL}: ${trimmedTitle}`,
    body: `${body.trim()}\n${senderLine}. ${BROADCAST_OPT_OUT_LINE}`,
  };
}
