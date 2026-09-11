"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { BUSINESS_NAME } from "@/lib/config";

export default function StaffLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "שגיאה בהתחברות");
        setSubmitting(false);
        return;
      }

      router.push("/staff/dashboard");
      router.refresh();
    } catch {
      setError("בעיית תקשורת - נסו שוב");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-6 px-4 py-8">
      <Logo size={80} priority />
      <div className="text-center">
        <h1 className="text-xl font-bold text-pikol-brown">כניסת צוות</h1>
        <p className="text-sm text-pikol-brown/60">{BUSINESS_NAME}</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div>
          <label htmlFor="username" className="mb-1 block text-sm font-medium text-pikol-brown">
            שם משתמש
          </label>
          <input
            id="username"
            type="text"
            required
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="w-full rounded-xl border border-pikol-tan/50 bg-white/70 px-4 py-3 text-pikol-brown outline-none focus:border-pikol-teal"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-pikol-brown">
            סיסמה
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-pikol-tan/50 bg-white/70 px-4 py-3 text-pikol-brown outline-none focus:border-pikol-teal"
          />
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-pikol-brown px-6 py-3 font-semibold text-pikol-cream disabled:opacity-60"
        >
          {submitting ? "מתחבר…" : "כניסה"}
        </button>
      </form>
    </main>
  );
}
