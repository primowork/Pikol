"use client";

import { useEffect, useRef, useState } from "react";

interface QrScannerProps {
  onScan: (decodedText: string) => void;
  active: boolean;
}

const ELEMENT_ID = "pikol-qr-reader";

/**
 * עוטף את html5-qrcode לסריקת מצלמה. נטען דינמית (רק כש-active) כי
 * הספרייה משתמשת ב-navigator.mediaDevices ולא רלוונטית בצד שרת.
 *
 * הערה: הסריקה דורשת הקשר מאובטח (HTTPS או localhost) - זו מגבלת
 * הדפדפן, לא באג כאן.
 */
export default function QrScanner({ onScan, active }: QrScannerProps) {
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;

    async function start() {
      setError(null);
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;

      const scanner = new Html5Qrcode(ELEMENT_ID);
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 240 },
          (decodedText) => {
            onScan(decodedText);
          },
          () => {
            // לא נמצא QR בפריים הנוכחי - קורה כל הזמן, לא שגיאה אמיתית
          }
        );
      } catch {
        if (!cancelled) {
          setError("לא הצלחנו לגשת למצלמה. אפשר לחפש לפי מספר טלפון במקום.");
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {
            // כבר נעצר או שלא הצליח להתחיל מלכתחילה - אין מה לנקות
          });
      }
    };
  }, [active, onScan]);

  if (!active) return null;

  return (
    <div className="w-full">
      <div id={ELEMENT_ID} className="mx-auto overflow-hidden rounded-2xl" />
      {error && <p className="mt-2 text-center text-sm text-red-700">{error}</p>}
    </div>
  );
}
