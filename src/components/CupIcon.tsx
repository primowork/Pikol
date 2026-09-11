interface CupIconProps {
  /** האם הניקוב הזה כבר בוצע (כוס "מלאה"). */
  filled: boolean;
  size?: number;
  /** true רק על הכוס שזה עתה נוספה - מפעיל את אנימציית ה"הטבעה". */
  justStamped?: boolean;
}

/** עיגול בודד בכרטיס - כוס קפה, בהשראת הכרטיס הפיזי המקורי. */
export default function CupIcon({ filled, size = 48, justStamped = false }: CupIconProps) {
  return (
    <div
      className={`flex items-center justify-center rounded-full border-2 ${
        filled ? "border-pikol-teal bg-pikol-teal/10" : "border-pikol-tan/50 bg-transparent"
      } ${justStamped ? "animate-stamp-in" : ""}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" width={size * 0.55} height={size * 0.55} fill="none" aria-hidden="true">
        <path
          d="M7 9h10l-1.2 9.5a2 2 0 0 1-2 1.98H10.2a2 2 0 0 1-2-1.98L7 9Z"
          fill={filled ? "var(--color-pikol-teal)" : "none"}
          stroke={filled ? "var(--color-pikol-teal)" : "var(--color-pikol-tan)"}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {filled ? (
          <ellipse cx="12" cy="9" rx="5.2" ry="1.6" fill="var(--color-pikol-gold)" />
        ) : (
          <ellipse
            cx="12"
            cy="9"
            rx="5.2"
            ry="1.6"
            fill="none"
            stroke="var(--color-pikol-tan)"
            strokeWidth="1.5"
          />
        )}
      </svg>
    </div>
  );
}
