import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentStaff } from "@/lib/auth";
import { getAboutUsText } from "@/lib/business-settings";
import AboutUsSettingsForm from "@/components/AboutUsSettingsForm";
import { BUSINESS_NAME } from "@/lib/config";

/**
 * הגדרות עסק - כרגע רק טקסט "קצת עלינו" (יתרחב בעתיד לפי הצורך). עמוד
 * נפרד מהדשבורד, כמו stand-qr/customers - proxy.ts כבר חוסם ברמת UX,
 * ומאמתים שוב כאן במפורש.
 */
export default async function SettingsPage() {
  const staff = await getCurrentStaff();
  if (!staff) {
    redirect("/staff/login");
  }

  const aboutUsText = await getAboutUsText();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-6 px-4 py-8">
      <Link href="/staff/dashboard" className="self-start text-sm text-pikol-brown/50 underline">
        חזרה לדשבורד
      </Link>

      <div className="text-center">
        <h1 className="text-xl font-bold text-pikol-brown">הגדרות</h1>
        <p className="text-sm text-pikol-brown/70">{BUSINESS_NAME}</p>
      </div>

      <AboutUsSettingsForm initialText={aboutUsText} />
    </main>
  );
}
