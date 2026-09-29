"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { recordPathname } from "@/lib/nav-history";

/** רושם כל מעבר עמוד, בשביל BackLink (ראו lib/nav-history.ts). */
export default function NavigationTracker() {
  const pathname = usePathname();

  useEffect(() => {
    recordPathname(pathname);
  }, [pathname]);

  return null;
}
