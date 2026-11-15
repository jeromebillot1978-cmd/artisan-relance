"use client";

import { useState } from "react";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);

/** Simulateur : l'artisan calcule avec SES chiffres (aucune statistique inventée). */
export function RoiSimulator({ defaultQuotes = 8, defaultAmount = 3500 }: { defaultQuotes?: number; defaultAmount?: number }) {
  const [quotes, setQuotes] = useState(defaultQuotes);
  const [amount, setAmount] = useState(defaultAmount);
  const [extra, setExtra] = useState(5);

  const perYear = quotes * 12;
  const won = (perYear * extra) / 100;
  const revenue = won * amount;

  const row = "grid gap-1.5 text-sm";
  const input = "h-10 w-full rounded-md border border-input bg-background px-3 text-base tabular-nums md:text-sm";

  return (
    <div className="grid gap-6 rounded-xl border bg-card p-5 md:grid-cols-[1fr_1fr] md:p-6">
      <div className="grid content-start gap-4">
        <label className={row}>
          <span className="font-medium">Devis envoyés par mois</span>
          <input type="number" inputMode="numeric" min={1} max={200} className={input} value={quotes} onChange={(e) => setQuotes(Math.max(0, Number(e.target.value) || 0))} />
        </label>
        <label className={row}>
          <span className="font-medium">Montant moyen d'un devis (€ TTC)</span>
          <input type="number" inputMode="numeric" min={100} step={100} className={input} value={amount} onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))} />
        </label>
        <label className={row}>
          <span className="flex items-center justify-between font-medium">
            Devis en plus signés grâce aux relances <span className="tabular-nums text-brand">{extra} %</span>
          </span>
          <input type="range" min={1} max={20} value={extra} onChange={(e) => setExtra(Number(e.target.value))} className="accent-[hsl(var(--brand))]" aria-label="Pourcentage de devis signés en plus" />
          <span className="text-xs text-muted-foreground">Hypothèse à choisir vous-même : 5 % = 1 devis sur 20.</span>
        </label>
      </div>
      <div className="grid content-center gap-3 rounded-lg bg-muted/50 p-5 text-center" aria-live="polite">
        <p className="text-sm text-muted-foreground">Sur un an, avec vos chiffres</p>
        <p className="text-4xl font-semibold tabular-nums tracking-tight">{fmt(revenue)} €</p>
        <p className="text-sm text-muted-foreground">
          de chiffre d'affaires en plus, soit <strong className="text-foreground">{fmt(won)} chantier{won >= 2 ? "s" : ""}</strong> sur {fmt(perYear)} devis
        </p>
        <p className="text-xs text-muted-foreground">Simulation, pas une promesse : le résultat dépend de vos devis et de vos clients.</p>
      </div>
    </div>
  );
}
