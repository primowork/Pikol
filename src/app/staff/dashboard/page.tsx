import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth";
import { loginPathWithNext } from "@/lib/staff-paths";
import DashboardClient from "./DashboardClient";

// src/proxy.ts כבר חוסם גישה לא-מאומתת ל-"/staff/dashboard" ברמת ה-UX,
// אבל בודקים שוב כאן במפורש - הגנה בכל שכבה בנפרד, לא רק בproxy.
export default async function StaffDashboardPage() {
  const staff = await getCurrentStaff();
  if (!staff) {
    redirect(loginPathWithNext("/staff/dashboard"));
  }

  return <DashboardClient staffName={staff.name} vapidPublicKey={process.env.VAPID_PUBLIC_KEY ?? ""} />;
}
