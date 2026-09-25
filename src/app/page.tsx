"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { BUSINESS_NAME, BUSINESS_TAGLINE, STAMPS_REQUIRED } from "@/lib/config";

/**
 * לקוח עם מזהה שמור מביקור קודם מופנה ישר לכרטיס שלו (אותו דפוס בדיוק
 * כמו card/page.tsx, ה-start_url של ה-PWA) - בלי כפתור, בלי טופס. רק
 * מכשיר שלא מזהה שום מזהה שמור רואה את מסך ההצטרפות.
 */
export default function HomePage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    function checkStoredCustomer() {
      let storedId: string | null = null;
      try {
        storedId = window.localStorage.getItem("pikol_customer_id");
      } catch {
        storedId = null;
      }

      if (storedId) {
        router.replace("/card");
        return;
      }

      setChecked(true);
    }

    checkStoredCustomer();
  }, [router]);

  if (!checked) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <Logo size={80} />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-4 py-8 text-center">
      <Logo size={140} priority />

      <div>
        <h1 className="text-3xl font-bold text-pikol-brown">{BUSINESS_NAME}</h1>
        <p className="mt-1 text-pikol-brown/70">{BUSINESS_TAGLINE}</p>
      </div>

      <p className="text-pikol-brown">
        הכרטיסייה שלנו עברה לדיגיטל. הצטרפו למועדון, קבלו כרטיס אישי בטלפון,
        וכל קנייה תירשם אצלנו בקופה. קנו {STAMPS_REQUIRED} כוסות קפה וקבלו את
        הכוס הבאה במתנה.
      </p>

      <Link
        href="/join"
        className="w-full rounded-full bg-pikol-brown px-6 py-4 text-lg font-semibold text-pikol-cream"
      >
        הצטרפות למועדון
      </Link>

      <Link href="/staff/login" className="text-xs text-pikol-brown/40 underline">
        כניסת צוות
      </Link>
    </main>
  );
}
