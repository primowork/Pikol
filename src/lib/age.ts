/**
 * גיל לפי תאריך לידה ("YYYY-MM-DD") ביום נתון. פונקציה טהורה - משמשת גם
 * בשרת (בדיקת גיל לפני הסכמה לדיוור, src/lib/consent.ts) וגם בדפדפן (חלון
 * יום ההולדת לא מציע תיבת דיוור למי שמתחת לגיל).
 */
export function ageOn(birthday: string, today: { year: number; month: number; day: number }): number {
  const [year, month, day] = birthday.split("-").map(Number);
  const hadBirthdayThisYear = today.month > month || (today.month === month && today.day >= day);
  return today.year - year - (hadBirthdayThisYear ? 0 : 1);
}

/** היום הנוכחי לפי שעון ישראל - "היום" של העסק, לא של השרת. */
export function israelToday(date: Date = new Date()): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}
