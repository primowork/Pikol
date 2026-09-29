import Link from "next/link";
import { connection } from "next/server";
import Logo from "@/components/Logo";
import BusinessContactDetails from "@/components/BusinessContactDetails";
import { BUSINESS_NAME, STAMPS_REQUIRED } from "@/lib/config";
import { getBusinessDetails } from "@/lib/business-settings";

/**
 * תנאי השימוש של מועדון הלקוחות. המועדון וההטבות של בית הקפה ובאחריותו;
 * מפעיל המערכת הוא ספק טכני בלבד ולא צד להטבות. הטקסט נכתב כבסיס סביר
 * והוגן ללקוח, בלי ליווי משפטי - עורך דין צריך לעבור עליו לפני שמסתמכים
 * עליו מול לקוחות (וגם על /privacy).
 *
 * connection: פרטי העסק נקראים מה-DB בכל בקשה, לא בזמן ה-build.
 */
export default async function TermsPage() {
  await connection();
  const details = await getBusinessDetails();
  const businessName = details.legalName ?? BUSINESS_NAME;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-6 px-4 py-8 text-right">
      <Logo size={72} />
      <h1 className="text-center text-2xl font-bold text-pikol-brown">תנאי שימוש</h1>

      <div className="w-full space-y-5 text-sm leading-relaxed text-pikol-brown">
        <p>
          התנאים האלה חלים על מועדון הלקוחות הדיגיטלי של {BUSINESS_NAME} ועל הכרטיסייה
          באפליקציה. ההצטרפות למועדון והשימוש בכרטיס הם הסכמה לתנאים.
        </p>

        <section>
          <h2 className="mb-1 font-semibold">מי מפעיל את המועדון</h2>
          <p>
            המועדון מופעל על ידי {businessName} (&quot;בית הקפה&quot;), וההטבות ניתנות על ידו
            ובאחריותו. המערכת עצמה מופעלת טכנית על ידי ספק חיצוני בשביל בית הקפה, והוא לא צד
            להטבות.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">הצטרפות</h2>
          <p>
            ההצטרפות חינם. כל מספר טלפון מקבל כרטיס אחד. חשוב למסור פרטים נכונים: מספר הטלפון
            הוא הדרך לחזור לכרטיס ממכשיר חדש.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">צבירה ומימוש</h2>
          <ul className="list-disc space-y-1 pr-5">
            <li>
              כל משקה שנקנה בבית הקפה מזכה בניקוב אחד. ניקוב נוסף לכרטיס רק באישור הצוות, בקופה
              או מהטלפון של הצוות.
            </li>
            <li>
              {STAMPS_REQUIRED} ניקובים מזכים במשקה אחד חינם. את הפרס מממשים בבית הקפה, באישור
              הצוות.
            </li>
            <li>מי שמסר תאריך יום הולדת מקבל משקה אחד חינם ביום ההולדת, פעם בשנה.</li>
            <li>
              להטבות אין ערך כספי: אי אפשר להמיר אותן בכסף או להעביר אותן לכרטיס של מישהו אחר.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">שימוש לרעה</h2>
          <p>
            אסור לנסות להשיג ניקובים או פרסים שלא מגיעים לכם, לפתוח כמה כרטיסים לאותו אדם או
            להשתמש בכרטיס של מישהו אחר. במקרה כזה בית הקפה רשאי לבטל את מה שהושג כך, ובמקרים
            חמורים לסגור את הכרטיס.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">זמינות המערכת</h2>
          <p>
            אנחנו עושים מאמץ שהמערכת תעבוד תמיד, אבל ייתכנו תקלות והפסקות. אם ניקוב לא נרשם בגלל
            תקלה, פנו לצוות, והעניין ייבדק לפי הרישומים של בית הקפה.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">שינויים וסיום</h2>
          <p>
            בית הקפה רשאי לשנות את התנאים או את ההטבות, או לסיים את המועדון. על שינוי מהותי או
            על סיום תינתן הודעה באפליקציה שלושים יום מראש לפחות, ובמהלכם אפשר לממש פרסים שכבר
            נצברו.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">עדכונים ומבצעים</h2>
          <p>
            מי שהסכים מקבל עדכונים ומבצעים בהתראות, ויכול להפסיק בכל עת בכרטיס. הפרטים ב
            <Link href="/privacy" className="text-pikol-teal underline">
              מדיניות הפרטיות
            </Link>
            , שחלה גם היא על השימוש במועדון.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">יצירת קשר</h2>
          <BusinessContactDetails details={details} />
        </section>

        <section>
          <h2 className="mb-1 font-semibold">הדין</h2>
          <p>על התנאים חל הדין הישראלי.</p>
          <p className="mt-1 text-xs text-pikol-brown/60">עודכן לאחרונה: ספטמבר 2026</p>
        </section>
      </div>

      <div className="flex gap-4 text-sm">
        <Link href="/privacy" className="text-pikol-teal underline">
          מדיניות פרטיות
        </Link>
        <Link href="/" className="text-pikol-teal underline">
          חזרה לעמוד הבית
        </Link>
      </div>
    </main>
  );
}
