"use client";

import { useState, type FormEvent } from "react";
import PasswordInput from "./PasswordInput";
import { PASSWORD_MIN_LENGTH } from "@/lib/config";
import { staffFetch } from "@/lib/staff-fetch";

type SaveState = "idle" | "saving" | "saved" | "error";

/** החלפת הסיסמה של המחובר. המכשיר הזה נשאר מחובר, מכשירים אחרים מתנתקים. */
export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [state, setState] = useState<SaveState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrorMessage(null);

    if (newPassword !== confirmation) {
      setErrorMessage("שתי הסיסמאות החדשות לא זהות");
      setState("error");
      return;
    }

    setState("saving");
    try {
      const res = await staffFetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? "משהו השתבש, נסו שוב");
        setState("error");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");
      setState("saved");
    } catch {
      setErrorMessage("בעיית תקשורת - נסו שוב");
      setState("error");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-3 rounded-2xl border border-pikol-tan/40 bg-white/60 p-4"
    >
      <p className="text-sm font-medium text-pikol-brown">החלפת סיסמה</p>

      <div>
        <label htmlFor="current-password" className="mb-1 block text-xs text-pikol-brown/70">
          הסיסמה הנוכחית
        </label>
        <PasswordInput
          id="current-password"
          value={currentPassword}
          onChange={setCurrentPassword}
          autoComplete="current-password"
        />
      </div>

      <div>
        <label htmlFor="changed-password" className="mb-1 block text-xs text-pikol-brown/70">
          סיסמה חדשה (לפחות {PASSWORD_MIN_LENGTH} תווים)
        </label>
        <PasswordInput
          id="changed-password"
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
        />
      </div>

      <div>
        <label htmlFor="changed-password-confirm" className="mb-1 block text-xs text-pikol-brown/70">
          הסיסמה החדשה שוב, לאימות
        </label>
        <PasswordInput
          id="changed-password-confirm"
          value={confirmation}
          onChange={setConfirmation}
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
        />
      </div>

      <button
        type="submit"
        disabled={state === "saving"}
        className="rounded-full bg-pikol-brown px-4 py-3 text-sm font-semibold text-pikol-cream disabled:opacity-60"
      >
        {state === "saving" ? "שומר…" : "החלפת סיסמה"}
      </button>

      {state === "saved" && (
        <p className="text-sm text-pikol-teal">
          הסיסמה הוחלפה ✓ מכשירים אחרים שהיו מחוברים יצטרכו להתחבר מחדש.
        </p>
      )}
      {state === "error" && <p className="text-sm text-red-700">{errorMessage}</p>}
    </form>
  );
}
