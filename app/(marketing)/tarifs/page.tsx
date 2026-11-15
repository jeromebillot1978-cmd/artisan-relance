import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { FaqList } from "@/components/marketing/faq-list";
import { FaqJsonLd } from "@/components/seo/json-ld";

export const metadata = pageMetadata({
  title: "Prix du logiciel de relance de devis : gratuit | Artisan Relance",
  description: "Artisan Relance est gratuit pendant le lancement : devis illimités, relances automatiques, tableau de bord. Sans carte bancaire, sans engagement.",
  path: "/tarifs",
});

const PRICING_FAQ = [
  { q: "Artisan Relance est-il vraiment gratuit ?", a: "Oui. Pendant la phase de lancement, toutes les fonctionnalités sont gratuites, sans carte bancaire et sans limite de nombre de devis. Seul le nombre d'e-mails envoyés par jour est plafonné (30 par compte) pour éviter les abus." },
  { q: "Que se passera-t-il à la fin du lancement ?", a: "Une offre payante sera proposée. Vous serez prévenu par e-mail au moins 30 jours avant tout changement, avec la possibilité d'exporter vos devis en CSV ou de supprimer votre compte sans frais." },
  { q: "Faut-il un logiciel de devis en plus ?", a: "Oui, Artisan Relance ne crée pas les devis : vous gardez votre outil habituel et vous joignez le PDF. Il s'occupe uniquement de l'envoi et des relances." },
];

const plans = [
  {
    name: "Lancement",
    price: "0 €",
    period: "pendant la bêta",
    description: "Toutes les fonctionnalités actuelles, sans carte bancaire.",
    features: [
      "Devis illimités",
      "Envoi du devis avec pièces jointes (PDF)",
      "Relances automatiques à la fréquence de votre choix",
      "Arrêt des relances en un clic (répondu, gagné, perdu)",
      "Tableau de bord et taux de conversion",
      "E-mails à votre nom, réponses dans votre boîte mail",
      "Application utilisable sur téléphone, mode sombre",
      "Export CSV de vos devis et de leur historique",
    ],
    cta: { label: SITE.cta, href: SITE.ctaHref },
    highlighted: true,
    available: true,
  },
  {
    name: "Pro",
    price: "Bientôt",
    period: "",
    description: "Pour aller plus loin dans l'automatisation.",
    features: [
      "Tout le plan Lancement",
      "Relances par SMS",
      "Demandes d'avis Google automatiques",
      "Relances de factures impayées",
      "Textes d'e-mails personnalisables",
    ],
    cta: { label: "Disponible prochainement", href: "#" },
    highlighted: false,
    available: false,
  },
];

export default function PricingPage() {
  return (
    <section className="container py-16 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <FaqJsonLd items={PRICING_FAQ} />
        <h1 className="text-4xl font-semibold tracking-tight">Tarifs Artisan Relance : 0 € pendant le lancement</h1>
        <p className="mt-3 text-muted-foreground">
          Le logiciel de relance de devis est gratuit pendant la phase de lancement : devis illimités, relances
          automatiques et tableau de bord. Aucune carte bancaire, aucun engagement.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              "flex flex-col rounded-2xl border bg-card p-6 md:p-8",
              plan.highlighted && "border-brand/50 shadow-lg shadow-brand/10",
            )}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{plan.name}</h2>
              {plan.highlighted && <Badge variant="outline" className="border-brand/40 text-brand">Actuel</Badge>}
            </div>
            <p className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-semibold tracking-tight">{plan.price}</span>
              {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
            <ul className="mt-6 flex-1 space-y-3 text-sm">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  {f}
                </li>
              ))}
            </ul>
            {plan.available ? (
              <Button asChild variant="brand" className="mt-8">
                <Link href={plan.cta.href}>{plan.cta.label}</Link>
              </Button>
            ) : (
              <Button variant="outline" className="mt-8" disabled>
                {plan.cta.label}
              </Button>
            )}
          </div>
        ))}
      </div>

      <p className="mx-auto mt-10 max-w-xl text-center text-sm text-muted-foreground">
        Les utilisateurs inscrits pendant le lancement seront prévenus au moins 30 jours avant toute évolution
        tarifaire et pourront exporter leurs données ou supprimer leur compte à tout moment.{" "}
        <Link href={SITE.demoHref} className="underline underline-offset-4">Une question ? Demandez une démonstration.</Link>
      </p>

      <div className="mx-auto mt-14 max-w-3xl">
        <h2 className="mb-5 text-2xl font-semibold tracking-tight">Questions sur les tarifs</h2>
        <FaqList items={PRICING_FAQ} />
      </div>
    </section>
  );
}
