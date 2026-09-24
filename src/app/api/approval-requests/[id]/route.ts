import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { APPROVAL_REQUEST_TIMEOUT_SECONDS } from "@/lib/config";
import { handleApiError, NotFoundError } from "@/lib/errors";
import type { ApprovalStatus } from "@/types";

/**
 * סטטוס בקשת אישור בודדת - ציבורי, ל-polling מ-"/scan". EXPIRED נגזר
 * לפי גיל הרשומה בכל קריאה, לעולם לא נכתב ל-DB (פחות סיכון race, אין
 * כתיבה בנתיב שנקרא הרבה).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const request = await prisma.approvalRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundError("בקשת אישור לא נמצאה");
    }

    const isStale = Date.now() - request.createdAt.getTime() > APPROVAL_REQUEST_TIMEOUT_SECONDS * 1000;
    const status: ApprovalStatus = request.status === "PENDING" && isStale ? "EXPIRED" : request.status;

    return NextResponse.json({ id: request.id, status, createdAt: request.createdAt });
  } catch (err) {
    return handleApiError(err);
  }
}
