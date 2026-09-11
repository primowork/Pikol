"use client";

import { useState } from "react";
import CupIcon from "./CupIcon";
import { STAMPS_REQUIRED } from "@/lib/config";
import type { ActiveCustomer, ApiErrorBody } from "@/types";

interface CustomerActionPanelProps {
  customer: ActiveCustomer;
  onUpdated: (customer: ActiveCustomer) => void;
  onClose: () => void;
}

/**
 * מוצג אחרי שלקוח נמצא (סריקה או חיפוש ידני): הכרטיס שלו + כפתור הוספת
 * חותמת, ומימוש פרס כשרלוונטי. זו הפעולה שבפועל שולחת בקשה מאומתת
 * ל-POST /api/stamps - staffId נגזר בשרת מה-session, לא נשלח מכאן.
 */
export default function CustomerActionPanel({
  customer,
  onUpdated,
  onClose,
}: CustomerActionPanelProps) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function performAction(action: "STAMP" | "REDEEM") {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/stamps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: customer.id, action }),
      });
      const data = await res.json();

      if (!res.ok) {
        const errBody = data as ApiErrorBody;
        setMessage(errBody.error ?? "שגיאה בביצוע הפעולה");
        return;
      }

      onUpdated(data.customer as ActiveCustomer);
      setMessage(action === "STAMP" ? "נוספה חותמת ✓" : "הפרס מומש בהצלחה ✓");
    } catch {
      setMessage("בעיית תקשורת - נסו שוב");
    } finally {
      setBusy(false);
    }
  }

  const filledInRound =
    customer.currentStamps === 0 ? 0 : ((customer.currentStamps - 1) % STAMPS_REQUIRED) + 1;
  const rewardsAvailable = customer.currentStamps >= STAMPS_REQUIRED;

  return (
    <div className="w-full rounded-2xl border border-pikol-tan/40 bg-white/80 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-pikol-brown">{customer.name}</h3>
        <button type="button" onClick={onClose} className="text-sm text-pikol-brown/50 underline">
          סגירה
        </button>
      </div>

      <div className="mt-3 grid grid-cols-5 gap-2">
        {Array.from({ length: STAMPS_REQUIRED }).map((_, index) => (
          <div key={index} className="flex justify-center">
            <CupIcon filled={index < filledInRound} size={32} />
          </div>
        ))}
      </div>

      <p className="mt-2 text-sm text-pikol-brown/70">
        {filledInRound} מתוך {STAMPS_REQUIRED} כוסות
        {customer.rewardsEarned > 0 && ` · מימשו עד היום ${customer.rewardsEarned} פרסים`}
      </p>

      {message && <p className="mt-2 text-sm font-medium text-pikol-brown">{message}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => performAction("STAMP")}
          disabled={busy}
          className="flex-1 rounded-full bg-pikol-brown px-4 py-3 font-semibold text-pikol-cream disabled:opacity-50"
        >
          הוספת חותמת
        </button>
        {rewardsAvailable && (
          <button
            type="button"
            onClick={() => performAction("REDEEM")}
            disabled={busy}
            className="flex-1 rounded-full bg-pikol-gold px-4 py-3 font-semibold text-pikol-brown disabled:opacity-50"
          >
            מימוש פרס
          </button>
        )}
      </div>
    </div>
  );
}
