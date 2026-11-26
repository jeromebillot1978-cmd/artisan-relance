"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { shouldSkipStats } from "@/lib/stats-exclusion";


/** Envoie une page vue anonyme (sans cookie) au serveur à chaque changement de page publique (hors administrateur). */
export function SiteVisitTracker() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (!pathname || shouldSkipStats(pathname)) return;
    const referrer = first.current ? document.referrer : "";
    first.current = false;
    try {
      void fetch("/api/stats/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname, referrer }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* jamais bloquant */
    }
  }, [pathname]);

  return null;
}
