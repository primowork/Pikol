/**
 * הנתיב הקודם בתוך האפליקציה, בזיכרון בלבד (NavigationTracker שבלייאאוט
 * מעדכן אותו בכל מעבר עמוד). BackLink משתמש בו כדי ש"חזרה ל..." תעשה
 * חזרה אמיתית בהיסטוריה כשזה בדיוק העמוד שממנו הגענו.
 */

let currentPathname: string | null = null;
let previousPathname: string | null = null;

export function recordPathname(pathname: string): void {
  if (pathname === currentPathname) return;
  previousPathname = currentPathname;
  currentPathname = pathname;
}

export function getPreviousPathname(): string | null {
  return previousPathname;
}
