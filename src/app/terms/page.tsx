import Link from "next/link";
import { connection } from "next/server";
import Logo from "@/components/Logo";
import PrintButton from "@/components/PrintButton";
import BusinessContactDetails from "@/components/BusinessContactDetails";
import { BUSINESS_NAME, TERMS_VERSION_LABEL } from "@/lib/config";
import { CLUB_TERMS_TITLE, getClubTerms } from "@/lib/club-terms";
import { getBusinessDetails } from "@/lib/business-settings";

/**
 * תקנון מועדון הלקוחות. התוכן ב-src/lib/club-terms.ts (מקור אחד גם למסמך
 * ה-Word); כאן רק התצוגה, עם מספור פרקים וסעיפים כמו במסמך משפטי. הכתובת
 * נשארה /terms כדי שקישורים קיימים ימשיכו לעבוד.
 *
 * connection: פרטי העסק נקראים מה-DB בכל בקשה, לא בזמן ה-build.
 */
export default async function TermsPage() {
  await connection();
  const details = await getBusinessDetails();
  const sections = getClubTerms(details.legalName ?? BUSINESS_NAME);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-6 px-4 py-8 text-right">
      <Logo size={72} />
      <div className="text-center">
        <h1 className="text-2xl font-bold text-pikol-brown">{CLUB_TERMS_TITLE}</h1>
        <p className="mt-1 text-xs text-pikol-brown/60">
          {BUSINESS_NAME} · גרסה מ{TERMS_VERSION_LABEL}
        </p>
      </div>

      <div className="w-full space-y-5 text-sm leading-relaxed text-pikol-brown">
        {sections.map((section, sectionIndex) => (
          <section key={section.title}>
            <h2 className="mb-1 font-semibold">{`${sectionIndex + 1}. ${section.title}`}</h2>
            <ol className="space-y-1">
              {section.clauses.map((clause, clauseIndex) => (
                <li key={clauseIndex} className="flex gap-2">
                  <span className="shrink-0 tabular-nums text-pikol-brown/70">
                    {`${sectionIndex + 1}.${clauseIndex + 1}`}
                  </span>
                  <span>{clause}</span>
                </li>
              ))}
            </ol>
            {section.showContactDetails && <BusinessContactDetails details={details} />}
          </section>
        ))}
      </div>

      <div className="no-print flex flex-col items-center gap-4">
        <PrintButton label="הדפסה או שמירה כ-PDF" />
        <div className="flex gap-4 text-sm">
          <Link href="/privacy" className="text-pikol-teal underline">
            מדיניות פרטיות
          </Link>
          <Link href="/" className="text-pikol-teal underline">
            חזרה לעמוד הבית
          </Link>
        </div>
      </div>
    </main>
  );
}
