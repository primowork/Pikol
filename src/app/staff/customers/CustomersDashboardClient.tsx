"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import BackLink from "@/components/BackLink";
import { BUSINESS_NAME, STAMPS_REQUIRED } from "@/lib/config";
import { staffFetch } from "@/lib/staff-fetch";
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
  /** רק בעל העסק רואה את כפתור מחיקת הכרטיס (גם השרת בודק). */
  isOwner: boolean;
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
  isOwner,
}: CustomersDashboardClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);
  const [results, setResults] = useState<{ query: string; customers: CustomerListItem[]; failed: boolean } | null>(
    null
  );

  // בלי חיפוש פעיל מציגים ישירות את initialCustomers (מחושב ברינדור,
  // לא "מאופס" דרך effect) - נמנע מתבנית ה-derived-state הבעייתית.
  // תוצאות שייכות לחיפוש מסוים: עד שמגיעות תוצאות לחיפוש הנוכחי מוצג
  // "מחפש…" (עם התוצאות הקודמות), ולא "לא נמצאו לקוחות" שהבהב בזמן הקלדה.
  const query = search.trim();
  const searching = query !== "" && results?.query !== query;
  const searchFailed = query !== "" && results?.query === query && results.failed;
  const customers = (query ? (results?.customers ?? []) : initialCustomers).filter(
    (customer) => !deletedIds.has(customer.id)
  );

  // ביטול חברות לבקשת לקוח (תקנון, פרק 9). אישור מפורש, כי אין דרך לשחזר.
  async function handleDelete(customer: CustomerListItem) {
    const confirmed = window.confirm(
      `למחוק את הכרטיס של ${customer.name}? הניקובים והפרסים יימחקו ואי אפשר לשחזר. נשאר רק תיעוד ההסכמות שלו.`
    );
    if (!confirmed) return;

    setDeletingId(customer.id);
    setDeleteNotice(null);
    try {
      const res = await staffFetch(`/api/customers/${customer.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteNotice(data.error ?? "המחיקה נכשלה, נסו שוב");
        return;
      }
      setDeletedIds((prev) => new Set(prev).add(customer.id));
      setDeleteNotice(`הכרטיס של ${customer.name} נמחק`);
      router.refresh();
    } catch {
      setDeleteNotice("בעיית תקשורת - נסו שוב");
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    if (!query) return;

    let cancelled = false;

    const timeout = window.setTimeout(async () => {
      try {
        const res = await staffFetch(`/api/customers?search=${encodeURIComponent(query)}`);
        const data = res.ok ? await res.json() : null;
        if (cancelled) return;
        setResults({ query, customers: data?.customers ?? [], failed: !data });
      } catch {
        if (!cancelled) setResults({ query, customers: [], failed: true });
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [query]);

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
        <BackLink href="/staff/dashboard" className="text-xs text-pikol-brown/50 underline">
          חזרה לדשבורד
        </BackLink>
      </div>

      {/* <a> רגיל ולא Link: זו הורדת קובץ מ-API, לא מעבר עמוד (Link גם היה
          טוען אותה מראש ברקע בכל כניסה לעמוד) */}
      <a
        href="/api/customers/export"
        download
        className="w-full rounded-full border border-pikol-teal px-4 py-2 text-center text-sm font-semibold text-pikol-teal"
      >
        ייצוא לאקסל (CSV)
      </a>

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
        autoComplete="off"
        className="w-full rounded-xl border border-pikol-tan/50 bg-white/70 px-4 py-2 text-pikol-brown outline-none focus:border-pikol-teal"
      />

      <div className="flex flex-col gap-2">
        {searching && <p className="text-center text-xs text-pikol-brown/50">מחפש…</p>}

        {searchFailed && (
          <p className="text-center text-xs text-red-700">החיפוש נכשל, אפשר לנסות שוב</p>
        )}

        {!searching && !searchFailed && customers.length === 0 && (
          <p className="text-center text-sm text-pikol-brown/60">לא נמצאו לקוחות</p>
        )}

        {deleteNotice && <p className="text-center text-sm text-pikol-brown">{deleteNotice}</p>}

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
            {isOwner && (
              <div className="mt-2 text-left">
                <button
                  type="button"
                  disabled={deletingId === customer.id}
                  onClick={() => handleDelete(customer)}
                  className="text-xs text-red-700 underline disabled:opacity-60"
                >
                  {deletingId === customer.id ? "מוחק…" : "מחיקת הכרטיס לבקשת הלקוח"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
