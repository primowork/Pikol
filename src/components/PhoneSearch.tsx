"use client";

import { useState, type FormEvent } from "react";
import type { CustomerSearchResult } from "@/types";

interface PhoneSearchProps {
  onFound: (customer: CustomerSearchResult) => void;
}

/** חיפוש ידני לפי טלפון - fallback כשסריקת המצלמה לא זמינה/נוחה. */
export default function PhoneSearch({ onFound }: PhoneSearchProps) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSearching(true);

    try {
      const res = await fetch(`/api/customers?phone=${encodeURIComponent(phone)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "שגיאה בחיפוש");
        return;
      }

      if (!data.customers || data.customers.length === 0) {
        setError("לא נמצא לקוח עם מספר הטלפון הזה");
        return;
      }

      onFound(data.customers[0]);
      setPhone("");
    } catch {
      setError("בעיית תקשורת - נסו שוב");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="tel"
          dir="ltr"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="חיפוש לפי מספר טלפון"
          className="flex-1 rounded-xl border border-pikol-tan/50 bg-white/70 px-4 py-2 text-pikol-brown outline-none focus:border-pikol-teal"
        />
        <button
          type="submit"
          disabled={searching || !phone}
          className="rounded-xl bg-pikol-brown px-4 py-2 font-semibold text-pikol-cream disabled:opacity-50"
        >
          חיפוש
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
