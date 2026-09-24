import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { pushSubscriptionSchema, pushUnsubscribeSchema } from "@/lib/validation";
import { handleApiError, ValidationError } from "@/lib/errors";

/** רישום מכשיר צוות ל-Web Push. staff בלבד. upsert לפי endpoint - מטפל גם ברענון דף וגם במכשיר שעובר בעלות בין חברי צוות. */
export async function POST(request: NextRequest) {
  try {
    const staff = await requireStaff();

    const body = await request.json().catch(() => null);
    const parsed = pushSubscriptionSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("בקשה לא תקינה");
    }
    const { endpoint, keys } = parsed.data.subscription;

    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { staffId: staff.sub, endpoint, p256dh: keys.p256dh, auth: keys.auth },
      update: { staffId: staff.sub, p256dh: keys.p256dh, auth: keys.auth },
    });

    return NextResponse.json({ id: subscription.id }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

/** ביטול רישום. staff בלבד, מוגבל למכשירים של הצוות המחובר עצמו. */
export async function DELETE(request: NextRequest) {
  try {
    const staff = await requireStaff();

    const body = await request.json().catch(() => null);
    const parsed = pushUnsubscribeSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("בקשה לא תקינה");
    }

    await prisma.pushSubscription.deleteMany({
      where: { endpoint: parsed.data.endpoint, staffId: staff.sub },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
