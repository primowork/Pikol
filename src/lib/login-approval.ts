import { prisma } from "./db";
import { APPROVAL_REQUEST_COOLDOWN_SECONDS, APPROVAL_REQUEST_TIMEOUT_SECONDS } from "./config";
import { ApprovalRequestCooldownError } from "./errors";
import { sendApprovalPush } from "./push";

/**
 * כניסה לכרטיס קיים מטלפון חדש: מי שמזין ב-/join מספר שכבר רשום לא מקבל
 * את הכרטיס מיד, אלא בקשת אישור (LOGIN) שהצוות מאשר בדוכן - כמו בקשת
 * ניקוב. כך מי שרק יודע מספר טלפון של לקוח לא נכנס לכרטיס שלו מהבית.
 *
 * אותם כללים כמו בבקשות מ-/scan: בקשה שעדיין ממתינה מוחזרת שוב (רענון או
 * לחיצה כפולה), ובקשה חדשה מותרת רק אחרי הקירור, כדי שלא יציפו את הצוות
 * בהתראות. בודקים רק בקשות LOGIN - בקשת ניקוב שממתינה מהמכשיר הישן לא
 * רלוונטית למכשיר החדש.
 */
export async function requestLoginApproval(customer: { id: string; name: string }): Promise<string> {
  const recent = await prisma.approvalRequest.findFirst({
    where: { customerId: customer.id, kind: "LOGIN" },
    orderBy: { createdAt: "desc" },
  });

  if (recent) {
    const ageSeconds = (Date.now() - recent.createdAt.getTime()) / 1000;
    if (recent.status === "PENDING" && ageSeconds < APPROVAL_REQUEST_TIMEOUT_SECONDS) {
      return recent.id;
    }
    if (ageSeconds < APPROVAL_REQUEST_COOLDOWN_SECONDS) {
      throw new ApprovalRequestCooldownError(Math.ceil(APPROVAL_REQUEST_COOLDOWN_SECONDS - ageSeconds));
    }
  }

  const approvalRequest = await prisma.approvalRequest.create({
    data: { customerId: customer.id, kind: "LOGIN" },
  });

  try {
    await sendApprovalPush(approvalRequest.id, customer.name, "LOGIN", 1);
  } catch (err) {
    // הבקשה נשמרה; הפופ-אפ בדשבורד (PendingApprovalsList) מציג אותה גם בלי push.
    console.error("שליחת Web Push לבקשת כניסה נכשלה, הבקשה עצמה נשמרה:", err);
  }

  return approvalRequest.id;
}
