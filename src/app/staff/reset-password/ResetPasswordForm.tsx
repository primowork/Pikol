"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import PasswordInput from "@/components/PasswordInput";
import { BUSINESS_NAME, PASSWORD_MIN_LENGTH } from "@/lib/config";
import { STAFF_HOME_PATH } from "@/lib/staff-paths";

interface ResetPasswordFormProps {
  token: string;
}

/**
 * בחירת סיסמה חדשה מקישור במייל. בהצלחה השרת כבר מחבר את המכשיר, ועוברים
 * לדשבורד עם replace - כתובת הקישור (עם הטוקן) לא נשארת בהיסטוריה.
 */
export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [linkInvalid, setLinkInvalid] = useState(!token);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password !== confirmation) {
      setError("שתי הסיסמאות לא זהות");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "משהו השתבש, נסו שוב");
        if (data.code === "invalid_token") setLinkInvalid(true);
        setSubmitting(false);
        return;
      }

      setDone(true);
      window.setTimeout(() => router.replace(STAFF_HOME_PATH), 1500);
    } catch {
      setError("בעיית תקשורת - נסו שוב");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-6 px-4 py-8">
      <Logo size={80} priority />
      <div className="text-center">
        <h1 className="text-xl font-bold text-pikol-brown">בחירת סיסמה חדשה</h1>
        <p className="text-sm text-pikol-brown/60">{BUSINESS_NAME}</p>
      </div>

      {done ? (
        <p className="w-full rounded-2xl border border-pikol-teal/40 bg-pikol-teal/10 p-4 text-center text-sm font-semibold text-pikol-brown">
          הסיסמה עודכנה ✓ עוברים לדשבורד…
        </p>
      ) : linkInvalid ? (
        <div className="w-full space-y-3 text-center text-sm text-pikol-brown">
          <p>{error ?? "הקישור לא שלם. כדאי לפתוח אותו שוב מהמייל, או לבקש קישור חדש."}</p>
          <Link
            href="/staff/forgot-password"
            replace
            className="inline-block rounded-full bg-pikol-brown px-6 py-3 font-semibold text-pikol-cream"
          >
            בקשת קישור חדש
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-pikol-brown">
              סיסמה חדשה
            </label>
            <PasswordInput
              id="new-password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              minLength={PASSWORD_MIN_LENGTH}
            />
            <p className="mt-1 text-xs text-pikol-brown/60">לפחות {PASSWORD_MIN_LENGTH} תווים</p>
          </div>

          <div>
            <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-pikol-brown">
              שוב, לאימות
            </label>
            <PasswordInput
              id="confirm-password"
              value={confirmation}
              onChange={setConfirmation}
              autoComplete="new-password"
              minLength={PASSWORD_MIN_LENGTH}
            />
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-pikol-brown px-6 py-3 font-semibold text-pikol-cream disabled:opacity-60"
          >
            {submitting ? "שומר…" : "שמירת הסיסמה"}
          </button>
        </form>
      )}
    </main>
  );
}
