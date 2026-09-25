import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { birthdaySchema } from "@/lib/validation";
import { handleApiError, NotFoundError, ValidationError } from "@/lib/errors";

/**
 * שמירת תאריך יום הולדת - "מתנת יום הולדת" בכרטיס. ציבורי, מזוהה ע"י ה-id
 * הבלתי-נחוש בנתיב (בדיוק כמו push-subscription), לא session. ניתן לקרוא
 * שוב כדי לעדכן תאריך שכבר נשמר - לא רק פעם אחת.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new NotFoundError("לקוח לא נמצא");
    }

    const body = await request.json().catch(() => null);
    const parsed = birthdaySchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("תאריך לא תקין");
    }

    await prisma.customer.update({
      where: { id },
      data: { birthday: new Date(parsed.data.birthday) },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
