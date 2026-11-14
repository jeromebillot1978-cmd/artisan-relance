import { siteUrl } from "@/lib/utils";
import { FAQ_ITEMS } from "@/components/marketing/faq-list";

/** Données structurées Schema.org — éditeur affiché sous le nom « Jercat ». */
export function SoftwareJsonLd() {
  const url = siteUrl();
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Artisan Relance",
    url,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: "fr-FR",
    description:
      "Envoi et relance automatique des devis par e-mail pour les artisans, arrêt dès que le client répond.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    publisher: { "@type": "Organization", name: "Jercat", url: "https://dev.jercat.fr" },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function FaqJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
