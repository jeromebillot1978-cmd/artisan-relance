/**
 * Contrôle qualité SEO des guides et des pages métiers :
 * - au moins 1 500 mots utiles par page (hors en-tête, pied de page et appels à l'action) ;
 * - title ≤ 65 caractères et meta description de 120 à 160 caractères, uniques ;
 * - aucune question FAQ répétée d'une page à l'autre ;
 * - tous les liens internes ([ancre](/chemin) et « related ») pointent vers une page existante.
 * Usage : npx tsx --tsconfig tsconfig.json scripts/check-content.ts
 */
import { GUIDES } from "@/lib/content/guides";
import { METIERS } from "@/lib/content/metiers";
import { getKit } from "@/lib/content/metier-kits";
import { wordCount, type ContentPage } from "@/lib/content/types";

const MIN_WORDS = 1500;
const STATIC_PAGES = ["/", "/tarifs", "/comparatif", "/presentation", "/a-propos", "/confiance", "/faq", "/relance-devis", "/guides", "/contact", "/mentions-legales", "/confidentialite", "/cgu", "/inscription"];

const pages: { path: string; page: ContentPage; title: string; description: string }[] = [
  ...GUIDES.map((g) => ({ path: `/guides/${g.slug}`, page: g, title: g.title, description: g.description })),
  ...METIERS.map((m) => {
    const k = getKit(m.slug);
    return { path: `/relance-devis/${m.slug}`, page: m, title: k?.title ?? m.title, description: k?.description ?? m.description };
  }),
];
const known = new Set([...STATIC_PAGES, ...pages.map((p) => p.path)]);
const errors: string[] = [];
const seenTitle = new Map<string, string>();
const seenDesc = new Map<string, string>();
const seenQ = new Map<string, string>();

for (const { path, page, title, description } of pages) {
  const words = wordCount(page);
  const flag = words >= MIN_WORDS ? "ok " : "KO ";
  console.log(`${flag} ${path.padEnd(50)} ${String(words).padStart(5)} mots · title ${title.length} · desc ${description.length} · FAQ ${page.faq.length}`);
  if (words < MIN_WORDS) errors.push(`${path} : ${words} mots (< ${MIN_WORDS})`);
  if (title.length > 65) errors.push(`${path} : title trop long (${title.length})`);
  if (description.length < 120 || description.length > 160) errors.push(`${path} : description de ${description.length} caractères`);
  if (seenTitle.has(title)) errors.push(`${path} : title identique à ${seenTitle.get(title)}`);
  if (seenDesc.has(description)) errors.push(`${path} : description identique à ${seenDesc.get(description)}`);
  seenTitle.set(title, path);
  seenDesc.set(description, path);
  for (const f of page.faq) {
    const key = f.q.trim().toLowerCase();
    if (seenQ.has(key)) errors.push(`${path} : question FAQ déjà posée sur ${seenQ.get(key)} — « ${f.q} »`);
    seenQ.set(key, path);
  }
  const text = JSON.stringify(page.sections);
  const links = [...text.matchAll(/\]\((\/[^)\s]*)\)/g)].map((m) => m[1]).concat(page.related.map((r) => r.href));
  for (const l of links) {
    if (!known.has(l.split("#")[0])) errors.push(`${path} : lien interne cassé ${l}`);
    if (l === path) errors.push(`${path} : lien vers elle-même`);
  }
}

if (errors.length) {
  console.error(`\n${errors.length} problème(s) :\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(`\nOK : ${pages.length} pages contrôlées.`);
