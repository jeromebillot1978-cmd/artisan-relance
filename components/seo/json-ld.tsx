import { siteUrl } from "@/lib/utils";
import { SITE } from "@/lib/site";
import { OG_IMAGE } from "@/lib/seo";
import { FAQ_ALL } from "@/lib/content/faq";
import { stripLinks } from "@/lib/content/types";

/** Question / réponse. `a` = réponse courte autonome (citée par les IA), `detail` = réponse détaillée facultative. */
export type QA = { q: string; a: string; detail?: string };

function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/** Identifiants Schema.org partagés : chaque page relie ses données aux mêmes entités. */
export const LD_IDS = {
  organization: (url: string) => `${url}/#organization`,
  website: (url: string) => `${url}/#website`,
  software: (url: string) => `${url}/#software`,
  founder: (url: string) => `${url}/a-propos#jercat`,
};

export const SITE_DESCRIPTION =
  "Artisan Relance est un logiciel SaaS français de relance automatique de devis pour les artisans du bâtiment : envoi du devis PDF par e-mail, relances automatiques au rythme choisi, arrêt dès que le client répond, réponses du client dans le dossier et demande d'avis Google après le chantier.";

/** Organization (Artisan Relance) + fondateur (Jercat) + WebSite : présents sur toutes les pages publiques. */
export function SiteJsonLd() {
  const url = siteUrl();
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": LD_IDS.organization(url),
            name: SITE.name,
            alternateName: ["Artisan Relance par Jercat", "Artisan Relance, logiciel de relance de devis"],
            url: `${url}/`,
            logo: { "@type": "ImageObject", url: `${url}/icon.svg`, caption: SITE.name },
            image: OG_IMAGE.url,
            description: SITE_DESCRIPTION,
            slogan: "Vous faites les devis. Nous les transformons en chantiers signés.",
            email: SITE.contactEmail,
            foundingDate: "2026-11",
            areaServed: { "@type": "Country", name: "France" },
            knowsAbout: ["relance de devis", "suivi des devis", "artisans du bâtiment", "taux de transformation des devis", "avis Google"],
            founder: { "@id": LD_IDS.founder(url) },
            address: { "@type": "PostalAddress", addressCountry: "FR" },
            ethicsPolicy: `${url}/confiance`,
            publishingPrinciples: `${url}/a-propos`,
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer support",
              email: SITE.contactEmail,
              url: `${url}/contact`,
              availableLanguage: ["fr"],
              areaServed: "FR",
            },
            brand: { "@type": "Brand", name: SITE.name, logo: `${url}/icon.svg` },
          },
          {
            "@type": "Person",
            "@id": LD_IDS.founder(url),
            name: SITE.editor,
            jobTitle: "Développeur web indépendant, créateur d'Artisan Relance",
            url: `${url}/a-propos`,
            sameAs: [SITE.editorUrl],
            worksFor: { "@id": LD_IDS.organization(url) },
            knowsAbout: ["développement web", "automatisation", "relance de devis", "e-mail transactionnel"],
          },
          {
            "@type": "WebSite",
            "@id": LD_IDS.website(url),
            name: SITE.name,
            url: `${url}/`,
            inLanguage: "fr-FR",
            description: SITE_DESCRIPTION,
            publisher: { "@id": LD_IDS.organization(url) },
            about: { "@id": LD_IDS.software(url) },
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
        "@id": LD_IDS.software(url),
        name: SITE.name,
        url: `${url}/`,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Relance de devis",
        operatingSystem: "Web, iOS, Android (navigateur)",
        inLanguage: "fr-FR",
        isAccessibleForFree: true,
        description:
          "Logiciel SaaS de relance automatique de devis pour artisans du bâtiment, en complément de leur logiciel de devis (Obat, Batappli, Tolteck, Excel, Word) : envoi du devis PDF par e-mail, relances automatiques au rythme choisi, arrêt dès que le client répond, réponses du client dans le dossier, demande d'avis Google après le chantier.",
        softwareRequirements: "Navigateur web récent (ordinateur, tablette ou téléphone)",
        dateModified: "2026-11-18",
        alternateName: ["Artisan Relance, logiciel de relance de devis", "Relance de devis automatique pour artisans"],
        audience: { "@type": "BusinessAudience", audienceType: "Artisans et TPE du bâtiment" },
        featureList: [
          "Envoi du devis PDF par e-mail au nom de l'artisan",
          "Relances automatiques tous les 3, 7, 14 ou 30 jours",
          "Nombre maximum de relances et date de fin",
          "Arrêt automatique des relances dès que le client répond",
          "Réponses et pièces jointes du client affichées dans le dossier du devis, avec alerte e-mail",
          "Réponse au client depuis le site, avec pièces jointes",
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
        publisher: { "@id": LD_IDS.organization(url) },
        creator: { "@id": LD_IDS.founder(url) },
      }}
    />
  );
}

