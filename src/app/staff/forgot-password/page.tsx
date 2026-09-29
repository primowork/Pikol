"use client";

import { useEffect, useState, type FormEvent } from "react";
import Logo from "@/components/Logo";
import BackLink from "@/components/BackLink";
import { BUSINESS_NAME, PASSWORD_RESET_TOKEN_TTL_MINUTES } from "@/lib/config";

const REMEMBERED_USERNAME_KEY = "pikol_staff_username";

/**
 * בקשת קישור איפוס סיסמה למייל ששמור בחשבון. ההודעה אחרי שליחה זהה תמיד
 * (גם כשאין חשבון כזה) - השרת לא מגלה אילו חשבונות קיימים.
 */
export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    function prefillRememberedUsername() {
      try {
        const remembered = window.localStorage.getItem(REMEMBERED_USERNAME_KEY);
        if (remembered) setIdentifier((current) => current || remembered);
      } catch {
        // localStorage חסום - פשוט לא ממלאים מראש
      }
    }
    prefillRememberedUsername();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "משהו השתבש, נסו שוב");
        return;
      }
      setSent(true);
    } catch {
      setError("בעיית תקשורת - נסו שוב");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-6 px-4 py-8">
      <Logo size={80} priority />
      <div className="text-center">
        <h1 className="text-xl font-bold text-pikol-brown">שכחתי סיסמה</h1>
        <p className="text-sm text-pikol-brown/60">{BUSINESS_NAME}</p>
      </div>

      {sent ? (
        <div className="w-full space-y-3 rounded-2xl border border-pikol-teal/40 bg-pikol-teal/10 p-4 text-sm text-pikol-brown">
          <p className="font-semibold">אם יש חשבון עם הפרטים האלה ושמור בו מייל, שלחנו אליו קישור לבחירת סיסמה חדשה.</p>
          <p>
            הקישור תקף ל-{PASSWORD_RESET_TOKEN_TTL_MINUTES} דקות. לא הגיע תוך כמה דקות? כדאי לבדוק
            בתיקיית הספאם.
          </p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="text-pikol-teal underline"
          >
            שליחה שוב
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <p className="text-sm text-pikol-brown/70">
            נשלח קישור לבחירת סיסמה חדשה למייל ששמור בחשבון.
          </p>
          <div>
            <label htmlFor="identifier" className="mb-1 block text-sm font-medium text-pikol-brown">
              שם משתמש או מייל
            </label>
            <input
              id="identifier"
              type="text"
              required
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              dir="ltr"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="w-full rounded-xl border border-pikol-tan/50 bg-white/70 px-4 py-3 text-pikol-brown outline-none focus:border-pikol-teal"
            />
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !identifier.trim()}
            className="w-full rounded-full bg-pikol-brown px-6 py-3 font-semibold text-pikol-cream disabled:opacity-60"
          >
            {submitting ? "שולח…" : "שליחת קישור"}
          </button>

          <p className="text-xs text-pikol-brown/50">
            לא שמור מייל בחשבון? צריך לפנות למי שהתקין את המערכת.
          </p>
        </form>
      )}

      <BackLink href="/staff/login" className="text-sm text-pikol-brown/60 underline">
        חזרה לכניסה
      </BackLink>
    </main>
  );
}
