"use client";

import { useEffect, useRef, useState } from "react";
import type { ActiveCustomer, PendingApprovalRequest } from "@/types";

interface PendingApprovalsListProps {
  onApproved: (customer: ActiveCustomer) => void;
}

const POLL_INTERVAL_MS = 6000;

function quantityLabel(quantity: number): string {
  return quantity === 1 ? "ניקוב אחד" : `${quantity} ניקובים`;
}

function requestLabel(request: PendingApprovalRequest): string {
  return request.kind === "REDEEM" ? "מבקש/ת לממש את הפרס" : `מבקש/ת ${quantityLabel(request.quantity)}`;
}

/**
 * בקשות אישור ממתינות: רשימה קומפקטית (fallback למקרה שההתראה עצמה לא
 * הגיעה) ומעליה פופ-אפ מסך מלא עם כפתורי ענק - הצוות עובד בלחץ ליד
 * המכונה, אין זמן להרים טלפון ולהסתכל מקרוב על שורה קטנה. לא מרנדר
 * כלום כשאין בקשות ממתינות.
 */
export default function PendingApprovalsList({ onApproved }: PendingApprovalsListProps) {
  const [requests, setRequests] = useState<PendingApprovalRequest[]>([]);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/approval-requests", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const incoming: PendingApprovalRequest[] = data.requests ?? [];

        const hasNewRequest = incoming.some((request) => !seenIdsRef.current.has(request.id));
        incoming.forEach((request) => seenIdsRef.current.add(request.id));
        if (hasNewRequest && typeof navigator !== "undefined" && "vibrate" in navigator) {
          try {
            // דפוס דחוף, שונה בכוונה מדפוסי StampCard.tsx (ניקוב/השלמת כרטיסייה)
            navigator.vibrate([300, 150, 300]);
          } catch {
            // best effort - לא כל דפדפן/מכשיר תומך
          }
        }

        setRequests(incoming);
      } catch {
        // תקלת רשת זמנית - ננסה שוב בפעימה הבאה
      }
    }

    poll();
    const interval = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  async function respond(id: string, action: "approve" | "decline") {
    setPendingActionId(id);
    try {
      const res = await fetch(`/api/approval-requests/${id}/${action}`, { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        setRequests((prev) => prev.filter((request) => request.id !== id));
        if (action === "approve" && data.customer) {
          onApproved(data.customer);
        }
      }
    } finally {
      setPendingActionId(null);
    }
  }

  if (requests.length === 0) return null;

  const nextRequest = requests[0];

  return (
    <>
      {/* פופ-אפ מסך מלא: אי אפשר לפספס, כפתורי ענק, בלי כפתור סגירה -
          התגובה היחידה היא אישור/דחייה בפועל. עובר אוטומטית לבקשה
          הבאה בתור אחרי שהמענה מגיע (respond מסננת מ-requests). */}
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-pikol-brown/95 p-6 text-center">
        {requests.length > 1 && (
          <p className="text-sm font-medium text-pikol-cream/70">
            בקשה 1 מתוך {requests.length}
          </p>
        )}

        <p className="text-4xl font-bold text-pikol-cream">{nextRequest.customer.name}</p>
        <p className="text-xl text-pikol-cream/90">{requestLabel(nextRequest)}</p>

        <div className="mt-4 flex w-full max-w-sm flex-col gap-3">
          <button
            type="button"
            disabled={pendingActionId === nextRequest.id}
            onClick={() => respond(nextRequest.id, "approve")}
            className="w-full rounded-3xl bg-pikol-teal py-8 text-3xl font-bold text-white disabled:opacity-60"
          >
            אישור
          </button>
          <button
            type="button"
            disabled={pendingActionId === nextRequest.id}
            onClick={() => respond(nextRequest.id, "decline")}
            className="w-full rounded-3xl border-2 border-pikol-cream/40 py-5 text-xl text-pikol-cream disabled:opacity-60"
          >
            דחייה
          </button>
        </div>
      </div>

      <div className="w-full space-y-2">
        <h2 className="text-sm font-semibold text-pikol-brown">בקשות ממתינות</h2>
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between gap-2 rounded-xl border border-pikol-gold/50 bg-pikol-gold/10 p-3"
          >
            <span className="text-sm font-medium text-pikol-brown">
              {request.customer.name} · {requestLabel(request)}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pendingActionId === request.id}
                onClick={() => respond(request.id, "approve")}
                className="rounded-full bg-pikol-teal px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
              >
                אישור
              </button>
              <button
                type="button"
                disabled={pendingActionId === request.id}
                onClick={() => respond(request.id, "decline")}
                className="rounded-full border border-pikol-brown/30 px-3 py-1 text-xs text-pikol-brown disabled:opacity-60"
              >
                דחייה
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
