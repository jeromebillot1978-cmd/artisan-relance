import { siteUrl } from "@/lib/utils";
import { SITE } from "@/lib/site";

export type QA = { q: string; a: string };

function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/** Organization + WebSite : présents sur toutes les pages publiques. */
export function SiteJsonLd() {
  const url = siteUrl();
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": `${url}/#organization`,
            name: SITE.editor,
            url: SITE.editorUrl,
            email: SITE.contactEmail,
            logo: `${url}/icon.svg`,
            brand: { "@type": "Brand", name: SITE.name },
            areaServed: "FR",
          },
          {
            "@type": "WebSite",
            "@id": `${url}/#website`,
            name: SITE.name,
            url,
            inLanguage: "fr-FR",
            description: "Logiciel de relance de devis pour les artisans du bâtiment : envoi du devis, relances automatiques par e-mail, suivi des réponses.",
            publisher: { "@id": `${url}/#organization` },
          },
        ],
      }}
    />
  );
}

export function SoftwareJsonLd() {
  const url = siteUrl();
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "@id": `${url}/#software`,
        name: SITE.name,
        url,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Relance de devis",
        operatingSystem: "Web, iOS, Android (navigateur)",
        inLanguage: "fr-FR",
        isAccessibleForFree: true,
        description:
          "Logiciel de relance de devis pour artisans du bâtiment, en complément de leur logiciel de devis (Obat, Batappli, Tolteck, Excel, Word) : envoi du devis PDF par e-mail, relances automatiques au rythme choisi, arrêt en un clic, demande d'avis Google après le chantier.",
        alternateName: ["Artisan Relance, logiciel de relance de devis", "Relance de devis automatique pour artisans"],
        audience: { "@type": "BusinessAudience", audienceType: "Artisans et TPE du bâtiment" },
        featureList: [
          "Envoi du devis PDF par e-mail au nom de l'artisan",
          "Relances automatiques tous les 3, 7, 14 ou 30 jours",
          "Nombre maximum de relances et date de fin",
          "Réponses du client reçues dans la boîte mail de l'artisan",
          "Arrêt des relances en un clic : gagné, perdu, répondu",
          "Demande d'avis Google automatique après « Gagné » ou « Terminé »",
          "Suivi des clics et des avis obtenus",
          "Tableau de bord et export CSV",
          "Compatible avec tout logiciel de devis (envoi du PDF)",
        ],
        screenshot: [
          `${url}/captures/tableau-de-bord.png`,
          `${url}/captures/nouveau-devis.png`,
          `${url}/captures/suivi-relances.png`,
          `${url}/captures/email-client.png`,
        ],
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          url: `${url}/tarifs`,
          description: "Gratuit pendant la phase de lancement, sans carte bancaire. Offre payante prévue à 19 € HT par mois.",
        },
        publisher: { "@id": `${url}/#organization` },
      }}
    />
  );
}

export function FaqJsonLd({ items }: { items: QA[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; path: string }[] }) {
  const url = siteUrl();
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((it, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: it.name,
          item: `${url}${it.path}`,
        })),
      }}
    />
  );
}

export function ArticleJsonLd(opts: { title: string; description: string; path: string; date: string }) {
  const url = siteUrl();
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: opts.title,
        description: opts.description,
        mainEntityOfPage: `${url}${opts.path}`,
        datePublished: opts.date,
        dateModified: opts.date,
        inLanguage: "fr-FR",
        author: { "@type": "Organization", name: SITE.editor, url: SITE.editorUrl },
        publisher: { "@id": `${url}/#organization` },
      }}
    />
  );
}

/** HowTo : étapes d'une relance (pages métiers). */
export function HowToJsonLd({ name, steps }: { name: string; steps: { name: string; text: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "HowTo",
        name,
        inLanguage: "fr-FR",
        step: steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.name, text: s.text })),
      }}
    />
  );
}
