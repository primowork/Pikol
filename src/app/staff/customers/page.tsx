import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentStaff } from "@/lib/auth";
import CustomersDashboardClient from "./CustomersDashboardClient";

const CUSTOMER_LIST_LIMIT = 200;

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

  const [totalCustomers, totalStampsIssued, customers] = await Promise.all([
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
  ]);

  return (
    <CustomersDashboardClient
      totalCustomers={totalCustomers}
      totalStampsIssued={totalStampsIssued}
      initialCustomers={customers.map((customer) => ({
        ...customer,
        createdAt: customer.createdAt.toISOString(),
      }))}
    />
  );
}
