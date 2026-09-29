"use client";

import { useState, type Ref } from "react";

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  inputRef?: Ref<HTMLInputElement>;
  minLength?: number;
}

/** שדה סיסמה עם כפתור "הצגה" - בטלפון קל לטעות בהקלדה עיוורת. */
export default function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  inputRef,
  minLength,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        type={visible ? "text" : "password"}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        dir="ltr"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-pikol-tan/50 bg-white/70 py-3 pl-20 pr-4 text-pikol-brown outline-none focus:border-pikol-teal"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-pressed={visible}
        aria-controls={id}
        className="absolute inset-y-0 left-2 my-auto h-fit rounded-lg px-2 py-1 text-xs text-pikol-brown/60 underline"
      >
        {visible ? "הסתרה" : "הצגה"}
      </button>
    </div>
  );
}
