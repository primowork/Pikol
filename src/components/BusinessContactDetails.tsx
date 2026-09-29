import { BUSINESS_NAME } from "@/lib/config";
import { toTelHref } from "@/lib/phone";
import type { BusinessDetails } from "@/types";

interface BusinessContactDetailsProps {
  details: BusinessDetails;
}

/** פרטי בית הקפה ודרכי הפנייה אליו, במדיניות הפרטיות ובתנאי השימוש. */
export default function BusinessContactDetails({ details }: BusinessContactDetailsProps) {
  const { legalName, businessNumber, address, contactPhone, contactEmail } = details;
  const hasContact = Boolean(address || contactPhone || contactEmail);

  return (
    <div className="mt-2 rounded-xl border border-pikol-tan/40 bg-white/60 p-3">
      <p className="font-semibold">{legalName ?? BUSINESS_NAME}</p>
      {businessNumber && (
        <p>
          מספר עוסק: <span dir="ltr">{businessNumber}</span>
        </p>
      )}
      {address && <p>כתובת: {address}</p>}
      {contactPhone && (
        <p>
          טלפון:{" "}
          <a href={toTelHref(contactPhone)} dir="ltr" className="text-pikol-teal underline">
            {contactPhone}
          </a>
        </p>
      )}
      {contactEmail && (
        <p>
          מייל:{" "}
          <a href={`mailto:${contactEmail}`} dir="ltr" className="text-pikol-teal underline">
            {contactEmail}
          </a>
        </p>
      )}
      {!hasContact && <p>אפשר לפנות אלינו ישירות בבית הקפה.</p>}
    </div>
  );
}
