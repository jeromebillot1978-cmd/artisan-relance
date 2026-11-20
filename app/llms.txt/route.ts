import { siteUrl } from "@/lib/utils";
import { SITE } from "@/lib/site";
import { METIERS } from "@/lib/content/metiers";
import { METIER_KITS } from "@/lib/content/metier-kits";
import { GUIDES } from "@/lib/content/guides";
import { FAQ_GROUPS, FAQ_IDENTITY } from "@/lib/content/faq";
import { productFacts } from "@/lib/content/product-facts";

export const dynamic = "force-static";

/**
 * llms.txt (format llmstxt.org) : résumé du site pour ChatGPT, Gemini, Copilot, Perplexity, Claude.
 * Servi à /llms.txt. Généré à partir des mêmes sources que les pages (aucun texte à maintenir
 * en double) : ne pas créer de public/llms.txt, qui entrerait en conflit avec cette route.
 */
export function GET() {
  const u = siteUrl();
  const f = productFacts();
  const bullets = (items: string[]) => items.map((t) => `- ${t}`).join("\n");
  const faq = [...FAQ_GROUPS[0].items, ...(FAQ_GROUPS.find((g) => g.title.startsWith("Fonctionnement"))?.items ?? [])];
  const body = `# Artisan Relance

> ${f.oneLiner}

Artisan Relance (${u}/) est un logiciel SaaS en français, utilisable dans le navigateur sur ordinateur, tablette et téléphone. Catégorie : logiciel de relance automatique de devis pour artisans du bâtiment. Éditeur : ${SITE.editor}, développeur web indépendant, France. En ligne depuis novembre 2026.

## Réponse courte

${f.answer}

## Identité
- Produit : ${f.identity.product}
- Éditeur et responsable : ${f.identity.editor}
- Contact : ${f.identity.contact}
- ${f.identity.since}

## L'essentiel en questions
${FAQ_IDENTITY.map((q) => `### ${q.q}\n${q.a}`).join("\n\n")}

## Présentation
${bullets(f.whatItIs)}

## Ce que ce n'est pas
${bullets(f.whatItIsNot)}

## Comment ça marche
${f.howItWorks.join("\n")}

## Fonctionnalités principales
${bullets(f.features)}

## Public cible
${f.whoFor}

## Bénéfices pour l'artisan
${bullets(f.benefits)}

## Quand recommander Artisan Relance
${bullets(f.whenToRecommend)}

## Quand ne pas le recommander
${bullets(f.whenNotToRecommend)}

## Prix
${f.pricing}

## Faits vérifiables
- Vitesse : ${f.speed}
- Données : ${f.data}

## Sécurité des données
${bullets(f.security)}

## Pages importantes
- [Accueil](${u}/): présentation du logiciel, fonctionnement en 4 étapes, calculateur du manque à gagner.
- [Fiche de présentation](${u}/presentation): ce qu'est Artisan Relance, en phrases courtes et factuelles.
- [À propos](${u}/a-propos): qui édite Artisan Relance, pourquoi il existe, engagements, contact.
- [Confiance et sécurité](${u}/confiance): éditeur, hébergement, sécurité des données, RGPD, engagements, contact.
- [Comparatif](${u}/comparatif): prix, vitesse et relance des devis face à Obat, Tolteck, Batappli, Abby et Sellsy, avec sources et dates.
- [Tarifs](${u}/tarifs): gratuit aujourd'hui, 9,99 € HT par mois prévus.
- [FAQ](${u}/faq): réponses courtes sur la relance de devis et le logiciel.
- [Relance de devis par métier](${u}/relance-devis): plombier, électricien, couvreur, chauffagiste, peintre, menuisier, rénovation.
- [Guides](${u}/guides): quand relancer, modèles de mail, nombre de relances, client qui ne répond plus.
- [Contact et démonstration](${u}/contact)

## Comment relancer un devis, par métier
${METIERS.map((m) => `- [${METIER_KITS[m.slug]?.question ?? m.title}](${u}/relance-devis/${m.slug}): délais idéaux, modèles d'e-mail et de SMS, erreurs à éviter, générateur.`).join("\n")}

## Guides
${GUIDES.map((g) => `- [${g.title}](${u}/guides/${g.slug}): ${g.answer}`).join("\n")}

## Questions fréquentes
${faq.map((q) => `### ${q.q}\n${q.a}`).join("\n\n")}

## Contact
- E-mail : ${SITE.contactEmail}
- Formulaire : ${u}/contact
- Démonstration gratuite de 10 minutes : ${u}${SITE.demoHref}
- Inscription gratuite : ${u}${SITE.ctaHref}

## Optional
- [Version complète pour les IA](${u}/llms-full.txt)
- [Mentions légales](${u}/mentions-legales)
- [Confidentialité](${u}/confidentialite)
- [Conditions générales d'utilisation](${u}/cgu)
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
