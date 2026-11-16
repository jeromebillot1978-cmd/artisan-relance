import type { Metadata } from "next";
import { siteUrl } from "@/lib/utils";

/**
 * Image officielle de partage (Facebook, LinkedIn, WhatsApp, Messenger, Discord, X, Teams).
 * Fichier : public/og-image.png (1200×630). Après modification de l'image, changer « v= »
 * pour forcer les réseaux sociaux à la recharger (ils gardent l'ancienne en cache).
 */
const OG_IMAGE_URL = `${siteUrl()}/og-image.png?v=20261116`;

export const OG_IMAGE = {
  url: OG_IMAGE_URL,
  secureUrl: OG_IMAGE_URL,
  width: 1200,
  height: 630,
  type: "image/png",
  alt: "Artisan Relance — Vous faites les devis. Nous les transformons en chantiers signés. Essayer gratuitement.",
};

/**
 * Métadonnées complètes d'une page publique : title, description, canonical,
 * Open Graph et Twitter propres à la page (sinon elles héritent de l'accueil).
 */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  ogTitle?: string;
  type?: "website" | "article";
}): Metadata {
  const ogTitle = opts.ogTitle ?? opts.title;
  // L'image de partage doit être répétée ici : un objet openGraph défini par la page
  // remplace entièrement celui hérité (sinon aucune og:image n'est publiée).
  const image = OG_IMAGE;
  return {
    title: { absolute: opts.title },
    description: opts.description,
    alternates: { canonical: opts.path },
    openGraph: {
      title: ogTitle,
      description: opts.description,
      url: opts.path,
      siteName: "Artisan Relance",
      locale: "fr_FR",
      type: opts.type ?? "website",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: opts.description,
      images: [{ url: image.url, alt: image.alt, width: image.width, height: image.height }],
    },
  };
}
