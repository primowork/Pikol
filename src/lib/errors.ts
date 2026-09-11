import { NextResponse } from "next/server";

/**
 * שגיאה עם קוד HTTP מובנה. כל ה-API routes זורקים תת-מחלקה של זו, ו-
 * handleApiError() בסוף למטה ממיר אותה לתגובת JSON אחידה - כך שאין
 * לוגיקת try/catch משוכפלת בכל route בנפרד.
 */
export class ApiError extends Error {
  status: number;
  extra?: Record<string, unknown>;

  constructor(status: number, message: string, extra?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(400, message);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "יש להתחבר כצוות כדי לבצע פעולה זו") {
    super(401, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "לא נמצא") {
    super(404, message);
  }
}

/** ניסיון סריקה כפולה לאותו לקוח בתוך חלון ה-cooldown. */
export class CooldownError extends ApiError {
  constructor(retryAfterSeconds: number) {
    super(409, "כבר נוספה חותמת לאחרונה, נסו שוב בעוד כמה שניות", {
      retryAfterSeconds,
    });
  }
}

/** יותר מדי ניסיונות התחברות כושלים מאותה כתובת. */
export class RateLimitedError extends ApiError {
  constructor(retryAfterSeconds: number) {
    super(429, "יותר מדי ניסיונות, נסו שוב בעוד כמה דקות", {
      retryAfterSeconds,
    });
  }
}

export function handleApiError(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message, ...err.extra }, { status: err.status });
  }
  console.error("Unexpected API error:", err);
  return NextResponse.json({ error: "משהו השתבש, נסו שוב" }, { status: 500 });
}
