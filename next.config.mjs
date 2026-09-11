/** @type {import('next').NextConfig} */
const nextConfig = {
  // מונע מ-Turbopack/Webpack לנסות לצרף (bundle) את מנוע ה-Prisma הנייטיבי -
  // הוא נטען כחבילת שרת רגילה במקום זאת.
  serverExternalPackages: ["@prisma/client"],

  async headers() {
    return [
      {
        // service worker וה-manifest חייבים להישלף מחדש בכל טעינה, אחרת
        // הדפדפן עלול "לתקוע" גרסה ישנה בקאש שלו לאורך זמן.
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
      {
        source: "/manifest.json",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
    ];
  },
};

export default nextConfig;
