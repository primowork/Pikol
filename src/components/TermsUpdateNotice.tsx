"use client";

import { useState } from "react";
import Link from "next/link";
import { TERMS_VERSION_LABEL } from "@/lib/config";
import { getTermsUpdateNotes } from "@/lib/club-terms";

interface TermsUpdateNoticeProps {
  customerId: string;
}

/**
 * פס בכרטיס ללקוח שאישר גרסה קודמת של תקנון המועדון (או הצטרף לפני
 * שהתחלנו לשמור גרסה): מה השתנה, קישור לתקנון, ואישור שנרשם ביומן
 * ההסכמות עם הגרסה. הפס הוא גם ההודעה על השינויים - אין כפתור סגירה בלי
 * אישור, והכרטיס ממשיך לעבוד כרגיל גם בלעדיו.
 */
export default function TermsUpdateNotice({ customerId }: TermsUpdateNoticeProps) {
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const notes = getTermsUpdateNotes();

  async function approve() {
    setStatus("saving");
    try {
      const res = await fetch(`/api/customers/${customerId}/terms`, { method: "POST" });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return <p className="text-sm text-pikol-teal">תודה! אישרת את תקנון המועדון המעודכן.</p>;
  }

  return (
    <div className="w-full rounded-2xl border border-pikol-gold/60 bg-pikol-gold/10 p-4 text-right text-sm text-pikol-brown">
      <p className="font-semibold">עדכנו את תקנון המועדון ({TERMS_VERSION_LABEL})</p>
      {notes.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pr-5">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={approve}
          disabled={status === "saving"}
          className="rounded-full bg-pikol-brown px-4 py-2 font-semibold text-pikol-cream disabled:opacity-60"
        >
          {status === "saving" ? "רק רגע…" : "קראתי ואני מאשר/ת"}
        </button>
        <Link href="/terms" target="_blank" className="text-pikol-teal underline">
          לצפייה בתקנון
        </Link>
      </div>
      {status === "error" && <p className="mt-2 text-red-700">משהו השתבש, נסו שוב</p>}
    </div>
  );
}
