import { prisma } from "./db";
import { israelToday } from "./age";

/**
 * בדיקה+זיכוי "עצלן" (lazy) של מתנת יום הולדת - בלי שום job מתוזמן.
 * נקרא מכל מקום שכבר שולף מצב לקוח בפועל (GET /api/customers/[id],
 * וגם card/[id]/page.tsx ב-SSR הראשוני).
 *
 * לפי התקנון (פרק 6): כוס קפה חינם פעם בשנה, שאפשר לממש בכל יום בחודש
 * יום ההולדת, ופגה בסוף החודש. לכן:
 * - זיכוי: בכל כניסה בחודש יום ההולדת (שעון ישראל) אם עוד לא זוכה השנה.
 *   לא תלוי ביום המדויק, אז גם מי שנולד בעשרים ותשעה בפברואר מקבל.
 * - תפוגה: birthdayRewardGrantedAt מסמן מתנה שזוכתה ועוד לא מומשה (המימוש
 *   מנקה אותו, src/lib/stamp-actions.ts). כשהחודש של הזיכוי נגמר, יחידת
 *   הבונוס הזו יורדת - גם אם הלקוח שינה את התאריך באמצע. מתנות מלפני הכלל
 *   הזה (בלי תאריך זיכוי) לא פגות.
 *
 * lastBirthdayRewardYear מונע זיכוי כפול באותה שנה (גם אחרי שינוי תאריך).
 * כל עדכון הוא updateMany עם guard ב-where - תפיסה אטומית מול שני polls
 * בו-זמנית.
 */
export async function grantBirthdayRewardIfDue(customerId: string): Promise<void> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      birthday: true,
      lastBirthdayRewardYear: true,
      bonusRewardsAvailable: true,
      birthdayRewardGrantedAt: true,
    },
  });
  if (!customer) return;

  const now = new Date();
  const today = israelToday(now);

  const grantedAt = customer.birthdayRewardGrantedAt;
  if (grantedAt && customer.bonusRewardsAvailable > 0) {
    const granted = israelToday(grantedAt);
    if (granted.year !== today.year || granted.month !== today.month) {
      await prisma.customer.updateMany({
        where: { id: customerId, birthdayRewardGrantedAt: grantedAt, bonusRewardsAvailable: { gt: 0 } },
        data: { bonusRewardsAvailable: { decrement: 1 }, birthdayRewardGrantedAt: null },
      });
    }
  }

  if (!customer.birthday) return;

  const isBirthdayMonth = customer.birthday.getUTCMonth() + 1 === today.month;
  if (!isBirthdayMonth || customer.lastBirthdayRewardYear === today.year) return;

  await prisma.customer.updateMany({
    where: {
      id: customerId,
      OR: [{ lastBirthdayRewardYear: null }, { lastBirthdayRewardYear: { not: today.year } }],
    },
    data: {
      bonusRewardsAvailable: { increment: 1 },
      lastBirthdayRewardYear: today.year,
      birthdayRewardGrantedAt: now,
    },
  });
}
