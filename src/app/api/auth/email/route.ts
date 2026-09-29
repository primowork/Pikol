import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { staffEmailSchema } from "@/lib/validation";
import { requireStaff } from "@/lib/auth";
import { ApiError, handleApiError, ValidationError } from "@/lib/errors";

/** המייל של המחובר, לשחזור סיסמה (עמוד ההגדרות). מחרוזת ריקה מסירה אותו. */
export async function POST(request: NextRequest) {
  try {
    const session = await requireStaff();

    const body = await request.json().catch(() => null);
    const parsed = staffEmailSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? "כתובת המייל לא תקינה");
    }
    const email = parsed.data.email || null;

    try {
      await prisma.staffUser.update({ where: { id: session.sub }, data: { email } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ApiError(409, "המייל הזה כבר שמור בחשבון צוות אחר");
      }
      throw err;
    }

    return NextResponse.json({ email });
  } catch (err) {
    return handleApiError(err);
  }
}
