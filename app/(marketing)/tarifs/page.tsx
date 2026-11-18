import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { FaqList } from "@/components/marketing/faq-list";
import { PriceCompare } from "@/components/marketing/price-compare";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo/json-ld";

export const metadata = pageMetadata({
  title: "Prix du logiciel de relance de devis : gratuit | Artisan Relance",
  description:
    "Artisan Relance est gratuit aujourd'hui, puis 19 € HT/mois prévus : relances automatiques, avis Google, tableau de bord. Comparez avec Obat, Tolteck, Batappli.",
  path: "/tarifs",
});

const PRICING_FAQ = [
  { q: "Artisan Relance est-il vraiment gratuit ?", a: "Oui, aujourd'hui toutes les fonctionnalités sont gratuites, sans carte bancaire et sans limite de nombre de devis. Seul le nombre d'e-mails envoyés par jour est plafonné (30 par compte) pour éviter les abus." },
  { q: "Combien coûtera Artisan Relance ?", a: "Une offre unique est prévue à 19 € HT par mois. Vous serez prévenu par e-mail au moins 30 jours avant tout changement, avec la possibilité d'exporter vos devis en CSV ou de supprimer votre compte sans frais." },
  { q: "Pourquoi ne pas utiliser la relance de mon logiciel de devis ?", a: "Si votre logiciel relance déjà vos devis et que vous l'utilisez, gardez-le. Artisan Relance s'adresse aux artisans dont l'outil de devis ne relance pas, ou qui ne veulent pas payer un logiciel complet pour cette seule fonction." },
  { q: "Faut-il un logiciel de devis en plus ?", a: "Oui, Artisan Relance ne crée pas les devis : vous gardez votre outil habituel (ou Excel, Word) et vous joignez le PDF. Il s'occupe de l'envoi, des relances et de la demande d'avis Google." },
];

const included = [
  "Devis illimités, jusqu'à 5 destinataires par devis",
  "Envoi du devis avec pièces jointes (PDF, photos, plans)",
  "Relances automatiques au rythme de votre choix",
  "Arrêt des relances en un clic (répondu, gagné, perdu, terminé)",
  "Demande d'avis Google automatique et suivi des clics",
  "Tableau de bord, taux de signature, export CSV",
  "E-mails à votre nom, réponses du client dans votre espace avec alerte e-mail",
  "Application rapide sur téléphone, même en 4G",
];

const plans = [
  {
    name: "Aujourd'hui",
    price: "0 €",
    period: "sans carte bancaire",
    description: "Toutes les fonctionnalités, pendant la phase de lancement.",
    badge: "Actuel",
    highlighted: true,
  },
  {
    name: "Offre prévue",
    price: "19 € HT",
    period: "par mois",
    description: "La même chose, sans logiciel complet à payer en plus. Préavis de 30 jours avant le passage.",
    badge: "Prévu",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <section className="container py-16 md:py-24">
      <FaqJsonLd items={PRICING_FAQ} />
      <BreadcrumbJsonLd items={[{ name: "Accueil", path: "/" }, { name: "Tarifs", path: "/tarifs" }]} />
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-balance text-4xl font-semibold tracking-tight">Tarifs : gratuit aujourd'hui, 19 € HT par mois demain</h1>
        <p className="mt-3 text-muted-foreground">
          Ne payez pas un logiciel complet si votre problème est seulement de relancer vos devis.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <div key={plan.name} className={cn("flex flex-col rounded-2xl border bg-card p-6 md:p-8", plan.highlighted && "border-brand/50 shadow-lg shadow-brand/10")}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{plan.name}</h2>
              <Badge variant="outline" className={cn(plan.highlighted && "border-brand/40 text-brand")}>{plan.badge}</Badge>
            </div>
            <p className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-semibold tracking-tight">{plan.price}</span>
              <span className="text-sm text-muted-foreground">{plan.period}</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
            <ul className="mt-6 flex-1 space-y-3 text-sm">
              {included.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  {f}
                </li>
              ))}
            </ul>
            {plan.highlighted ? (
              <Button asChild variant="brand" className="mt-8">
                <Link href={SITE.ctaHref}>{SITE.cta}</Link>
              </Button>
            ) : (
              <p className="mt-8 rounded-md bg-muted px-3 py-2 text-center text-sm text-muted-foreground">Rien à faire aujourd'hui</p>
            )}
          </div>
        ))}
      </div>

      <div className="mx-auto mt-16 max-w-4xl">
        <h2 className="text-2xl font-semibold tracking-tight">Combien coûte un logiciel complet ?</h2>
        <p className="mt-2 mb-5 text-muted-foreground">
          Les logiciels de devis font beaucoup plus que relancer : si vous avez besoin de tout, ils valent leur prix. Si
          votre seul problème est la relance, comparez.
        </p>
        <PriceCompare />
        <p className="mt-4 text-sm">
          <Link href="/comparatif" className="underline underline-offset-4">Voir le comparatif détaillé (vitesse, fonctions, prix)</Link>
        </p>
      </div>

      <div className="mx-auto mt-16 max-w-3xl">
        <h2 className="mb-5 text-2xl font-semibold tracking-tight">Questions sur les tarifs</h2>
        <FaqList items={PRICING_FAQ} />
      </div>
    </section>
  );
}
