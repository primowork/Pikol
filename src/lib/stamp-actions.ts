import type { Prisma } from "@prisma/client";
import { STAMP_COOLDOWN_SECONDS } from "./config";
import { CooldownError, NotFoundError } from "./errors";

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
  staffId: string
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
    data: { currentStamps: { increment: 1 } },
  });
  const event = await tx.stampEvent.create({
    data: { type: "STAMP", customerId, staffId },
  });
  return { customer: updatedCustomer, event };
}
