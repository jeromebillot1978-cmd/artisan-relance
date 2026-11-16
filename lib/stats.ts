import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** Pages de l'application (privées) : jamais comptées comme visites du site. */
export const PRIVATE_PREFIXES = ["/dashboard", "/devis", "/parametres", "/avis-google", "/statistiques", "/api", "/auth", "/r/"];

export function isTrackablePath(path: string) {
  return (
    path.startsWith("/") &&
    path.length <= 200 &&
    !PRIVATE_PREFIXES.some((p) => path === p.replace(/\/$/, "") || path.startsWith(p.endsWith("/") ? p : `${p}/`))
  );
}

export type Metric = { total: number; month: number };
export type DailyPoint = { day: string; visitors: number; views: number };

export type SiteStats = {
  generated_at: string;
  first_day: string | null;
  visitors: { today: number; week: number; month: number; total: number };
  views: { today: number; week: number; month: number; total: number };
  daily: DailyPoint[];
  top_pages: { path: string; visitors: number; views: number }[];
  top_referrers: { host: string; visitors: number }[];
  /** Statistiques de la plateforme : ajouter une clé côté SQL suffit à l'afficher (voir PLATFORM_METRICS). */
  platform: Record<string, Metric>;
};

/** L'utilisateur connecté est-il administrateur de la plateforme ? */
export const isPlatformAdmin = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_platform_admin");
  return data === true;
});

export async function getSiteStats(days = 90): Promise<SiteStats | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_site_stats", { p_days: days });
  if (error) {
    console.error("admin_site_stats", error.message);
    return null;
  }
  return data as SiteStats;
}
