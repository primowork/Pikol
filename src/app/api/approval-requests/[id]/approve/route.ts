import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { APPROVAL_REQUEST_TIMEOUT_SECONDS } from "@/lib/config";
import { addStampForCustomer, redeemForCustomer } from "@/lib/stamp-actions";
import { handleApiError, ValidationError, NotFoundError, ApprovalConflictError } from "@/lib/errors";

/**
 * staff מאשר בקשה - זו הפעולה שבפועל מוסיפה את הניקוב (או מממשת פרס, או
 * מאשרת כניסה לכרטיס מטלפון חדש ב-LOGIN). נקראת גם מלחיצת
 * "אישור" ישירות בהתראת ה-Web Push (מה-service worker, credentials:'include')
 * וגם מ-PendingApprovalsList בדשבורד. staffId נגזר אך ורק מ-requireStaff().
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireStaff();
    const { id } = await params;

    const result = await prisma.$transaction(async (tx) => {
      const approvalRequest = await tx.approvalRequest.findUnique({ where: { id } });
      if (!approvalRequest) {
        throw new NotFoundError("בקשת אישור לא נמצאה");
      }

      const timeoutStart = new Date(Date.now() - APPROVAL_REQUEST_TIMEOUT_SECONDS * 1000);
      // תפיסה אטומית: ה-where עם status:PENDING הוא ה-guard נגד race של
      // שני חברי צוות שמאשרים בו-זמנית - רק אחד יתפוס (count===1).
      const claimed = await tx.approvalRequest.updateMany({
        where: { id, status: "PENDING", createdAt: { gte: timeoutStart } },
        data: { status: "APPROVED", respondedAt: new Date(), respondedByStaffId: staff.sub },
      });

      if (claimed.count === 0) {
        if (approvalRequest.status === "PENDING") {
          throw new ValidationError(
            approvalRequest.kind === "LOGIN"
              ? "הבקשה פגה תוקף, בקשו מהלקוח להזין שוב את המספר"
              : "הבקשה פגה תוקף, בקשו מהלקוח לסרוק שוב"
          );
        }
        throw new ApprovalConflictError();
      }

      if (approvalRequest.kind === "LOGIN") {
        // כניסה מטלפון חדש: האישור עצמו (status APPROVED) הוא כל הפעולה -
        // "/join" רואה אותו ב-polling ומקבל את מזהה הכרטיס. אין ניקוב.
        const customer = await tx.customer.findUnique({ where: { id: approvalRequest.customerId } });
        if (!customer) {
          throw new NotFoundError("לקוח לא נמצא");
        }
        return { customer };
      }

      return approvalRequest.kind === "REDEEM"
        ? redeemForCustomer(tx, approvalRequest.customerId, staff.sub)
        : addStampForCustomer(tx, approvalRequest.customerId, staff.sub, approvalRequest.quantity);
    });

    return NextResponse.json({
      approvalRequest: { id, status: "APPROVED" },
      customer: {
        id: result.customer.id,
        name: result.customer.name,
        currentStamps: result.customer.currentStamps,
        rewardsEarned: result.customer.rewardsEarned,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
