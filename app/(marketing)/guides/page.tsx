import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { GUIDES } from "@/lib/content/guides";
import { METIERS } from "@/lib/content/metiers";
import { pageMetadata } from "@/lib/seo";
import { CtaBlock } from "@/components/marketing/cta-block";
import { BreadcrumbJsonLd, CollectionJsonLd } from "@/components/seo/json-ld";

const DESCRIPTION =
  "Relancer un devis sans harceler, quand relancer, exemples de mail et de SMS, taux de signature, suivi des devis : les guides pratiques pour artisans.";

export const metadata = pageMetadata({
  title: "Guides de relance de devis pour artisans — Artisan Relance",
  description: DESCRIPTION,
  path: "/guides",
});

/**
 * Guides classés par intention de recherche. Chaque guide a ici une phrase propre au hub
 * (« quand le lire »), distincte de sa réponse courte et de sa meta description.
 */
const THEMES: { title: string; intro: string; guides: { slug: string; when: string }[] }[] = [
  {
    title: "Quand et combien de fois relancer un devis",
    intro:
      "Le rythme est la première question que se posent les artisans : trop tôt, la relance paraît pressante ; trop tard, le client a déjà choisi. Ces trois guides donnent des délais précis, adaptés au montant et à l'urgence du chantier.",
    guides: [
      { slug: "quand-relancer-un-devis", when: "À lire avant d'envoyer votre prochain devis : délai d'envoi après le rendez-vous et calendriers types jour par jour." },
      { slug: "combien-de-relances-devis", when: "À lire si vous hésitez entre une et cinq relances : repères selon le montant, l'urgence et votre métier." },
      { slug: "relancer-devis-sans-harceler", when: "À lire si vous avez peur de déranger : règles de rythme, phrases à éviter et test en trois questions." },
    ],
  },
  {
    title: "Quoi écrire : mail, SMS ou téléphone",
    intro:
      "Une relance efficace apporte une information nouvelle et appelle une réponse simple. Ces guides fournissent des modèles prêts à copier et vous aident à choisir le bon canal pour chaque client.",
    guides: [
      { slug: "modele-mail-relance-devis", when: "Dix modèles de mail, des objets qui se font ouvrir et une séquence complète de trois messages." },
      { slug: "exemple-sms-relance-devis", when: "Des SMS courts par situation et par métier, avec les horaires et les erreurs à éviter." },
      { slug: "relance-devis-email-ou-telephone", when: "Comparatif des canaux, script d'appel et combinaison e-mail + téléphone pour les gros devis." },
    ],
  },
  {
    title: "Débloquer un devis resté sans réponse",
    intro:
      "Un devis sans réponse n'est pas forcément un devis refusé. Ces guides aident à comprendre ce qui bloque et à relancer les dossiers longs, notamment ceux qui dépendent d'une aide à la rénovation.",
    guides: [
      { slug: "relancer-client-qui-ne-repond-plus", when: "Méthode en quatre étapes, types de silence et message de clôture qui fait réagir." },
      { slug: "pourquoi-devis-pas-signe", when: "Les dix causes les plus fréquentes et une grille d'autodiagnostic sur vos vingt derniers devis." },
      { slug: "relance-devis-renovation-energetique", when: "Pompe à chaleur, isolation, fenêtres : relancer au rythme du dossier d'aide du client." },
    ],
  },
  {
    title: "Signer plus de devis et suivre ses résultats",
    intro:
      "Relancer ne suffit pas si l'on ne mesure rien. Ces deux guides expliquent comment calculer son taux de signature, organiser un suivi simple et repérer ce qui fait perdre des chantiers.",
    guides: [
      { slug: "augmenter-taux-signature-devis", when: "Calcul du taux de signature, neuf leviers concrets et plan d'action sur trente jours." },
      { slug: "suivi-des-devis", when: "Statuts, colonnes d'un tableau de suivi, routine hebdomadaire de dix minutes et indicateurs utiles." },
    ],
  },
];

