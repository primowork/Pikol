import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { changePasswordSchema } from "@/lib/validation";
import { requireStaff, startStaffSession } from "@/lib/auth";
import { checkLoginRateLimit } from "@/lib/rate-limit";
import { handleApiError, ValidationError } from "@/lib/errors";

/**
 * החלפת סיסמה של המחובר (עמוד ההגדרות). המכשיר הזה נשאר מחובר עם טוקן
 * חדש, וכל מכשיר אחר מתנתק (sessionVersion עולה). סיסמה נוכחית שגויה
 * מחזירה 400 ולא 401 - 401 אצלנו אומר "ה-session נגמר" ומעביר למסך הכניסה.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireStaff();
    checkLoginRateLimit(`change-password:${session.sub}`);

    const body = await request.json().catch(() => null);
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? "הסיסמה לא תקינה");
    }

    const staff = await prisma.staffUser.findUnique({ where: { id: session.sub } });
    if (!staff || !(await bcrypt.compare(parsed.data.currentPassword, staff.passwordHash))) {
      throw new ValidationError("הסיסמה הנוכחית שגויה");
    }

    const updated = await prisma.staffUser.update({
      where: { id: staff.id },
      data: {
        passwordHash: await bcrypt.hash(parsed.data.newPassword, 10),
        sessionVersion: { increment: 1 },
      },
    });
    await prisma.passwordResetToken.deleteMany({ where: { staffId: staff.id } });
    await startStaffSession(updated, session.remember);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
