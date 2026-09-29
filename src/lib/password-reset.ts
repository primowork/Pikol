import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { BUSINESS_NAME, PASSWORD_RESET_TOKEN_TTL_MINUTES } from "./config";
import { sendEmail } from "./email";
import { InvalidResetTokenError } from "./errors";

/**
 * שחזור סיסמת צוות במייל. הטוקן עצמו (32 בייטים אקראיים) נמצא רק בקישור
 * שנשלח; במסד נשמר רק ה-SHA-256 שלו. קישור תקף לזמן קצר ולשימוש אחד.
 */

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * הכתובת הציבורית של האתר לקישור במייל. APP_URL אם הוגדר, אחרת הדומיין
 * ש-Railway מגדיר בעצמו (RAILWAY_PUBLIC_DOMAIN), ורק בסוף ה-Host של הבקשה
 * (כמו בעמוד קוד הדוכן) - לא x-forwarded-host שכל אחד יכול לזייף.
 */
export function getPublicBaseUrl(hostHeader: string | null): string {
  const configured = process.env.APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railwayDomain) return `https://${railwayDomain}`;

  const host = hostHeader ?? "localhost:3000";
  const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  return `${isLocal ? "http" : "https"}://${host}`;
}

/**
 * שולח קישור איפוס לחבר הצוות שמזוהה בשם משתמש או במייל, אם שמור לו מייל.
 * אין תשובה החוצה בכוונה: הקורא עונה תמיד אותו דבר, כדי שאי אפשר יהיה
 * לגלות דרך הטופס אילו חשבונות קיימים.
 */
export async function sendPasswordResetEmail(identifier: string, baseUrl: string): Promise<void> {
  const staff = await prisma.staffUser.findFirst({
    where: { OR: [{ username: identifier }, { email: identifier.toLowerCase() }] },
  });
  if (!staff?.email) return;

  const now = new Date();
  const token = randomBytes(32).toString("base64url");
  await prisma.$transaction([
    // ניקוי הזדמנותי של קישורים שפגו, כדי שהטבלה לא תגדל עם הזמן
    prisma.passwordResetToken.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.passwordResetToken.create({
      data: {
        staffId: staff.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(now.getTime() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000),
      },
    }),
  ]);

  const link = `${baseUrl}/staff/reset-password?token=${token}`;
  const subject = `איפוס סיסמה לדשבורד ${BUSINESS_NAME}`;
  const text = [
    `שלום ${staff.name},`,
    "",
    `קיבלנו בקשה לאיפוס הסיסמה שלך לדשבורד של ${BUSINESS_NAME}.`,
    `לבחירת סיסמה חדשה: ${link}`,
    "",
    `הקישור תקף ל-${PASSWORD_RESET_TOKEN_TTL_MINUTES} דקות ולשימוש אחד בלבד.`,
    "לא ביקשת איפוס? אפשר להתעלם מהמייל הזה, והסיסמה לא תשתנה.",
  ].join("\n");
  const html = `<div dir="rtl" style="font-family:Arial,sans-serif;font-size:16px;line-height:1.6;color:#614943">
<p>שלום ${escapeHtml(staff.name)},</p>
<p>קיבלנו בקשה לאיפוס הסיסמה שלך לדשבורד של ${escapeHtml(BUSINESS_NAME)}.</p>
<p><a href="${link}" style="display:inline-block;background:#614943;color:#fffaee;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:bold">בחירת סיסמה חדשה</a></p>
<p style="font-size:14px">הקישור תקף ל-${PASSWORD_RESET_TOKEN_TTL_MINUTES} דקות ולשימוש אחד בלבד.<br>לא ביקשת איפוס? אפשר להתעלם מהמייל הזה, והסיסמה לא תשתנה.</p>
</div>`;

  await sendEmail({ to: staff.email, subject, text, html });
}

/**
 * קובע סיסמה חדשה לפי קישור מהמייל ומחזיר את חבר הצוות המעודכן. מעלה את
 * sessionVersion (כל מכשיר שהיה מחובר מתנתק) ומוחק את כל הקישורים שלו.
 * המחיקה של הקישור עצמו היא ה"תפיסה": שתי בקשות במקביל עם אותו קישור -
 * רק אחת מוחקת שורה בפועל, השנייה נכשלת.
 */
export async function resetPasswordWithToken(token: string, newPassword: string) {
  const tokenHash = hashToken(token);
  // bcrypt איטי בכוונה - מחוץ לטרנזקציה כדי לא להחזיק אותה פתוחה
  const passwordHash = await bcrypt.hash(newPassword, 10);

  return prisma.$transaction(async (tx) => {
    const record = await tx.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!record || record.expiresAt < new Date()) {
      throw new InvalidResetTokenError();
    }

    const claimed = await tx.passwordResetToken.deleteMany({ where: { id: record.id } });
    if (claimed.count !== 1) {
      throw new InvalidResetTokenError();
    }

    const staff = await tx.staffUser.update({
      where: { id: record.staffId },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    });
    await tx.passwordResetToken.deleteMany({ where: { staffId: staff.id } });
    return staff;
  });
}
