import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { pushSubscriptionSchema, pushUnsubscribeSchema } from "@/lib/validation";
import { handleApiError, ValidationError } from "@/lib/errors";

/**
 * האם המכשיר הזה (לפי endpoint) רשום להתראות בקשות ניקוב. staff בלבד. לא
 * מסונן לפי staffId: push לבקשת אישור יוצא לכל שורות הצוות, אז כל שורה עם
 * ה-endpoint הזה אומרת שהמכשיר יקבל את ההתראות.
 */
export async function GET(request: NextRequest) {
  try {
    await requireStaff();

    const endpoint = request.nextUrl.searchParams.get("endpoint")?.trim();
    if (!endpoint) {
      throw new ValidationError("endpoint חסר");
    }

    const subscription = await prisma.pushSubscription.findUnique({
      where: { endpoint },
      select: { id: true },
    });

    return NextResponse.json({ subscribed: subscription !== null });
  } catch (err) {
    return handleApiError(err);
  }
}

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
