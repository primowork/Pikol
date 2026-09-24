"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import QrScanner from "@/components/QrScanner";
import PhoneSearch from "@/components/PhoneSearch";
import CustomerActionPanel from "@/components/CustomerActionPanel";
import ActivityFeed from "@/components/ActivityFeed";
import NotificationSubscribe from "@/components/NotificationSubscribe";
import PendingApprovalsList from "@/components/PendingApprovalsList";
import { BUSINESS_NAME } from "@/lib/config";
import type { ActiveCustomer, CustomerSearchResult, CustomerCardState } from "@/types";

interface DashboardClientProps {
  staffName: string;
  vapidPublicKey: string;
}

/** ה-QR מכיל קישור מלא לכרטיס (ראו card/[id]/page.tsx) - מחלצים ממנו את המזהה. */
function extractCustomerId(scannedText: string): string {
  try {
    const url = new URL(scannedText);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? scannedText;
  } catch {
    return scannedText.trim();
  }
}

export default function DashboardClient({ staffName, vapidPublicKey }: DashboardClientProps) {
  const router = useRouter();
  const [scannerActive, setScannerActive] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState<ActiveCustomer | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleScan = useCallback(async (decodedText: string) => {
    setScannerActive(false);
    setScanError(null);
    const customerId = extractCustomerId(decodedText);

    try {
      const res = await fetch(`/api/customers/${customerId}`);
      if (!res.ok) {
        setScanError("לא נמצא לקוח - אפשר לנסות שוב או לחפש לפי טלפון");
        return;
      }
      const data: CustomerCardState = await res.json();
      setActiveCustomer({
        id: data.id,
        name: data.name,
        currentStamps: data.currentStamps,
        rewardsEarned: data.rewardsEarned,
      });
    } catch {
      setScanError("בעיית תקשורת - נסו שוב");
    }
  }, []);

  function handleFound(customer: CustomerSearchResult) {
    setScanError(null);
    setActiveCustomer(customer);
  }

  function handleUpdated(customer: ActiveCustomer) {
    setActiveCustomer(customer);
    setRefreshKey((key) => key + 1);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/staff/login");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-5 px-4 py-6">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo size={44} />
          <div className="text-right">
            <p className="text-sm font-semibold text-pikol-brown">{BUSINESS_NAME}</p>
            <p className="text-xs text-pikol-brown/60">שלום, {staffName}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="text-xs text-pikol-brown/50 underline"
        >
          יציאה
        </button>
      </div>

      <NotificationSubscribe vapidPublicKey={vapidPublicKey} />
      <PendingApprovalsList onApproved={handleUpdated} />

      {activeCustomer ? (
        <CustomerActionPanel
          customer={activeCustomer}
          onUpdated={handleUpdated}
          onClose={() => setActiveCustomer(null)}
        />
      ) : (
        <div className="w-full space-y-4">
          {!scannerActive && (
            <button
              type="button"
              onClick={() => setScannerActive(true)}
              className="w-full rounded-full bg-pikol-brown px-6 py-4 text-lg font-semibold text-pikol-cream"
            >
              סריקת כרטיס לקוח
            </button>
          )}

          <QrScanner active={scannerActive} onScan={handleScan} />

          {scannerActive && (
            <button
              type="button"
              onClick={() => setScannerActive(false)}
              className="w-full rounded-full border border-pikol-tan/50 px-6 py-2 text-sm text-pikol-brown"
            >
              ביטול סריקה
            </button>
          )}

          {scanError && <p className="text-center text-sm text-red-700">{scanError}</p>}

          <div className="flex items-center gap-2 text-xs text-pikol-brown/40">
            <div className="h-px flex-1 bg-pikol-tan/30" />
            או
            <div className="h-px flex-1 bg-pikol-tan/30" />
          </div>

          <PhoneSearch onFound={handleFound} />
        </div>
      )}

      <div className="w-full">
        <h2 className="mb-2 text-sm font-semibold text-pikol-brown">פעילות אחרונה</h2>
        <ActivityFeed refreshKey={refreshKey} />
      </div>
    </main>
  );
}
