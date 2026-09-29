"use client";

import type { ComponentProps, MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPreviousPathname } from "@/lib/nav-history";

type BackLinkProps = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

/**
 * קישור "חזרה ל..." שמתנהג כמו כפתור החזרה של הטלפון כשהיעד שלו הוא בדיוק
 * העמוד הקודם. קישור רגיל היה דוחף את היעד שוב להיסטוריה, ואז החלקה אחורה
 * ממנו הייתה חוזרת לעמוד שממנו יצאנו (דשבורד ← הגדרות ← דשבורד ← הגדרות...).
 * כשלא הגענו מהיעד (קישור ישיר, סימנייה, סריקת קוד) זה קישור רגיל.
 */
export default function BackLink({ href, onClick, ...rest }: BackLinkProps) {
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    if (getPreviousPathname() === href) {
      event.preventDefault();
      router.back();
    }
  }

  return <Link href={href} onClick={handleClick} {...rest} />;
}
