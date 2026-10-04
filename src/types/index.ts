// טיפוסים משותפים שתואמים בדיוק את חוזי ה-API (src/app/api/**/route.ts).

export interface CustomerCardState {
  id: string;
  name: string;
  currentStamps: number;
  stampsRequired: number;
  rewardsAvailable: boolean;
  rewardsEarned: number;
}

export interface CustomerSearchResult {
  id: string;
  name: string;
  phone: string;
  currentStamps: number;
  rewardsEarned: number;
}

/** שורה ברשימת "מסד הלקוחות" (staff/customers) - כוללת תאריך הצטרפות. */
export interface CustomerListItem {
  id: string;
  name: string;
  phone: string;
  currentStamps: number;
  rewardsEarned: number;
  createdAt: string;
}

/** הצורה המשותפת בין תוצאת חיפוש/סריקה לתוצאת POST /api/stamps. */
export interface ActiveCustomer {
  id: string;
  name: string;
  currentStamps: number;
  rewardsEarned: number;
}

export interface StaffInfo {
  id: string;
  username: string;
  name: string;
  role: "OWNER" | "STAFF";
}

export interface StampActivityEvent {
  id: string;
  type: "STAMP" | "REDEEM";
  quantity: number;
  createdAt: string;
  customer: { id: string; name: string };
  staff: { id: string; name: string };
}

export interface ApiErrorBody {
  error: string;
  retryAfterSeconds?: number;
}

export type ApprovalStatus = "PENDING" | "APPROVED" | "EXPIRED" | "DECLINED";
/** LOGIN: כניסה לכרטיס קיים מטלפון חדש, באישור הצוות (נוצרת מ-POST /api/customers). */
export type ApprovalRequestKind = "STAMP" | "REDEEM" | "LOGIN";

/** מצב בקשת האישור כפי שנצפה מ-"/scan" ומ-"/join" (polling). */
export interface ApprovalRequestState {
  id: string;
  status: ApprovalStatus;
  kind: ApprovalRequestKind;
  quantity: number;
  createdAt: string;
  /** רק בבקשת LOGIN שאושרה: הכרטיס שהמכשיר המבקש נכנס אליו. */
  customerId?: string;
}

/** שורה ברשימת "בקשות ממתינות" בדשבורד הצוות. */
export interface PendingApprovalRequest {
  id: string;
  createdAt: string;
  kind: ApprovalRequestKind;
  quantity: number;
  customer: { id: string; name: string };
}

/**
 * פרטי העסק שמוצגים ללקוחות (src/lib/business-settings.ts). בית הקפה הוא
 * בעל השליטה במאגר והמפרסם בשידורים. שדה שלא מולא הוא null.
 */
export interface BusinessDetails {
  legalName: string | null;
  businessNumber: string | null;
  address: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
}

/** GET /api/broadcast - כמה לקוחות יקבלו שידור אם יישלח עכשיו (לתצוגה המקדימה). */
export interface BroadcastAudience {
  /** לקוחות שאישרו דיוור ויש להם לפחות מכשיר אחד עם התראות. */
  customerCount: number;
  /** לקוחות עם התראות פעילות שלא אישרו דיוור - לא יקבלו את השידור. */
  withoutConsentCount: number;
  /** שם העסק (וטלפון אם הוגדר) שיופיע בסוף ההודעה - לתצוגה המקדימה. */
  senderLine: string;
}

/** POST /api/broadcast - פירוט מה קרה בשליחה, כדי ש"0" לא יישאר בלי הסבר. */
export interface CustomerBroadcastResult {
  /** לקוחות ייחודיים (לא מכשירים) שלפחות מכשיר אחד שלהם קיבל את ההודעה. */
  sentCount: number;
  /** מכשירים ששירות ה-push דחה (לא 404/410) - נשארים ברשימה. */
  failedCount: number;
  /** מכשירים שביטלו את ההרשמה (404/410) ונמחקו עכשיו מהרשימה. */
  removedCount: number;
  /** תשובת שירות ה-push לכישלון הראשון, בקיצור - לאבחון בלי גישה ללוגים. */
  failureReason: string | null;
}

/**
 * תואם את מה שהדפדפן מחזיר מ-PushSubscription.toJSON(). שם שונה בכוונה
 * מה-interface הגלובלי PushSubscriptionJSON (מ-lib.dom) כדי שלא יהיה
 * בלבול קריאה בין השניים.
 */
export interface SerializedPushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}
