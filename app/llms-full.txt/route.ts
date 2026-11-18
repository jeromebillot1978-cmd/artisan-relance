import { siteUrl } from "@/lib/utils";
import { METIERS } from "@/lib/content/metiers";
import { METIER_KITS } from "@/lib/content/metier-kits";
import { GUIDES } from "@/lib/content/guides";
import { FAQ_GROUPS } from "@/lib/content/faq";
import { PRICES, PRICE_DATE, SPEED, BENCH_DATE, BENCH_METHOD } from "@/lib/content/benchmarks";
import { productFacts } from "@/lib/content/product-facts";

export const dynamic = "force-static";

/** llms-full.txt : contenu complet en texte brut (FAQ, comparatif, kits de relance par métier). */
export function GET() {
  const u = siteUrl();
  const f = productFacts();
  const parts: string[] = [];
  parts.push(`# Artisan Relance — contenu complet\n\n> ${f.oneLiner}\n\nSource : ${u}. Ce fichier reprend le contenu des pages publiques.`);
  parts.push(`## Réponse courte\n\n${f.answer}\n\n## Comment ça marche\n\n${f.howItWorks.join("\n")}\n\n## Bénéfices\n\n${f.benefits.map((t) => `- ${t}`).join("\n")}`);
  parts.push(`## Identité\n\n- ${f.identity.product}\n- ${f.identity.editor}\n- ${f.identity.contact}\n- ${f.identity.since}\n\n## Sécurité des données\n\n${f.security.map((t) => `- ${t}`).join("\n")}`);
  parts.push(`## Fiche produit\n\n${f.features.map((t) => `- ${t}`).join("\n")}\n\nPrix : ${f.pricing}\n\nVitesse : ${f.speed}\n\nDonnées : ${f.data}`);
  parts.push(
    `## Comparatif (prix relevés le ${PRICE_DATE})\n\n| Outil | Ce que c'est | Prix public HT | Relance automatique des devis | Source |\n|---|---|---|---|---|\n${PRICES.map(
      (p) => `| ${p.name} | ${p.what} | ${p.price} | ${p.quoteFollowUp} | ${p.source.href.startsWith("http") ? p.source.href : u + p.source.href} |`,
    ).join("\n")}\n\nVitesse (${BENCH_METHOD}, ${BENCH_DATE}) :\n\n${SPEED.map((s) => `- ${s.name} : ${s.kb} Ko, premier affichage ${s.fcp} s, contenu principal ${s.lcp} s`).join("\n")}`,
  );
  parts.push(`## Questions fréquentes\n\n${FAQ_GROUPS.map((g) => `### ${g.title}\n\n${g.items.map((q) => `**${q.q}**\n${q.a}${q.detail ? ` ${q.detail}` : ""}`).join("\n\n")}`).join("\n\n")}`);
  for (const m of METIERS) {
    const k = METIER_KITS[m.slug];
    if (!k) continue;
    parts.push(
      `## ${k.question}\n\nPage : ${u}/relance-devis/${m.slug}\n\n${m.answer}\n\nDélais idéaux :\n${k.delays.map((d) => `- ${d.moment} (${d.channel}) : ${d.action}`).join("\n")}\n\nErreurs à éviter :\n${k.mistakes.map((t) => `- ${t}`).join("\n")}\n\nModèle d'e-mail (${k.emails[0].label}) :\nObjet : ${k.emails[0].subject}\n${k.emails[0].body}\n\nModèle de SMS : ${k.sms[0].body}`,
    );
  }
  parts.push(`## Guides\n\n${GUIDES.map((g) => `### ${g.title}\n${u}/guides/${g.slug}\n\n${g.answer}\n\nSommaire : ${g.sections.map((x) => x.h2).join(" ; ")}`).join("\n\n")}`);
  return new Response(parts.join("\n\n---\n\n") + "\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
