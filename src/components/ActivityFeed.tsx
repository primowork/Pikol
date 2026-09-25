"use client";

import { useEffect, useState } from "react";
import type { StampActivityEvent } from "@/types";

interface ActivityFeedProps {
  /** לשנות ערך זה (למשל מונה שעולה) כדי לאלץ רענון של הפיד. */
  refreshKey: number;
}

/** פיד הפעילות האחרונה בדשבורד - יומן הביקורת שהמשתמש ביקש. */
export default function ActivityFeed({ refreshKey }: ActivityFeedProps) {
  const [events, setEvents] = useState<StampActivityEvent[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stamps?limit=15", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setEvents(data.events ?? []);
      })
      .catch(() => {
        // תקלת רשת זמנית - הפיד פשוט לא יתעדכן בפעם הזו
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (events.length === 0) {
    return <p className="text-sm text-pikol-brown/50">אין עדיין פעילות להצגה</p>;
  }

  return (
    <ul className="w-full space-y-2">
      {events.map((event) => (
        <li
          key={event.id}
          className="flex items-center justify-between rounded-xl bg-white/50 px-3 py-2 text-sm text-pikol-brown"
        >
          <span>
            {event.type === "STAMP"
              ? event.quantity > 1
                ? `ניקוב (${event.quantity})`
                : "ניקוב"
              : "מימוש פרס"}{" "}
            · {event.customer.name}
          </span>
          <span className="text-xs text-pikol-brown/50">
            {new Date(event.createdAt).toLocaleTimeString("he-IL", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </li>
      ))}
    </ul>
  );
}
