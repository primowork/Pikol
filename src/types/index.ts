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
export type ApprovalRequestKind = "STAMP" | "REDEEM";

/** מצב בקשת האישור כפי שנצפה מ-"/scan" (polling). */
export interface ApprovalRequestState {
  id: string;
  status: ApprovalStatus;
  kind: ApprovalRequestKind;
  quantity: number;
  createdAt: string;
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
 * תואם את מה שהדפדפן מחזיר מ-PushSubscription.toJSON(). שם שונה בכוונה
 * מה-interface הגלובלי PushSubscriptionJSON (מ-lib.dom) כדי שלא יהיה
 * בלבול קריאה בין השניים.
 */
export interface SerializedPushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}
