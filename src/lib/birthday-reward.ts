import { prisma } from "./db";

/**
 * מחלץ שנה/חודש/יום לפי השעון הישראלי (לא UTC) - "היום" של העסק, לא
 * של השרת. אותו עיקרון בדיוק כמו חישובי השעה/יום בשבוע ב-staff/customers
 * (AT TIME ZONE כפול ב-SQL) - כאן זה בקוד, לא ב-SQL, אז Intl.DateTimeFormat
 * במקום מחרוזת+פענוח חוזר (toLocaleString->new Date) שיכול להיות שביר.
 */
function getIsraelDateParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/**
 * בדיקה+זיכוי "עצלן" (lazy) של מתנת יום הולדת - בלי שום job מתוזמן.
 * נקרא מכל מקום שכבר שולף מצב לקוח בפועל (GET /api/customers/[id],
 * וגם card/[id]/page.tsx ב-SSR הראשוני) - בדיוק כמו שתפוגת תוקף של
 * בקשת אישור כבר נגזרת מגיל הרשומה בכל קריאה, בלי כתיבה יזומה ל-DB.
 * הלקוח יראה את הזיכוי בתוך שניות מהרגע שהוא פותח את האפליקציה ביום
 * ההולדת עצמו (polling קיים כל 6 שניות), בלי תשתית תזמון חדשה.
 *
 * lastBirthdayRewardYear מונע זיכוי כפול באותה שנה. ה-updateMany עם
 * ה-guard בתוך ה-where הוא ה-atomic claim שמונע מרוץ בין שני polls
 * בו-זמנית שמזכים פעמיים.
 */
export async function grantBirthdayRewardIfDue(customerId: string): Promise<void> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { birthday: true, lastBirthdayRewardYear: true },
  });
  if (!customer?.birthday) return;

  const today = getIsraelDateParts(new Date());
  const isBirthdayToday =
    customer.birthday.getUTCMonth() + 1 === today.month && customer.birthday.getUTCDate() === today.day;

  if (!isBirthdayToday || customer.lastBirthdayRewardYear === today.year) return;

  await prisma.customer.updateMany({
    where: {
      id: customerId,
      OR: [{ lastBirthdayRewardYear: null }, { lastBirthdayRewardYear: { not: today.year } }],
    },
    data: { bonusRewardsAvailable: { increment: 1 }, lastBirthdayRewardYear: today.year },
  });
}
