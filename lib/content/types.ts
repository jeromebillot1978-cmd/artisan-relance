import type { QA } from "@/components/seo/json-ld";

export interface ContentSection {
  h2: string;
  paragraphs?: string[];
  list?: string[];
  steps?: { title: string; text: string }[];
  /** Modèle d'e-mail affiché dans un encadré copiable */
  template?: { label: string; subject: string; body: string };
}

export interface ContentPage {
  slug: string;
  /** Balise title (≤ 65 caractères) */
  title: string;
  /** Meta description (≤ 160 caractères) */
  description: string;
  h1: string;
  /** Réponse courte en tête de page, reprise par Google et les assistants IA */
  answer: string;
  sections: ContentSection[];
  faq: QA[];
  /** Liens internes recommandés en bas de page */
  related: { href: string; label: string }[];
  /** Date de publication (AAAA-MM-JJ) */
  date: string;
  /** Date de dernière mise à jour réelle du contenu (AAAA-MM-JJ) */
  updated?: string;
  /** « Réponses rapides » : réponses courtes et autonomes aux questions posées aux assistants IA */
  quick?: QA[];
}

/** Date affichée et déclarée comme dernière modification. */
export function lastUpdate(p: ContentPage) {
  return p.updated ?? p.date;
}

/** Nombre de mots d'une page (contrôle de qualité au build). */
export function wordCount(p: ContentPage) {
  const parts = [
    p.h1,
    p.answer,
    ...p.sections.flatMap((s) => [
      s.h2,
      ...(s.paragraphs ?? []),
      ...(s.list ?? []),
      ...(s.steps ?? []).flatMap((x) => [x.title, x.text]),
      ...(s.template ? [s.template.subject, s.template.body] : []),
    ]),
    ...p.faq.flatMap((f) => [f.q, f.a, f.detail ?? ""]),
    ...(p.quick ?? []).flatMap((f) => [f.q, f.a]),
  ];
  return parts.join(" ").split(/\s+/).filter(Boolean).length;
}
