import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { pushSubscriptionSchema, pushUnsubscribeSchema } from "@/lib/validation";
import { handleApiError, NotFoundError, ValidationError } from "@/lib/errors";

/**
 * רישום מכשיר לקוח ל-Web Push (opt-in) - ציבורי, מזוהה ע"י ה-id
 * הבלתי-נחוש בנתיב (בדיוק כמו GET /api/customers/[id]), לא session.
 * upsert לפי endpoint - מטפל גם ברענון דף וגם במעבר בין לקוחות באותו
 * מכשיר (למשל מכשיר משפחתי משותף).
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

    const subscription = await prisma.customerPushSubscription.upsert({
      where: { endpoint },
      create: { customerId: id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
      update: { customerId: id, p256dh: keys.p256dh, auth: keys.auth },
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
