"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { BUSINESS_NAME } from "@/lib/config";
import { staffFetch } from "@/lib/staff-fetch";
import { useBackToClose } from "@/lib/use-back-to-close";
import type { BroadcastAudience, CustomerBroadcastResult } from "@/types";

type Step = "compose" | "preview" | "sent";

/** "ללקוח אחד" / "ל-3 לקוחות" - בלי "ל-1 לקוחות". */
function toCount(count: number, one: string, many: string) {
  return count === 1 ? `ל${one}` : `ל-${count} ${many}`;
}

/**
 * שידור ידני לכל הלקוחות שנרשמו ל-Web Push (opt-in בכרטיס האישי). שלב
 * ראשון בתשתית לקמפיינים - כרגע רק שליחה ידנית ("יש עוגה טרייה היום"),
 * לא אוטומטית לפי חוסר פעילות (זה דורש החלטה נפרדת על מנגנון תזמון).
 *
 * מאחורי כפתור ולא גלוי כברירת מחדל בדשבורד - זו פעולה שיוצאת בבת אחת
 * לכל הלקוחות, לא משהו שרוצים ליד יד בלחיצה שגרתית באמצע המסך. מאותה
 * סיבה יש שלב תצוגה מקדימה לפני השליחה הסופית: איך ההתראה תיראה, וכמה
 * לקוחות יקבלו אותה (נבדק מול השרת בפתיחת החלון).
 */
