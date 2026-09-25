import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { stampActionSchema } from "@/lib/validation";
import { handleApiError, ValidationError } from "@/lib/errors";
import { addStampForCustomer, redeemForCustomer } from "@/lib/stamp-actions";

/**
 * הפעולה הביטחונית המרכזית של כל המערכת: הוספה/מימוש ניקוב. staff בלבד.
 *
 * staffId לעולם לא מגיע מגוף הבקשה - הוא נגזר אך ורק מ-requireStaff(),
 * כלומר מה-session המאומת. גם אם מישהו ישלח staffId מזויף ב-body, הוא
 * פשוט לא נקרא בקוד הזה.
 */
export async function POST(request: NextRequest) {
  try {
    const staff = await requireStaff();

    const body = await request.json().catch(() => null);
    const parsed = stampActionSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("בקשה לא תקינה");
    }
    const { customerId, action } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      if (action === "STAMP") {
        return addStampForCustomer(tx, customerId, staff.sub);
      }
      return redeemForCustomer(tx, customerId, staff.sub);
    });

    return NextResponse.json({
      customer: {
        id: result.customer.id,
        name: result.customer.name,
        currentStamps: result.customer.currentStamps,
        rewardsEarned: result.customer.rewardsEarned,
      },
      event: { type: result.event.type, createdAt: result.event.createdAt },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/** פיד הפעילות האחרונה בדשבורד הצוות - staff בלבד. */
export async function GET(request: NextRequest) {
  try {
    await requireStaff();

    const { searchParams } = new URL(request.url);
    const requestedLimit = Number(searchParams.get("limit"));
    const limit =
      Number.isFinite(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 100)
        : 20;

    const events = await prisma.stampEvent.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true } },
        staff: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      events: events.map((event) => ({
        id: event.id,
        type: event.type,
        quantity: event.quantity,
        createdAt: event.createdAt,
        customer: event.customer,
        staff: event.staff,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