/**
 * FAQPage. Règle Google : une même question ne doit être balisée qu'une fois sur tout le site.
 * La page /faq (`hub`) porte le balisage de toutes ses questions ; sur les autres pages, les
 * questions déjà présentes sur /faq restent visibles mais ne sont plus balisées.
 */
export function FaqJsonLd({ items, hub = false }: { items: QA[]; hub?: boolean }) {
  const onHub = new Set(FAQ_ALL.map((x) => x.q.trim().toLowerCase()));
  const seen = new Set<string>();
  const marked = items.filter((item) => {
    const key = item.q.trim().toLowerCase();
    if (seen.has(key) || (!hub && onHub.has(key))) return false;
    seen.add(key);
    return true;
  });
  if (marked.length === 0) return null;
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: marked.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: stripLinks(item.detail ? `${item.a} ${item.detail}` : item.a) },
        })),
      }}
    />
  );
}

/** Page de liste (hub /guides, /relance-devis) : CollectionPage + ItemList des pages liées. */
export function CollectionJsonLd(opts: { path: string; name: string; description: string; items: { name: string; path: string }[] }) {
  const url = siteUrl();
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "@id": `${url}${opts.path}`,
        url: `${url}${opts.path}`,
        name: opts.name,
        description: opts.description,
        inLanguage: "fr-FR",
        isPartOf: { "@id": LD_IDS.website(url) },
        publisher: { "@id": LD_IDS.organization(url) },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: opts.items.length,
          itemListElement: opts.items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, url: `${url}${it.path}` })),
        },
      }}
    />
  );
}

/** Page de contact : ContactPage reliée à l'organisation. */
export function ContactPageJsonLd({ path, description }: { path: string; description: string }) {
  const url = siteUrl();
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "ContactPage",
        "@id": `${url}${path}`,
        url: `${url}${path}`,
        name: "Contacter Artisan Relance",
        description,
        inLanguage: "fr-FR",
        isPartOf: { "@id": LD_IDS.website(url) },
        about: { "@id": LD_IDS.organization(url) },
        mainEntity: { "@id": LD_IDS.organization(url) },
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

export function ArticleJsonLd(opts: { title: string; description: string; path: string; date: string; modified?: string }) {
  const url = siteUrl();
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: opts.title,
        description: opts.description,
        mainEntityOfPage: { "@type": "WebPage", "@id": `${url}${opts.path}` },
        url: `${url}${opts.path}`,
        image: OG_IMAGE.url,
        datePublished: opts.date,
        dateModified: opts.modified ?? opts.date,
        inLanguage: "fr-FR",
        about: { "@type": "Thing", name: "Relance de devis" },
        author: { "@id": LD_IDS.founder(url), "@type": "Person", name: SITE.editor, url: `${url}/a-propos` },
        publisher: { "@id": LD_IDS.organization(url) },
        isPartOf: { "@id": LD_IDS.website(url) },
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

/** Page « À propos » : décrit l'organisation et son fondateur. */
export function AboutPageJsonLd({ path, description }: { path: string; description: string }) {
  const url = siteUrl();
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "AboutPage",
        "@id": `${url}${path}`,
        url: `${url}${path}`,
        name: "À propos d'Artisan Relance",
        description,
        inLanguage: "fr-FR",
        isPartOf: { "@id": LD_IDS.website(url) },
        about: { "@id": LD_IDS.organization(url) },
        mainEntity: { "@id": LD_IDS.organization(url) },
        author: { "@id": LD_IDS.founder(url) },
      }}
    />
  );
}

/** Page « Confiance » : engagements, sécurité et RGPD de l'organisation. */
export function TrustPageJsonLd({ path, description }: { path: string; description: string }) {
  const url = siteUrl();
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": `${url}${path}`,
        url: `${url}${path}`,
        name: "Confiance et sécurité des données — Artisan Relance",
        description,
        inLanguage: "fr-FR",
        isPartOf: { "@id": LD_IDS.website(url) },
        about: [{ "@id": LD_IDS.organization(url) }, { "@id": LD_IDS.software(url) }],
        publisher: { "@id": LD_IDS.organization(url) },
        author: { "@id": LD_IDS.founder(url) },
        dateModified: "2026-11-18",
      }}
    />
  );
}
