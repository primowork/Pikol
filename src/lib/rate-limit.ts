import { RateLimitedError } from "./errors";

/**
 * הגנה בסיסית נגד ניחוש סיסמה: מספר ניסיונות מוגבל לכל מפתח (בדרך כלל
 * כתובת IP) בתוך חלון זמן. זו הגנת "best effort" בזיכרון בתהליך - מספיקה
 * לעסק יחיד קטן, אבל לא משותפת בין כמה instance-ים אם המערכת פרוסה
 * serverless עם כמה עותקים מקבילים. שדרוג עתידי: Upstash Redis או דומה.
 */

interface Bucket {
  count: number;
  windowStart: number;
}

const WINDOW_MS = 5 * 60 * 1000; // חלון של 5 דקות
const MAX_ATTEMPTS = 5;

const buckets = new Map<string, Bucket>();

function cleanupExpired(now: number) {
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > WINDOW_MS) {
      buckets.delete(key);
    }
  }
}

/** כתובת ה-IP של הלקוח מאחורי ה-proxy של Railway (הכתובת הראשונה ב-x-forwarded-for). */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

/**
 * זורק RateLimitedError אם המפתח הזה חרג ממכסת הניסיונות בחלון הנוכחי.
 * משמש גם לשחזור והחלפת סיסמה, עם קידומת במפתח (למשל "forgot:<ip>")
 * כדי שכל פעולה תספור בנפרד.
 */
export function checkLoginRateLimit(key: string): void {
  const now = Date.now();

  // ניקוי הזדמנותי כדי שה-Map לא יגדל ללא הגבלה עם הזמן.
  if (Math.random() < 0.05) cleanupExpired(now);

  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return;
  }

  bucket.count += 1;
  if (bucket.count > MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((bucket.windowStart + WINDOW_MS - now) / 1000)
    );
    throw new RateLimitedError(retryAfterSeconds);
  }
}
