"use client";

import { useState, type FormEvent } from "react";

type SendState = "idle" | "sending" | "sent" | "error";

/**
 * שידור ידני לכל הלקוחות שנרשמו ל-Web Push (opt-in בכרטיס האישי). שלב
 * ראשון בתשתית לקמפיינים - כרגע רק שליחה ידנית ("יש עוגה טרייה היום"),
 * לא אוטומטית לפי חוסר פעילות (זה דורש החלטה נפרדת על מנגנון תזמון).
 *
 * מאחורי כפתור ולא גלוי כברירת מחדל בדשבורד - זו פעולה שיוצאת בבת אחת
 * לכל הלקוחות, לא משהו שרוצים ליד יד בלחיצה שגרתית באמצע המסך.
 */
export default function BroadcastToCustomers() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [state, setState] = useState<SendState>("idle");
  const [sentCount, setSentCount] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setState("sending");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? "משהו השתבש, נסו שוב");
        setState("error");
        return;
      }

      setSentCount(data.sentCount ?? 0);
      setState("sent");
      setTitle("");
      setBody("");
    } catch {
      setErrorMessage("בעיית תקשורת - נסו שוב");
      setState("error");
    }
  }

  function closeModal() {
    setOpen(false);
    setState("idle");
    setErrorMessage(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-pikol-tan/40 bg-white/60 px-4 py-3 text-sm font-semibold text-pikol-brown"
      >
        שידור הודעה ללקוחות
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-pikol-brown/60 p-6">
          <div className="w-full max-w-sm rounded-3xl bg-pikol-cream p-6 shadow-xl">
            <h2 className="mb-1 text-sm font-semibold text-pikol-brown">שידור הודעה ללקוחות</h2>
            <p className="mb-3 text-xs text-pikol-brown/60">
              נשלח כהתראת Web Push לכל לקוח שהפעיל התראות בכרטיס האישי שלו.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              <input
                type="text"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setState("idle");
                }}
                placeholder="כותרת, למשל: יש עוגה טרייה היום!"
                maxLength={80}
                required
                className="w-full rounded-xl border border-pikol-tan/50 bg-white/70 px-3 py-2 text-sm text-pikol-brown outline-none focus:border-pikol-teal"
              />
              <textarea
                value={body}
                onChange={(event) => {
                  setBody(event.target.value);
                  setState("idle");
                }}
                placeholder="תוכן ההודעה"
                maxLength={200}
                required
                rows={2}
                className="w-full resize-none rounded-xl border border-pikol-tan/50 bg-white/70 px-3 py-2 text-sm text-pikol-brown outline-none focus:border-pikol-teal"
              />
              <button
                type="submit"
                disabled={state === "sending"}
                className="rounded-full bg-pikol-brown px-4 py-2 text-sm font-semibold text-pikol-cream disabled:opacity-60"
              >
                {state === "sending" ? "שולח…" : "שליחה לכל הלקוחות"}
              </button>
            </form>

            {state === "sent" && (
              <p className="mt-2 text-sm text-pikol-teal">
                נשלח ל-{sentCount} {sentCount === 1 ? "לקוח" : "לקוחות"} ✓
              </p>
            )}
            {state === "error" && <p className="mt-2 text-sm text-red-700">{errorMessage}</p>}

            <button
              type="button"
              onClick={closeModal}
              className="mt-3 text-xs text-pikol-brown/50 underline"
            >
              סגירה
            </button>
          </div>
        </div>
      )}
    </>
  );
}
