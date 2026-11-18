import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/utils";
import { METIERS } from "@/lib/content/metiers";
import { GUIDES } from "@/lib/content/guides";

// Dates fixes : mises à jour à la main quand le contenu d'une page change réellement.
const UPDATED = new Date("2026-11-18");

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const page = (path: string, priority: number, changeFrequency: "weekly" | "monthly" | "yearly" = "monthly", lastModified = UPDATED) => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency,
    priority,
  });
  return [
    page("/", 1, "weekly"),
    page("/tarifs", 0.8),
    page("/comparatif", 0.8),
    page("/presentation", 0.6),
    page("/a-propos", 0.6, "monthly", new Date("2026-11-18")),
    page("/confiance", 0.6, "monthly", new Date("2026-11-18")),
    page("/faq", 0.8),
    page("/relance-devis", 0.8),
    ...METIERS.map((m) => page(`/relance-devis/${m.slug}`, 0.8, "monthly", new Date(m.date))),
    page("/guides", 0.7),
    ...GUIDES.map((g) => page(`/guides/${g.slug}`, 0.7, "monthly", new Date(g.date))),
    page("/contact", 0.6),
    page("/mentions-legales", 0.2, "yearly"),
    page("/confidentialite", 0.2, "yearly"),
    page("/cgu", 0.2, "yearly"),
  ];
}
