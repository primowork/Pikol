import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import QRCode from "qrcode";
import { getCurrentStaff } from "@/lib/auth";
import Logo from "@/components/Logo";
import PrintButton from "@/components/PrintButton";
import { BUSINESS_NAME } from "@/lib/config";

/**
 * QR קבוע להדפסה/הצגה בדוכן עצמו - מקודד "/scan", לא מזהה לקוח ספציפי.
 * עמוד נפרד מהדשבורד (לא section שם): הדשבורד נפתח הרבה בזמן משמרת,
 * וה-QR הזה נצפה כמעט פעם אחת. src/proxy.ts כבר חוסם גישה לא-מאומתת
 * ברמת ה-UX, אבל בודקים שוב כאן במפורש - כמו בדשבורד.
 */
export default async function StandQrPage() {
  const staff = await getCurrentStaff();
  if (!staff) {
    redirect("/staff/login");
  }

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const scanUrl = `${isLocal ? "http" : "https"}://${host}/scan`;

  // רזולוציה גבוהה (600) כדי שההדפסה תצא חדה - התצוגה במסך נשארת
  // קטנה דרך width/height ב-<img>, זה רק מקור הקובץ.
  const qrDataUrl = await QRCode.toDataURL(scanUrl, {
    margin: 1,
    width: 600,
    color: { dark: "#614943", light: "#ffffffff" },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-4 py-8 text-center">
      <Link href="/staff/dashboard" className="self-start text-sm text-pikol-brown/50 underline">
        חזרה לדשבורד
      </Link>

      <Logo size={80} />
      <div>
        <h1 className="text-xl font-bold text-pikol-brown">{BUSINESS_NAME}</h1>
        <p className="text-sm text-pikol-brown/70">קוד הדוכן - לבקשת ניקוב</p>
      </div>

      <div className="print-area rounded-2xl border border-pikol-tan/40 bg-white p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="קוד QR לבקשת ניקוב" width={320} height={320} />
      </div>

      <PrintButton label="הדפסת הקוד" />

      <p className="max-w-xs text-sm text-pikol-brown/60">
        להדפיס או להציג את הקוד הזה בדוכן. לקוח שסורק אותו שולח בקשת
        ניקוב, ותקבלו התראה במכשיר הזה לאישור.
      </p>
    </main>
  );
}
