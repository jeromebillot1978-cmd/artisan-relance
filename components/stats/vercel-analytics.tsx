"use client";

import { Analytics } from "@vercel/analytics/next";
import { shouldSkipStats } from "@/lib/stats-exclusion";

/**
 * Vercel Web Analytics, limité aux pages publiques et aux vrais visiteurs :
 * ni l'application privée, ni l'administration, ni les visites de l'administrateur.
 */
export function VercelAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        try {
          return shouldSkipStats(new URL(event.url).pathname) ? null : event;
        } catch {
          return event;
        }
      }}
    />
  );
}
