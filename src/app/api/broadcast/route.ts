import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { broadcastSchema } from "@/lib/validation";
import { sendCustomerBroadcast } from "@/lib/push";
import { handleApiError, ValidationError } from "@/lib/errors";

/** שידור הודעה ידני לכל הלקוחות שנרשמו ל-Web Push. staff בלבד. */
export async function POST(request: NextRequest) {
  try {
    await requireStaff();

    const body = await request.json().catch(() => null);
    const parsed = broadcastSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? "בקשה לא תקינה");
    }

    const { sentCount } = await sendCustomerBroadcast(parsed.data.title, parsed.data.body);

    return NextResponse.json({ sentCount });
  } catch (err) {
    return handleApiError(err);
  }
}
