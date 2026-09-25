import { z } from "zod";
import { STAMPS_REQUIRED } from "./config";

/**
 * טופס "כניסה/הצטרפות" חכם אחד ("/join"): תמיד שולח טלפון; שם אופציונלי -
 * הצעד הראשון שולח רק טלפון כדי לבדוק אם הלקוח כבר קיים, ורק אם לא
 * (needsName בתשובה) הצעד השני שולח גם שם ליצירת כרטיס חדש.
 */
export const joinSchema = z.object({
  name: z.string().trim().min(2, "השם קצר מדי").max(60, "השם ארוך מדי").optional(),
  phone: z.string().trim().min(7, "מספר הטלפון לא תקין").max(20, "מספר הטלפון לא תקין"),
});

/** התחברות צוות. */
export const loginSchema = z.object({
  username: z.string().trim().min(1, "יש להזין שם משתמש"),
  password: z.string().min(1, "יש להזין סיסמה"),
});

/** הוספת/מימוש ניקוב - הפעולה הביטחונית המרכזית. */
export const stampActionSchema = z.object({
  customerId: z.string().trim().min(1, "חסר מזהה לקוח"),
  action: z.enum(["STAMP", "REDEEM"]),
});

/**
 * יצירת בקשת אישור מ-"/scan" (לקוח סרק את ה-QR הקבוע בדוכן). quantity
 * הוא כמה ניקובים מבוקשים בפעם הזו (למשל שתי קפות באותה קנייה) - תקרה
 * קבועה של STAMPS_REQUIRED, לא תלוית-מצב (עודף כבר נתמך במערכת בלאו הכי).
 */
export const approvalRequestCreateSchema = z.object({
  customerId: z.string().trim().min(1, "חסר מזהה לקוח"),
  quantity: z.number().int().min(1, "כמות לא תקינה").max(STAMPS_REQUIRED, "כמות גבוהה מדי").default(1),
});

/** רישום מכשיר צוות ל-Web Push - תואם בדיוק את הפלט של PushSubscription.toJSON() בדפדפן. */
export const pushSubscriptionSchema = z.object({
  subscription: z.object({
    endpoint: z.string().trim().min(1, "endpoint חסר"),
    keys: z.object({
      p256dh: z.string().trim().min(1, "מפתח p256dh חסר"),
      auth: z.string().trim().min(1, "מפתח auth חסר"),
    }),
  }),
});

/** ביטול רישום Web Push של מכשיר צוות. */
export const pushUnsubscribeSchema = z.object({
  endpoint: z.string().trim().min(1, "endpoint חסר"),
});

/** שידור ידני מהצוות לכל הלקוחות שנרשמו להתראות (opt-in). */
export const broadcastSchema = z.object({
  title: z.string().trim().min(1, "כותרת חסרה").max(80, "כותרת ארוכה מדי"),
  body: z.string().trim().min(1, "תוכן חסר").max(200, "תוכן ארוך מדי"),
});

/** שמירת תאריך יום הולדת ("מתנת יום הולדת") - מגיע כ-YYYY-MM-DD מ-input type="date". */
export const birthdaySchema = z.object({
  birthday: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "תאריך לא תקין"),
});
