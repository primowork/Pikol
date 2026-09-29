import Link from "next/link";
import { connection } from "next/server";
import Logo from "@/components/Logo";
import BusinessContactDetails from "@/components/BusinessContactDetails";
import { BUSINESS_NAME } from "@/lib/config";
import { getBusinessDetails } from "@/lib/business-settings";

/**
 * מדיניות הפרטיות של מועדון הלקוחות. בית הקפה הוא בעל השליטה במאגר (פרטיו
 * מההגדרות), ומפעיל המערכת וספקי התשתית פועלים בשבילו. הטקסט מתאר רק מה
 * שהמערכת עושה בפועל: ערוץ הדיוור היחיד הוא התראות, ודרכי ההסרה שמופיעות
 * כאן קיימות באמת (בכרטיס ובהתראה). כתוב כבסיס סביר, בלי ליווי משפטי -
 * עורך דין צריך לעבור עליו לפני שמסתמכים עליו (וגם על /terms).
 *
 * connection: פרטי העסק נקראים מה-DB בכל בקשה, לא בזמן ה-build.
 */
export default async function PrivacyPage() {
  await connection();
  const details = await getBusinessDetails();
  const businessName = details.legalName ?? BUSINESS_NAME;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-6 px-4 py-8 text-right">
      <Logo size={72} />
      <h1 className="text-center text-2xl font-bold text-pikol-brown">מדיניות פרטיות</h1>

      <div className="w-full space-y-5 text-sm leading-relaxed text-pikol-brown">
        <p>
          כאן מוסבר איזה מידע נשמר במועדון הלקוחות הדיגיטלי של {BUSINESS_NAME}, למה, מי רואה
          אותו ומה הזכויות שלכם.
        </p>

        <section>
          <h2 className="mb-1 font-semibold">מי אחראי על המידע</h2>
          <p>
            {businessName} הוא בעל השליטה במאגר המידע של המועדון, והוא מחליט מה נעשה במידע.
            לכל שאלה או בקשה בנוגע למידע שלכם אפשר לפנות אליו:
          </p>
          <BusinessContactDetails details={details} />
        </section>

        <section>
          <h2 className="mb-1 font-semibold">איזה מידע נשמר</h2>
          <ul className="list-disc space-y-1 pr-5">
            <li>שם ומספר טלפון, שנמסרים בהצטרפות.</li>
            <li>ניקובים, בקשות ניקוב ומימושי פרסים, והמועדים שלהם.</li>
            <li>תאריך יום הולדת, רק אם בחרתם למסור אותו.</li>
            <li>תיעוד ההסכמות וההסרות שלכם: מה אישרתם, מתי, ומאיזו כתובת IP.</li>
            <li>
              אם הפעלתם התראות: מזהה טכני שהדפדפן יוצר לשליחת התראות למכשיר. הוא לא כולל את
              מספר הטלפון או מיקום.
            </li>
            <li>בטלפון עצמו נשמר מזהה הכרטיס, כדי שהכרטיס ייפתח ישר בכניסה הבאה.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">למה</h2>
          <ul className="list-disc space-y-1 pr-5">
            <li>ניהול הכרטיסייה: ניקובים, פרסים ומתנת יום הולדת.</li>
            <li>מניעת שימוש לרעה: כל ניקוב נרשם יחד עם איש הצוות שאישר אותו.</li>
            <li>שיפור השירות, בנתונים כלליים כמו כמה לקוחות חוזרים ובאיזו תדירות.</li>
            <li>שליחת עדכונים ומבצעים, רק למי שהסכים לכך.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">האם חייבים למסור את המידע</h2>
          <p>
            אין חובה חוקית למסור את המידע, והמסירה תלויה ברצונכם ובהסכמתכם. בלי שם ומספר טלפון
            אי אפשר להצטרף למועדון. יום הולדת והתראות הם לבחירתכם: בלעדיהם הכרטיסייה עובדת כרגיל,
            רק בלי מתנת יום ההולדת או בלי עדכונים.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">מי עוד רואה את המידע</h2>
          <ul className="list-disc space-y-1 pr-5">
            <li>צוות בית הקפה, לצורך הפעלת המועדון.</li>
            <li>
              ספקים טכניים שפועלים בשביל בית הקפה ולפי הוראותיו, רק כדי שהמערכת תעבוד: המפעיל
              הטכני של המערכת, שירות האחסון שבו נמצאים השרת ומאגר המידע, ושירותי ההתראות של
              יצרני הדפדפנים (כמו Google ו-Apple) שדרכם עוברות ההתראות. חלק מהשרתים של הספקים
              האלה נמצאים מחוץ לישראל.
            </li>
            <li>המידע לא נמכר ולא נמסר לאף גורם אחר, אלא אם החוק מחייב.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">עדכונים ומבצעים</h2>
          <p>
            עדכונים ומבצעים נשלחים רק למי שהסכים לקבל אותם: בטופס ההצטרפות, בחלון מתנת יום ההולדת,
            או בלחיצה על &quot;הפעלת התראות על מבצעים ועדכונים&quot; בכרטיס. כיום הם נשלחים רק
            כהתראות לטלפון. אם בית הקפה ירצה לשלוח גם ב-SMS, בוואטסאפ או במייל, הוא יבקש לכך
            הסכמה נפרדת. כל הודעה מתחילה במילה &quot;פרסומת&quot; ומציינת איך מסירים.
          </p>
          <p className="mt-2">אפשר להסיר את עצמכם בכל עת, בלי לתת סיבה:</p>
          <ul className="mt-1 list-disc space-y-1 pr-5">
            <li>בכרטיס, בלחיצה על &quot;הפסקת עדכונים ומבצעים&quot;.</li>
            <li>באנדרואיד, גם בכפתור &quot;הסרה מרשימת התפוצה&quot; שבהתראה עצמה.</li>
            <li>בפנייה לבית הקפה, בפרטים שלמעלה.</li>
          </ul>
          <p className="mt-2">
            ההסרה לא משפיעה על הכרטיסייה: הניקובים והפרסים נשארים. כיבוי ההתראות בהגדרות הטלפון
            מפסיק את קבלתן במכשיר הזה.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">הזכויות שלכם</h2>
          <p>
            לפי חוק הגנת הפרטיות, התשמ&quot;א-1981, אתם זכאים לעיין במידע שנשמר עליכם, ולבקש לתקן
            או למחוק מידע שאינו נכון, שלם, ברור או מעודכן. אפשר גם לבקש למחוק את הכרטיס כולו. פנו
            לבית הקפה בפרטים שלמעלה. מחיקת הכרטיס מוחקת גם את הניקובים שנצברו בו.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">אבטחה ושמירת מידע</h2>
          <p>
            המידע נשמר בשרתים מאובטחים, והגישה אליו מוגבלת לצוות בית הקפה, בכניסה עם סיסמה.
            המידע נשמר כל עוד הכרטיס קיים, או עד שתבקשו למחוק אותו.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">שינויים במדיניות</h2>
          <p>אם המדיניות תשתנה, הנוסח המעודכן יופיע בעמוד הזה.</p>
          <p className="mt-1 text-xs text-pikol-brown/60">עודכן לאחרונה: ספטמבר 2026</p>
        </section>
      </div>

      <div className="flex gap-4 text-sm">
        <Link href="/terms" className="text-pikol-teal underline">
          תנאי שימוש
        </Link>
        <Link href="/" className="text-pikol-teal underline">
          חזרה לעמוד הבית
        </Link>
      </div>
    </main>
  );
}
