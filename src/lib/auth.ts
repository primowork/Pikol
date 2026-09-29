import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "./config";
import { prisma } from "./db";
import { UnauthorizedError } from "./errors";
import {
  createSessionToken,
  sessionCookieOptions,
  verifySessionToken,
  type SessionPayload,
  type VerifiedSession,
} from "./session";

/**
 * ניהול session של הצוות: JWT חתום (ראו lib/session.ts) בתוך cookie
 * httpOnly. staffId (השדה sub) הוא המזהה היחיד שמותר להשתמש בו בעת
 * כתיבת StampEvent - הוא תמיד מגיע מכאן ולעולם לא מגוף הבקשה של הלקוח.
 */

export type { SessionPayload } from "./session";

interface StaffForSession {
  id: string;
  username: string;
  name: string;
  role: "OWNER" | "STAFF";
  sessionVersion: number;
}

/** מנפיק session חדש ושומר אותו ב-cookie: כניסה, איפוס סיסמה, החלפת סיסמה. */
export async function startStaffSession(staff: StaffForSession, remember: boolean): Promise<void> {
  const payload: SessionPayload = {
    sub: staff.id,
    username: staff.username,
    name: staff.name,
    role: staff.role,
    remember,
    sessionVersion: staff.sessionVersion,
  };
  const token = await createSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions(remember));
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * מחזיר את חבר הצוות המחובר, או null אם אין session תקף. מעבר לחתימה
 * ולתוקף, בודק מול המסד שהחשבון עדיין קיים ושהסיסמה לא הוחלפה מאז
 * שהטוקן הונפק (sessionVersion) - כך איפוס סיסמה מנתק גם מכשיר שנגנב.
 */
export async function getCurrentStaff(): Promise<VerifiedSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session) return null;

  const staff = await prisma.staffUser.findUnique({
    where: { id: session.sub },
    select: { sessionVersion: true },
  });
  if (!staff || staff.sessionVersion !== session.sessionVersion) return null;

  return session;
}

/**
 * שער החובה לכל endpoint שמשנה נתונים (הוספת/מימוש ניקוב, חיפוש לקוחות).
 * זורק UnauthorizedError אם אין session תקף - זו ההגנה האמיתית, לא
 * proxy.ts שהוא רק נוחות UI.
 */
export async function requireStaff(): Promise<VerifiedSession> {
  const staff = await getCurrentStaff();
  if (!staff) {
    throw new UnauthorizedError();
  }
  return staff;
}
