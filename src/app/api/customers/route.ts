import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { joinSchema } from "@/lib/validation";
import { normalizePhone } from "@/lib/phone";
import { requireStaff } from "@/lib/auth";
import { handleApiError, ValidationError } from "@/lib/errors";

/**
 * כניסה/הצטרפות - ציבורי, נקרא מ-"/join". טופס חכם אחד: השלב הראשון
 * שולח רק טלפון. אם הוא כבר רשום - מחזיר את הכרטיס הקיים ישירות (אין
 * צורך בשם, ולקוח חוזר ממכשיר חדש "נכנס" בלי שום מסך login נפרד). אם
 * לא רשום ולא נשלח שם - מחזיר needsName כדי שה-UI יבקש שם ויקרא שוב.
 */
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

    if (!parsed.data.name) {
      // עדיין לא נוצר כלום - רק מבקשים מה-UI לחשוף שדה שם ולשלוח שוב.
      return NextResponse.json({ existing: false, needsName: true }, { status: 200 });
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

const CUSTOMER_LIST_LIMIT = 200;

/**
 * staff בלבד. שני מצבים על אותו endpoint:
 * - `?phone=` (הדפוס הקיים): חיפוש ידני מדויק, fallback כשסריקת המצלמה
 *   לא זמינה - נשאר בדיוק כמו שהיה.
 * - בלי `phone` (חדש): רשימת כל הלקוחות למסך "מסד הלקוחות", עם `?search=`
 *   חופשי אופציונלי שמחפש גם בשם וגם בטלפון מנורמל.
 */
export async function GET(request: NextRequest) {
  try {
    await requireStaff();

    const { searchParams } = new URL(request.url);
    const rawPhone = searchParams.get("phone");

    if (rawPhone) {
      const phone = normalizePhone(rawPhone);
      if (!phone) {
        return NextResponse.json({ customers: [] });
      }

      const customers = await prisma.customer.findMany({
        where: { phone },
        select: { id: true, name: true, phone: true, currentStamps: true, rewardsEarned: true },
      });

      return NextResponse.json({ customers });
    }

    const search = searchParams.get("search")?.trim();
    const normalizedSearchPhone = search ? normalizePhone(search) : null;

    const customers = await prisma.customer.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              ...(normalizedSearchPhone ? [{ phone: { contains: normalizedSearchPhone } }] : []),
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: CUSTOMER_LIST_LIMIT,
      select: {
        id: true,
        name: true,
        phone: true,
        currentStamps: true,
        rewardsEarned: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ customers });
  } catch (err) {
    return handleApiError(err);
  }
}
