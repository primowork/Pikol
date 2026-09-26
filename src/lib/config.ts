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

/** לכמה זמן ה-session של הצוות תקף לפני שצריך להתחבר מחדש. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // חודש

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
