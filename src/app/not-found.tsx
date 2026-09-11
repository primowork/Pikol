import Link from "next/link";
import Logo from "@/components/Logo";

export default function RootNotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-4 py-8 text-center">
      <Logo size={80} />
      <h1 className="text-xl font-bold text-pikol-brown">העמוד לא נמצא</h1>
      <Link
        href="/"
        className="rounded-full bg-pikol-brown px-6 py-3 font-semibold text-pikol-cream"
      >
        חזרה לדף הבית
      </Link>
    </main>
  );
}
