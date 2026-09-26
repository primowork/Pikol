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

/** שידור הודעה ידני לכל הלקוחות שנרשמו ל-Web Push. staff בלבד. */
export async function POST(request: NextRequest) {
  try {
    await requireStaff();

    const body = await request.json().catch(() => null);
    const parsed = broadcastSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? "בקשה לא תקינה");
    }

    const result = await sendCustomerBroadcast(parsed.data.title, parsed.data.body);

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
