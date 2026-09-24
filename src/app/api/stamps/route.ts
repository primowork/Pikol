import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { stampActionSchema } from "@/lib/validation";
import { STAMPS_REQUIRED } from "@/lib/config";
import { handleApiError, ValidationError, NotFoundError } from "@/lib/errors";
import { addStampForCustomer } from "@/lib/stamp-actions";

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
      const customer = await tx.customer.findUnique({ where: { id: customerId } });
      if (!customer) {
        throw new NotFoundError("לקוח לא נמצא");
      }

      if (action === "STAMP") {
        return addStampForCustomer(tx, customerId, staff.sub);
      }

      // action === "REDEEM"
      if (customer.currentStamps < STAMPS_REQUIRED) {
        throw new ValidationError("אין מספיק ניקובים למימוש הפרס");
      }

      const updatedCustomer = await tx.customer.update({
        where: { id: customerId },
        data: {
          currentStamps: { decrement: STAMPS_REQUIRED },
          rewardsEarned: { increment: 1 },
        },
      });
      const event = await tx.stampEvent.create({
        data: { type: "REDEEM", customerId, staffId: staff.sub },
      });
      return { customer: updatedCustomer, event };
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
        createdAt: event.createdAt,
        customer: event.customer,
        staff: event.staff,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
