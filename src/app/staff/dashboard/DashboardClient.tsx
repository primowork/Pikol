"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import PhoneSearch from "@/components/PhoneSearch";
import CustomerActionPanel from "@/components/CustomerActionPanel";
import ActivityFeed from "@/components/ActivityFeed";
import NotificationSubscribe from "@/components/NotificationSubscribe";
import PendingApprovalsList from "@/components/PendingApprovalsList";
import BroadcastToCustomers from "@/components/BroadcastToCustomers";
import { BUSINESS_NAME } from "@/lib/config";
import type { ActiveCustomer, CustomerSearchResult } from "@/types";

interface DashboardClientProps {
  staffName: string;
  vapidPublicKey: string;
}

export default function DashboardClient({ staffName, vapidPublicKey }: DashboardClientProps) {
  const router = useRouter();
  const [activeCustomer, setActiveCustomer] = useState<ActiveCustomer | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleFound(customer: CustomerSearchResult) {
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

      <div className="flex w-full items-center justify-center gap-4 text-xs text-pikol-brown/60">
        <Link href="/staff/stand-qr" className="underline">
          קוד הדוכן להדפסה
        </Link>
        <span className="text-pikol-tan">•</span>
        <Link href="/staff/customers" className="underline">
          מסד הלקוחות
        </Link>
      </div>

      <NotificationSubscribe
        vapidPublicKey={vapidPublicKey}
        subscribeUrl="/api/push-subscriptions"
        buttonLabel="הפעלת התראות בקשות ניקוב"
        subscribedLabel="התראות פעילות במכשיר הזה"
        unsupportedLabel='התראות לא נתמכות בדפדפן הזה - אפשר עדיין לאשר בקשות ברשימת "בקשות ממתינות" למטה.'
      />
      <PendingApprovalsList onApproved={handleUpdated} />
      <BroadcastToCustomers />

      {activeCustomer ? (
        <CustomerActionPanel
          customer={activeCustomer}
          onUpdated={handleUpdated}
          onClose={() => setActiveCustomer(null)}
        />
      ) : (
        <div className="w-full space-y-4">
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
