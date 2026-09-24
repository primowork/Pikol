import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/config";
import { verifySessionToken } from "@/lib/auth";

// שכבת UX בלבד: מונעת הבזק של תוכן הדשבורד לפני שברור שאין הרשאה, ומפנה
// ישר ל-login. ההגנה האמיתית היא requireStaff() בתוך כל route handler -
// קריאה ישירה ל-API בלי לעבור דרך הדפדפן לא נעצרת כאן.
//
// שם הקובץ הזה (proxy.ts, לא middleware.ts) הוא דרישה של Next.js 16.
export default async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/staff/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/staff/dashboard/:path*", "/staff/stand-qr", "/staff/customers"],
};
