import Link from "next/link";
import Logo from "@/components/Logo";
import { BUSINESS_NAME } from "@/lib/config";

export default function CardNotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-4 py-8 text-center">
      <Logo size={80} />
      <h1 className="text-xl font-bold text-pikol-brown">לא מצאנו את הכרטיס הזה</h1>
      <p className="text-pikol-brown/70">
        ייתכן שהקישור שגוי או שהכרטיס הוסר. אפשר להצטרף מחדש למועדון של {BUSINESS_NAME}.
      </p>
      <Link
        href="/join"
        className="rounded-full bg-pikol-brown px-6 py-3 font-semibold text-pikol-cream"
      >
        הצטרפות למועדון
      </Link>
    </main>
  );
}
