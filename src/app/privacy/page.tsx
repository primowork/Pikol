import Link from "next/link";
import Logo from "@/components/Logo";
import { BUSINESS_NAME } from "@/lib/config";

/**
 * טקסט מדיניות הפרטיות - מבוסס על הניסוח שהמשתמש עצמו ניסח וסיפק,
 * תואם את המבנה המקובל לחוק הגנת הפרטיות ולחוק התקשורת (סעיף 30א).
 * בשונה מ-/terms, זה טקסט מלא ולא placeholder.
 */
export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-6 px-4 py-8 text-right">
      <Logo size={72} />
      <h1 className="text-center text-2xl font-bold text-pikol-brown">מדיניות פרטיות</h1>

      <div className="w-full space-y-4 text-sm leading-relaxed text-pikol-brown">
        <section>
          <h2 className="mb-1 font-semibold">איסוף מידע ושמירתו במאגר</h2>
          <p>
            בעת ההרשמה למועדון הנאמנות והשימוש באפליקציית {BUSINESS_NAME}, הנך מוסר/ת לבית הקפה
            מידע אישי (כגון: שם, מספר טלפון, תאריך יום הולדת והיסטוריית ניקובים/רכישות). מילוי
            הפרטים מתבצע מרצונך החופשי ואינו נובע מחובה חוקית, אך הוא נדרש לצורך הצטרפות למועדון,
            מימוש הטבות והענקת השירות.
          </p>
          <p className="mt-2">
            הנתונים שנמסרו יישמרו במאגר המידע המאובטח של בית הקפה. המידע ישמש לניהול מועדון
            הלקוחות, תפעול כרטיסיית הנאמנות הדיגיטלית, ניתוח סטטיסטי לשיפור השירות, והתאמה אישית
            של הטבות ומבצעים.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">דיוור ישיר ותקשורת שיווקית</h2>
          <p>
            בכפוף לקבלת הסכמתך, בית הקפה יהיה רשאי לפנות אליך בהודעות עדכון, הצעות שיווקיות
            והטבות (לרבות הטבות יום הולדת) באמצעות SMS, WhatsApp, דוא&quot;ל או התראות Push. הנך
            רשאי/ת לבטל את הסכמתך לקבלת דיוור שיווקי בכל עת על ידי לחיצה על קישור ההסרה
            (&quot;הסר&quot;) בהודעות שיועברו אליך או בניהול ההגדרות באפליקציה.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">זכות עיון ומחיקה</h2>
          <p>
            על פי חוק הגנת הפרטיות, תשמ&quot;א-1981, הנך זכאי/ת לעיין במידע שנשמר אודותיך במאגר,
            ולבקש את תיקונו או מחיקתו במידה ומצאת כי אינו נכון או מעודכן.
          </p>
        </section>
      </div>

      <Link href="/" className="text-sm text-pikol-teal underline">
        חזרה לעמוד הבית
      </Link>
    </main>
  );
}
