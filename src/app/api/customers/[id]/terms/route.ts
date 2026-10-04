import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { TERMS_VERSION } from "@/lib/config";
import { getConsentIp } from "@/lib/consent";
import { checkLoginRateLimit, getClientIp } from "@/lib/rate-limit";
import { handleApiError, NotFoundError } from "@/lib/errors";

/**
 * אישור הגרסה הנוכחית של תקנון המועדון מהפס בכרטיס (TermsUpdateNotice).
 * ציבורי, מזוהה ע"י ה-id הבלתי-נחוש בנתיב, כמו שאר הפעולות מהכרטיס. נרשם
 * ביומן ההסכמות עם הגרסה; אישור חוזר של אותה גרסה לא יוצר שורה נוספת.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    checkLoginRateLimit(`terms:${getClientIp(request)}:${id}`);

    const customer = await prisma.customer.findUnique({ where: { id }, select: { id: true } });
    if (!customer) {
      throw new NotFoundError("לקוח לא נמצא");
    }

    const latest = await prisma.consentEvent.findFirst({
      where: { customerId: id, kind: "TERMS_ACCEPTED" },
      orderBy: { createdAt: "desc" },
      select: { termsVersion: true },
    });

    if (latest?.termsVersion !== TERMS_VERSION) {
      await prisma.$transaction([
        prisma.consentEvent.create({
          data: {
            customerId: id,
            kind: "TERMS_ACCEPTED",
            source: "card",
            ip: getConsentIp(request),
            termsVersion: TERMS_VERSION,
          },
        }),
        prisma.customer.update({ where: { id }, data: { termsAccepted: true } }),
      ]);
    }

    return NextResponse.json({ ok: true, termsVersion: TERMS_VERSION });
  } catch (err) {
    return handleApiError(err);
  }
}
