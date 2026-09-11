import Link from "next/link";
import Logo from "@/components/Logo";
import { BUSINESS_NAME, BUSINESS_TAGLINE, STAMPS_REQUIRED } from "@/lib/config";

export default function HomePage() {
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
