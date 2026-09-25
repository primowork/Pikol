"use client";

import { useEffect, useState } from "react";

const PIECE_COLORS = [
  "var(--color-pikol-teal)",
  "var(--color-pikol-gold)",
  "var(--color-pikol-brown)",
  "var(--color-pikol-tan)",
];
const PIECE_COUNT = 24;

interface ConfettiProps {
  active: boolean;
}

interface ConfettiPiece {
  left: number;
  delay: number;
  duration: number;
  color: string;
  reverse: boolean;
}

function createPieces(): ConfettiPiece[] {
  return Array.from({ length: PIECE_COUNT }, (_, index) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.3,
    duration: 1.2 + Math.random() * 0.8,
    color: PIECE_COLORS[index % PIECE_COLORS.length],
    reverse: index % 2 === 1,
  }));
}

/**
 * חגיגת קונפטי קלה בלי תלות חיצונית - מלבנים קטנים שנופלים ב-CSS, לא
 * canvas. מוצג רק ברגע השלמת כרטיסייה (active הופך ל-true לזמן קצר
 * ואז חוזר ל-false אצל הקורא, בדיוק כמו justStampedAt הקיים).
 *
 * ה-Math.random נקרא בתוך effect ולא בגוף הרינדור - קריאה ישירה ברינדור
 * נחסמת ע"י react-hooks/purity (רינדור חייב להיות דטרמיניסטי).
 */
export default function Confetti({ active }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    function generate() {
      if (!active) return;
      setPieces(createPieces());
    }
    generate();
  }, [active]);

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {pieces.map((piece, index) => (
        <span
          key={index}
          className={`absolute top-[-10px] h-3 w-2 ${
            piece.reverse ? "animate-confetti-fall-reverse" : "animate-confetti-fall"
          }`}
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
