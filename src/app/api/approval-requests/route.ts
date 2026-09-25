import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { approvalRequestCreateSchema } from "@/lib/validation";
import { APPROVAL_REQUEST_COOLDOWN_SECONDS, APPROVAL_REQUEST_TIMEOUT_SECONDS } from "@/lib/config";
import { handleApiError, ValidationError, NotFoundError, ApprovalRequestCooldownError } from "@/lib/errors";
import { sendApprovalPush } from "@/lib/push";

/**
 * לקוח יוצר בקשת אישור אחרי שסרק את ה-QR הקבוע בדוכן ("/scan"). ציבורי -
 * לא מוסיף ניקוב בעצמו, רק "מבקש" אחד ושולח Web Push לצוות. ההוספה
 * בפועל קורית רק ב-POST .../[id]/approve, שדורש session מאומת של staff.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = approvalRequestCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("בקשה לא תקינה");
    }
    const { customerId, quantity } = parsed.data;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, name: true },
    });
    if (!customer) {
      throw new NotFoundError("לקוח לא נמצא");
    }

    const recent = await prisma.approvalRequest.findFirst({
      where: { customerId },
      orderBy: { createdAt: "desc" },
    });

    if (recent) {
      const ageSeconds = (Date.now() - recent.createdAt.getTime()) / 1000;
      const stillPending = recent.status === "PENDING" && ageSeconds < APPROVAL_REQUEST_TIMEOUT_SECONDS;
      if (stillPending) {
        // אידמפוטנטי בכוונה: רענון דף/סריקה כפולה מיד אחרי היצירה מחזירים
        // את אותה בקשה הקיימת, לא שגיאה מבלבלת. quantity מוחזר גם כאן
        // כדי ש-"/scan" ידע אילו כוסות להציג כ-pending גם אחרי רענון.
        return NextResponse.json({ approvalRequestId: recent.id, quantity: recent.quantity });
      }
      if (ageSeconds < APPROVAL_REQUEST_COOLDOWN_SECONDS) {
        throw new ApprovalRequestCooldownError(Math.ceil(APPROVAL_REQUEST_COOLDOWN_SECONDS - ageSeconds));
      }
    }

    const approvalRequest = await prisma.approvalRequest.create({
      data: { customerId, quantity },
    });

    await sendApprovalPush(approvalRequest.id, customer.name, quantity);

    return NextResponse.json(
      { approvalRequestId: approvalRequest.id, quantity: approvalRequest.quantity },
      { status: 201 }
    );
  } catch (err) {
    return handleApiError(err);
  }
}

/** רשימת בקשות ממתינות - fallback ויזואלי בדשבורד הצוות. staff בלבד. */
export async function GET() {
  try {
    await requireStaff();

    const timeoutStart = new Date(Date.now() - APPROVAL_REQUEST_TIMEOUT_SECONDS * 1000);
    const requests = await prisma.approvalRequest.findMany({
      where: { status: "PENDING", createdAt: { gte: timeoutStart } },
      orderBy: { createdAt: "asc" },
      include: { customer: { select: { id: true, name: true } } },
    });

    return NextResponse.json({
      requests: requests.map((request) => ({
        id: request.id,
        createdAt: request.createdAt,
        quantity: request.quantity,
        customer: request.customer,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
