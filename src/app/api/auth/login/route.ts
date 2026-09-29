import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validation";
import { startStaffSession } from "@/lib/auth";
import { checkLoginRateLimit, getClientIp } from "@/lib/rate-limit";
import { handleApiError, UnauthorizedError, ValidationError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    // בדיקת rate-limit לפני כל שאילתת DB - גם ניסיון ראשון "יקר" לא אמור
    // לרוץ מעבר למכסה.
    checkLoginRateLimit(getClientIp(request));

    const body = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("יש להזין שם משתמש וסיסמה");
    }
    const { username, password, remember } = parsed.data;

    const staff = await prisma.staffUser.findUnique({ where: { username } });

    // אותה הודעת שגיאה בין "משתמש לא קיים" ל"סיסמה שגויה" - כדי שלא
    // יהיה אפשר לגלות אילו שמות משתמש קיימים במערכת.
    if (!staff || !(await bcrypt.compare(password, staff.passwordHash))) {
      throw new UnauthorizedError("שם משתמש או סיסמה שגויים");
    }

    await startStaffSession(staff, remember);

    return NextResponse.json({
      id: staff.id,
      username: staff.username,
      name: staff.name,
      role: staff.role,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
