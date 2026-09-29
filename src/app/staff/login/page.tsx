import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth";
import { safeStaffNextPath } from "@/lib/staff-paths";
import LoginForm from "./LoginForm";

interface StaffLoginPageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

/**
 * מי שכבר מחובר לא רואה את טופס הסיסמה בכלל: עובר ישר לדשבורד (או לעמוד
 * שממנו הגיע, next). כך גם קישור "כניסת צוות" מהכרטיס וגם כל דרך אחרת
 * להגיע לכאן לא מבקשים סיסמה שוב ממכשיר מחובר.
 */
export default async function StaffLoginPage({ searchParams }: StaffLoginPageProps) {
  const { next } = await searchParams;
  const nextPath = safeStaffNextPath(typeof next === "string" ? next : null);

  if (await getCurrentStaff()) {
    redirect(nextPath);
  }

  return <LoginForm nextPath={nextPath} />;
}
