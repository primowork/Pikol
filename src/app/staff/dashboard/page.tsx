import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth";
import { loginPathWithNext } from "@/lib/staff-paths";
import { getBusinessDetails } from "@/lib/business-settings";
import { getVapidPublicKey } from "@/lib/vapid";
import DashboardClient from "./DashboardClient";

// src/proxy.ts כבר חוסם גישה לא-מאומתת ל-"/staff/dashboard" ברמת ה-UX,
// אבל בודקים שוב כאן במפורש - הגנה בכל שכבה בנפרד, לא רק בproxy.
export default async function StaffDashboardPage() {
  const staff = await getCurrentStaff();
  if (!staff) {
    redirect(loginPathWithNext("/staff/dashboard"));
  }

  // התקנון ומדיניות הפרטיות מציגים את השם הרשום ומספר העוסק מההגדרות -
  // בלעדיהם לא ברור ללקוח מי מפעיל את המועדון. תזכורת עד שימולאו, עם מה חסר בדיוק.
  const details = await getBusinessDetails();
  const missingBusinessDetails = [
    ...(details.legalName ? [] : ["השם הרשום"]),
    ...(details.businessNumber ? [] : ["מספר העוסק"]),
  ];

  return (
    <DashboardClient
      staffName={staff.name}
      vapidPublicKey={getVapidPublicKey()}
      missingBusinessDetails={missingBusinessDetails}
    />
  );
}
