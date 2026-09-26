import webpush from "web-push";
import { prisma } from "./db";
import { APPROVAL_REQUEST_TIMEOUT_SECONDS } from "./config";
import { PushNotConfiguredError } from "./errors";
import { getVapidSubject } from "./business-settings";

// חתימת VAPID מוגדרת מחדש רק כש-subject בפועל משתנה (לא flag בוליאני קבוע) -
// כי subject יכול עכשיו להגיע מ-DB ולהשתנות בזמן ריצה דרך /staff/settings,
// בלי restart לשרת. המפתחות עצמם (public/private) נשארים אך ורק משתני
// סביבה בכוונה: אלה זהות קריפטוגרפית שכל ה-subscriptions הקיימים תלויים
// בה - שינוי שלהם דרך UI היה שובר בשקט את כל ההרשמות הקיימות. לא ב-
// src/proxy.ts - זה רץ ב-Edge runtime (לכן jose נבחר שם), ו-web-push
// תלוי ב-Node crypto. route handlers רצים על Node כרגיל.
let configuredSubject: string | null = null;
async function ensureConfigured() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = await getVapidSubject();
  if (!publicKey || !privateKey || !subject) {
    throw new PushNotConfiguredError();
  }
  if (configuredSubject === subject) return;
  // setVapidDetails מוודא גם פורמט (אורך המפתח אחרי פענוח base64url,
  // subject שהוא URL תקין וכו'), לא רק שהערכים קיימים - ערך נוכח אבל
  // פגום זורק כאן כל קריאה, לנצח, כי configuredSubject אף פעם לא מתעדכן.
  // לוכדים כדי שההודעה הספציפית (למשל "אורך מפתח שגוי") תגיע ל-staff
  // במקום "משהו השתבש" גנרי.
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
  } catch (err) {
    throw new PushNotConfiguredError(err instanceof Error ? err.message : undefined);
  }
  configuredSubject = subject;
}

/**
 * שולח Web Push לכל מכשירי הצוות הרשומים. כשל במכשיר בודד (Promise.allSettled)
 * לא חוסם את השאר. subscriptions עם endpoint שפג תוקף (404/410) נמחקים מה-DB.
 */
export async function sendApprovalPush(
  approvalRequestId: string,
  customerName: string,
  kind: "STAMP" | "REDEEM",
  quantity: number
) {
  await ensureConfigured();

  const subscriptions = await prisma.pushSubscription.findMany();
  if (subscriptions.length === 0) return;

  // הכמות מוצגת במפורש בכותרת - כדי ש-staff יראה בדיוק כמה מבוקש ולא
  // יאשר "בעיוורון" בקשה מנופחת. יחיד/רבים בעברית: "ניקוב אחד" / "N ניקובים".
  // עבור מימוש פרס (REDEEM) הכמות לא רלוונטית - כותרת ייעודית במקום.
  const title =
    kind === "REDEEM"
      ? `בקשת מימוש פרס - ${customerName}`
      : `בקשת ${quantity === 1 ? "ניקוב אחד" : `${quantity} ניקובים`} - ${customerName}`;
  const payload = JSON.stringify({
    kind: "approval",
    approvalRequestId,
    title,
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

/**
 * שידור ידני מהצוות לכל הלקוחות שנרשמו ל-Web Push (opt-in). בלי כפתורי
 * פעולה - זו הודעה פשוטה, לא בקשה לאישור/דחייה (ראו kind:"broadcast"
 * ב-sw.js). אותו דפוס allSettled + ניקוי endpoint שפג תוקף כמו למעלה.
 */
export async function sendCustomerBroadcast(title: string, body: string): Promise<{ sentCount: number }> {
  await ensureConfigured();

  const subscriptions = await prisma.customerPushSubscription.findMany();
  if (subscriptions.length === 0) return { sentCount: 0 };

  const payload = JSON.stringify({ kind: "broadcast", title, body });

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
        { TTL: 60 * 60 * 24, urgency: "normal" }
      )
    )
  );

  const staleEndpoints: string[] = [];
  let sentCount = 0;
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      sentCount += 1;
      return;
    }
    const statusCode = (result.reason as { statusCode?: number })?.statusCode;
    if (statusCode === 404 || statusCode === 410) {
      staleEndpoints.push(subscriptions[index].endpoint);
    } else {
      console.error("שליחת שידור ללקוחות נכשלה:", result.reason);
    }
  });

  if (staleEndpoints.length > 0) {
    await prisma.customerPushSubscription.deleteMany({ where: { endpoint: { in: staleEndpoints } } });
  }

  return { sentCount };
}
