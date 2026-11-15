import type { Metadata } from "next";

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
    },
    twitter: { card: "summary_large_image", title: ogTitle, description: opts.description },
  };
}