export default function GuidesIndex() {
  const bySlug = new Map(GUIDES.map((g) => [g.slug, g]));
  const listed = new Set(THEMES.flatMap((t) => t.guides.map((x) => x.slug)));
  const others = GUIDES.filter((g) => !listed.has(g.slug));
  return (
    <section className="container max-w-3xl py-12 md:py-16">
      <BreadcrumbJsonLd items={[{ name: "Accueil", path: "/" }, { name: "Guides", path: "/guides" }]} />
      <CollectionJsonLd
        path="/guides"
        name="Guides de relance de devis pour artisans"
        description={DESCRIPTION}
        items={GUIDES.map((g) => ({ name: g.h1, path: `/guides/${g.slug}` }))}
      />
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Guides : relancer ses devis et signer plus</h1>
      <div className="mt-4 space-y-4 text-muted-foreground">
        <p>
          Ces guides répondent aux questions que se posent les artisans du bâtiment une fois le devis envoyé : quand relancer,
          combien de fois, avec quel message et par quel canal, et que faire quand le client ne répond plus. Chacun donne des
          délais précis, des exemples tirés de chantiers courants et des modèles prêts à copier.
        </p>
        <p>
          <strong className="font-medium text-foreground">Par où commencer ?</strong> Si vous ne relancez pas encore vos
          devis, lisez d'abord <Link href="/guides/quand-relancer-un-devis" className="underline underline-offset-4">quand relancer un devis</Link>,
          puis copiez un des <Link href="/guides/modele-mail-relance-devis" className="underline underline-offset-4">modèles de mail de relance</Link>.
          Si vous relancez déjà mais signez peu, commencez par{" "}
          <Link href="/guides/pourquoi-devis-pas-signe" className="underline underline-offset-4">pourquoi un devis n'est pas signé</Link>.
        </p>
      </div>

      <nav aria-label="Thèmes" className="mt-8 flex flex-wrap gap-2 text-sm">
        {THEMES.map((t, i) => (
          <a key={t.title} href={`#theme-${i}`} className="rounded-full border px-3 py-1 hover:bg-muted">{t.title}</a>
        ))}
      </nav>

      {THEMES.map((t, i) => (
        <section key={t.title} id={`theme-${i}`} className="mt-12 scroll-mt-20">
          <h2 className="text-2xl font-semibold tracking-tight">{t.title}</h2>
          <p className="mt-2 text-muted-foreground">{t.intro}</p>
          <ul className="mt-5 space-y-3">
            {t.guides.map(({ slug, when }) => {
              const g = bySlug.get(slug);
              if (!g) return null;
              return (
                <li key={slug}>
                  <Link href={`/guides/${slug}`} className="block rounded-xl border bg-card p-5 hover:bg-muted/40">
                    <span className="flex items-center justify-between gap-3 text-lg font-medium">
                      {g.h1}
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </span>
                    <span className="mt-2 block text-sm text-muted-foreground">{when}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {others.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold tracking-tight">Autres guides</h2>
          <ul className="mt-5 space-y-3">
            {others.map((g) => (
              <li key={g.slug}>
                <Link href={`/guides/${g.slug}`} className="block rounded-xl border bg-card p-5 hover:bg-muted/40">
                  <span className="text-lg font-medium">{g.h1}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-14">
        <h2 className="text-2xl font-semibold tracking-tight">Des conseils adaptés à votre métier</h2>
        <p className="mt-2 text-muted-foreground">
          Un devis de toiture ne se relance pas comme un devis de peinture. Les pages métiers reprennent ces méthodes avec
          des délais, des modèles et des exemples propres à chaque activité.
        </p>
        <ul className="mt-5 flex flex-wrap gap-2">
          {METIERS.map((m) => (
            <li key={m.slug}>
              <Link href={`/relance-devis/${m.slug}`} className="inline-block rounded-full border px-3 py-1.5 text-sm hover:bg-muted/50">
                Relance de devis {m.short.toLowerCase()}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-14">
        <CtaBlock
          title="Appliquez ces méthodes sans y penser"
          text="Artisan Relance envoie vos devis et programme les relances au rythme choisi, à votre nom. Elles s'arrêtent dès que le client répond."
        />
      </div>
    </section>
  );
}
