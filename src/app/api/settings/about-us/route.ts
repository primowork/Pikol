import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { aboutUsSettingsSchema } from "@/lib/validation";
import { setAboutUsText } from "@/lib/business-settings";
import { handleApiError, ValidationError } from "@/lib/errors";

/**
 * עדכון טקסט "קצת עלינו" - staff בלבד. הקריאה נעשית מ-/staff/settings.
 * אין GET כאן - עמוד ההגדרות עצמו (Server Component) קורא ל-getAboutUsText()
 * ישירות, בדיוק כמו ש-card/[id]/page.tsx קורא ל-prisma.customer.findUnique
 * ישירות בלי לעבור דרך API.
 */
export async function POST(request: NextRequest) {
  try {
    await requireStaff();

    const body = await request.json().catch(() => null);
    const parsed = aboutUsSettingsSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? "בקשה לא תקינה");
    }

    await setAboutUsText(parsed.data.aboutUsText);

    return NextResponse.json({ aboutUsText: parsed.data.aboutUsText });
  } catch (err) {
    return handleApiError(err);
  }
}
