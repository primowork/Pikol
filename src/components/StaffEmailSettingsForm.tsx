"use client";

import { useState, type FormEvent } from "react";
import { staffFetch } from "@/lib/staff-fetch";

interface StaffEmailSettingsFormProps {
  initialEmail: string;
  /** האם השרת יכול לשלוח מיילים בכלל (BREVO_API_KEY + EMAIL_FROM). */
  emailConfigured: boolean;
}

type SaveState = "idle" | "saving" | "saved" | "error";

/** המייל של המחובר, שאליו יישלח קישור איפוס אם הסיסמה תישכח. */
export default function StaffEmailSettingsForm({ initialEmail, emailConfigured }: StaffEmailSettingsFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [state, setState] = useState<SaveState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setState("saving");
    setErrorMessage(null);

    try {
      const res = await staffFetch("/api/auth/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? "משהו השתבש, נסו שוב");
        setState("error");
        return;
      }

      setEmail(data.email ?? "");
      setState("saved");
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
        <p className="text-sm font-medium text-pikol-brown">המייל שלך לשחזור סיסמה</p>
        <p className="mt-1 text-xs text-pikol-brown/60">
          אם הסיסמה תישכח, קישור לבחירת סיסמה חדשה יישלח לכתובת הזו. היא לא מוצגת ללקוחות.
        </p>
      </div>

      {!emailConfigured && (
        <p className="rounded-xl bg-pikol-gold/15 p-3 text-xs text-pikol-brown">
          שליחת מיילים עוד לא הוגדרה בשרת, ולכן כרגע קישור איפוס לא יישלח בפועל. אפשר לשמור את
          המייל כבר עכשיו. חסרים בשרת המשתנים:{" "}
          <span dir="ltr" className="font-mono">
            BREVO_API_KEY, EMAIL_FROM
          </span>
        </p>
      )}

      <input
        type="email"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          setState("idle");
        }}
        placeholder="name@example.com"
        autoComplete="email"
        dir="ltr"
        className="w-full rounded-xl border border-pikol-tan/50 bg-white/70 px-3 py-2 text-sm text-pikol-brown outline-none focus:border-pikol-teal"
      />

      <button
        type="submit"
        disabled={state === "saving"}
        className="rounded-full bg-pikol-brown px-4 py-3 text-sm font-semibold text-pikol-cream disabled:opacity-60"
      >
        {state === "saving" ? "שומר…" : "שמירה"}
      </button>

      {state === "saved" && (
        <p className="text-sm text-pikol-teal">{email ? "נשמר בהצלחה ✓" : "המייל הוסר ✓"}</p>
      )}
      {state === "error" && <p className="text-sm text-red-700">{errorMessage}</p>}
    </form>
  );
}
