import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { handleApiError, NotFoundError, ApprovalConflictError } from "@/lib/errors";

/**
 * staff דוחה בקשה - הכפתור השני בהתראת ה-Web Push. עדכון סטטוס יחיד
 * אטומי (אין $transaction רב-שלבים לתאם, בניגוד ל-approve).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireStaff();
    const { id } = await params;

    const claimed = await prisma.approvalRequest.updateMany({
      where: { id, status: "PENDING" },
      data: { status: "DECLINED", respondedAt: new Date(), respondedByStaffId: staff.sub },
    });

    if (claimed.count === 0) {
      const existing = await prisma.approvalRequest.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundError("בקשת אישור לא נמצאה");
      }
      throw new ApprovalConflictError();
    }

    return NextResponse.json({ approvalRequest: { id, status: "DECLINED" } });
  } catch (err) {
    return handleApiError(err);
  }
}
