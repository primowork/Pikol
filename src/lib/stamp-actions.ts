import type { Prisma } from "@prisma/client";
import { STAMP_COOLDOWN_SECONDS, STAMPS_REQUIRED } from "./config";
import { CooldownError, NotFoundError, ValidationError } from "./errors";

/**
 * הלוגיקה הביטחונית המשותפת להוספת ניקוב - קרואה גם מ-POST /api/stamps
 * (סריקה/חיפוש בדשבורד) וגם מ-POST /api/approval-requests/[id]/approve
 * (אישור מה-Web Push). staffId חייב תמיד להגיע מ-requireStaff() אצל הקורא -
 * הפונקציה הזו לא מקבלת ולא סומכת על staffId מגוף בקשה. חייבת לרוץ בתוך
 * prisma.$transaction קיים (tx) - האחריות על הקורא.
 */
export async function addStampForCustomer(
  tx: Prisma.TransactionClient,
  customerId: string,
  staffId: string,
  quantity: number = 1
) {
  const customer = await tx.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    throw new NotFoundError("לקוח לא נמצא");
  }

  const cooldownStart = new Date(Date.now() - STAMP_COOLDOWN_SECONDS * 1000);
  const recentStamp = await tx.stampEvent.findFirst({
    where: { customerId, type: "STAMP", createdAt: { gte: cooldownStart } },
    orderBy: { createdAt: "desc" },
  });
  if (recentStamp) {
    const elapsedMs = Date.now() - recentStamp.createdAt.getTime();
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((STAMP_COOLDOWN_SECONDS * 1000 - elapsedMs) / 1000)
    );
    throw new CooldownError(retryAfterSeconds);
  }

  const updatedCustomer = await tx.customer.update({
    where: { id: customerId },
    data: { currentStamps: { increment: quantity } },
  });
  const event = await tx.stampEvent.create({
    data: { type: "STAMP", customerId, staffId, quantity },
  });
  return { customer: updatedCustomer, event };
}

/**
 * הלוגיקה הביטחונית המשותפת למימוש פרס - קרואה גם מ-POST /api/stamps
 * (מימוש ידני דרך CustomerActionPanel) וגם מ-POST /api/approval-requests/[id]/approve
 * (אישור בקשת מימוש מהלקוח). staffId חייב תמיד להגיע מ-requireStaff() אצל
 * הקורא. מעדיף לצרוך בונוס יום הולדת קודם (bonusRewardsAvailable) - זו
 * מתנה בלי קשר למחזור הניקובים, ולא אמור "לעלות" ללקוח מהניקובים שכבר
 * צבר; רק אם אין בונוס זמין חוזרים לסמנטיקה הרגילה: מפחית בדיוק
 * STAMPS_REQUIRED (לא מאפס ל-0 - תומך בעודף), לא מגביל למספר "סבבים".
 */
export async function redeemForCustomer(
  tx: Prisma.TransactionClient,
  customerId: string,
  staffId: string
) {
  const customer = await tx.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    throw new NotFoundError("לקוח לא נמצא");
  }

  const hasBonusReward = customer.bonusRewardsAvailable > 0;
  if (!hasBonusReward && customer.currentStamps < STAMPS_REQUIRED) {
    throw new ValidationError("אין מספיק ניקובים למימוש הפרס");
  }

  const updatedCustomer = await tx.customer.update({
    where: { id: customerId },
    data: hasBonusReward
      ? { bonusRewardsAvailable: { decrement: 1 }, rewardsEarned: { increment: 1 } }
      : { currentStamps: { decrement: STAMPS_REQUIRED }, rewardsEarned: { increment: 1 } },
  });
  const event = await tx.stampEvent.create({
    data: { type: "REDEEM", customerId, staffId },
  });
  return { customer: updatedCustomer, event };
}
