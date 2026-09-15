"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { BUSINESS_NAME, BUSINESS_TAGLINE } from "@/lib/config";

export default function JoinPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "משהו השתבש, נסו שוב");
        setSubmitting(false);
        return;
      }

      router.push(`/card/${data.id}`);
    } catch {
      setError("בעיית תקשורת - נסו שוב");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-4 py-8">
      <Logo size={96} priority />
      <div className="text-center">
        <h1 className="text-2xl font-bold text-pikol-brown">{BUSINESS_NAME}</h1>
        <p className="text-sm text-pikol-brown/70">{BUSINESS_TAGLINE}</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <h2 className="text-center text-lg font-semibold text-pikol-brown">
          הצטרפות למועדון
        </h2>

        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-pikol-brown">
            שם מלא
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-xl border border-pikol-tan/50 bg-white/70 px-4 py-3 text-pikol-brown outline-none focus:border-pikol-teal"
            placeholder="לדוגמה: דנה כהן"
          />
        </div>

        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium text-pikol-brown">
            מספר טלפון
          </label>
          <input
            id="phone"
            type="tel"
            required
            dir="ltr"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="w-full rounded-xl border border-pikol-tan/50 bg-white/70 px-4 py-3 text-pikol-brown outline-none focus:border-pikol-teal"
            placeholder="050-1234567"
          />
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-pikol-brown px-6 py-3 font-semibold text-pikol-cream disabled:opacity-60"
        >
          {submitting ? "רק רגע…" : "יצירת הכרטיס שלי"}
        </button>
      </form>
    </main>
  );
}
