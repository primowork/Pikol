import { BUSINESS_NAME } from "./config";

/**
 * שליחת מייל (כרגע רק קישורי איפוס סיסמה). דרך ה-API של Brevo ב-HTTPS
 * ולא SMTP, כי Railway חוסם יציאת SMTP בחבילות Free/Trial/Hobby. בחבילה
 * החינמית של Brevo מספיק לאמת כתובת שולח אחת (למשל Gmail), בלי דומיין.
 *
 * משתני סביבה: BREVO_API_KEY, ו-EMAIL_FROM (כתובת השולח המאומתת ב-Brevo).
 * בפיתוח מקומי בלי ההגדרות האלה המייל מודפס ללוג השרת במקום להישלח.
 */

const BREVO_SEND_URL = "https://api.brevo.com/v3/smtp/email";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.info(
        `[email] שליחת מיילים לא מוגדרת, המייל מודפס כאן במקום:\nאל: ${message.to}\nנושא: ${message.subject}\n\n${message.text}`
      );
      return;
    }
    throw new Error("שליחת מיילים לא מוגדרת בשרת: חסרים BREVO_API_KEY או EMAIL_FROM");
  }

  const res = await fetch(BREVO_SEND_URL, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: BUSINESS_NAME, email: from },
      to: [{ email: message.to }],
      subject: message.subject,
      textContent: message.text,
      htmlContent: message.html,
    }),
  });

  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    throw new Error(`Brevo החזיר ${res.status}: ${detail}`);
  }
}
