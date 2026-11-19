import type { QA } from "@/components/seo/json-ld";

export interface ContentSection {
  h2: string;
  /** Paragraphes. Liens internes possibles avec la syntaxe [ancre](/chemin). */
  paragraphs?: string[];
  list?: string[];
  steps?: { title: string; text: string }[];
  /** Modèle d'e-mail affiché dans un encadré copiable */
  template?: { label: string; subject: string; body: string };
  /** Paragraphes affichés après la liste, les étapes ou le modèle (conclusion de section) */
  outro?: string[];
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
}

/** Contenu complémentaire d'une page (sections, FAQ, liens), fusionné par `enrich`. */
export interface Enrichment {
  /** Date de la mise à jour (AAAA-MM-JJ), reprise par le sitemap et le JSON-LD */
  updated: string;
  /** Sections ajoutées, insérées avant la section dont le H2 est `before` (sinon à la fin) */
  sections: ContentSection[];
  before?: string;
  faq?: QA[];
  related?: { href: string; label: string }[];
  /** Remplacements éventuels du title / de la meta description */
  title?: string;
  description?: string;
}

/** Fusionne une page et son enrichissement, sans doublon de section, de question ni de lien. */
export function enrich<T extends ContentPage>(page: T, e?: Enrichment): T {
  if (!e) return page;
  const sections = [...page.sections];
  const at = e.before ? sections.findIndex((s) => s.h2 === e.before) : -1;
  if (e.before && at < 0) throw new Error(`Section introuvable dans ${page.slug} : ${e.before}`);
  const fresh = e.sections.filter((s) => !sections.some((x) => x.h2 === s.h2));
  sections.splice(at < 0 ? sections.length : at, 0, ...fresh);
  const faq = [...page.faq, ...(e.faq ?? []).filter((f) => !page.faq.some((x) => x.q === f.q))];
  const related = [...page.related];
  for (const r of e.related ?? []) if (!related.some((x) => x.href === r.href)) related.push(r);
  return {
    ...page,
    title: e.title ?? page.title,
    description: e.description ?? page.description,
    sections,
    faq,
    related,
    updated: e.updated,
  };
}

/** Retire la syntaxe des liens internes : « [ancre](/chemin) » devient « ancre ». */
export function stripLinks(text: string) {
  return text.replace(/\[([^\]]+)\]\((\/[^)\s]*)\)/g, "$1");
}

/** Date affichée et déclarée comme dernière modification. */
export function lastUpdate(p: ContentPage) {
  return p.updated ?? p.date;
}

/** Nombre de mots utiles d'une page (contrôle de qualité au build). */
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
      ...(s.outro ?? []),
    ]),
    ...p.faq.flatMap((f) => [f.q, f.a, f.detail ?? ""]),
  ];
  return stripLinks(parts.join(" ")).split(/\s+/).filter(Boolean).length;
}
