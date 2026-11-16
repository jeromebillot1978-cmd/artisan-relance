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
  // L'image de partage doit être répétée ici : un objet openGraph défini par la page
  // remplace entièrement celui hérité (sinon aucune og:image n'est publiée).
  const image = { url: "/opengraph-image", width: 1200, height: 630, alt: "Artisan Relance — logiciel de relance de devis pour artisans" };
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
    twitter: { card: "summary_large_image", title: ogTitle, description: opts.description, images: [image.url] },
  };
}
