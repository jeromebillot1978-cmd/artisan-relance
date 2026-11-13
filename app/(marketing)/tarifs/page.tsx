import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tarifs",
  description: "Artisan Relance est gratuit pendant la phase de lancement.",
};

const plans = [
  {
    name: "Lancement",
    price: "0 €",
    period: "pendant la bêta",
    description: "Toutes les fonctionnalités actuelles, sans carte bancaire.",
    features: [
      "Devis illimités",
      "Relances e-mail automatiques J+4 et J+10",
      "Tableau de bord et taux de conversion",
      "E-mails à votre nom, réponses dans votre boîte",
      "Application mobile-first, mode sombre",
    ],
    cta: { label: "Créer mon compte", href: "/inscription" },
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
        <h1 className="text-4xl font-semibold tracking-tight">Des tarifs simples</h1>
        <p className="mt-3 text-muted-foreground">
          Artisan Relance est gratuit pendant la phase de lancement. Aucun paiement, aucun engagement.
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
        Les utilisateurs inscrits pendant le lancement seront prévenus à l'avance de toute évolution tarifaire
        et pourront supprimer leur compte à tout moment.
      </p>
    </section>
  );
}
