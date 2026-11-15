/**
 * Mesures et prix publics des concurrents — source unique pour l'accueil,
 * /comparatif, /tarifs, /presentation et llms.txt.
 *
 * Règle : chaque chiffre est mesuré ou sourcé, daté, et compare des choses
 * comparables (publicité comparative, art. L122-1 du Code de la consommation).
 * Mettre à jour la date et les valeurs à chaque nouvelle mesure.
 */

export const BENCH_DATE = "15 novembre 2026";
export const BENCH_METHOD =
  "Lighthouse 12.8, profil mobile (Moto G Power, 4G lente simulée), page d'accueil, une mesure par site le même jour";

export interface SpeedRow {
  slug: string;
  name: string;
  /** Poids total de la page d'accueil, en Ko */
  kb: number;
  /** Premier affichage (First Contentful Paint), en secondes */
  fcp: number;
  /** Contenu principal affiché (Largest Contentful Paint), en secondes */
  lcp: number;
  self?: boolean;
}

export const SPEED: SpeedRow[] = [
  { slug: "artisan-relance", name: "Artisan Relance", kb: 424, fcp: 1.0, lcp: 2.6, self: true },
  { slug: "obat", name: "Obat", kb: 2974, fcp: 2.7, lcp: 3.3 },
  { slug: "abby", name: "Abby", kb: 842, fcp: 2.7, lcp: 4.7 },
  { slug: "batappli", name: "Batappli", kb: 3256, fcp: 5.8, lcp: 8.5 },
  { slug: "tolteck", name: "Tolteck", kb: 2507, fcp: 2.3, lcp: 9.6 },
];

export function speedSelf() {
  return SPEED.find((r) => r.self)!;
}

/** Rapport de poids entre le site le plus lourd mesuré et Artisan Relance (arrondi à l'inférieur). */
export function weightRatio() {
  const self = speedSelf();
  const heaviest = Math.max(...SPEED.filter((r) => !r.self).map((r) => r.kb));
  return Math.floor(heaviest / self.kb);
}

export interface PriceRow {
  name: string;
  what: string;
  price: string;
  /** Prix mensuel le plus bas sans engagement annuel, pour le graphique (HT) */
  monthly: number | null;
  quoteFollowUp: string;
  source: { label: string; href: string };
  self?: boolean;
}

export const PRICES: PriceRow[] = [
  {
    name: "Artisan Relance",
    what: "Relance de devis et demande d'avis Google",
    price: "Gratuit aujourd'hui · 19 € HT/mois prévu",
    monthly: 19,
    quoteFollowUp: "Oui, c'est le cœur du produit",
    source: { label: "artisan-relance.jercat.fr/tarifs", href: "/tarifs" },
    self: true,
  },
  {
    name: "Tolteck",
    what: "Devis et factures pour le bâtiment",
    price: "25 € HT/mois (228 € HT/an)",
    monthly: 25,
    quoteFollowUp: "Non mentionnée dans la source",
    source: { label: "Capterra, fiche Tolteck", href: "https://www.capterra.fr/software/1011798/tolteck" },
  },
  {
    name: "Obat",
    what: "Devis, factures et suivi de chantier",
    price: "32 à 52 € HT/mois sans engagement (micro-entreprise), dès 25 € HT en annuel",
    monthly: 32,
    quoteFollowUp: "Non mentionnée dans la source",
    source: { label: "Tool Advisor, avis Obat 2026", href: "https://tool-advisor.fr/logiciel-facturation/comparatif/obat/" },
  },
  {
    name: "Batappli",
    what: "Gestion complète pour le bâtiment",
    price: "39 à 119 € HT/mois",
    monthly: 39,
    quoteFollowUp: "Non mentionnée dans la source",
    source: { label: "Independant.io, avis Batappli", href: "https://independant.io/avis/batappli/" },
  },
  {
    name: "Abby",
    what: "Facturation et comptabilité des indépendants",
    price: "Gratuit (Basique), 11 à 39 € HT/mois",
    monthly: 11,
    quoteFollowUp: "Non : relance des factures impayées uniquement",
    source: { label: "abby.fr/llms-full.txt", href: "https://abby.fr/llms-full.txt" },
  },
  {
    name: "Sellsy",
    what: "CRM et facturation pour PME",
    price: "35 à 143 € HT/mois par utilisateur, engagement 12 mois",
    monthly: 35,
    quoteFollowUp: "Oui (relances automatiques par e-mail)",
    source: { label: "go.sellsy.com/tarifs", href: "https://go.sellsy.com/tarifs" },
  },
];

export const PRICE_DATE = "15 novembre 2026";
