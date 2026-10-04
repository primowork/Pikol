import { createECDH } from "crypto";

/**
 * מפתחות VAPID וכתובת הקשר שבחתימה - מה שהשרת שולח עם כל התראת Push.
 *
 * אפל דוחה כל שליחה עם 403 {"reason":"BadJwtToken"} כשהחתימה לא תקינה:
 * המפתח הפרטי לא מתאים לציבורי שנשלח איתו, או שכתובת הקשר (subject) אינה
 * URL או mailto: תקין. שני המקרים קרו בפועל, ולכן:
 * - המפתח הציבורי נגזר תמיד מהפרטי (VAPID_PRIVATE_KEY הוא המקור היחיד),
 *   כך ששני משתני הסביבה לא יכולים לצאת לא תואמים. VAPID_PUBLIC_KEY, אם
 *   מוגדר ושונה, רק נרשם כאזהרה בלוג.
 * - כתובת הקשר מנוקה (רווח אחרי mailto:, סוגריים משולשים, אימייל בלי
 *   mailto:) ונבדקת לפני השליחה, כולל כתובות localhost/.local שאפל דוחה.
 */

/** base64url קנוני (בלי ריפוד, עם - ו-_), כדי שמפתח שהודבק בקידוד אחר עדיין יעבוד. */
function toBase64Url(value: string): string {
  return value.trim().replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export type VapidKeysResult =
  | { ok: true; publicKey: string; privateKey: string }
  | { ok: false; reason: "missing" | "invalid" };

let warnedAboutPublicKey = false;

export function getVapidKeys(): VapidKeysResult {
  const raw = process.env.VAPID_PRIVATE_KEY;
  if (!raw?.trim()) return { ok: false, reason: "missing" };

  const privateKey = toBase64Url(raw);
  const privateBytes = Buffer.from(privateKey, "base64url");
  if (privateBytes.length !== 32) return { ok: false, reason: "invalid" };

  let publicKey: string;
  try {
    const ecdh = createECDH("prime256v1");
    ecdh.setPrivateKey(privateBytes);
    publicKey = ecdh.getPublicKey().toString("base64url");
  } catch {
    return { ok: false, reason: "invalid" };
  }

  const configuredPublic = process.env.VAPID_PUBLIC_KEY;
  if (configuredPublic && toBase64Url(configuredPublic) !== publicKey && !warnedAboutPublicKey) {
    warnedAboutPublicKey = true;
    console.warn(
      "VAPID_PUBLIC_KEY לא תואם ל-VAPID_PRIVATE_KEY - משתמשים במפתח הציבורי שנגזר מהפרטי. " +
        "מכשירים שנרשמו עם המפתח הישן יתבקשו להפעיל התראות מחדש."
    );
  }

  return { ok: true, publicKey, privateKey };
}

/** המפתח הציבורי לדפדפן (applicationServerKey), או "" כשהמפתחות לא מוגדרים. */
export function getVapidPublicKey(): string {
  const keys = getVapidKeys();
  return keys.ok ? keys.publicKey : "";
}

/** localhost, *.localhost, *.local - כתובות שאי אפשר להגיע אליהן מבחוץ, ואפל דוחה. */
const LOCAL_HOST = /(^|\.)(localhost|local)$/i;

/**
 * כתובת קשר בפורמט שאפל מקבל: mailto:name@domain.tld או https://domain.tld/...,
 * או null כשאי אפשר לתקן. מקבל גם אימייל בלי mailto: ומנקה רווחים וסוגריים.
 */
export function normalizeVapidSubject(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;

  if (/^https?:/i.test(value)) {
    try {
      const url = new URL(value);
      if (url.protocol !== "https:" || !url.hostname.includes(".") || LOCAL_HOST.test(url.hostname)) return null;
      return url.href;
    } catch {
      return null;
    }
  }

  const email = value.match(/^(?:mailto:)?\s*<?\s*([^\s<>]+)\s*>?$/i)?.[1];
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s.]+$/.test(email)) return null;
  const domain = email.slice(email.lastIndexOf("@") + 1);
  if (LOCAL_HOST.test(domain)) return null;
  return `mailto:${email}`;
}
