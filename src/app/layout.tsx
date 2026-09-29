import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { BUSINESS_NAME, BUSINESS_TAGLINE } from "@/lib/config";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import ChromeIosTopFix from "@/components/ChromeIosTopFix";
import NavigationTracker from "@/components/NavigationTracker";
import ManifestLink from "@/components/ManifestLink";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
});

export const metadata: Metadata = {
  title: `${BUSINESS_NAME} — כרטיס ניקוב`,
  description: BUSINESS_TAGLINE,
  // ה-manifest לא כאן אלא ב-ManifestLink: הוא משתנה בכרטיס אישי
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: BUSINESS_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: "#614943",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="min-h-screen font-sans antialiased">
        <ManifestLink />
        {children}
        <ServiceWorkerRegister />
        <ChromeIosTopFix />
        <NavigationTracker />
      </body>
    </html>
  );
}
