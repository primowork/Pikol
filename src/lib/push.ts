import webpush from "web-push";
import { prisma } from "./db";
import { APPROVAL_REQUEST_TIMEOUT_SECONDS } from "./config";

// חתימת VAPID מוגדרת פעם אחת בלבד (lazy) - נטען רק כשבאמת שולחים push,
// כדי שסביבת build/lint לא תדרוש את משתני הסביבה האלה. משתמשים רק כאן,
// לעולם לא ב-src/proxy.ts - זה רץ ב-Edge runtime (לכן jose נבחר שם),
// ו-web-push תלוי ב-Node crypto. route handlers רצים על Node כרגיל.
let configured = false;
function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    throw new Error("חסרים משתני הסביבה VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

/**
 * שולח Web Push לכל מכשירי הצוות הרשומים. כשל במכשיר בודד (Promise.allSettled)
 * לא חוסם את השאר. subscriptions עם endpoint שפג תוקף (404/410) נמחקים מה-DB.
 */
export async function sendApprovalPush(approvalRequestId: string, customerName: string) {
  ensureConfigured();

  const subscriptions = await prisma.pushSubscription.findMany();
  if (subscriptions.length === 0) return;

  const payload = JSON.stringify({
    approvalRequestId,
    title: `בקשת ניקוב - ${customerName}`,
    body: "לחצו לאישור או דחייה",
  });

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
        { TTL: APPROVAL_REQUEST_TIMEOUT_SECONDS, urgency: "high" }
      )
    )
  );

  const staleEndpoints: string[] = [];
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      const statusCode = (result.reason as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        staleEndpoints.push(subscriptions[index].endpoint);
      } else {
        console.error("שליחת Web Push נכשלה:", result.reason);
      }
    }
  });

  if (staleEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: staleEndpoints } } });
  }
}
