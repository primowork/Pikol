/**
 * לאן חוזרים אחרי כניסת צוות. הפרמטר next מגיע מה-URL, ולכן מתקבל רק
 * נתיב פנימי תחת /staff/ (לא כתובת חיצונית, לא "//host") ולא עמודי הכניסה
 * עצמם, כדי שלא ייווצר מעגל. כל ערך אחר נופל לדשבורד.
 */

export const STAFF_HOME_PATH = "/staff/dashboard";

const AUTH_PAGES = ["/staff/login", "/staff/forgot-password", "/staff/reset-password"];

export function safeStaffNextPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/staff/") || raw.includes("//") || raw.includes("\\")) {
    return STAFF_HOME_PATH;
  }
  const pathname = raw.split(/[?#]/)[0];
  if (AUTH_PAGES.includes(pathname)) return STAFF_HOME_PATH;
  return raw;
}

export function loginPathWithNext(next: string): string {
  const safeNext = safeStaffNextPath(next);
  return safeNext === STAFF_HOME_PATH
    ? "/staff/login"
    : `/staff/login?next=${encodeURIComponent(safeNext)}`;
}
