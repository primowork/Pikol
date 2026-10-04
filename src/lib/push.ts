import webpush from "web-push";
import { prisma } from "./db";
import { APPROVAL_REQUEST_TIMEOUT_SECONDS } from "./config";
import { PushNotConfiguredError } from "./errors";
import { getBroadcastSenderLine, getVapidSubject } from "./business-settings";
import { formatCustomerBroadcast } from "./broadcast-format";
import type { ApprovalRequestKind, BroadcastAudience, CustomerBroadcastResult } from "@/types";

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
  kind: ApprovalRequestKind,
  quantity: number
) {
  await ensureConfigured();

  const subscriptions = await prisma.pushSubscription.findMany();
  if (subscriptions.length === 0) return;

  // הכמות מוצגת במפורש בכותרת - כדי ש-staff יראה בדיוק כמה מבוקש ולא
  // יאשר "בעיוורון" בקשה מנופחת. יחיד/רבים בעברית: "ניקוב אחד" / "N ניקובים".
  // עבור מימוש פרס (REDEEM) הכמות לא רלוונטית - כותרת ייעודית במקום.
  // LOGIN: כניסה לכרטיס מטלפון חדש - הצוות צריך לוודא שזה באמת הלקוח.
  const title =
    kind === "REDEEM"
      ? `בקשת מימוש פרס - ${customerName}`
      : kind === "LOGIN"
        ? `כניסה לכרטיס מטלפון חדש - ${customerName}`
        : `בקשת ${quantity === 1 ? "ניקוב אחד" : `${quantity} ניקובים`} - ${customerName}`;
  const payload = JSON.stringify({
    kind: "approval",
    approvalRequestId,
    title,
    body: kind === "LOGIN" ? "אשרו רק אם זה באמת הלקוח שעומד מולכם" : "לחצו לאישור או דחייה",
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
 * כמה לקוחות (ייחודיים, לא מכשירים) יקבלו שידור אם יישלח עכשיו - לתצוגה
 * המקדימה בדשבורד. ensureConfigured קודם, כדי ש-VAPID שבור יתגלה כבר
 * בפתיחת חלון השידור ולא רק אחרי שבעל העסק ניסח ולחץ "שליחה".
 *
 * שידור הוא דבר פרסומת, ולכן נשלח רק למי שאישר דיוור (marketingOptIn).
 * withoutConsentCount הם לקוחות שהפעילו התראות בלי לאשר, כדי שבעל העסק
 * יבין למה הם לא נספרים.
 */
export async function getCustomerBroadcastAudience(): Promise<BroadcastAudience> {
  await ensureConfigured();

  const [withConsent, withoutConsent, senderLine] = await Promise.all([
    prisma.customerPushSubscription.findMany({
      where: { customer: { marketingOptIn: true } },
      distinct: ["customerId"],
      select: { customerId: true },
    }),
    prisma.customerPushSubscription.findMany({
      where: { customer: { marketingOptIn: false } },
      distinct: ["customerId"],
      select: { customerId: true },
    }),
    getBroadcastSenderLine(),
  ]);
  return { customerCount: withConsent.length, withoutConsentCount: withoutConsent.length, senderLine };
}

/** תקציר קצר של כישלון שליחה - תשובת שירות ה-push (body) אומרת הכי הרבה. */
function describePushFailure(reason: unknown): string {
  const { statusCode, body, message } = (reason ?? {}) as {
    statusCode?: number;
    body?: unknown;
    message?: string;
  };
  const detail = (typeof body === "string" && body.trim()) || message || "שגיאה לא ידועה";
  const text = statusCode ? `${statusCode}: ${detail}` : detail;
  return text.replace(/\s+/g, " ").trim().slice(0, 200);
}

interface CustomerBroadcastInput {
  title: string;
  body: string;
  /** מי שלח - תמיד מה-session, לעולם לא מגוף הבקשה. */
  staffId: string;
  /** מתי השולח אישר שההודעה יוצאת בשם העסק ובאחריותו. */
  acknowledgedAt: Date;
}

/**
 * שידור ידני מהצוות ללקוחות שאישרו דיוור (marketingOptIn) והפעילו התראות.
 * כפתור הפעולה היחיד בהתראה הוא הסרה מרשימת התפוצה (ראו kind:"broadcast"
 * ב-sw.js), ולכן ה-payload של כל מכשיר כולל את ה-customerId שלו. אותו
 * דפוס allSettled + ניקוי endpoint שפג תוקף כמו למעלה.
 *
 * הנוסח שנשלח ונשמר ביומן (Broadcast) הוא הסופי, עם "פרסומת", שם העסק
 * ודרך ההסרה (formatCustomerBroadcast). שורת היומן נוצרת לפני השליחה,
 * כך שגם שליחה שנקטעה באמצע משאירה תיעוד של מי שלח ומה.
 *
 * מחזירה פירוט ולא רק מספר: "נשלח ל-0" יכול לנבוע מזה שאין מנויים בכלל,
 * מדחייה של שירות ה-push (למשל 403 כשמפתחות VAPID הוחלפו אחרי שהלקוחות
 * נרשמו), או ממנויים שפגו - ובלי הפירוט אי אפשר להבדיל ביניהם מהדשבורד.
 * דחייה (לא 404/410) לא נמחקת בכוונה: מפתח פרטי שהוגדר לא נכון היה
 * מוחק ככה את ההרשמות של כל הלקוחות בבת אחת.
 */
export async function sendCustomerBroadcast(input: CustomerBroadcastInput): Promise<CustomerBroadcastResult> {
  await ensureConfigured();

  const [subscriptions, senderLine] = await Promise.all([
    prisma.customerPushSubscription.findMany({ where: { customer: { marketingOptIn: true } } }),
    getBroadcastSenderLine(),
  ]);
  const message = formatCustomerBroadcast(input.title, input.body, senderLine);

  const broadcast = await prisma.broadcast.create({
    data: {
      staffId: input.staffId,
      title: message.title,
      body: message.body,
      audienceCount: new Set(subscriptions.map((sub) => sub.customerId)).size,
      sentCount: 0,
      failedCount: 0,
      removedCount: 0,
      acknowledgedAt: input.acknowledgedAt,
    },
  });

  if (subscriptions.length === 0) {
    return { sentCount: 0, failedCount: 0, removedCount: 0, failureReason: null };
  }

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ kind: "broadcast", ...message, customerId: sub.customerId }),
        { TTL: 60 * 60 * 24, urgency: "normal" }
      )
    )
  );

  const staleEndpoints: string[] = [];
  const reachedCustomerIds = new Set<string>();
  let failedCount = 0;
  let failureReason: string | null = null;
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      reachedCustomerIds.add(subscriptions[index].customerId);
      return;
    }
    const statusCode = (result.reason as { statusCode?: number })?.statusCode;
    if (statusCode === 404 || statusCode === 410) {
      staleEndpoints.push(subscriptions[index].endpoint);
    } else {
      failedCount += 1;
      failureReason ??= describePushFailure(result.reason);
      console.error("שליחת שידור ללקוחות נכשלה:", result.reason);
    }
  });

  if (staleEndpoints.length > 0) {
    await prisma.customerPushSubscription.deleteMany({ where: { endpoint: { in: staleEndpoints } } });
  }

  const result = {
    sentCount: reachedCustomerIds.size,
    failedCount,
    removedCount: staleEndpoints.length,
    failureReason,
  };
  await prisma.broadcast.update({
    where: { id: broadcast.id },
    data: { sentCount: result.sentCount, failedCount: result.failedCount, removedCount: result.removedCount },
  });
  return result;
}
