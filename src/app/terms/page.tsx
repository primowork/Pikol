import Link from "next/link";
import Logo from "@/components/Logo";
import { BUSINESS_NAME } from "@/lib/config";

/**
 * טיוטה בלבד - לא סופק טקסט תנאי שימוש מלא. יש להחליף בטקסט אמיתי,
 * מומלץ בליווי עורך דין, לפני שהעמוד הזה נחשב מחייב מול לקוחות אמיתיים.
 */
export default function TermsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-6 px-4 py-8 text-right">
      <Logo size={72} />
      <h1 className="text-center text-2xl font-bold text-pikol-brown">תנאי שימוש</h1>

      <div className="w-full rounded-2xl border-2 border-pikol-gold bg-pikol-gold/15 p-4 text-sm text-pikol-brown">
        <p className="font-semibold">טיוטה - לא לשימוש בפרודקשן כפי שהיא</p>
        <p className="mt-1">
          עמוד זה הוא placeholder בלבד. יש להחליף אותו בטקסט תנאי שימוש מלא, מומלץ בליווי עורך
          דין, לפני שהוא מוצג ללקוחות אמיתיים.
        </p>
      </div>

      <div className="w-full space-y-3 text-sm leading-relaxed text-pikol-brown">
        <p>
          השימוש באפליקציית {BUSINESS_NAME} ובמועדון הנאמנות הדיגיטלי כפוף לתנאים שייקבעו כאן.
          לפרטים על איסוף ושימוש במידע אישי, ראו את{" "}
          <Link href="/privacy" className="text-pikol-teal underline">
            מדיניות הפרטיות
          </Link>
          .
        </p>
      </div>

      <Link href="/" className="text-sm text-pikol-teal underline">
        חזרה לעמוד הבית
      </Link>
    </main>
  );
}
