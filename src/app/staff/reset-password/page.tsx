import type { Metadata } from "next";
import ResetPasswordForm from "./ResetPasswordForm";

// הטוקן נמצא בכתובת העמוד - לא שולחים אותו הלאה ב-Referer לשום מקום
export const metadata: Metadata = {
  referrer: "no-referrer",
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string | string[] }>;
}

/** יעד הקישור שנשלח במייל: בחירת סיסמה חדשה. הטוקן נבדק רק בשליחה, לא בפתיחה. */
export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;
  return <ResetPasswordForm token={typeof token === "string" ? token : ""} />;
}
