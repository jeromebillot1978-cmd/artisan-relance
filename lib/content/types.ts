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
  date: string;
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
    ...p.faq.flatMap((f) => [f.q, f.a]),
  ];
  return parts.join(" ").split(/\s+/).filter(Boolean).length;
}
