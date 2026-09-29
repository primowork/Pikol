"use client";

import { usePathname } from "next/navigation";

const CARD_PATH = /^\/card\/([^/]+)$/;

/**
 * ה-manifest של האתר, כתגית אחת שמתעדכנת עם כל מעבר עמוד. בכרטיס אישי
 * הוא manifest אישי (האייקון במסך הבית נפתח ישר לכרטיס), ובשאר העמודים
 * הכללי. לא דרך metadata של Next: במעבר עמוד בצד הלקוח נשארה בראש הדף
 * גם התגית של העמוד הקודם, והדפדפן לוקח את הראשונה - הכללית.
 */
export default function ManifestLink() {
  const pathname = usePathname();
  const cardMatch = pathname.match(CARD_PATH);
  const href = cardMatch ? `/card/${cardMatch[1]}/manifest.webmanifest` : "/manifest.json";
  return <link rel="manifest" href={href} />;
}
