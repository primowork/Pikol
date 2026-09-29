import { NextRequest, NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/validation";
import { resetPasswordWithToken } from "@/lib/password-reset";
import { startStaffSession } from "@/lib/auth";
import { checkLoginRateLimit, getClientIp } from "@/lib/rate-limit";
import { handleApiError, ValidationError } from "@/lib/errors";

/**
 * קביעת סיסמה חדשה מקישור במייל. בהצלחה המכשיר הזה נכנס ישר לדשבורד
 * (הקישור הגיע למייל של החשבון, זו הוכחת הבעלות), וכל מכשיר אחר שהיה
 * מחובר לחשבון מתנתק.
 */
export async function POST(request: NextRequest) {
  try {
    checkLoginRateLimit(`reset:${getClientIp(request)}`);

    const body = await request.json().catch(() => null);
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? "הסיסמה לא תקינה");
    }

    const staff = await resetPasswordWithToken(parsed.data.token, parsed.data.password);
    await startStaffSession(staff, true);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
