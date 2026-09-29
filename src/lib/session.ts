import { SignJWT, jwtVerify } from "jose";
import {
  SESSION_MAX_AGE_SECONDS,
  SESSION_RENEW_AFTER_SECONDS,
  SHORT_SESSION_MAX_AGE_SECONDS,
} from "./config";

/**
 * טוקן ה-session של הצוות (JWT חתום ב-jose) ואפשרויות ה-cookie שלו. בלי
 * גישה למסד הנתונים ובלי next/headers, כדי ש-src/proxy.ts יוכל להשתמש בו
 * כמו שהוא. הבדיקה המלאה (כולל ביטול sessions אחרי החלפת סיסמה) נמצאת
 * ב-getCurrentStaff ב-lib/auth.ts.
 */

export interface SessionPayload {
  sub: string; // StaffUser.id
  username: string;
  name: string;
  role: "OWNER" | "STAFF";
  /** "להישאר מחובר": cookie קבוע שמתחדש בשימוש, או cookie שנמחק עם סגירת הדפדפן. */
  remember: boolean;
  /** StaffUser.sessionVersion בזמן ההנפקה. איפוס או החלפת סיסמה מעלים אותו ומנתקים את כל המכשירים. */
  sessionVersion: number;
}

export interface VerifiedSession extends SessionPayload {
  /** זמן הנפקת הטוקן, בשניות (iat). */
  issuedAt: number;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("חסר משתנה הסביבה SESSION_SECRET");
  }
  return new TextEncoder().encode(secret);
}

function maxAgeSeconds(remember: boolean): number {
  return remember ? SESSION_MAX_AGE_SECONDS : SHORT_SESSION_MAX_AGE_SECONDS;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds(payload.remember)}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<VerifiedSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.sub !== "string" ||
      typeof payload.username !== "string" ||
      typeof payload.name !== "string" ||
      (payload.role !== "OWNER" && payload.role !== "STAFF") ||
      typeof payload.iat !== "number"
    ) {
      return null;
    }
    return {
      sub: payload.sub,
      username: payload.username,
      name: payload.name,
      role: payload.role,
      // טוקנים שהונפקו לפני "להישאר מחובר" היו תמיד קבועים לחודש, ועוד לא
      // היה להם sessionVersion - הם ממשיכים לעבוד כמו שהם.
      remember: typeof payload.remember === "boolean" ? payload.remember : true,
      sessionVersion: typeof payload.sessionVersion === "number" ? payload.sessionVersion : 0,
      issuedAt: payload.iat,
    };
  } catch {
    // חתימה לא תקינה, פג תוקף, או JWT מעוות - כל אלה נחשבים "לא מחובר"
    return null;
  }
}

/** session "זכור" שהטוקן שלו כבר לא טרי - מקבל טוקן חדש לעוד חודש שלם. */
export function shouldRenewSession(session: VerifiedSession): boolean {
  return session.remember && Date.now() / 1000 - session.issuedAt > SESSION_RENEW_AFTER_SECONDS;
}

export function toSessionPayload(session: VerifiedSession): SessionPayload {
  return {
    sub: session.sub,
    username: session.username,
    name: session.name,
    role: session.role,
    remember: session.remember,
    sessionVersion: session.sessionVersion,
  };
}

/**
 * בלי maxAge ה-cookie נמחק כשהדפדפן נסגר. בטלפונים הדפדפן כמעט אף פעם
 * לא "נסגר" באמת, ולכן התוקף האמיתי של session לא-זכור הוא ה-exp הקצר
 * שבתוך הטוקן עצמו.
 */
export function sessionCookieOptions(remember: boolean) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    ...(remember ? { maxAge: SESSION_MAX_AGE_SECONDS } : {}),
  };
}
