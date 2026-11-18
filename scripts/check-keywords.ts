/**
 * Vérifie la carte des mots-clés (lib/content/keywords.ts) :
 * - 20 principaux et 50 secondaires, sans requête en double ;
 * - chaque mot-clé principal se retrouve (mots significatifs) dans le title, le H1,
 *   la description ou la réponse courte de sa page cible ;
 * - chaque mot-clé secondaire se retrouve dans le contenu de sa page cible.
 * La page d'accueil (composant React) n'est pas analysée ici.
 * Usage : npx tsx --tsconfig tsconfig.json scripts/check-keywords.ts
 */
import { GUIDES } from "@/lib/content/guides";
import { METIERS } from "@/lib/content/metiers";
import { METIER_KITS } from "@/lib/content/metier-kits";
import { PRIMARY_KEYWORDS, SECONDARY_KEYWORDS } from "@/lib/content/keywords";
import type { ContentPage } from "@/lib/content/types";

const STOP = new Set(["de", "des", "du", "un", "une", "le", "la", "les", "a", "au", "aux", "et", "pour", "ses", "son", "sa", "par", "en", "d", "l"]);
const norm = (t: string) =>
  t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/['’\-]/g, " ").replace(/[^a-z0-9 ]/g, " ");
const tokens = (t: string) => norm(t).split(/\s+/).filter((w) => w && !STOP.has(w)).map((w) => w.replace(/s$/, ""));
const has = (text: string, kw: string) => {
  const words = new Set(tokens(text));
  return tokens(kw).every((w) => words.has(w));
};

function fullText(p: ContentPage) {
  return [
    p.title, p.description, p.h1, p.answer,
    ...p.sections.flatMap((s) => [s.h2, ...(s.paragraphs ?? []), ...(s.list ?? []), ...(s.steps ?? []).flatMap((x) => [x.title, x.text]), s.template?.subject ?? "", s.template?.body ?? ""]),
    ...p.faq.flatMap((f) => [f.q, f.a]),
    ...(p.quick ?? []).flatMap((f) => [f.q, f.a]),
  ].join(" ");
}

const pages = new Map<string, { head: string; body: string }>();
for (const g of GUIDES) pages.set(`/guides/${g.slug}`, { head: [g.title, g.h1, g.description, g.answer].join(" "), body: fullText(g) });
for (const m of METIERS) {
  const k = METIER_KITS[m.slug];
  const kitText = k ? [k.question, k.title, k.description, ...k.delays.map((d) => d.action), ...k.emails.flatMap((e) => [e.subject ?? "", e.body]), ...k.sms.map((x) => x.body), ...k.mistakes].join(" ") : "";
  pages.set(`/relance-devis/${m.slug}`, { head: [m.title, m.h1, m.description, m.answer, k?.title ?? "", k?.question ?? "", k?.description ?? ""].join(" "), body: fullText(m) + " " + kitText });
}

let errors = 0;
const fail = (msg: string) => { errors++; console.log("✗ " + msg); };

if (PRIMARY_KEYWORDS.length !== 20) fail(`${PRIMARY_KEYWORDS.length} mots-clés principaux (20 attendus)`);
if (SECONDARY_KEYWORDS.length !== 50) fail(`${SECONDARY_KEYWORDS.length} mots-clés secondaires (50 attendus)`);
const all = [...PRIMARY_KEYWORDS, ...SECONDARY_KEYWORDS].map((k) => norm(k.keyword).trim());
for (const k of new Set(all.filter((k, i) => all.indexOf(k) !== i))) fail(`mot-clé en double : ${k}`);

for (const { keyword, path } of PRIMARY_KEYWORDS) {
  if (path === "/") continue;
  const p = pages.get(path);
  if (!p) fail(`page inconnue ${path}`);
  else if (!has(p.head, keyword)) fail(`principal « ${keyword} » absent de l'en-tête de ${path}`);
}
for (const { keyword, path } of SECONDARY_KEYWORDS) {
  const p = pages.get(path);
  if (!p) fail(`page inconnue ${path}`);
  else if (!has(p.body, keyword)) fail(`secondaire « ${keyword} » absent de ${path}`);
}
console.log(errors ? `${errors} problème(s)` : `OK : ${PRIMARY_KEYWORDS.length} principaux, ${SECONDARY_KEYWORDS.length} secondaires, tous présents`);
process.exit(errors ? 1 : 0);
