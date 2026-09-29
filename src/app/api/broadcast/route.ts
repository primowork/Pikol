import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { broadcastSchema } from "@/lib/validation";
import { getCustomerBroadcastAudience, sendCustomerBroadcast } from "@/lib/push";
import { handleApiError, ValidationError } from "@/lib/errors";

/**
 * כמה לקוחות יקבלו שידור אם יישלח עכשיו - לתצוגה המקדימה לפני שליחה.
 * staff בלבד. מחזיר שגיאה מפורטת אם VAPID לא מוגדר נכון (כמו ה-POST).
 */
export async function GET() {
  try {
    await requireStaff();

    const audience = await getCustomerBroadcastAudience();

    return NextResponse.json(audience);
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * שידור הודעה ידני ללקוחות שאישרו דיוור. staff בלבד, ורק אחרי שהשולח
 * אישר בתצוגה המקדימה שההודעה יוצאת בשם העסק ובאחריותו (acknowledged).
 * כל שידור נרשם ביומן Broadcast עם השולח מה-session.
 */
export async function POST(request: NextRequest) {
  try {
    const staff = await requireStaff();

    const body = await request.json().catch(() => null);
    const parsed = broadcastSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? "בקשה לא תקינה");
    }

    const result = await sendCustomerBroadcast({
      title: parsed.data.title,
      body: parsed.data.body,
      staffId: staff.sub,
      acknowledgedAt: new Date(),
    });

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
