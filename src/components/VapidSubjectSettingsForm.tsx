"use client";

import { useState, type FormEvent } from "react";

interface VapidSubjectSettingsFormProps {
  initialValue: string;
}

type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * עריכת כתובת ה-subject של VAPID - staff בלבד. זו כתובת קשר טכנית
 * ששירותי ה-push (גוגל, מוזילה וכו') משתמשים בה אם צריך לפנות למי
 * שמפעיל את השרת - לא מוצגת ללקוחות בשום מקום.
 */
export default function VapidSubjectSettingsForm({ initialValue }: VapidSubjectSettingsFormProps) {
  const [value, setValue] = useState(initialValue);
  const [state, setState] = useState<SaveState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setState("saving");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/settings/vapid-subject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vapidSubject: value }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? "משהו השתבש, נסו שוב");
        setState("error");
        return;
      }

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
        <p className="text-sm font-medium text-pikol-brown">כתובת קשר להתראות Push</p>
        <p className="mt-1 text-xs text-pikol-brown/60">
          כתובת טכנית ששירותי ההתראות משתמשים בה אם צריך לפנות אליכם - לא
          מוצגת ללקוחות. פורמט: mailto:example@mail.com או https://
        </p>
      </div>

      <input
        type="text"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setState("idle");
        }}
        placeholder="mailto:info@example.com"
        dir="ltr"
        className="w-full rounded-xl border border-pikol-tan/50 bg-white/70 px-3 py-2 text-sm text-pikol-brown outline-none focus:border-pikol-teal"
      />

      <button
        type="submit"
        disabled={state === "saving" || value.trim().length === 0}
        className="rounded-full bg-pikol-brown px-4 py-3 text-sm font-semibold text-pikol-cream disabled:opacity-60"
      >
        {state === "saving" ? "שומר…" : "שמירה"}
      </button>

      {state === "saved" && <p className="text-sm text-pikol-teal">נשמר בהצלחה ✓</p>}
      {state === "error" && <p className="text-sm text-red-700">{errorMessage}</p>}
    </form>
  );
}
