import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { joinSchema } from "@/lib/validation";
import { normalizePhone } from "@/lib/phone";
import { requireStaff } from "@/lib/auth";
import { handleApiError, ValidationError } from "@/lib/errors";

/** הרשמה למועדון - ציבורי, נקרא מ-"/join". */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = joinSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? "קלט לא תקין");
    }

    const phone = normalizePhone(parsed.data.phone);
    if (!phone) {
      throw new ValidationError("מספר הטלפון לא תקין");
    }

    // אם הטלפון כבר רשום, מפנים לכרטיס הקיים במקום ליצור כפילות - ובכוונה
    // לא מעדכנים את השם הקיים, כדי שהרשמה חוזרת לא "תגנוב" כרטיס של מישהו
    // אחר רק כי הטלפון שלו ידוע.
    const existing = await prisma.customer.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json(
        {
          id: existing.id,
          name: existing.name,
          phone: existing.phone,
          currentStamps: existing.currentStamps,
          existing: true,
        },
        { status: 200 }
      );
    }

    const customer = await prisma.customer.create({
      data: { name: parsed.data.name, phone },
    });

    return NextResponse.json(
      {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        currentStamps: customer.currentStamps,
        existing: false,
      },
      { status: 201 }
    );
  } catch (err) {
    return handleApiError(err);
  }
}

/** חיפוש ידני לפי טלפון - staff בלבד, fallback כשסריקת המצלמה לא זמינה. */
export async function GET(request: NextRequest) {
  try {
    await requireStaff();

    const { searchParams } = new URL(request.url);
    const rawPhone = searchParams.get("phone");
    if (!rawPhone) {
      throw new ValidationError("יש לספק מספר טלפון לחיפוש");
    }

    const phone = normalizePhone(rawPhone);
    if (!phone) {
      return NextResponse.json({ customers: [] });
    }

    const customers = await prisma.customer.findMany({
      where: { phone },
      select: { id: true, name: true, phone: true, currentStamps: true, rewardsEarned: true },
    });

    return NextResponse.json({ customers });
  } catch (err) {
    return handleApiError(err);
  }
}
