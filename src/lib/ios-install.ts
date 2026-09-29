/**
 * באיזה דפדפן באייפון/אייפד הכרטיס פתוח, כדי להראות בדיוק איפה ללחוץ כדי
 * להוסיף אותו למסך הבית. באייפון אין לאתר דרך לפתוח את חלון ההוספה בעצמו
 * (אין beforeinstallprompt), אפשר רק להדריך.
 */

export type IosBrowser = "safari" | "chrome" | "other";

export interface IosInstallContext {
  browser: IosBrowser;
  device: "iphone" | "ipad";
  /**
   * בספארי 26 (iOS 26) בפריסת הלשוניות "קומפקטית", ברירת המחדל, כפתור
   * השיתוף כבר לא בסרגל - הוא בתוך תפריט שלוש הנקודות.
   */
  shareInMoreMenu: boolean;
}

// דפדפנים אחרים ודפדפנים פנימיים של אפליקציות (אינסטגרם, פייסבוק...) -
// ב-user agent שלהם יש לפעמים גם Safari/, אבל ההוספה למסך הבית שונה או חסרה
const NOT_SAFARI =
  /FxiOS|EdgiOS|OPiOS|OPT\/|YaBrowser|DuckDuckGo|GSA\/|Instagram|FBAN|FBAV|FB_IAB|Line\/|LinkedInApp|Snapchat|musical_ly|TikTok|Twitter/;

export function detectIosInstallContext(userAgent: string, maxTouchPoints: number): IosInstallContext | null {
  // אייפד מציג את עצמו כמק ("Macintosh"), רק מסך המגע מסגיר אותו
  const ipadAsDesktop = userAgent.includes("Macintosh") && maxTouchPoints > 1;
  if (!/iPhone|iPad|iPod/.test(userAgent) && !ipadAsDesktop) return null;

  const device = /iPad/.test(userAgent) || ipadAsDesktop ? "ipad" : "iphone";

  if (userAgent.includes("CriOS/")) {
    return { browser: "chrome", device, shareInMoreMenu: false };
  }

  const safariVersion = userAgent.match(/Version\/(\d+)/);
  if (safariVersion && userAgent.includes("Safari/") && !NOT_SAFARI.test(userAgent)) {
    return {
      browser: "safari",
      device,
      shareInMoreMenu: device === "iphone" && Number(safariVersion[1]) >= 26,
    };
  }

  return { browser: "other", device, shareInMoreMenu: false };
}
