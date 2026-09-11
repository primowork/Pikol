"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

/**
 * זהו ה-start_url הגלובלי של ה-PWA (public/manifest.json). כשלקוח פותח
 * את האייקון מהמסך הבית, זה מה שנטען קודם: קוראים את המזהה שנשמר
 * בביקור הקודם ב-localStorage ומפנים ישר לכרטיס האישי. בלי מזהה שמור -
 * כנראה מכשיר/דפדפן חדש - מפנים להרשמה.
 */
export default function CardResolverPage() {
  const router = useRouter();

  useEffect(() => {
    let storedId: string | null = null;
    try {
      storedId = window.localStorage.getItem("pikol_customer_id");
    } catch {
      storedId = null;
    }

    router.replace(storedId ? `/card/${storedId}` : "/join");
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <Logo size={80} />
      <p className="text-pikol-brown/70">טוען את הכרטיס שלך…</p>
    </main>
  );
}
