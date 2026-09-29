import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { marketingOptOutSchema } from "@/lib/validation";
import { getConsentIp, setMarketingConsent } from "@/lib/consent";
import { checkLoginRateLimit, getClientIp } from "@/lib/rate-limit";
import { handleApiError, NotFoundError, ValidationError } from "@/lib/errors";

/**
 * הסרה מרשימת התפוצה: "הפסקת עדכונים ומבצעים" בכרטיס, או כפתור ההסרה
 * בהתראת שידור (sw.js). ציבורי, מזוהה ע"י ה-id הבלתי-נחוש בנתיב כמו שאר
 * נתיבי הלקוח. חייב לעבוד תמיד, ולכן הגבלת הקצב היא לפי IP ולקוח יחד:
 * כמה לקוחות על אותה רשת Wi-Fi בבית הקפה לא חוסמים זה את זה.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    checkLoginRateLimit(`marketing-opt-out:${getClientIp(request)}:${id}`);

    const body = await request.json().catch(() => null);
    const parsed = marketingOptOutSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? "בקשה לא תקינה");
    }

    const customer = await prisma.customer.findUnique({ where: { id }, select: { id: true } });
    if (!customer) {
      throw new NotFoundError("לקוח לא נמצא");
    }

    await setMarketingConsent({
      customerId: id,
      optIn: false,
      source: parsed.data.source,
      ip: getConsentIp(request),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
