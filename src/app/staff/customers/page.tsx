import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentStaff } from "@/lib/auth";
import { STAMPS_REQUIRED } from "@/lib/config";
import CustomersDashboardClient from "./CustomersDashboardClient";

const CUSTOMER_LIST_LIMIT = 200;
const RETENTION_WINDOW_DAYS = 30;
const HEBREW_DAY_NAMES = ["יום ראשון", "יום שני", "יום שלישי", "יום רביעי", "יום חמישי", "יום שישי", "שבת"];

/**
 * שעת/יום העומס נגזרים לפי שעון ישראל, לא UTC שבו createdAt נשמר -
 * AT TIME ZONE כפול הוא הדפוס הסטנדרטי להמיר timestamp נטול-אזור
 * ששמור בפועל כ-UTC לשעון מקומי (נבדק בפועל מול נתונים אמיתיים).
 */
function getRetentionWindowStart(): Date {
  return new Date(Date.now() - RETENTION_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

async function getPeakHourAndDay() {
  const [hourRows, dayRows] = await Promise.all([
    prisma.$queryRaw<{ hour: number; cnt: number }[]>`
      SELECT EXTRACT(HOUR FROM ("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Jerusalem')::int AS hour,
             COUNT(*)::int AS cnt
      FROM "StampEvent"
      WHERE type = 'STAMP'
      GROUP BY hour
      ORDER BY cnt DESC
      LIMIT 1
    `,
    prisma.$queryRaw<{ dow: number; cnt: number }[]>`
      SELECT EXTRACT(DOW FROM ("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Jerusalem')::int AS dow,
             COUNT(*)::int AS cnt
      FROM "StampEvent"
      WHERE type = 'STAMP'
      GROUP BY dow
      ORDER BY cnt DESC
      LIMIT 1
    `,
  ]);

  return {
    peakHour: hourRows[0]?.hour ?? null,
    peakDayLabel: dayRows[0] ? HEBREW_DAY_NAMES[dayRows[0].dow] : null,
  };
}

/**
 * מסד הלקוחות - staff בלבד. הנתון הראשוני (סטטיסטיקה + רשימה) נשלף
 * ישירות בשרת לטעינה ראשונה מהירה; חיפוש בהמשך קורא ל-API (בדיוק
 * כמו stand-qr/dashboard, שגם הם Server Component עם בדיקת staff מפורשת -
 * proxy.ts כבר חוסם ברמת ה-UX, אבל בודקים גם כאן).
 */
export default async function CustomersPage() {
  const staff = await getCurrentStaff();
  if (!staff) {
    redirect("/staff/login");
  }

  const windowStart = getRetentionWindowStart();

  const [totalCustomers, totalStampsIssued, customers, activeCustomerGroups, allCurrentStamps, peak] =
    await Promise.all([
      prisma.customer.count(),
      prisma.stampEvent.count({ where: { type: "STAMP" } }),
      prisma.customer.findMany({
        orderBy: { createdAt: "desc" },
        take: CUSTOMER_LIST_LIMIT,
        select: {
          id: true,
          name: true,
          phone: true,
          currentStamps: true,
          rewardsEarned: true,
          createdAt: true,
        },
      }),
      // קבוצה לפי customerId מחזירה גם את מספר הלקוחות הפעילים (אורך המערך)
      // וגם את סך הביקורים שלהם בחלון הזמן, בשאילתה אחת.
      prisma.stampEvent.groupBy({
        by: ["customerId"],
        where: { type: "STAMP", createdAt: { gte: windowStart } },
        _count: { _all: true },
      }),
      prisma.customer.findMany({ select: { currentStamps: true } }),
      getPeakHourAndDay(),
    ]);

  const activeCustomers30d = activeCustomerGroups.length;
  const activeRatePercent = totalCustomers > 0 ? Math.round((activeCustomers30d / totalCustomers) * 100) : 0;
  const stampsInWindow = activeCustomerGroups.reduce((sum, group) => sum + group._count._all, 0);
  const avgVisitsPerActiveCustomer = activeCustomers30d > 0 ? stampsInWindow / activeCustomers30d : 0;
  // "כמה פרסים אני חייב לתת עכשיו אם כולם יבואו לממש" - כל לקוח תורם
  // מספר שלם של סבבים שהוא כבר עבר את הסף שלהם ולא מימש עדיין.
  const openRewardLiability = allCurrentStamps.reduce(
    (sum, customer) => sum + Math.floor(customer.currentStamps / STAMPS_REQUIRED),
    0
  );

  return (
    <CustomersDashboardClient
      totalCustomers={totalCustomers}
      totalStampsIssued={totalStampsIssued}
      activeCustomers30d={activeCustomers30d}
      activeRatePercent={activeRatePercent}
      avgVisitsPerActiveCustomer={avgVisitsPerActiveCustomer}
      peakHour={peak.peakHour}
      peakDayLabel={peak.peakDayLabel}
      openRewardLiability={openRewardLiability}
      initialCustomers={customers.map((customer) => ({
        ...customer,
        createdAt: customer.createdAt.toISOString(),
      }))}
    />
  );
}
