"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import PasswordInput from "@/components/PasswordInput";
import { BUSINESS_NAME } from "@/lib/config";

interface LoginFormProps {
  /** לאן לעבור אחרי כניסה (כבר עבר safeStaffNextPath בשרת). */
  nextPath: string;
}

const REMEMBERED_USERNAME_KEY = "pikol_staff_username";

/**
 * טופס כניסת צוות. אחרי כניסה מוצלחת עוברים עם router.replace ולא push:
 * עמוד הכניסה לא נשאר בהיסטוריה, ולכן "חזרה" מהדשבורד לא מחזירה למסך
 * הסיסמה (זה היה הבאג - החלקה אחורה בתוך העסק הקפיצה שוב לסיסמה).
 *
 * "להישאר מחובר" מסומן כברירת מחדל: session של חודש שמתחדש בכל שימוש.
 * שם המשתמש נשמר במכשיר (לא הסיסמה - אותה שומר מנהל הסיסמאות של הדפדפן).
 */
export default function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const passwordRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    function restoreRememberedUsername() {
      let remembered: string | null = null;
      try {
        remembered = window.localStorage.getItem(REMEMBERED_USERNAME_KEY);
      } catch {
        remembered = null;
      }
      if (!remembered) return;
      setUsername((current) => current || remembered);
      passwordRef.current?.focus();
    }
    restoreRememberedUsername();
  }, []);

  // השרת כבר מפנה מכאן מכשיר מחובר, אבל "חזרה" בדפדפן יכולה להציג את
  // הטופס מהמטמון בלי לשאול את השרת - לכן בודקים שוב גם מכאן.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.authenticated) router.replace(nextPath);
      })
      .catch(() => {
        // אם הבדיקה נכשלה פשוט נשארים בטופס
      });
    return () => {
      cancelled = true;
    };
  }, [router, nextPath]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, remember }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "שגיאה בהתחברות");
        setSubmitting(false);
        return;
      }

      try {
        if (remember) {
          window.localStorage.setItem(REMEMBERED_USERNAME_KEY, username.trim());
        } else {
          window.localStorage.removeItem(REMEMBERED_USERNAME_KEY);
        }
      } catch {
        // localStorage חסום - לא קריטי, רק שם המשתמש לא ימולא בפעם הבאה
      }

      router.replace(nextPath);
    } catch {
      setError("בעיית תקשורת - נסו שוב");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-6 px-4 py-8">
      <Logo size={80} priority />
      <div className="text-center">
        <h1 className="text-xl font-bold text-pikol-brown">כניסת צוות</h1>
        <p className="text-sm text-pikol-brown/60">{BUSINESS_NAME}</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div>
          <label htmlFor="username" className="mb-1 block text-sm font-medium text-pikol-brown">
            שם משתמש
          </label>
          <input
            id="username"
            type="text"
            required
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            dir="ltr"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="w-full rounded-xl border border-pikol-tan/50 bg-white/70 px-4 py-3 text-pikol-brown outline-none focus:border-pikol-teal"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-pikol-brown">
            סיסמה
          </label>
          <PasswordInput
            id="password"
            inputRef={passwordRef}
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-pikol-brown">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="h-4 w-4"
          />
          להישאר מחובר במכשיר הזה
        </label>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-pikol-brown px-6 py-3 font-semibold text-pikol-cream disabled:opacity-60"
        >
          {submitting ? "מתחבר…" : "כניסה"}
        </button>
      </form>

      <Link href="/staff/forgot-password" className="text-sm text-pikol-teal underline">
        שכחתי סיסמה
      </Link>
    </main>
  );
}
