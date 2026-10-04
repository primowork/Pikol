"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { BUSINESS_NAME, BUSINESS_TAGLINE, MARKETING_MIN_AGE } from "@/lib/config";
import type { ApprovalRequestState } from "@/types";

type Step = "phone" | "name" | "approval";
type ApprovalOutcome = "waiting" | "declined" | "expired";

const POLL_INTERVAL_MS = 3000;

/**
 * טופס חכם אחד שמשמש גם ככניסה וגם כהצטרפות - אין מסך "login" נפרד.
 * שלב ראשון שולח רק טלפון:
 * - מספר חדש: נחשף שדה שם ליצירת כרטיס, יחד עם אישור תקנון המועדון
 *   ומדיניות הפרטיות (חובה) והסכמה לדיוור (רשות, מגיל 18).
 * - מספר רשום: הכרטיס לא נפתח מיד. נוצרת בקשת כניסה שהצוות מאשר בדוכן,
 *   והמסך ממתין לה - כך מי שרק יודע מספר של מישהו לא נכנס לכרטיס שלו.
 *   מכשיר שהכרטיס כבר שמור בו בכלל לא מגיע לכאן (/card מפנה ישר לכרטיס).
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
  const [approvalRequestId, setApprovalRequestId] = useState<string | null>(null);
  const [approvalOutcome, setApprovalOutcome] = useState<ApprovalOutcome>("waiting");

  function handleChangePhone() {
    setStep("phone");
    setError(null);
    setApprovalRequestId(null);
  }

  async function submit() {
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

      if (data.needsApproval) {
        setApprovalRequestId(data.approvalRequestId);
        setApprovalOutcome("waiting");
        setStep("approval");
        setSubmitting(false);
        return;
      }

      // replace: "חזרה" מהכרטיס לא מחזירה לטופס שכבר מולא
      router.replace(`/card/${data.id}`);
    } catch {
      setError("בעיית תקשורת - נסו שוב");
      setSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }

  // ממתינים לאישור הצוות. polling כמו ב-"/scan"; התפוגה נגזרת בשרת.
  useEffect(() => {
    if (step !== "approval" || approvalOutcome !== "waiting" || !approvalRequestId) return;

    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/approval-requests/${approvalRequestId}`, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data: ApprovalRequestState = await res.json();
        if (cancelled || data.status === "PENDING") return;

        if (data.status === "APPROVED" && data.customerId) {
          router.replace(`/card/${data.customerId}`);
          return;
        }
        setApprovalOutcome(data.status === "DECLINED" ? "declined" : "expired");
      } catch {
        // תקלת רשת זמנית - ננסה שוב בפעימה הבאה
      }
    }

    const interval = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [step, approvalOutcome, approvalRequestId, router]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-4 py-8">
      <Logo size={96} priority />
      <div className="text-center">
        <h1 className="text-2xl font-bold text-pikol-brown">{BUSINESS_NAME}</h1>
        <p className="text-sm text-pikol-brown/70">{BUSINESS_TAGLINE}</p>
      </div>

      {step === "approval" ? (
        <div className="w-full space-y-4 text-center text-pikol-brown">
          <h2 className="text-lg font-semibold">יש כבר כרטיס עם המספר הזה</h2>

          {approvalOutcome === "waiting" && (
            <>
              <p className="text-sm text-pikol-brown/80">
                כדי שאף אחד אחר לא ייכנס לכרטיס שלכם, כניסה מטלפון חדש צריכה אישור של הצוות.
                גשו לדוכן ובקשו מהבריסטה לאשר.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-pikol-teal">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-pikol-teal border-t-transparent" />
                ממתינים לאישור…
              </div>
            </>
          )}

          {approvalOutcome === "declined" && (
            <p className="text-sm text-pikol-brown/80">
              הצוות לא אישר את הכניסה. אם זה הכרטיס שלכם, דברו איתם בדוכן ונסו שוב.
            </p>
          )}

          {approvalOutcome === "expired" && (
            <p className="text-sm text-pikol-brown/80">
              הבקשה פגה. כשתהיו בדוכן, נסו שוב והצוות יאשר.
            </p>
          )}

          {error && <p className="text-sm text-red-700">{error}</p>}

          {approvalOutcome !== "waiting" && (
            <button
              type="button"
              disabled={submitting}
              onClick={submit}
              className="w-full rounded-full bg-pikol-brown px-6 py-3 font-semibold text-pikol-cream disabled:opacity-60"
            >
              {submitting ? "רק רגע…" : "נסו שוב"}
            </button>
          )}
          <button type="button" onClick={handleChangePhone} className="text-sm text-pikol-teal underline">
            {approvalOutcome === "waiting" ? "ביטול" : "שינוי מספר"}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <h2 className="text-center text-lg font-semibold text-pikol-brown">
            {step === "phone" ? "כניסה לכרטיס שלכם" : "כרטיס חדש - איך קוראים לכם?"}
          </h2>
          {step === "phone" && (
            <p className="text-center text-xs text-pikol-brown/60">
              כבר יש לכם כרטיס? הזינו את אותו הטלפון, והצוות יאשר את הכניסה מהטלפון הזה.
            </p>
          )}

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="phone" className="block text-sm font-medium text-pikol-brown">
                מספר טלפון
              </label>
              {step === "name" && (
                <button type="button" onClick={handleChangePhone} className="text-xs text-pikol-teal underline">
                  שינוי מספר
                </button>
              )}
            </div>
            <input
              id="phone"
              type="tel"
              required
              dir="ltr"
              inputMode="tel"
              autoComplete="tel"
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
                autoComplete="name"
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
                  קראתי ואני מאשר/ת את{" "}
                  <Link href="/terms" target="_blank" className="text-pikol-teal underline">
                    תקנון המועדון
                  </Link>{" "}
                  ואת{" "}
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
                  אני מעל גיל {MARKETING_MIN_AGE} ומאשר/ת לקבל עדכונים, הטבות ומבצעים מבית הקפה.
                  אפשר להסיר בכל עת.
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
      )}
    </main>
  );
}
