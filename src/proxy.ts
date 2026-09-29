import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/config";
import {
  createSessionToken,
  sessionCookieOptions,
  shouldRenewSession,
  toSessionPayload,
  verifySessionToken,
} from "@/lib/session";
import { loginPathWithNext } from "@/lib/staff-paths";

// שכבת UX בלבד: מונעת הבזק של תוכן הדשבורד לפני שברור שאין הרשאה, ומפנה
// ישר ל-login (עם next, כדי לחזור לאותו עמוד אחרי הכניסה). ההגנה האמיתית
// היא requireStaff() בתוך כל route handler - קריאה ישירה ל-API בלי לעבור
// דרך הדפדפן לא נעצרת כאן.
//
// כאן גם מתחדש session "זכור": כל כניסה לעמוד צוות עם טוקן בן יותר מיום
// מקבלת טוקן חדש לחודש נוסף, כך שמכשיר בשימוש קבוע לא מתנתק. אין כאן
// בדיקה מול המסד - טוקן שבוטל (החלפת סיסמה) מתחדש עם אותה גרסה ישנה
// ולכן נשאר מבוטל, והעמוד עצמו מפנה ל-login.
//
// שם הקובץ הזה (proxy.ts, לא middleware.ts) הוא דרישה של Next.js 16.
export default async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL(loginPathWithNext(request.nextUrl.pathname), request.url);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  if (shouldRenewSession(session)) {
    const renewedToken = await createSessionToken(toSessionPayload(session));
    response.cookies.set(SESSION_COOKIE_NAME, renewedToken, sessionCookieOptions(true));
  }
  return response;
}

export const config = {
  matcher: ["/staff/dashboard/:path*", "/staff/stand-qr", "/staff/customers", "/staff/settings"],
};
