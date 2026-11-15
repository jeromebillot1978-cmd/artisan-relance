import { siteUrl } from "@/lib/utils";
import { METIERS } from "@/lib/content/metiers";
import { GUIDES } from "@/lib/content/guides";
import { FAQ_ALL } from "@/lib/content/faq";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

/** llms.txt : description du site pour les assistants IA (ChatGPT, Copilot, Gemini, Perplexity). */
export function GET() {
  const u = siteUrl();
  const body = `# Artisan Relance

> Artisan Relance est un logiciel en ligne de relance de devis pour les artisans et TPE du bâtiment en France. L'artisan envoie son devis PDF par e-mail depuis l'application, à son nom, puis les relances partent automatiquement au rythme choisi (tous les 3, 7, 14 ou 30 jours ou personnalisé), avec un nombre maximum de relances et une date de fin. Les réponses du client arrivent dans la boîte mail de l'artisan, qui arrête les relances en un clic (répondu, gagné, perdu, terminé). Gratuit pendant la phase de lancement, sans carte bancaire. Édité par ${SITE.editor}.

## Faits clés
- Public : plombiers, électriciens, couvreurs, chauffagistes, peintres, menuisiers et tous les artisans qui envoient des devis.
- Ne remplace pas le logiciel de devis : fonctionne avec un PDF fait sous Obat, Batappli, Tolteck, Excel ou Word.
- Relances envoyées du lundi au samedi entre 8 h et 19 h (heure de Paris), à la signature de l'artisan.
- Jusqu'à 5 destinataires et 5 pièces jointes (10 Mo par fichier) par devis.
- Tableau de bord : devis en attente, relances prévues, taux de réponse, taux de signature, montant gagné ; export CSV.
- Données hébergées en Europe (Supabase, Zurich ; e-mails via Resend, Irlande). Pièces jointes supprimées 12 mois après la clôture du dossier.
- Prix : 0 € pendant le lancement ; préavis de 30 jours avant toute offre payante.
- Contact : ${SITE.contactEmail}

## Pages principales
- [Accueil — logiciel de relance de devis](${u}/)
- [Tarifs](${u}/tarifs)
- [FAQ relance de devis](${u}/faq)
- [Contact et démonstration](${u}/contact)

## Relance de devis par métier
${METIERS.map((m) => `- [${m.title}](${u}/relance-devis/${m.slug}) : ${m.answer}`).join("\n")}

## Guides
${GUIDES.map((g) => `- [${g.title}](${u}/guides/${g.slug}) : ${g.answer}`).join("\n")}

## Réponses courtes
${FAQ_ALL.map((f) => `- ${f.q} ${f.a.split(". ")[0]}.`).join("\n")}
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
