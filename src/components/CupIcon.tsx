export type CupStatus = "empty" | "filled" | "pending";

interface CupIconProps {
  /** empty = לא נוקב עדיין. filled = ניקוב מאושר. pending = מבוקש, ממתין לאישור staff. */
  status: CupStatus;
  size?: number;
  /** true רק על הכוס שזה עתה נוספה - מפעיל את אנימציית ה"הטבעה". */
  justStamped?: boolean;
  onClick?: () => void;
}

/**
 * עיגול בודד בכרטיס - כוס קפה, בהשראת הכרטיס הפיזי המקורי. pending
 * משתמש באותו גוון טורקיז כמו filled (לא צבע שישי בפלטה - זהב כבר שמור
 * ל"הגעת ליעד") אבל עם מסגרת מקווקוות ומילוי קלוש יותר, כדי שיהיה ברור
 * ויזואלית ש"זה עוד לא סופי" בלי לבלבל עם כוס שכבר אושרה בפועל.
 */
export default function CupIcon({ status, size = 48, justStamped = false, onClick }: CupIconProps) {
  const filled = status === "filled";
  const pending = status === "pending";

  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-center rounded-full border-2 ${onClick ? "cursor-pointer" : ""} ${
        filled
          ? "border-pikol-teal bg-pikol-teal/10"
          : pending
            ? "border-dashed border-pikol-teal bg-pikol-teal/5"
            : "border-pikol-tan/50 bg-transparent"
      } ${justStamped ? "animate-stamp-in" : ""}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" width={size * 0.55} height={size * 0.55} fill="none" aria-hidden="true">
        <path
          d="M7 9h10l-1.2 9.5a2 2 0 0 1-2 1.98H10.2a2 2 0 0 1-2-1.98L7 9Z"
          fill={filled ? "var(--color-pikol-teal)" : "none"}
          stroke={filled || pending ? "var(--color-pikol-teal)" : "var(--color-pikol-tan)"}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeDasharray={pending ? "2 2" : undefined}
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
            stroke={pending ? "var(--color-pikol-teal)" : "var(--color-pikol-tan)"}
            strokeWidth="1.5"
            strokeDasharray={pending ? "2 2" : undefined}
          />
        )}
      </svg>
    </div>
  );
}
