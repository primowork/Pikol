import { NextResponse } from "next/server";
import { getCurrentStaff } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";

// תמיד מחזיר 200 (אף פעם לא 401) - נועד לשימוש נוח מצד הלקוח כדי לדעת
// אם יש session פעיל, בלי לצטרך להתמודד עם קוד שגיאה.
export async function GET() {
  try {
    const staff = await getCurrentStaff();
    if (!staff) {
      return NextResponse.json({ authenticated: false });
    }
    return NextResponse.json({
      authenticated: true,
      staff: { id: staff.sub, username: staff.username, name: staff.name, role: staff.role },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
