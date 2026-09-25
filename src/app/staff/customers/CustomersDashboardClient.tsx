"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { BUSINESS_NAME, STAMPS_REQUIRED } from "@/lib/config";
import type { CustomerListItem } from "@/types";

interface CustomersDashboardClientProps {
  totalCustomers: number;
  totalStampsIssued: number;
  activeCustomers30d: number;
  activeRatePercent: number;
  avgVisitsPerActiveCustomer: number;
  peakHour: number | null;
  peakDayLabel: string | null;
  openRewardLiability: number;
  initialCustomers: CustomerListItem[];
}

const SEARCH_DEBOUNCE_MS = 300;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("he-IL", { day: "numeric", month: "short", year: "numeric" });
}

export default function CustomersDashboardClient({
  totalCustomers,
  totalStampsIssued,
  activeCustomers30d,
  activeRatePercent,
  avgVisitsPerActiveCustomer,
  peakHour,
  peakDayLabel,
  openRewardLiability,
  initialCustomers,
}: CustomersDashboardClientProps) {
  const [searchResults, setSearchResults] = useState<CustomerListItem[] | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // בלי חיפוש פעיל מציגים ישירות את initialCustomers (מחושב ברינדור,
  // לא "מאופס" דרך effect) - נמנע מתבנית ה-derived-state הבעייתית.
  const customers = search.trim() ? (searchResults ?? []) : initialCustomers;

  useEffect(() => {
    if (!search.trim()) return;

    let cancelled = false;

    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/customers?search=${encodeURIComponent(search.trim())}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        setSearchResults(data.customers ?? []);
      } catch {
        // תקלת רשת זמנית - הרשימה הקודמת נשארת מוצגת
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [search]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 px-4 py-6">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo size={44} />
          <div className="text-right">
            <p className="text-sm font-semibold text-pikol-brown">{BUSINESS_NAME}</p>
            <p className="text-xs text-pikol-brown/60">מסד הלקוחות</p>
          </div>
        </div>
        <Link href="/staff/dashboard" className="text-xs text-pikol-brown/50 underline">
          חזרה לדשבורד
        </Link>
      </div>

      <Link
        href="/api/customers/export"
        className="w-full rounded-full border border-pikol-teal px-4 py-2 text-center text-sm font-semibold text-pikol-teal"
      >
        ייצוא לאקסל (CSV)
      </Link>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-pikol-tan/40 bg-white/60 p-4 text-center">
          <p className="text-2xl font-semibold text-pikol-brown">{totalCustomers}</p>
          <p className="text-xs text-pikol-brown/60">לקוחות רשומים</p>
        </div>
        <div className="rounded-2xl border border-pikol-tan/40 bg-white/60 p-4 text-center">
          <p className="text-2xl font-semibold text-pikol-brown">{totalStampsIssued}</p>
          <p className="text-xs text-pikol-brown/60">ניקובים שהוענקו בסה&quot;כ</p>
        </div>
        <div className="rounded-2xl border border-pikol-tan/40 bg-white/60 p-4 text-center">
          <p className="text-2xl font-semibold text-pikol-brown">{activeRatePercent}%</p>
          <p className="text-xs text-pikol-brown/60">
            לקוחות פעילים ב-30 הימים האחרונים ({activeCustomers30d} מתוך {totalCustomers})
          </p>
        </div>
        <div className="rounded-2xl border border-pikol-tan/40 bg-white/60 p-4 text-center">
          <p className="text-2xl font-semibold text-pikol-brown">{avgVisitsPerActiveCustomer.toFixed(1)}</p>
          <p className="text-xs text-pikol-brown/60">ביקורים בממוצע לחודש ללקוח פעיל</p>
        </div>
        <div className="rounded-2xl border border-pikol-tan/40 bg-white/60 p-4 text-center">
          <p className="text-2xl font-semibold text-pikol-brown">
            {peakHour !== null ? `${peakHour}:00` : "—"}
          </p>
          <p className="text-xs text-pikol-brown/60">
            {peakDayLabel ? `השעה הכי עמוסה, בעיקר ב${peakDayLabel}` : "אין עדיין מספיק נתונים"}
          </p>
        </div>
        <div className="rounded-2xl border border-pikol-tan/40 bg-white/60 p-4 text-center">
          <p className="text-2xl font-semibold text-pikol-brown">{openRewardLiability}</p>
          <p className="text-xs text-pikol-brown/60">פרסים שממתינים למימוש כרגע</p>
        </div>
      </div>

      <input
        type="text"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="חיפוש לפי שם או טלפון"
        className="w-full rounded-xl border border-pikol-tan/50 bg-white/70 px-4 py-2 text-pikol-brown outline-none focus:border-pikol-teal"
      />

      <div className="flex flex-col gap-2">
        {loading && <p className="text-center text-xs text-pikol-brown/50">מחפש…</p>}

        {!loading && customers.length === 0 && (
          <p className="text-center text-sm text-pikol-brown/60">לא נמצאו לקוחות</p>
        )}

        {customers.map((customer) => (
          <div
            key={customer.id}
            className="rounded-xl border border-pikol-tan/30 bg-white/60 p-3"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-pikol-brown">{customer.name}</p>
              <p dir="ltr" className="text-sm text-pikol-brown/70">
                {customer.phone}
              </p>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-pikol-brown/60">
              <span className="tabular-nums">
                {customer.currentStamps} מתוך {STAMPS_REQUIRED} כוסות · {customer.rewardsEarned} פרסים
              </span>
              <span>הצטרפ/ה ב-{formatDate(customer.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
