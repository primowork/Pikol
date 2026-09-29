"use client";

import { useEffect, useState } from "react";
import { staffFetch } from "@/lib/staff-fetch";
import type { StampActivityEvent } from "@/types";

interface ActivityFeedProps {
  /** לשנות ערך זה (למשל מונה שעולה) כדי לאלץ רענון של הפיד. */
  refreshKey: number;
}

// ניקובים שאושרו מתוך ההתראה עצמה (בלי לגעת בדשבורד) מופיעים גם בלי רענון
const REFRESH_INTERVAL_MS = 30000;

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** "14:05" להיום, "אתמול 14:05", ואחרת "3.9 14:05" - בלי זה ניקוב מאתמול נראה כמו מהיום. */
function formatEventTime(iso: string, now: Date): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
  if (isSameDay(date, now)) return time;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return `אתמול ${time}`;

  return `${date.toLocaleDateString("he-IL", { day: "numeric", month: "numeric" })} ${time}`;
}

/** פיד הפעילות האחרונה בדשבורד - יומן הביקורת שהמשתמש ביקש. */
export default function ActivityFeed({ refreshKey }: ActivityFeedProps) {
  const [events, setEvents] = useState<StampActivityEvent[] | null>(null);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await staffFetch("/api/stamps?limit=15", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setEvents(data.events ?? []);
        setLoadedAt(new Date());
      } catch {
        // תקלת רשת זמנית - הפיד פשוט לא יתעדכן בפעם הזו
      }
    }

    load();
    const interval = window.setInterval(load, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [refreshKey]);

  if (events === null || loadedAt === null) {
    return <p className="text-sm text-pikol-brown/50">טוען…</p>;
  }

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
          <span className="text-xs text-pikol-brown/50">{formatEventTime(event.createdAt, loadedAt)}</span>
        </li>
      ))}
    </ul>
  );
}
