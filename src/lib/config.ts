// קבועים גלובליים של המערכת. מספר הניקובים הנדרש למשקה חינם תואם את
// הכרטיס הפיזי המקורי של קפה פיקולו (עשר כוסות).

export const BUSINESS_NAME = "קפה פיקולו";
export const BUSINESS_TAGLINE = "בית קפה קטן ולעניין";
export const INSTAGRAM_URL = "https://www.instagram.com/cafe.piccolo.il/";

/** כמה ניקובים נדרשים כדי לזכות במשקה חינם. */
export const STAMPS_REQUIRED = 10;

/**
 * כמה שניות צריכות לעבור בין שני ניקובים לאותו לקוח לפני שמותר להוסיף
 * ניקוב נוסף. מגן מפני סריקה כפולה בטעות (לא מפני רמאות מכוונת - זו
 * ההגנה הראשית, ראו lib/auth.ts).
 */
export const STAMP_COOLDOWN_SECONDS = 10;

/** שם הקוקי של session הצוות. */
export const SESSION_COOKIE_NAME = "pikol_staff_session";

/**
 * "להישאר מחובר" (ברירת המחדל בכניסה): כמה זמן session נשאר תקף בלי שימוש.
 * כל כניסה לעמוד צוות מחדשת אותו (src/proxy.ts), כך שמכשיר שנמצא בשימוש
 * קבוע לא מתנתק אף פעם.
 */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // חודש

/** בלי "להישאר מחובר" (מכשיר משותף): session קצר שלא מתחדש. */
export const SHORT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

/** אחרי כמה זמן session "זכור" מקבל טוקן חדש (בכניסה הבאה לעמוד צוות). */
export const SESSION_RENEW_AFTER_SECONDS = 60 * 60 * 24;

/** כמה זמן קישור איפוס סיסמה שנשלח במייל תקף. */
export const PASSWORD_RESET_TOKEN_TTL_MINUTES = 30;

/** אורך מינימלי לסיסמת צוות חדשה (איפוס או החלפה). */
export const PASSWORD_MIN_LENGTH = 8;

/** כמה מיליישניות לשמור מטמון לוגו/סטטי בשירות הרקע (service worker). */
export const SW_CACHE_NAME = "pikol-shell-v1";

/**
 * כמה שניות לחכות בין שתי בקשות אישור רצופות לאותו לקוח (הגנה מפני
 * הצפת התראות Push לצוות). קבוע נפרד מ-STAMP_COOLDOWN_SECONDS - הסמנטיקה
 * שונה (כאן מונעים ספאם התראות, לא הקשה כפולה בטעות של staff).
 */
export const APPROVAL_REQUEST_COOLDOWN_SECONDS = 60;

/** כמה שניות בקשת אישור נשארת תקפה לפני שהיא נחשבת פגת-תוקף (נגזר בזמן קריאה, לא נכתב ל-DB). */
export const APPROVAL_REQUEST_TIMEOUT_SECONDS = 5 * 60;
