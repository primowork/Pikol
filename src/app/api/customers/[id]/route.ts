import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, NotFoundError } from "@/lib/errors";
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
