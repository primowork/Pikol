import { NextRequest, NextResponse, after } from "next/server";
import { forgotPasswordSchema } from "@/lib/validation";
import { getPublicBaseUrl, sendPasswordResetEmail } from "@/lib/password-reset";
import { checkLoginRateLimit, getClientIp } from "@/lib/rate-limit";
import { handleApiError, ValidationError } from "@/lib/errors";

/**
 * בקשת קישור איפוס סיסמה. התשובה תמיד זהה, והחיפוש והשליחה רצים אחרי
 * שהיא נשלחה (after): אי אפשר לגלות לפי התוכן או לפי זמן התגובה אם
 * החשבון קיים ואם שמור לו מייל.
 */
export async function POST(request: NextRequest) {
  try {
    checkLoginRateLimit(`forgot:${getClientIp(request)}`);

    const body = await request.json().catch(() => null);
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? "יש להזין שם משתמש או מייל");
    }

    const { identifier } = parsed.data;
    const baseUrl = getPublicBaseUrl(request.headers.get("host"));
    after(async () => {
      try {
        await sendPasswordResetEmail(identifier, baseUrl);
      } catch (err) {
        console.error("שליחת קישור איפוס סיסמה נכשלה:", err);
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
