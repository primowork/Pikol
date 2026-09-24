"use client";

interface PrintButtonProps {
  label: string;
}

/** כפתור הדפסה פשוט - window.print() לא זמין ב-Server Component. */
export default function PrintButton({ label }: PrintButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-pikol-brown px-6 py-3 font-semibold text-pikol-cream"
    >
      {label}
    </button>
  );
}
