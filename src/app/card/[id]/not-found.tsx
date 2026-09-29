import Link from "next/link";
import Logo from "@/components/Logo";
import ForgetMissingCard from "@/components/ForgetMissingCard";
import { BUSINESS_NAME } from "@/lib/config";

export default function CardNotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-4 py-8 text-center">
      <ForgetMissingCard />
      <Logo size={80} />
      <h1 className="text-xl font-bold text-pikol-brown">לא מצאנו את הכרטיס הזה</h1>
      <p className="text-pikol-brown/70">
        ייתכן שהקישור שגוי או שהכרטיס הוסר. אפשר להיכנס עם מספר הטלפון, או להצטרף מחדש למועדון של{" "}
        {BUSINESS_NAME}.
      </p>
      {/* replace: "חזרה" מהכרטיס החדש לא תחזיר לעמוד השגיאה הזה */}
      <Link
        href="/join"
        replace
        className="rounded-full bg-pikol-brown px-6 py-3 font-semibold text-pikol-cream"
      >
        כניסה או הצטרפות
      </Link>
    </main>
  );
}
