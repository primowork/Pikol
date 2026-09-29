import Link from "next/link";
import { BUSINESS_NAME } from "@/lib/config";
import { toTelHref } from "@/lib/phone";
import type { BusinessDetails } from "@/types";

interface BusinessFooterProps {
  details: BusinessDetails;
}

/**
 * מי עומד מאחורי המועדון: פרטי בית הקפה מההגדרות (בעל השליטה במאגר
 * והמפרסם בשידורים), קישורים לתנאים ולפרטיות, וכניסת הצוות. שדה שלא
 * מולא בהגדרות פשוט לא מוצג.
 */
export default function BusinessFooter({ details }: BusinessFooterProps) {
  const { legalName, businessNumber, address, contactPhone, contactEmail } = details;

  return (
    <footer className="flex w-full flex-col items-center gap-1 border-t border-pikol-tan/30 pt-4 text-[11px] leading-relaxed text-pikol-brown/50">
      <p>
        {legalName ?? BUSINESS_NAME}
        {businessNumber && (
          <>
            {" · "}מספר עוסק <span dir="ltr">{businessNumber}</span>
          </>
        )}
      </p>
      {address && <p>{address}</p>}
      {(contactPhone || contactEmail) && (
        <p>
          {contactPhone && (
            <a href={toTelHref(contactPhone)} dir="ltr" className="underline">
              {contactPhone}
            </a>
          )}
          {contactPhone && contactEmail && " · "}
          {contactEmail && (
            <a href={`mailto:${contactEmail}`} dir="ltr" className="underline">
              {contactEmail}
            </a>
          )}
        </p>
      )}
      <p>
        <Link href="/terms" className="underline">
          תנאי שימוש
        </Link>
        {" · "}
        <Link href="/privacy" className="underline">
          מדיניות פרטיות
        </Link>
        {" · "}
        <Link href="/staff/login" className="underline">
          כניסת צוות
        </Link>
      </p>
    </footer>
  );
}
