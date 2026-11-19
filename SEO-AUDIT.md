# Audit SEO — « Explorée, actuellement non indexée »

Site : https://artisan-relance.jercat.fr · Audit du 19 novembre 2026 · Branche `seo/indexation-2026-11-19`

Méthode : téléchargement des 31 pages publiques en ligne (y compris avec l'agent Googlebot smartphone), contrôle des en-têtes HTTP, de robots.txt, du sitemap, des balises et des données structurées, comptage des mots utiles, mesure de similarité entre pages (5-grammes, indice de Jaccard), recensement du maillage interne, puis build de production et même contrôle sur la nouvelle version.

---

## Diagnostic principal (à lire en premier)

**La technique n'empêche pas l'indexation.** Les 19 URL signalées répondent en 200, ont une canonical correcte, aucune balise ni en-tête `noindex`, ne sont pas bloquées par robots.txt et figurent toutes dans le sitemap. Le HTML est rendu côté serveur : Googlebot voit tout le contenu.

**La cause n°1 est l'âge du site.** Le dépôt a été créé le 13 novembre 2026 : le site a 6 jours. Sur un sous-domaine neuf, sans aucun lien externe, Google explore d'abord puis attend des signaux (liens, visites, stabilité du contenu) avant d'indexer. Le statut « Explorée, actuellement non indexée » est l'état normal de la majorité des pages d'un site de moins de 2 à 4 semaines. Le contenu a en plus été modifié presque chaque jour entre le 13 et le 18 novembre : Google a exploré des versions plus courtes que celles d'aujourd'hui.

**Les causes n°2 à n°4 sont des signaux de qualité, corrigés dans cette branche :** balisage FAQ dupliqué sur jusqu'à 10 pages, bloc de texte promotionnel identique sur 10 pages, guides et pages métiers trop courts, pages hubs pauvres et maillage interne sans liens dans le texte.

Aucune correction ne force l'indexation : elles retirent les raisons que Google peut avoir de juger les pages faibles ou redondantes. Les délais réalistes et les actions hors code sont dans la partie I.

---

## A. Liste exhaustive des problèmes

### Problèmes réels (corrigés)

| # | Gravité | Problème | Pages | Correction |
|---|---|---|---|---|
| 1 | Élevée | **Balisage FAQPage dupliqué.** 20 questions balisées sur plusieurs pages, dont 3 sur **10 pages** (« Quel logiciel permet de relancer automatiquement des devis ? », « Comment automatiser les relances clients ? », « Comment augmenter le taux de signature des devis ? »). Les consignes Google demandent de ne baliser une question répétée qu'une seule fois sur le site. | 8 guides, plombier, électricien, accueil, présentation, à propos, confiance, FAQ | `FaqJsonLd` ne balise plus, hors de /faq, les questions déjà présentes sur /faq ; doublons internes filtrés. Résultat : **0 question balisée deux fois** (176 questions uniques). |
| 2 | Élevée | **Bloc « Réponses rapides » identique** (~130 mots de promotion d'Artisan Relance) répété sur 10 pages : contenu passe-partout qui dilue l'originalité de chaque page. | 8 guides, plombier, électricien | Bloc supprimé (`lib/content/geo.ts` retiré). Ces questions restent traitées une fois, sur /faq. Phrases communes entre guides : 223 → 75 mots (uniquement gabarit : auteur, appel à l'action). |
| 3 | Élevée | **Guides sous 1 500 mots utiles** : 11 sur 11 une fois le bloc dupliqué retiré (832 à 1 350 mots). | Tous les guides | 2 à 5 nouvelles sections uniques par guide (exemples chiffrés, calendriers, grilles, séquences), FAQ propres. **Tous ≥ 1 512 mots**. |
| 4 | Élevée | **Pages métiers déséquilibrées** : couvreur 912, chauffagiste 876, peintre 854, menuisier 830, rénovation 981 mots d'article, contre 1 477 (plombier) et 1 287 (électricien). | 5 pages métiers | 3 à 5 sections propres au métier par page (saisons, cas d'usage, exemple chiffré, documents, erreurs). **Toutes ≥ 1 522 mots** d'article, sans compter le kit de relance. |
| 5 | Moyenne | **Hub /guides sans structure** : aucun H2, et chaque carte reprenait mot pour mot le « En bref » du guide (texte dupliqué ×11). | /guides | 4 thèmes en H2 par intention de recherche, phrase unique « quand le lire » par guide, introduction, liens vers les métiers, `CollectionPage` + `ItemList`. |
| 6 | Moyenne | **Hub /relance-devis trop mince** : 284 mots, 1 H2, simple liste de cartes. | /relance-devis | Tableau comparatif des rythmes par métier, règles communes, FAQ propre (3 questions), `CollectionPage` + `ItemList`. 789 mots. |
| 7 | Moyenne | **Maillage interne sans liens contextuels** : les liens n'existaient que dans des encadrés « À lire aussi » de 3 à 5 liens ; /relance-devis/peintre ne recevait de liens contextuels que de 3 pages. | Guides et métiers | Syntaxe `[ancre](/chemin)` rendue en vrais liens dans le texte (59 liens contextuels ajoutés), blocs « Autres guides », « Relance de devis par métier » et « Autres métiers » sur chaque page. Chaque guide et chaque métier reçoit désormais des liens depuis les 17 autres pages de contenu. |
| 8 | Moyenne | **Page /contact presque vide** : 73 mots. | /contact | Sections « Ce que vous pouvez nous demander », « Comment se déroule la démonstration », renvoi vers FAQ / tarifs / confiance / guides, `ContactPage`. 301 mots. |
| 9 | Faible | Même question FAQ (« Peut-on relancer un devis par SMS ? ») sur deux guides. | email-ou-telephone, exemple-sms | Question reformulée sur le guide e-mail/téléphone. |
| 10 | Faible | Le gabarit affichait toujours les paragraphes **avant** les listes : une conclusion de section se retrouvait au-dessus de la liste qu'elle commente. Deux sections avaient même un paragraphe d'introduction écrasé. | Gabarit `ContentArticle` | Nouveau champ `outro` affiché après la liste, les étapes ou le modèle. |
| 11 | Faible | Aucun contrôle automatique de la qualité du contenu. | — | `scripts/check-content.ts` : ≥ 1 500 mots, longueurs title/description, unicité, doublons FAQ, liens internes cassés. |
| 12 | Faible | /tarifs : peu de liens vers le contenu. | /tarifs | Section « Ce que le prix ne changera pas » + liens vers le guide taux de signature et les pages métiers. |

### Points vérifiés, conformes (aucune correction nécessaire)

| Élément | Constat |
|---|---|
| Statut HTTP | 200 sur les 31 URL publiques. `http://` → `https://` en 308 ; `/guides/` → `/guides` en 308 ; `artisan-relance.vercel.app` → 404 (pas de site en double). |
| Robots meta / X-Robots-Tag | Aucun `noindex` sur les pages publiques. `noindex` uniquement sur l'application, la connexion, `/api`, `/auth`, `/r` : voulu. |
| robots.txt | Aucune page publique bloquée. `/_next/` (CSS, JS) autorisé. Sitemap déclaré. |
| sitemap.xml | 31 URL, toutes indexables, `lastmod` réalistes (dates fixes, pas la date du jour). Pages applicatives absentes : correct. |
| Canonicals | Absolues, auto-référentes, sur le bon domaine, sur les 31 pages. Aucune canonical erronée. |
| Titles / meta descriptions | Uniques, 34 à 64 caractères / 126 à 159 caractères, alignés sur l'intention de recherche. |
| Rendu | HTML statique généré au build ; contenu identique avec l'agent Googlebot smartphone ; FAQ en `<details>` présentes dans le HTML. |
| Pages métiers « dupliquées » ? | **Non.** Similarité de 10 à 14 % entre deux métiers, et ce qui est commun (~240 mots) est le gabarit (simulateur, encadrés, appel à l'action). Les textes, exemples, modèles et FAQ sont propres à chaque métier. Elles n'avaient pas besoin d'être réécrites, seulement enrichies (problème 4). |
| Guides dupliqués ? | Non : 2 à 9 % de similarité entre deux guides, chacun cible une intention distincte. |
| Profondeur | Toutes les pages à 1 clic de l'accueil (menu ou pied de page), 2 clics au plus. |
| HTML sémantique | Un seul H1 par page, `lang="fr"`, `<main>`, `<article>`, `<nav>` du fil d'Ariane, H2/H3 hiérarchisés, images avec `alt`. |
| Core Web Vitals | Pages statiques, 108 Ko de JS au premier chargement, police en `display: optional` (pas de décalage), pas de script tiers. Mesure PageSpeed impossible depuis l'audit (quota de l'API atteint) : à vérifier dans Search Console > Signaux Web essentiels quand il y aura assez de visites. |
| IndexNow | Envoie seulement les pages modifiées depuis 3 jours : conforme. (Ne concerne que Bing, pas Google.) |
| Pages légales | /cgu, /confidentialite, /mentions-legales : leur non-indexation est **normale et sans conséquence** (Google les juge rarement utiles en résultats). Laissées indexables : elles comptent pour la confiance. Inutile de demander leur indexation. |

---

## B. Fichiers modifiés (complets dans la branche)

| Fichier | Rôle |
|---|---|
| `lib/content/enrichments.ts` (nouveau) | Tout le nouveau contenu des 11 guides et 7 pages métiers : sections, FAQ, liens. |
| `lib/content/types.ts` | Fonction `enrich()`, champ `outro`, `stripLinks()`, comptage de mots sans le bloc retiré. |
| `components/marketing/rich-text.tsx` (nouveau) | Liens internes contextuels `[ancre](/chemin)`. |
| `components/marketing/content-article.tsx` | Liens dans le texte, `outro`, blocs de navigation, suppression du bloc « Réponses rapides ». |
| `components/seo/json-ld.tsx` | Déduplication FAQPage, `CollectionJsonLd`, `ContactPageJsonLd`. |
| `app/(marketing)/guides/page.tsx` | Hub /guides restructuré. |
| `app/(marketing)/relance-devis/page.tsx` | Hub /relance-devis enrichi. |
| `app/(marketing)/guides/[slug]/page.tsx`, `relance-devis/[metier]/page.tsx` | Blocs « Autres guides », « Par métier », « Autres métiers ». |
| `app/(marketing)/contact/page.tsx`, `tarifs/page.tsx`, `faq/page.tsx` | Contenu contact, section tarifs, /faq déclarée page FAQ de référence. |
| `lib/content/guides.ts`, `guides-2.ts`, `metiers.ts` | Retrait du bloc dupliqué, branchement des enrichissements, FAQ SMS reformulée. |
| `app/sitemap.ts` | `lastmod` du 19/11 pour les pages modifiées (guides et métiers via `updated`). |
| `scripts/check-content.ts` (nouveau), `scripts/check-keywords.ts` | Contrôles qualité. |
| `lib/content/geo.ts` | Supprimé. |

## C. Code exact

Voir le diff de la branche (`git diff main...seo/indexation-2026-11-19`). Points clés :

```tsx
// components/seo/json-ld.tsx — une question n'est balisée qu'une fois sur le site
export function FaqJsonLd({ items, hub = false }: { items: QA[]; hub?: boolean }) {
  const onHub = new Set(FAQ_ALL.map((x) => x.q.trim().toLowerCase()));
  const seen = new Set<string>();
  const marked = items.filter((item) => {
    const key = item.q.trim().toLowerCase();
    if (seen.has(key) || (!hub && onHub.has(key))) return false;
    seen.add(key);
    return true;
  });
  if (marked.length === 0) return null;
  /* … FAQPage avec `marked` … */
}
// app/(marketing)/faq/page.tsx
<FaqJsonLd items={FAQ_ALL} hub />
```

```ts
// lib/content/guides.ts et metiers.ts — fusion du contenu enrichi
export const GUIDES = [...GUIDES_1, ...GUIDES_2].map((g) => enrich(g, GUIDE_ENRICHMENTS[g.slug]));
export const METIERS = METIERS_BASE.map((m) => enrich(m, METIER_ENRICHMENTS[m.slug]));
```

## D. Titres SEO et E. Meta descriptions

**Aucun changement, volontairement.** Les titles et descriptions actuels sont uniques, de bonne longueur, placent la requête principale en tête et correspondent à l'intention de recherche (vérifié aussi par `scripts/check-keywords.ts` : 20 mots-clés principaux et 50 secondaires présents). Les modifier six jours après le lancement relancerait l'évaluation de Google sans bénéfice. Le mécanisme `enrich()` accepte `title` et `description` si vous voulez en changer plus tard.

| URL | Title | Meta description (caractères) |
|---|---|---|
| /guides | Guides de relance de devis pour artisans — Artisan Relance | 149 |
| /guides/quand-relancer-un-devis | Quand relancer un devis après un rendez-vous ? Les bons délais | 158 |
| /guides/modele-mail-relance-devis | Exemple de mail de relance de devis pour artisan : 9 modèles | 159 |
| /guides/relancer-client-qui-ne-repond-plus | Comment relancer un client qui ne répond plus après un devis | 149 |
| /guides/combien-de-relances-devis | Combien de relances pour un devis ? La bonne fréquence | 147 |
| /guides/relance-devis-email-ou-telephone | Relance de devis : e-mail ou téléphone ? Le bon canal | 142 |
| /relance-devis | Relance de devis par métier du bâtiment — Artisan Relance | 142 |
| /relance-devis/plombier | Relancer un devis de plomberie : modèles mail et SMS | 140 |
| /relance-devis/electricien | Relancer un devis d'électricité : modèles mail et SMS | 152 |
| /relance-devis/couvreur | Relancer un devis de toiture : modèles mail et SMS | 155 |
| /relance-devis/chauffagiste | Relancer un devis de chauffage : modèles mail et SMS | 152 |
| /relance-devis/peintre | Relancer un devis de peinture : modèles mail et SMS | 151 |
| /relance-devis/menuisier | Relancer un devis de menuiserie : modèles mail et SMS | 149 |
| /faq | Relance de devis : 51 questions et réponses \| Artisan Relance | 149 |
| /tarifs | Prix du logiciel de relance de devis : gratuit \| Artisan Relance | 159 |
| /contact | Contact et démonstration — Artisan Relance | 139 |

Le guide modèles de mail garde « 9 modèles » dans son title : le modèle ajouté est présenté comme un bonus, le title reste exact.

## F. Nouveaux contenus (mots utiles, hors en-tête, pied de page et appels à l'action)

| Page | Avant | Après | Contenu ajouté |
|---|---|---|---|
| quand-relancer-un-devis | 1 258 | 1 854 | 3 calendriers types jour par jour ; vacances et échéances du client ; relancer un devis ancien |
| modele-mail-relance-devis | 1 294 | 1 774 | Modèle bonus (réponse écrite à une question) ; séquence complète de 3 mails ; vouvoiement, signature, pièce jointe |
| relancer-client-qui-ne-repond-plus | 853 | 1 583 | 5 types de silence ; exemple sur 3 semaines ; message vocal et SMS ; quand classer le dossier |
| combien-de-relances-devis | 873 | 1 543 | Grille montant × urgence ; pourquoi plus ≠ mieux ; cas à une seule relance ; par métier ; exemple plombier vs couvreur |
| relance-devis-email-ou-telephone | 832 | 1 567 | Comparatif des canaux ; ce que l'appel révèle ; canal par métier ; exemple d'une semaine ; clients professionnels |
| relancer-devis-sans-harceler | 1 350 | 1 622 | Test des 3 questions ; même relance insistante puis respectueuse |
| exemple-sms-relance-devis | 1 032 | 1 512 | 6 SMS par métier ; ce qu'il ne faut jamais envoyer ; séquence avec SMS bien placé |
| pourquoi-devis-pas-signe | 1 078 | 1 550 | Grille d'autodiagnostic en 8 questions ; 3 situations réelles ; demander la raison d'un refus |
| augmenter-taux-signature-devis | 1 048 | 1 559 | Calcul sur un trimestre ; plan d'action 30 jours ; fausses bonnes idées ; choix des rendez-vous |
| suivi-des-devis | 1 135 | 1 571 | Tableau colonne par colonne ; 3 erreurs ; suivi à plusieurs ; archivage |
| relance-devis-renovation-energetique | 1 103 | 1 537 | Étapes du dossier d'aide ; exemple PAC sur 10 semaines ; coordination isolation / menuiseries |
| plombier | 1 477 | 1 641 | Adaptation de salle de bain pour une personne âgée |
| electricien | 1 287 | 1 588 | Borne de recharge ; séquence pour une rénovation complète |
| couvreur | 912 | 1 547 | Saisons ; petits devis ; exemple de réfection sur 6 semaines ; isolation et aides ; documents |
| chauffagiste | 876 | 1 541 | Saison de chauffe ; exemple chaudière fioul → PAC ; erreurs propres ; documents ; PAC ou chaudière |
| peintre | 854 | 1 540 | Ravalement ; client qui veut peindre lui-même ; exemple mise en location ; décoration ; documents |
| menuisier | 830 | 1 522 | Face à une grande enseigne ; sur-mesure par étape ; exemple porte + fenêtres ; erreurs ; documents |
| renovation | 981 | 1 530 | Phasage plutôt que remise ; logement acheté ; exemple 70 m² ; coordination des corps d'état |

Chaque page métier garde en plus son kit (délais, 3 mails, 3 SMS, erreurs, générateur, simulateur) : 2 300 à 2 550 mots visibles au total.

## G. Maillage interne

- **Liens contextuels dans le texte** : 59 liens avec ancres descriptives (« combien de relances envoyer pour un devis », « relance de devis pour chauffagiste »…), placés là où le lecteur en a besoin.
- **Guides** : bloc « Autres guides » (10 liens) + « Relance de devis par métier » (7 liens) + « À lire aussi » enrichi.
- **Métiers** : bloc « Relance de devis pour les autres métiers » (6 liens + hub) + « Guides pour relancer vos devis » (11 liens).
- **Hubs** : /guides lie les 11 guides par thème et les 7 métiers ; /relance-devis lie les 7 métiers (cartes + tableau) et 3 guides.
- **/contact** et **/tarifs** lient FAQ, tarifs, confiance, guides, métiers.

## H. Données structurées

| Type de page | Schema.org |
|---|---|
| Toutes | `Organization`, `Person` (Jercat), `WebSite` (inchangés) |
| Guides | `Article` (auteur, dates), `BreadcrumbList`, `FAQPage` (questions propres à la page uniquement) |
| Métiers | idem + `HowTo` (inoffensif ; Google n'affiche plus de résultat enrichi HowTo depuis 2023) |
| /guides, /relance-devis | `CollectionPage` + `ItemList` (nouveau), `BreadcrumbList` ; `FAQPage` sur /relance-devis |
| /faq | `FAQPage` de référence (seule page à baliser les questions générales) |
| /contact | `ContactPage` (nouveau), `BreadcrumbList` |
| Accueil, /presentation | `SoftwareApplication` (inchangé) |

Note : depuis 2023, Google n'affiche plus les FAQ enrichies que pour quelques sites officiels. Le balisage reste utile pour la compréhension des pages, mais n'attendez pas d'affichage FAQ dans les résultats.

## I. Plan d'action par priorité

| Priorité | Action | Qui | Quand |
|---|---|---|---|
| 1 | Fusionner la branche `seo/indexation-2026-11-19` dans `main` (déploiement automatique Vercel) | Vous | Maintenant |
| 2 | Vérifier en ligne 2 ou 3 pages (ex. /guides, /relance-devis/couvreur) puis tester une URL dans Search Console > Inspection d'URL > « Tester l'URL en ligne » | Vous | Après le déploiement |
| 3 | Demander l'indexation (Inspection d'URL > « Demander une indexation »), dans cet ordre : /relance-devis, /guides, /relance-devis/couvreur, /chauffagiste, /peintre, /menuisier, /plombier, /electricien, /guides/combien-de-relances-devis, /guides/relancer-client-qui-ne-repond-plus. Google limite à une dizaine de demandes par jour : faites le reste le lendemain. Ne demandez pas les pages légales. | Vous | J+0 et J+1 |
| 4 | Search Console > Sitemaps : renvoyer `sitemap.xml` | Vous | J+0 |
| 5 | Dans le rapport « Explorée, actuellement non indexée », cliquer **« Valider la correction »** | Vous | J+1 |
| 6 | **Obtenir les premiers liens externes** — c'est le levier le plus puissant à ce stade : lien depuis dev.jercat.fr (page Réalisations, ancre « logiciel de relance de devis pour artisans ») ; fiche éditeur gratuite sur les annuaires de logiciels (Capterra / GetApp, annuaires de SaaS français) ; présentation dans des groupes Facebook ou forums d'artisans ; article invité ou interview sur un blog BTP. | Vous | Semaines 1 à 4 |
| 7 | Ne plus modifier titles et URL pendant 4 semaines ; ajouter du contenu, oui (nouveaux guides) | Vous | Continu |
| 8 | Suivre le rapport Pages chaque semaine. Délai réaliste : premières indexations en 1 à 3 semaines, la majorité en 4 à 8 semaines. La validation Google peut durer jusqu'à 2 semaines. | Vous | Hebdomadaire |
| 9 | Dans un mois : contrôler les Signaux Web essentiels et le rapport Pages, puis publier de nouveaux guides si besoin | Vous / Claude | Mi-décembre |
| 10 | Avant chaque ajout de contenu : `npx tsx --tsconfig tsconfig.json scripts/check-content.ts` | Claude | À chaque modification |
