import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { vapidSubjectSettingsSchema } from "@/lib/validation";
import { setVapidSubject } from "@/lib/business-settings";
import { handleApiError, ValidationError } from "@/lib/errors";

/** עדכון VAPID subject - staff בלבד. הקריאה נעשית מ-/staff/settings. */
export async function POST(request: NextRequest) {
  try {
    await requireStaff();

    const body = await request.json().catch(() => null);
    const parsed = vapidSubjectSettingsSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? "בקשה לא תקינה");
    }

    await setVapidSubject(parsed.data.vapidSubject);

    return NextResponse.json({ vapidSubject: parsed.data.vapidSubject });
  } catch (err) {
    return handleApiError(err);
  }
}
