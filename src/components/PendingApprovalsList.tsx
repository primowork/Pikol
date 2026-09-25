"use client";

import { useEffect, useState } from "react";
import type { ActiveCustomer, PendingApprovalRequest } from "@/types";

interface PendingApprovalsListProps {
  onApproved: (customer: ActiveCustomer) => void;
}

const POLL_INTERVAL_MS = 6000;

/**
 * Fallback ויזואלי לבקשות אישור ממתינות - למקרה שההתראה עצמה לא הגיעה
 * (הרשאה נדחתה, דפדפן לא נתמך, מכשיר לא רשום). לא מרנדר כלום כשאין
 * בקשות ממתינות.
 */
export default function PendingApprovalsList({ onApproved }: PendingApprovalsListProps) {
  const [requests, setRequests] = useState<PendingApprovalRequest[]>([]);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/approval-requests", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        setRequests(data.requests ?? []);
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

  return (
    <div className="w-full space-y-2">
      <h2 className="text-sm font-semibold text-pikol-brown">בקשות ממתינות</h2>
      {requests.map((request) => (
        <div
          key={request.id}
          className="flex items-center justify-between gap-2 rounded-xl border border-pikol-gold/50 bg-pikol-gold/10 p-3"
        >
          <span className="text-sm font-medium text-pikol-brown">
            {request.customer.name} · מבקש/ת {request.quantity === 1 ? "ניקוב אחד" : `${request.quantity} ניקובים`}
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
  );
}
