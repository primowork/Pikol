import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { pushSubscriptionSchema, pushUnsubscribeSchema } from "@/lib/validation";
import { getConsentIp, setMarketingConsent } from "@/lib/consent";
import { handleApiError, NotFoundError, ValidationError } from "@/lib/errors";

/**
 * האם המכשיר הזה (לפי endpoint) רשום לשידורים של הלקוח הזה. NotificationSubscribe
 * שואל את זה בטעינה, כי לדפדפן יש מינוי push אחד לכל האתר (service worker
 * יחיד) - מינוי שנוצר בדשבורד הצוות לא אומר שהמכשיר רשום גם כלקוח.
 *
 * נחשב רשום רק אם הלקוח גם אישר דיוור: שידורים נשלחים רק למי שאישר
 * (src/lib/push.ts), ומינוי ישן בלי הסכמה צריך להציג שוב את הכפתור -
 * לחיצה עליו רושמת את ההסכמה.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const endpoint = request.nextUrl.searchParams.get("endpoint")?.trim();
    if (!endpoint) {
      throw new ValidationError("endpoint חסר");
    }

    const subscription = await prisma.customerPushSubscription.findFirst({
      where: { endpoint, customerId: id, customer: { marketingOptIn: true } },
      select: { id: true },
    });

    return NextResponse.json({ subscribed: subscription !== null });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * רישום מכשיר לקוח ל-Web Push (opt-in) - ציבורי, מזוהה ע"י ה-id
 * הבלתי-נחוש בנתיב (בדיוק כמו GET /api/customers/[id]), לא session.
 * upsert לפי endpoint - מטפל גם ברענון דף וגם במעבר בין לקוחות באותו
 * מכשיר (למשל מכשיר משפחתי משותף).
 *
 * הלחיצה על "הפעלת התראות על מבצעים ועדכונים", עם טקסט ההסכמה שמתחת
 * לכפתור, היא הסכמה מפורשת לדיוור - נרשמת יחד עם המינוי ביומן ההסכמות.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new NotFoundError("לקוח לא נמצא");
    }

    const body = await request.json().catch(() => null);
    const parsed = pushSubscriptionSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("בקשה לא תקינה");
    }
    const { endpoint, keys } = parsed.data.subscription;
    const { replacesEndpoint } = parsed.data;

    const subscription = await prisma.$transaction(async (tx) => {
      // המכשיר נרשם מחדש אחרי שמפתח ה-VAPID התחלף: ההרשמה הישנה שלו לא תעבוד
      // יותר. מוחקים רק אם היא של אותו לקוח, כדי שאי אפשר יהיה למחוק לאחרים.
      if (replacesEndpoint && replacesEndpoint !== endpoint) {
        await tx.customerPushSubscription.deleteMany({ where: { endpoint: replacesEndpoint, customerId: id } });
      }
      const saved = await tx.customerPushSubscription.upsert({
        where: { endpoint },
        create: { customerId: id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
        update: { customerId: id, p256dh: keys.p256dh, auth: keys.auth },
      });
      await setMarketingConsent(
        { customerId: id, optIn: true, source: "notifications", ip: getConsentIp(request) },
        tx
      );
      return saved;
    });

    return NextResponse.json({ id: subscription.id }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

/** ביטול רישום - מוגבל למכשירים ששייכים ללקוח הזה בלבד. */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const body = await request.json().catch(() => null);
    const parsed = pushUnsubscribeSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("בקשה לא תקינה");
    }

    await prisma.customerPushSubscription.deleteMany({
      where: { endpoint: parsed.data.endpoint, customerId: id },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
