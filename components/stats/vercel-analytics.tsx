"use client";

import { Analytics } from "@vercel/analytics/next";

const PRIVATE = /^\/(dashboard|devis|parametres|avis-google|statistiques|auth|r)(\/|$)/;

/** Vercel Web Analytics, limité aux pages publiques (l'application privée n'est pas comptée). */
export function VercelAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        try {
          return PRIVATE.test(new URL(event.url).pathname) ? null : event;
        } catch {
          return event;
        }
      }}
    />
  );
}
