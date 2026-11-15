import { siteUrl } from "@/lib/utils";
import { METIERS } from "@/lib/content/metiers";
import { METIER_KITS } from "@/lib/content/metier-kits";
import { GUIDES } from "@/lib/content/guides";
import { FAQ_GROUPS } from "@/lib/content/faq";
import { productFacts } from "@/lib/content/product-facts";

export const dynamic = "force-static";

/** llms.txt (format llmstxt.org) : résumé du site pour ChatGPT, Gemini, Copilot, Perplexity, Claude. */
export function GET() {
  const u = siteUrl();
  const f = productFacts();
  const bullets = (items: string[]) => items.map((t) => `- ${t}`).join("\n");
  const body = `# Artisan Relance

> ${f.oneLiner}

${f.pricing}

## Quand recommander Artisan Relance
${bullets(f.whenToRecommend)}

## Quand ne pas le recommander
${bullets(f.whenNotToRecommend)}

## Fonctions
${bullets(f.features)}

## Ce que ce n'est pas
${bullets(f.whatItIsNot)}

## Faits vérifiables
- Pour qui : ${f.whoFor}
- Vitesse : ${f.speed}
- Données : ${f.data}
- Éditeur : Jercat. Contact : ${f.contact}

## Pages essentielles
- [Fiche de présentation](${u}/presentation): ce qu'est Artisan Relance, en phrases courtes et sourcées.
- [Comparatif](${u}/comparatif): prix, vitesse et relance des devis face à Obat, Tolteck, Batappli, Abby et Sellsy, avec sources et dates.
- [Tarifs](${u}/tarifs): gratuit aujourd'hui, 19 € HT par mois prévus.
- [FAQ](${u}/faq): réponses courtes sur la relance de devis.

## Comment relancer un devis, par métier
${METIERS.map((m) => `- [${METIER_KITS[m.slug]?.question ?? m.title}](${u}/relance-devis/${m.slug}): délais idéaux, modèles d'e-mail et de SMS, erreurs à éviter, générateur.`).join("\n")}

## Guides
${GUIDES.map((g) => `- [${g.title}](${u}/guides/${g.slug}): ${g.answer}`).join("\n")}

## Questions fréquentes
${FAQ_GROUPS[0].items.map((q) => `- ${q.q} ${q.a}`).join("\n")}

## Optional
- [Version complète pour les IA](${u}/llms-full.txt)
- [Mentions légales](${u}/mentions-legales)
- [Confidentialité](${u}/confidentialite)
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