export default function BroadcastToCustomers() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("compose");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<number | null>(null);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [audienceError, setAudienceError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<CustomerBroadcastResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function openModal() {
    setOpen(true);
    setStep("compose");
    setResult(null);
    setErrorMessage(null);
    setAudience(null);
    setAudienceError(null);
    setAudienceLoading(true);

    try {
      const res = await staffFetch("/api/broadcast");
      const data = await res.json();
      if (!res.ok) {
        setAudienceError(data.error ?? "לא הצלחנו לבדוק כמה לקוחות רשומים להתראות");
        return;
      }
      setAudience((data as BroadcastAudience).customerCount);
    } catch {
      setAudienceError("בעיית תקשורת - לא הצלחנו לבדוק כמה לקוחות רשומים להתראות");
    } finally {
      setAudienceLoading(false);
    }
  }

  function closeModal() {
    setOpen(false);
    setStep("compose");
    setErrorMessage(null);
  }

  useBackToClose(open, closeModal);

  function handlePreview(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !body.trim()) {
      setErrorMessage("יש למלא כותרת ותוכן");
      return;
    }
    setErrorMessage(null);
    setStep("preview");
  }

  async function handleSend() {
    setSending(true);
    setErrorMessage(null);

    try {
      const res = await staffFetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? "משהו השתבש, נסו שוב");
        return;
      }

      setResult(data as CustomerBroadcastResult);
      setStep("sent");
      setTitle("");
      setBody("");
    } catch {
      setErrorMessage("בעיית תקשורת - נסו שוב");
    } finally {
      setSending(false);
    }
  }

  function renderAudience() {
    if (audienceLoading) {
      return <p className="text-xs text-pikol-brown/60">בודקים כמה לקוחות הפעילו התראות…</p>;
    }
    if (audienceError) {
      return <p className="text-xs text-red-700">{audienceError}</p>;
    }
    if (audience === null) return null;
    if (audience === 0) {
      return (
        <div className="rounded-xl bg-pikol-gold/15 p-3 text-xs text-pikol-brown">
          <p className="font-semibold">
            עדיין אף לקוח לא הפעיל התראות, אז כרגע ההודעה לא תגיע לאף אחד.
          </p>
          <p className="mt-1">
            לקוח מצטרף בלחיצה על &quot;הפעלת התראות על מבצעים ועדכונים&quot; בכרטיס האישי
            שלו. באייפון זה אפשרי רק אחרי שמוסיפים את הכרטיס למסך הבית.
          </p>
        </div>
      );
    }
    return (
      <p className="text-xs text-pikol-brown/60">
        {audience === 1
          ? "ההודעה תישלח ללקוח אחד שהפעיל התראות בכרטיס שלו."
          : `ההודעה תישלח ל-${audience} לקוחות שהפעילו התראות בכרטיס שלהם.`}
      </p>
    );
  }

  function renderResult(sendResult: CustomerBroadcastResult) {
    const nobodyToSend =
      sendResult.sentCount === 0 && sendResult.failedCount === 0 && sendResult.removedCount === 0;

    return (
      <div className="flex flex-col gap-2">
        {sendResult.sentCount > 0 ? (
          <p className="text-sm font-semibold text-pikol-teal">
            נשלח {toCount(sendResult.sentCount, "לקוח אחד", "לקוחות")} ✓
          </p>
        ) : (
          <p className="text-sm font-semibold text-pikol-brown">
            {nobodyToSend
              ? "לא נשלח לאף אחד - עדיין אין לקוחות שהפעילו התראות."
              : "ההודעה לא הגיעה לאף לקוח."}
          </p>
        )}

        {sendResult.failedCount > 0 && (
          <div className="rounded-xl bg-red-50 p-3 text-xs text-red-800">
            <p>
              שירות ההתראות דחה את השליחה {toCount(sendResult.failedCount, "מכשיר אחד", "מכשירים")}.
              אם זה חוזר בכל שידור, כנראה שמפתחות ה-VAPID בשרת הוחלפו מאז שהלקוחות
              נרשמו, והם צריכים להפעיל התראות מחדש בכרטיס.
            </p>
            {sendResult.failureReason && (
              <p dir="ltr" className="mt-1 break-words text-left font-mono text-[11px]">
                {sendResult.failureReason}
              </p>
            )}
          </div>
        )}

        {sendResult.removedCount > 0 && (
          <p className="text-xs text-pikol-brown/60">
            {sendResult.removedCount === 1
              ? "מכשיר אחד ביטל את ההרשמה והוסר מהרשימה."
              : `${sendResult.removedCount} מכשירים ביטלו את ההרשמה והוסרו מהרשימה.`}
          </p>
        )}
      </div>
    );
  }

  const heading =
    step === "preview" ? "תצוגה מקדימה" : step === "sent" ? "סיכום השליחה" : "שידור הודעה ללקוחות";

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="w-full rounded-2xl border border-pikol-tan/40 bg-white/60 px-4 py-3 text-sm font-semibold text-pikol-brown"
      >
        שידור הודעה ללקוחות
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-pikol-brown/60 p-6"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={heading}
            className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-3xl bg-pikol-cream p-6 shadow-xl"
          >
            <h2 className="mb-3 text-sm font-semibold text-pikol-brown">{heading}</h2>

            {step === "compose" && (
              <form onSubmit={handlePreview} className="flex flex-col gap-2">
                {renderAudience()}
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="כותרת, למשל: יש עוגה טרייה היום!"
                  maxLength={80}
                  required
                  className="w-full rounded-xl border border-pikol-tan/50 bg-white/70 px-3 py-2 text-sm text-pikol-brown outline-none focus:border-pikol-teal"
                />
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="תוכן ההודעה"
                  maxLength={200}
                  required
                  rows={2}
                  className="w-full resize-none rounded-xl border border-pikol-tan/50 bg-white/70 px-3 py-2 text-sm text-pikol-brown outline-none focus:border-pikol-teal"
                />
                {errorMessage && <p className="text-sm text-red-700">{errorMessage}</p>}
                <button
                  type="submit"
                  className="rounded-full bg-pikol-brown px-4 py-2 text-sm font-semibold text-pikol-cream"
                >
                  תצוגה מקדימה
                </button>
              </form>
            )}

            {step === "preview" && (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-pikol-brown/60">כך ההודעה תיראה אצל הלקוחות:</p>

                <div className="flex items-start gap-3 rounded-2xl border border-pikol-tan/30 bg-white p-3 shadow-sm">
                  <Image
                    src="/icons/icon-192.png"
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 shrink-0 rounded-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-pikol-brown/50">{BUSINESS_NAME} · עכשיו</p>
                    <p className="break-words text-sm font-semibold text-pikol-brown">{title.trim()}</p>
                    <p className="whitespace-pre-line break-words text-sm text-pikol-brown/80">
                      {body.trim()}
                    </p>
                  </div>
                </div>

                {renderAudience()}
                {errorMessage && <p className="text-sm text-red-700">{errorMessage}</p>}

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || audience === 0}
                  className="rounded-full bg-pikol-brown px-4 py-3 text-sm font-semibold text-pikol-cream disabled:opacity-60"
                >
                  {sending ? "שולח…" : "שליחה סופית"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("compose");
                    setErrorMessage(null);
                  }}
                  disabled={sending}
                  className="rounded-full border border-pikol-tan/60 px-4 py-2 text-sm text-pikol-brown disabled:opacity-60"
                >
                  חזרה לעריכה
                </button>
              </div>
            )}

            {step === "sent" && result && renderResult(result)}

            <button
              type="button"
              onClick={closeModal}
              disabled={sending}
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
