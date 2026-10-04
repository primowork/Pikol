import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { ForbiddenError, handleApiError, NotFoundError } from "@/lib/errors";
import { STAMPS_REQUIRED } from "@/lib/config";
import { grantBirthdayRewardIfDue } from "@/lib/birthday-reward";

/**
 * מצב הכרטיס - ציבורי (ה-id הבלתי-נחוש הוא הסוד, כמו קישור תשלום). לא
 * מחזיר מספר טלפון, כדי לא לחשוף מידע אישי דרך URL ששותף בטעות.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await grantBirthdayRewardIfDue(id);

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new NotFoundError("לקוח לא נמצא");
    }

    return NextResponse.json({
      id: customer.id,
      name: customer.name,
      currentStamps: customer.currentStamps,
      stampsRequired: STAMPS_REQUIRED,
      rewardsAvailable: customer.currentStamps >= STAMPS_REQUIRED || customer.bonusRewardsAvailable > 0,
      rewardsEarned: customer.rewardsEarned,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * ביטול חברות לבקשת הלקוח (תקנון, פרק 9) - בעל העסק בלבד. הלקוח וכל מה
 * שקשור אליו נמחקים (ניקובים, בקשות, התראות, יומן הסכמות - cascade). לפני
 * כן נשמר ב-DeletedCustomer רק מספר הטלפון והעתק של יומן ההסכמות, כדי
 * שבית הקפה יוכל להראות שהייתה הסכמה אם תעלה טענה על דיוור.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireStaff();
    if (staff.role !== "OWNER") {
      throw new ForbiddenError("רק בעל העסק יכול למחוק כרטיס");
    }
    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id },
        include: { consentEvents: { orderBy: { createdAt: "asc" } } },
      });
      if (!customer) {
        throw new NotFoundError("לקוח לא נמצא");
      }

      await tx.deletedCustomer.create({
        data: {
          phone: customer.phone,
          customerSince: customer.createdAt,
          deletedByStaffId: staff.sub,
          consentHistory: customer.consentEvents.map((event) => ({
            kind: event.kind,
            source: event.source,
            ip: event.ip,
            termsVersion: event.termsVersion,
            createdAt: event.createdAt.toISOString(),
          })),
        },
      });
      await tx.customer.delete({ where: { id } });
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
