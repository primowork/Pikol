import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "./config";
import { UnauthorizedError } from "./errors";

/**
 * ניהול session של הצוות: JWT חתום (jose - תואם Edge runtime, נחוץ כי
 * src/proxy.ts רץ שם) בתוך cookie httpOnly. staffId (השדה sub) הוא
 * המזהה היחיד שמותר להשתמש בו בעת כתיבת StampEvent - הוא תמיד מגיע
 * מכאן ולעולם לא מגוף הבקשה של הלקוח.
 */

export interface SessionPayload {
  sub: string; // StaffUser.id
  username: string;
  name: string;
  role: "OWNER" | "STAFF";
}

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("חסר משתנה הסביבה SESSION_SECRET");
  }
  return new TextEncoder().encode(secret);
}

const maxAgeDays = Math.floor(SESSION_MAX_AGE_SECONDS / 86400);

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeDays}d`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.sub === "string" &&
      typeof payload.username === "string" &&
      typeof payload.name === "string" &&
      (payload.role === "OWNER" || payload.role === "STAFF")
    ) {
      return {
        sub: payload.sub,
        username: payload.username,
        name: payload.name,
        role: payload.role,
      };
    }
    return null;
  } catch {
    // חתימה לא תקינה, פג תוקף, או JWT מעוות - כל אלה נחשבים "לא מחובר"
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/** מחזיר את חבר הצוות המחובר, או null אם אין session תקף. */
export async function getCurrentStaff(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * שער החובה לכל endpoint שמשנה נתונים (הוספת/מימוש ניקוב, חיפוש לקוחות).
 * זורק UnauthorizedError אם אין session תקף - זו ההגנה האמיתית, לא
 * proxy.ts שהוא רק נוחות UI.
 */
export async function requireStaff(): Promise<SessionPayload> {
  const staff = await getCurrentStaff();
  if (!staff) {
    throw new UnauthorizedError();
  }
  return staff;
}
