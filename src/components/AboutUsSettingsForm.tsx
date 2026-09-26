"use client";

import { useState, type FormEvent } from "react";

interface AboutUsSettingsFormProps {
  initialText: string;
}

type SaveState = "idle" | "saving" | "saved" | "error";

/** עריכת הטקסט שמוצג בפופ-אפ "קצת עלינו" בכרטיס הלקוח - staff בלבד. */
export default function AboutUsSettingsForm({ initialText }: AboutUsSettingsFormProps) {
  const [text, setText] = useState(initialText);
  const [state, setState] = useState<SaveState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setState("saving");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/settings/about-us", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aboutUsText: text }),
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
        <p className="text-sm font-medium text-pikol-brown">
          הפסקה שמוצגת בכפתור &quot;עלינו&quot; בכרטיס הלקוח
        </p>
        <p className="mt-1 text-xs text-pikol-brown/60">שורה ריקה מפרידה בין פסקאות</p>
      </div>

      <textarea
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setState("idle");
        }}
        rows={12}
        maxLength={4000}
        className="w-full rounded-xl border border-pikol-tan/50 bg-white/70 px-3 py-2 text-sm leading-relaxed text-pikol-brown outline-none focus:border-pikol-teal"
      />

      <button
        type="submit"
        disabled={state === "saving" || text.trim().length === 0}
        className="rounded-full bg-pikol-brown px-4 py-3 text-sm font-semibold text-pikol-cream disabled:opacity-60"
      >
        {state === "saving" ? "שומר…" : "שמירה"}
      </button>

      {state === "saved" && <p className="text-sm text-pikol-teal">נשמר בהצלחה ✓</p>}
      {state === "error" && <p className="text-sm text-red-700">{errorMessage}</p>}
    </form>
  );
}
