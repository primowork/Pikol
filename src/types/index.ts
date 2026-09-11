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
  createdAt: string;
  customer: { id: string; name: string };
  staff: { id: string; name: string };
}

export interface ApiErrorBody {
  error: string;
  retryAfterSeconds?: number;
}
