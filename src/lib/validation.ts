import { z } from "zod";

/** טופס ההצטרפות למועדון ("/join"). */
export const joinSchema = z.object({
  name: z.string().trim().min(2, "השם קצר מדי").max(60, "השם ארוך מדי"),
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

/** יצירת בקשת אישור מ-"/scan" (לקוח סרק את ה-QR הקבוע בדוכן). */
export const approvalRequestCreateSchema = z.object({
  customerId: z.string().trim().min(1, "חסר מזהה לקוח"),
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
