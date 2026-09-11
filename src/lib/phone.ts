/**
 * מנרמל מספר טלפון ישראלי לפורמט אחיד (למשל "0501234567"), בלי קשר איך
 * המשתמש הקליד אותו ("050-1234567", "+972-50-123-4567", "972501234567"...).
 *
 * חובה להשתמש בזה לפני כל שמירה/חיפוש של טלפון ב-DB - אחרת אותו אדם
 * שנרשם עם "050-1234567" לא יימצא בחיפוש לפי "0501234567", ועלולה
 * להיווצר כפילות של אותו לקוח.
 *
 * מחזיר null אם הקלט לא נראה כמו מספר טלפון ישראלי תקין.
 */
export function normalizePhone(raw: string): string | null {
  if (!raw) return null;

  let digits = raw.replace(/[^\d+]/g, "").replace(/\+/g, "");
  if (!digits) return null;

  if (digits.startsWith("972")) {
    digits = "0" + digits.slice(3);
  } else if (!digits.startsWith("0")) {
    digits = "0" + digits;
  }

  // מספר ישראלי: "0" + קידומת + מנוי = 9 ספרות (קווי) או 10 ספרות (נייד)
  if (!/^0\d{8,9}$/.test(digits)) {
    return null;
  }

  return digits;
}
