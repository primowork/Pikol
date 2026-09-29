import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentStaff } from "@/lib/auth";
import { loginPathWithNext } from "@/lib/staff-paths";
import { getAboutUsText, getBusinessDetails, getVapidSubject } from "@/lib/business-settings";
import { isEmailConfigured } from "@/lib/email";
import BackLink from "@/components/BackLink";
import AboutUsSettingsForm from "@/components/AboutUsSettingsForm";
import BusinessDetailsSettingsForm from "@/components/BusinessDetailsSettingsForm";
import VapidSubjectSettingsForm from "@/components/VapidSubjectSettingsForm";
import StaffEmailSettingsForm from "@/components/StaffEmailSettingsForm";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import { BUSINESS_NAME } from "@/lib/config";

/**
 * הגדרות: החשבון של המחובר (מייל לשחזור סיסמה, החלפת סיסמה), פרטי העסק
 * שמוצגים ללקוחות, טקסט "קצת עלינו" וכתובת קשר ל-VAPID subject. עמוד נפרד
 * מהדשבורד, כמו stand-qr/customers - proxy.ts כבר חוסם ברמת UX, ומאמתים
 * שוב כאן במפורש.
 */
export default async function SettingsPage() {
  const staff = await getCurrentStaff();
  if (!staff) {
    redirect(loginPathWithNext("/staff/settings"));
  }

  const [account, businessDetails, aboutUsText, vapidSubject] = await Promise.all([
    prisma.staffUser.findUnique({ where: { id: staff.sub }, select: { username: true, email: true } }),
    getBusinessDetails(),
    getAboutUsText(),
    getVapidSubject(),
  ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-6 px-4 py-8">
      <BackLink href="/staff/dashboard" className="self-start text-sm text-pikol-brown/50 underline">
        חזרה לדשבורד
      </BackLink>

      <div className="text-center">
        <h1 className="text-xl font-bold text-pikol-brown">הגדרות</h1>
        <p className="text-sm text-pikol-brown/70">{BUSINESS_NAME}</p>
      </div>

      <section className="flex w-full flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold text-pikol-brown">החשבון שלי</h2>
          <p className="text-xs text-pikol-brown/60">
            שם המשתמש לכניסה:{" "}
            <span dir="ltr" className="font-semibold">
              {account?.username ?? staff.username}
            </span>
          </p>
        </div>
        <StaffEmailSettingsForm initialEmail={account?.email ?? ""} emailConfigured={isEmailConfigured()} />
        <ChangePasswordForm />
      </section>

      <section className="flex w-full flex-col gap-3">
        <h2 className="text-sm font-semibold text-pikol-brown">בית הקפה</h2>
        <BusinessDetailsSettingsForm initialDetails={businessDetails} />
        <AboutUsSettingsForm initialText={aboutUsText} />
        <VapidSubjectSettingsForm initialValue={vapidSubject ?? ""} />
      </section>
    </main>
  );
}
