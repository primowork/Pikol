import { loginPathWithNext } from "./staff-paths";

/**
 * fetch לנתיבי ה-API של הצוות, מצד הדפדפן. 401 אומר שה-session נגמר (פג
 * תוקף, או שהסיסמה הוחלפה ממכשיר אחר): במקום שהמסך ימשיך להיראות חי בזמן
 * ששום פעולה לא עובדת, עוברים למסך הכניסה וחוזרים לאותו עמוד אחריה.
 */
export async function staffFetch(input: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status === 401) {
    window.location.replace(loginPathWithNext(window.location.pathname));
    // הדף כבר בדרך למסך הכניסה - התשובה לא מגיעה לקורא, כדי שלא תהבהב שגיאה
    return new Promise<Response>(() => {});
  }
  return res;
}
