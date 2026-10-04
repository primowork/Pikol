import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { joinSchema } from "@/lib/validation";
import { normalizePhone } from "@/lib/phone";
import { requireStaff } from "@/lib/auth";
import { getConsentIp } from "@/lib/consent";
import { requestLoginApproval } from "@/lib/login-approval";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { JOIN_RATE_LIMIT, TERMS_VERSION } from "@/lib/config";
import { handleApiError, ValidationError } from "@/lib/errors";

/**
 * כניסה/הצטרפות - ציבורי, נקרא מ-"/join". טופס חכם אחד: השלב הראשון
 * שולח רק טלפון. אם הוא כבר רשום, הכרטיס לא מוחזר מיד: נוצרת בקשת כניסה
 * (LOGIN) שהצוות מאשר בדוכן, ו-"/join" ממתין לה (src/lib/login-approval.ts).
 * כך מי שרק יודע מספר טלפון של לקוח לא רואה את הכרטיס, השם או יום ההולדת
 * שלו. אם לא רשום ולא נשלח שם - מחזיר needsName כדי שה-UI יבקש שם ויקרא שוב.
 *
 * הגבלת קצב לפי IP (JOIN_RATE_LIMIT) עוצרת סריקה של מספרים, ונדיבה מספיק
 * ללקוחות שחולקים את ה-Wi-Fi של בית הקפה.
 */
export async function POST(request: NextRequest) {
  try {
    checkRateLimit(`join:${getClientIp(request)}`, JOIN_RATE_LIMIT);

    const body = await request.json().catch(() => null);
    const parsed = joinSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? "קלט לא תקין");
    }

    const phone = normalizePhone(parsed.data.phone);
    if (!phone) {
      throw new ValidationError("מספר הטלפון לא תקין");
    }

    // טלפון רשום: לא יוצרים כפילות ולא נוגעים בשם הקיים, וגם לא מחזירים
    // כלום מהכרטיס - רק מזהה של בקשת כניסה שהצוות צריך לאשר.
    const existing = await prisma.customer.findUnique({
      where: { phone },
      select: { id: true, name: true },
    });
    if (existing) {
      const approvalRequestId = await requestLoginApproval(existing);
      return NextResponse.json({ existing: true, needsApproval: true, approvalRequestId }, { status: 200 });
    }

    const { name } = parsed.data;
    if (!name) {
      // עדיין לא נוצר כלום - רק מבקשים מה-UI לחשוף שדה שם ולשלוח שוב.
      return NextResponse.json({ existing: false, needsName: true }, { status: 200 });
    }

    // IP נשמר לצורך תיעוד הסכמה בר-הוכחה (audit-ready) - תואם Railway/רוב
    // ה-reverse proxies. null בפיתוח מקומי כשאין header - לא קריטי, לא זורק.
    const consentIp = getConsentIp(request);
    const marketingOptIn = parsed.data.marketingOptIn ?? false;

    // השדות על Customer הם המצב האחרון; היומן (ConsentEvent) שומר גם את
    // ההיסטוריה, באותה טרנזקציה כדי שלא ייווצר לקוח בלי תיעוד ההסכמה שלו.
    const customer = await prisma.$transaction(async (tx) => {
      const created = await tx.customer.create({
        data: {
          name,
          phone,
          termsAccepted: true,
          marketingOptIn,
          consentedAt: new Date(),
          consentIp,
        },
      });
      await tx.consentEvent.createMany({
        data: [
          {
            customerId: created.id,
            kind: "TERMS_ACCEPTED",
            source: "join",
            ip: consentIp,
            termsVersion: TERMS_VERSION,
          },
          ...(marketingOptIn
            ? [{ customerId: created.id, kind: "MARKETING_OPT_IN" as const, source: "join", ip: consentIp }]
            : []),
        ],
      });
      return created;
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
