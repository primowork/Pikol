import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { approvalRequestCreateSchema } from "@/lib/validation";
import {
  APPROVAL_REQUEST_COOLDOWN_SECONDS,
  APPROVAL_REQUEST_TIMEOUT_SECONDS,
  STAMPS_REQUIRED,
} from "@/lib/config";
import { handleApiError, ValidationError, NotFoundError, ApprovalRequestCooldownError } from "@/lib/errors";
import { sendApprovalPush } from "@/lib/push";

/**
 * לקוח יוצר בקשת אישור אחרי שסרק את ה-QR הקבוע בדוכן ("/scan"). ציבורי -
 * לא מוסיף ניקוב/ממש פרס בעצמו, רק "מבקש" ושולח Web Push לצוות. הפעולה
 * בפועל קורית רק ב-POST .../[id]/approve, שדורש session מאומת של staff.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = approvalRequestCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("בקשה לא תקינה");
    }
    const { customerId, kind, quantity } = parsed.data;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, name: true, currentStamps: true },
    });
    if (!customer) {
      throw new NotFoundError("לקוח לא נמצא");
    }

    if (kind === "REDEEM" && customer.currentStamps < STAMPS_REQUIRED) {
      throw new ValidationError("אין מספיק ניקובים למימוש הפרס");
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
        // את אותה בקשה הקיימת, לא שגיאה מבלבלת. kind/quantity מוחזרים גם
        // כאן כדי ש-"/scan" ידע איזו בקשה בדיוק ממתינה גם אחרי רענון.
        return NextResponse.json({ approvalRequestId: recent.id, kind: recent.kind, quantity: recent.quantity });
      }
      if (ageSeconds < APPROVAL_REQUEST_COOLDOWN_SECONDS) {
        throw new ApprovalRequestCooldownError(Math.ceil(APPROVAL_REQUEST_COOLDOWN_SECONDS - ageSeconds));
      }
    }

    const approvalRequest = await prisma.approvalRequest.create({
      data: { customerId, kind, quantity },
    });

    try {
      await sendApprovalPush(approvalRequest.id, customer.name, kind, quantity);
    } catch (err) {
      // הבקשה כבר נשמרה בהצלחה - כשל בשליחת ה-push (VAPID לא מוגדר,
      // תקלת רשת וכו') לא אמור להיכשל ללקוח. PendingApprovalsList
      // בדשבורד הוא בדיוק ה-fallback הקיים למקרה שההתראה לא מגיעה.
      console.error("שליחת Web Push לבקשת אישור נכשלה, הבקשה עצמה נשמרה:", err);
    }

    return NextResponse.json(
      { approvalRequestId: approvalRequest.id, kind: approvalRequest.kind, quantity: approvalRequest.quantity },
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
        kind: request.kind,
        quantity: request.quantity,
        customer: request.customer,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
