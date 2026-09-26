import { prisma } from "./db";

const SETTINGS_ID = "singleton";

/**
 * ברירת מחדל - הטקסט המקורי שהוזן ידנית. משמש כל עוד לא נשמר עדכון
 * דרך /staff/settings (אין שורה ב-DB עדיין) - לא דורש מיגרציית seed.
 */
export const DEFAULT_ABOUT_US_TEXT = `פיקולו — קטן באיטלקית — נולד מאהבה לקפה ומהרצון לפתוח מקום קטן, פשוט ושלי.

אחרי עשור בתחום הקפה, בין עבודה כבריסטה, ניהול בר וקלייה, חזרתי משירות המילואים בלי עבודה. במקום לחפש את הדבר הבא, החלטתי לפתוח את המקום שלי — קטן ולעניין, כמה צעדים מכיכר דיזנגוף.

הקפה הוא הלב של המקום. אני קולה את הקפה בבית הקלייה רות, ועובד עם 100% ערביקה בקלייה בינונית-פלוס, לצד קפה אתיופי וקולומביאני. אני שומר על מלאי קטן ומפוקח כדי שהקפה יהיה תמיד טרי.

לצד הקפה תמצאו מאפים וכריכים טריים ממייזון קייזר.

בסוף, פיקולו הוא בדיוק מה שהשם שלו אומר: מקום קטן, עם הרבה תשומת לב למה שנכנס לכוס.`;

export async function getAboutUsText(): Promise<string> {
  const settings = await prisma.businessSettings.findUnique({ where: { id: SETTINGS_ID } });
  return settings?.aboutUsText ?? DEFAULT_ABOUT_US_TEXT;
}

export async function setAboutUsText(aboutUsText: string): Promise<void> {
  await prisma.businessSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, aboutUsText },
    update: { aboutUsText },
  });
}

/**
 * כתובת ה-subject של VAPID (דרישת תקן Web Push - ראו src/lib/push.ts) -
 * "כתובת קשר" טכנית לשירותי ה-push, לא מוצגת ללקוחות. ברירת המחדל היא
 * משתנה הסביבה VAPID_SUBJECT (כפי שהיה לפני שהתווסף כאן) - עדיפות לערך
 * מה-DB אם staff שמר אחד דרך /staff/settings.
 */
export async function getVapidSubject(): Promise<string | null> {
  const settings = await prisma.businessSettings.findUnique({ where: { id: SETTINGS_ID } });
  return settings?.vapidSubject || process.env.VAPID_SUBJECT || null;
}

export async function setVapidSubject(vapidSubject: string): Promise<void> {
  await prisma.businessSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, vapidSubject },
    update: { vapidSubject },
  });
}
