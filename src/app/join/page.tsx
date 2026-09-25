"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { BUSINESS_NAME, BUSINESS_TAGLINE } from "@/lib/config";

type Step = "phone" | "name";

/**
 * טופס חכם אחד שמשמש גם ככניסה וגם כהצטרפות - אין מסך "login" נפרד.
 * שלב ראשון שולח רק טלפון: אם הוא כבר רשום, המשתמש עובר ישר לכרטיס
 * הקיים בלי לשאול שם. אם לא - נחשף שדה שם ליצירת כרטיס חדש, יחד עם
 * הסכמה לתנאי השימוש/מדיניות הפרטיות (חובה) והסכמה לדיוור (אופציונלי) -
 * לקוח קיים שחוזר לא מתבקש להסכים שוב.
 */
export default function JoinPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
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
        body: JSON.stringify(
          step === "name" ? { name, phone, termsAccepted, marketingOptIn } : { phone }
        ),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "משהו השתבש, נסו שוב");
        setSubmitting(false);
        return;
      }

      if (data.needsName) {
        setStep("name");
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
          {step === "phone" ? "כניסה לכרטיס שלכם" : "כרטיס חדש - איך קוראים לכם?"}
        </h2>
        {step === "phone" && (
          <p className="text-center text-xs text-pikol-brown/60">
            כבר יש לכם כרטיס? הזינו את אותו הטלפון ותועברו אליו ישירות.
          </p>
        )}

        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium text-pikol-brown">
            מספר טלפון
          </label>
          <input
            id="phone"
            type="tel"
            required
            dir="ltr"
            disabled={step === "name"}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="w-full rounded-xl border border-pikol-tan/50 bg-white/70 px-4 py-3 text-pikol-brown outline-none focus:border-pikol-teal disabled:opacity-60"
            placeholder="050-1234567"
          />
        </div>

        {step === "name" && (
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-pikol-brown">
              שם מלא
            </label>
            <input
              id="name"
              type="text"
              required
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl border border-pikol-tan/50 bg-white/70 px-4 py-3 text-pikol-brown outline-none focus:border-pikol-teal"
              placeholder="לדוגמה: דנה כהן"
            />
          </div>
        )}

        {step === "name" && (
          <div className="space-y-2 text-sm text-pikol-brown">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                required
                checked={termsAccepted}
                onChange={(event) => setTermsAccepted(event.target.checked)}
                className="mt-0.5"
              />
              <span>
                אני מאשר/ת את{" "}
                <Link href="/terms" target="_blank" className="text-pikol-teal underline">
                  תנאי השימוש
                </Link>{" "}
                ו
                <Link href="/privacy" target="_blank" className="text-pikol-teal underline">
                  מדיניות הפרטיות
                </Link>
                , ומסכים/ה לשמירת פרטיי במאגר המידע של {BUSINESS_NAME}.
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={marketingOptIn}
                onChange={(event) => setMarketingOptIn(event.target.checked)}
                className="mt-0.5"
              />
              <span>
                מאשר/ת קבלת עדכונים, הטבות מותאמות אישית ומבצעים מבית הקפה (ניתן להסיר בכל עת).
              </span>
            </label>
          </div>
        )}

        {error && <p className="text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={submitting || (step === "name" && !termsAccepted)}
          className="w-full rounded-full bg-pikol-brown px-6 py-3 font-semibold text-pikol-cream disabled:opacity-60"
        >
          {submitting ? "רק רגע…" : step === "phone" ? "המשך" : "יצירת הכרטיס שלי"}
        </button>
      </form>
    </main>
  );
}
