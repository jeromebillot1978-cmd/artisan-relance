import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { BENCH_DATE, BENCH_METHOD, PRICE_DATE, weightRatio } from "@/lib/content/benchmarks";
import { PriceCompare } from "@/components/marketing/price-compare";
import { SpeedChart } from "@/components/marketing/speed-chart";
import { FaqList } from "@/components/marketing/faq-list";
import { CtaBlock } from "@/components/marketing/cta-block";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo/json-ld";

export const metadata = pageMetadata({
  title: "Comparatif logiciels de relance de devis artisans 2026",
  description:
    "Artisan Relance face à Obat, Tolteck, Batappli, Abby et Sellsy : prix publics, vitesse mesurée sur mobile, relance des devis. Sources et dates.",
  path: "/comparatif",
});

const FAQ = [
  {
    q: "Quel est le logiciel le moins cher pour relancer ses devis ?",
    a: `Artisan Relance est gratuit aujourd'hui, avec une offre prévue à 19 € HT par mois. Les logiciels de devis complets relevés le ${PRICE_DATE} coûtent entre 25 et 143 € HT par mois, mais ils couvrent aussi le chiffrage, la facturation ou la gestion.`,
  },
  {
    q: "Obat, Tolteck ou Batappli relancent-ils les devis ?",
    a: "Les sources consultées ne mentionnent pas de relance automatique des devis pour ces trois logiciels ; Obat et Abby mentionnent la relance des factures impayées. Les fonctions évoluent : vérifiez auprès de chaque éditeur. Sellsy annonce des relances automatiques par e-mail.",
  },
  {
    q: "Peut-on utiliser Artisan Relance avec Obat ou Batappli ?",
    a: "Oui. Vous faites le devis dans votre logiciel, vous exportez le PDF et vous le joignez dans Artisan Relance, qui s'occupe de l'envoi, des relances et de la demande d'avis Google. Aucune intégration n'est nécessaire.",
  },
];

export default function ComparatifPage() {
  return (
    <article className="container max-w-4xl py-12 md:py-16">
      <BreadcrumbJsonLd items={[{ name: "Accueil", path: "/" }, { name: "Comparatif", path: "/comparatif" }]} />
      <FaqJsonLd items={FAQ} />

      <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
        Comparatif des logiciels pour relancer ses devis d'artisan
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">Par Jercat · prix et mesures du {PRICE_DATE}</p>

      <section aria-label="En bref" className="mt-8 rounded-xl border border-brand/30 bg-brand/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">En bref</p>
        <p className="mt-2 leading-relaxed">
          Si vous n'avez pas encore de logiciel de devis, prenez un logiciel complet. Si vous en avez déjà un et que vos
          devis restent sans réponse, un outil spécialisé comme Artisan Relance suffit : il relance à partir du PDF de
          n'importe quel logiciel, il est gratuit aujourd'hui (19 € HT par mois prévus) et sa page d'accueil est jusqu'à{" "}
          {weightRatio()} fois plus légère que celles des logiciels de devis mesurés.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">Prix et relance des devis</h2>
        <p className="mt-3 mb-5 text-muted-foreground">
          Ces outils ne font pas la même chose : on compare ici ce que vous payez quand votre besoin est de relancer vos devis.
        </p>
        <PriceCompare />
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-semibold tracking-tight">Vitesse sur mobile</h2>
        <p className="mt-3 text-muted-foreground">
          Sur un chantier, le réseau est souvent faible. Une page légère s'affiche plus vite et consomme moins de données.
        </p>
        <div className="mt-6 grid gap-6">
          <div className="rounded-xl border bg-card p-5"><SpeedChart metric="lcp" /></div>
          <div className="rounded-xl border bg-card p-5"><SpeedChart metric="kb" /></div>
        </div>
      </section>

      <section className="mt-14 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold">Choisissez un logiciel complet si…</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {[
              "vous n'avez pas encore d'outil pour chiffrer et éditer vos devis ;",
              "vous voulez facturer, gérer les acomptes et la TVA au même endroit ;",
              "vous avez besoin d'une bibliothèque de prix ou d'un suivi de chantier.",
            ].map((t) => (
              <li key={t} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{t}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border-2 border-brand bg-brand/5 p-6">
          <h2 className="text-lg font-semibold">Choisissez Artisan Relance si…</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              "vous avez déjà votre outil de devis et ne voulez pas en changer ;",
              "vos devis partent mais personne n'a le temps de relancer ;",
              "vous voulez aussi demander des avis Google après le chantier ;",
              "vous ne voulez pas payer un logiciel complet pour une seule fonction.",
            ].map((t) => (
              <li key={t} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />{t}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-semibold tracking-tight">Méthode</h2>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li>Vitesse : {BENCH_METHOD}, le {BENCH_DATE}. Les valeurs varient d'une mesure à l'autre ; seuls les ordres de grandeur comptent.</li>
          <li>Prix : tarifs publics hors promotion relevés le {PRICE_DATE} sur les pages citées sous le tableau, à vérifier chez chaque éditeur avant de souscrire.</li>
          <li>Fonctions : uniquement ce que disent les sources. Une fonction « non mentionnée » peut exister.</li>
          <li>
            Une erreur ou une mise à jour ? <Link href="/contact" className="underline underline-offset-4">Écrivez-nous</Link>, nous corrigeons rapidement.
          </li>
        </ul>
      </section>

      <section className="mt-14">
        <h2 className="mb-5 text-2xl font-semibold tracking-tight">Questions fréquentes</h2>
        <FaqList items={FAQ} />
      </section>

      <div className="mt-14">
        <CtaBlock title="Gardez votre logiciel. Ajoutez la relance." text="Joignez le PDF de votre prochain devis : les relances partent seules, à votre nom, au bon moment." />
      </div>
    </article>
  );
}
