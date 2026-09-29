"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * בעמוד "כרטיס לא נמצא": אם המזהה השמור במכשיר הוא בדיוק הכרטיס החסר,
 * מוחקים אותו. אחרת עמוד הבית ואייקון האפליקציה ימשיכו להפנות לכרטיס
 * שלא קיים, בכל פתיחה מחדש.
 */
export default function ForgetMissingCard() {
  const pathname = usePathname();

  useEffect(() => {
    const missingId = pathname.split("/").pop();
    try {
      if (missingId && window.localStorage.getItem("pikol_customer_id") === missingId) {
        window.localStorage.removeItem("pikol_customer_id");
      }
    } catch {
      // localStorage חסום - אין מה לנקות
    }
  }, [pathname]);

  return null;
}
