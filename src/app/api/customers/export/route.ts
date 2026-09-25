import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("he-IL", { day: "numeric", month: "numeric", year: "numeric" });
}

/**
 * ייצוא מלא של מסד הלקוחות ל-CSV, staff בלבד. תמיד כל הלקוחות (לא רק
 * ה-200 הראשונים שמוצגים בדשבורד, ולא מסונן לפי חיפוש) - ייצוא הוא
 * גיבוי/ניתוח, לא תצוגה. BOM בתחילת הקובץ נדרש כדי שאקסל יזהה UTF-8
 * ויציג עברית נכון (בלעדיו טקסט עברי מוצג כג'יבריש בחלק מגרסאות Excel).
 */
export async function GET() {
  try {
    await requireStaff();

    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      select: { name: true, phone: true, currentStamps: true, rewardsEarned: true, createdAt: true },
    });

    const header = ["שם", "טלפון", "ניקובים נוכחיים", "פרסים שמומשו", "תאריך הצטרפות"];
    const rows = customers.map((customer) =>
      [
        customer.name,
        customer.phone,
        String(customer.currentStamps),
        String(customer.rewardsEarned),
        formatDate(customer.createdAt),
      ]
        .map(csvEscape)
        .join(",")
    );
    const csv = "﻿" + [header.join(","), ...rows].join("\r\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="pikol-customers.csv"',
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
