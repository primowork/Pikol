import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { MARKETING_MIN_AGE } from "./config";
import { ageOn, israelToday } from "./age";
import { ValidationError } from "./errors";

/**
 * מאיפה הגיעה ההסכמה או ההסרה - נשמר ביומן (ConsentEvent.source):
 * join (טופס ההצטרפות), birthday (פופ-אפ יום ההולדת), notifications
 * (הפעלת התראות בכרטיס), card (הפסקת עדכונים בכרטיס), notification
 * (כפתור ההסרה בהתראת שידור עצמה).
 */
export type ConsentSource = "join" | "birthday" | "notifications" | "card" | "notification";

/** כתובת ה-IP לתיעוד הסכמה, או null כשאין (בפיתוח מקומי אין x-forwarded-for). */
export function getConsentIp(request: Request): string | null {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

interface MarketingConsentChange {
  customerId: string;
  optIn: boolean;
  source: ConsentSource;
  ip: string | null;
}

/**
 * הסכמה או הסרה מדיוור שיווקי: מעדכן את המצב על Customer ורושם שורה ביומן
 * שלא נדרסת. בהסרה נמחקים גם מינויי ה-push של הלקוח, כדי ששום שידור לא
 * יגיע אליו גם אם משהו בסינון ישתבש בעתיד. מינוי הדפדפן עצמו לא מבוטל:
 * הוא משותף לכל האתר, וייתכן שבאותו מכשיר מחובר גם הצוות לבקשות ניקוב.
 *
 * מקבל tx כשהשינוי הוא חלק מפעולה גדולה יותר (למשל רישום מינוי + הסכמה).
 */
export async function setMarketingConsent(
  change: MarketingConsentChange,
  tx?: Prisma.TransactionClient
): Promise<void> {
  if (!tx) {
    await prisma.$transaction((innerTx) => setMarketingConsent(change, innerTx));
    return;
  }

  const { customerId, optIn, source, ip } = change;

  // עדכונים ומבצעים רק מגיל 18 (תקנון, פרק 7). את הגיל יודעים רק אם נמסר
  // יום הולדת; בלעדיו ההצהרה בתיבת הסימון היא מה שיש.
  if (optIn) {
    const current = await tx.customer.findUnique({ where: { id: customerId }, select: { birthday: true } });
    const birthday = current?.birthday?.toISOString().slice(0, 10);
    if (birthday && ageOn(birthday, israelToday()) < MARKETING_MIN_AGE) {
      throw new ValidationError(`עדכונים ומבצעים אפשר לאשר רק מגיל ${MARKETING_MIN_AGE}`);
    }
  }

  await tx.customer.update({
    where: { id: customerId },
    data: optIn
      ? { marketingOptIn: true, consentedAt: new Date(), ...(ip ? { consentIp: ip } : {}) }
      : { marketingOptIn: false },
  });

  await tx.consentEvent.create({
    data: { customerId, kind: optIn ? "MARKETING_OPT_IN" : "MARKETING_OPT_OUT", source, ip },
  });

  if (!optIn) {
    await tx.customerPushSubscription.deleteMany({ where: { customerId } });
  }
}
