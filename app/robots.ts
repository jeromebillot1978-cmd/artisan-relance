import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/utils";

/**
 * Pages marketing : explorables et indexables.
 * Application connectée (tableau de bord, devis, paramètres, avis) et liens privés :
 * exploration interdite ici, et en-tête « X-Robots-Tag: noindex » en plus (next.config.ts
 * et middleware) au cas où une URL privée serait découverte par un lien externe.
 *
 * Règles « $ » : /devis et ses sous-pages sont bloqués, mais une future page marketing
 * dont l'adresse commencerait par « /devis- » (ex. /devis-gratuit) resterait explorable.
 * Les pages de connexion ne sont PAS bloquées : Google doit pouvoir lire leur « noindex ».
 */
const PRIVATE = ["/dashboard", "/devis", "/parametres", "/avis-google", "/statistiques"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        ...PRIVATE.flatMap((p) => [`${p}$`, `${p}/`]),
        "/api/",
        "/auth/",
        "/r/",
      ],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
