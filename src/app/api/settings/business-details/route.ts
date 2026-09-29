import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { businessDetailsSchema } from "@/lib/validation";
import { setBusinessDetails } from "@/lib/business-settings";
import { handleApiError, ValidationError } from "@/lib/errors";

/** עדכון פרטי העסק שמוצגים ללקוחות - staff בלבד. הקריאה נעשית מ-/staff/settings. */
export async function POST(request: NextRequest) {
  try {
    await requireStaff();

    const body = await request.json().catch(() => null);
    const parsed = businessDetailsSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? "בקשה לא תקינה");
    }

    await setBusinessDetails(parsed.data);

    return NextResponse.json(parsed.data);
  } catch (err) {
    return handleApiError(err);
  }
}
