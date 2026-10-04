"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { staffFetch } from "@/lib/staff-fetch";
import type { BusinessDetails } from "@/types";

interface BusinessDetailsSettingsFormProps {
  initialDetails: BusinessDetails;
}

type SaveState = "idle" | "saving" | "saved" | "error";

type FieldName = keyof BusinessDetails;

const FIELDS: { name: FieldName; label: string; placeholder: string; ltr?: boolean; type?: string }[] = [
  { name: "legalName", label: "שם העסק הרשום", placeholder: "כמו ברישום במע\"מ, למשל: ישראל ישראלי" },
  { name: "businessNumber", label: "מספר עוסק או ח.פ.", placeholder: "123456789", ltr: true },
  { name: "address", label: "כתובת", placeholder: "רחוב, מספר, עיר" },
  { name: "contactPhone", label: "טלפון ליצירת קשר", placeholder: "03-1234567", ltr: true, type: "tel" },
  { name: "contactEmail", label: "מייל ליצירת קשר", placeholder: "info@example.com", ltr: true, type: "email" },
];

function toFormValues(details: BusinessDetails): Record<FieldName, string> {
  return {
    legalName: details.legalName ?? "",
    businessNumber: details.businessNumber ?? "",
    address: details.address ?? "",
    contactPhone: details.contactPhone ?? "",
    contactEmail: details.contactEmail ?? "",
  };
}

/**
 * פרטי העסק שמוצגים ללקוחות - staff בלבד. בית הקפה הוא בעל השליטה במאגר
 * והמפרסם בשידורים, ולכן חוק הגנת הפרטיות וחוק הספאם דורשים שהלקוחות
 * יידעו מי הוא ואיך פונים אליו.
 */
export default function BusinessDetailsSettingsForm({ initialDetails }: BusinessDetailsSettingsFormProps) {
  const router = useRouter();
  const [values, setValues] = useState(() => toFormValues(initialDetails));
  const [state, setState] = useState<SaveState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setState("saving");
    setErrorMessage(null);

    try {
      const res = await staffFetch("/api/settings/business-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? "משהו השתבש, נסו שוב");
        setState("error");
        return;
      }

      setValues(toFormValues(data as BusinessDetails));
      setState("saved");
      // מנקה את מטמון הניווט: "חזרה לדשבורד" שחזרה את המסך הקודם הציגה עדיין
      // את התזכורת "חסרים פרטי העסק" גם אחרי שמילאו אותם
      router.refresh();
    } catch {
      setErrorMessage("בעיית תקשורת - נסו שוב");
      setState("error");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-3 rounded-2xl border border-pikol-tan/40 bg-white/60 p-4"
    >
      <div>
        <p className="text-sm font-medium text-pikol-brown">פרטי העסק</p>
        <p className="mt-1 text-xs text-pikol-brown/60">
          מוצגים ללקוחות בתחתית הכרטיס, במדיניות הפרטיות ובתקנון המועדון, והטלפון גם בסוף כל
          הודעת שידור. החוק מחייב שהלקוחות יידעו מי אחראי על המידע שלהם ועל ההודעות שהם מקבלים.
        </p>
      </div>

      {FIELDS.map((field) => (
        <label key={field.name} className="flex flex-col gap-1 text-xs text-pikol-brown/70">
          {field.label}
          <input
            type={field.type ?? "text"}
            value={values[field.name]}
            onChange={(event) => {
              setValues((prev) => ({ ...prev, [field.name]: event.target.value }));
              setState("idle");
            }}
            placeholder={field.placeholder}
            dir={field.ltr ? "ltr" : undefined}
            className="w-full rounded-xl border border-pikol-tan/50 bg-white/70 px-3 py-2 text-sm text-pikol-brown outline-none focus:border-pikol-teal"
          />
        </label>
      ))}

      <button
        type="submit"
        disabled={state === "saving"}
        className="rounded-full bg-pikol-brown px-4 py-3 text-sm font-semibold text-pikol-cream disabled:opacity-60"
      >
        {state === "saving" ? "שומר…" : "שמירה"}
      </button>

      {state === "saved" && <p className="text-sm text-pikol-teal">נשמר בהצלחה ✓</p>}
      {state === "error" && <p className="text-sm text-red-700">{errorMessage}</p>}
    </form>
  );
}
