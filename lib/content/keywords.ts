/**
 * Carte des mots-clés : chaque requête est rattachée à UNE seule page (pas de cannibalisation).
 * - principaux : présents dans le title, le H1, la description ou la réponse courte de la page cible ;
 * - secondaires : présents dans le corps de la page cible.
 * Contrôle : `npx tsx scripts/check-keywords.ts`.
 */
export interface KeywordTarget {
  keyword: string;
  path: string;
}

export const PRIMARY_KEYWORDS: KeywordTarget[] = [
  { keyword: "logiciel relance devis", path: "/" },
  { keyword: "relance automatique devis", path: "/" },
  { keyword: "relancer un devis", path: "/guides/relancer-devis-sans-harceler" },
  { keyword: "quand relancer un devis", path: "/guides/quand-relancer-un-devis" },
  { keyword: "relancer devis après rendez-vous", path: "/guides/quand-relancer-un-devis" },
  { keyword: "mail de relance devis", path: "/guides/modele-mail-relance-devis" },
  { keyword: "exemple mail relance devis artisan", path: "/guides/modele-mail-relance-devis" },
  { keyword: "sms relance devis", path: "/guides/exemple-sms-relance-devis" },
  { keyword: "exemple sms relance devis", path: "/guides/exemple-sms-relance-devis" },
  { keyword: "devis pas signé", path: "/guides/pourquoi-devis-pas-signe" },
  { keyword: "pourquoi devis pas signé", path: "/guides/pourquoi-devis-pas-signe" },
  { keyword: "taux de signature devis", path: "/guides/augmenter-taux-signature-devis" },
  { keyword: "augmenter taux signature devis", path: "/guides/augmenter-taux-signature-devis" },
  { keyword: "suivi des devis", path: "/guides/suivi-des-devis" },
  { keyword: "suivre ses devis", path: "/guides/suivi-des-devis" },
  { keyword: "relance devis plombier", path: "/relance-devis/plombier" },
  { keyword: "relance devis électricien", path: "/relance-devis/electricien" },
  { keyword: "relance devis rénovation énergétique", path: "/guides/relance-devis-renovation-energetique" },
  { keyword: "client ne répond plus devis", path: "/guides/relancer-client-qui-ne-repond-plus" },
  { keyword: "combien de relances devis", path: "/guides/combien-de-relances-devis" },
];

export const SECONDARY_KEYWORDS: KeywordTarget[] = [
  // Relancer sans harceler
  { keyword: "relancer sans harceler", path: "/guides/relancer-devis-sans-harceler" },
  { keyword: "relance devis poliment", path: "/guides/relancer-devis-sans-harceler" },
  { keyword: "relancer client sans insistance", path: "/guides/relancer-devis-sans-harceler" },
  { keyword: "relance polie", path: "/guides/relancer-devis-sans-harceler" },
  { keyword: "suivi professionnel devis", path: "/guides/relancer-devis-sans-harceler" },
  // Quand relancer
  { keyword: "délai relance devis", path: "/guides/quand-relancer-un-devis" },
  { keyword: "envoyer devis 48 heures", path: "/guides/quand-relancer-un-devis" },
  { keyword: "après la visite", path: "/guides/quand-relancer-un-devis" },
  { keyword: "meilleur jour pour relancer", path: "/guides/quand-relancer-un-devis" },
  { keyword: "annoncer la relance", path: "/guides/quand-relancer-un-devis" },
  // Mail de relance
  { keyword: "objet mail relance devis", path: "/guides/modele-mail-relance-devis" },
  { keyword: "modèle de relance", path: "/guides/modele-mail-relance-devis" },
  { keyword: "relance chauffe-eau", path: "/guides/modele-mail-relance-devis" },
  { keyword: "relance tableau électrique", path: "/guides/modele-mail-relance-devis" },
  { keyword: "relance toiture", path: "/guides/modele-mail-relance-devis" },
  // SMS
  { keyword: "relance par sms", path: "/guides/exemple-sms-relance-devis" },
  { keyword: "sms de clôture", path: "/guides/exemple-sms-relance-devis" },
  { keyword: "whatsapp", path: "/guides/exemple-sms-relance-devis" },
  { keyword: "sms disponibilité", path: "/guides/exemple-sms-relance-devis" },
  { keyword: "combiner e-mail et sms", path: "/guides/exemple-sms-relance-devis" },
  // Devis non signé
  { keyword: "devis trop cher", path: "/guides/pourquoi-devis-pas-signe" },
  { keyword: "devis refusé", path: "/guides/pourquoi-devis-pas-signe" },
  { keyword: "devis sans réponse", path: "/guides/pourquoi-devis-pas-signe" },
  { keyword: "baisser son prix", path: "/guides/pourquoi-devis-pas-signe" },
  { keyword: "proposer une variante", path: "/guides/pourquoi-devis-pas-signe" },
  // Taux de signature
  { keyword: "taux de transformation", path: "/guides/augmenter-taux-signature-devis" },
  { keyword: "taux d'acceptation des devis", path: "/guides/augmenter-taux-signature-devis" },
  { keyword: "calculer taux de signature", path: "/guides/augmenter-taux-signature-devis" },
  { keyword: "signer plus de devis", path: "/guides/augmenter-taux-signature-devis" },
  { keyword: "avis google", path: "/guides/augmenter-taux-signature-devis" },
  // Suivi des devis
  { keyword: "tableau excel devis", path: "/guides/suivi-des-devis" },
  { keyword: "statut devis", path: "/guides/suivi-des-devis" },
  { keyword: "routine de suivi", path: "/guides/suivi-des-devis" },
  { keyword: "devis en cours", path: "/guides/suivi-des-devis" },
  { keyword: "export csv", path: "/guides/suivi-des-devis" },
  // Plomberie
  { keyword: "devis salle de bain", path: "/relance-devis/plombier" },
  { keyword: "remplacement chauffe-eau", path: "/relance-devis/plombier" },
  { keyword: "devis plomberie", path: "/relance-devis/plombier" },
  // Électricité
  { keyword: "mise aux normes", path: "/relance-devis/electricien" },
  { keyword: "devis électricité", path: "/relance-devis/electricien" },
  { keyword: "borne de recharge", path: "/relance-devis/electricien" },
  // Rénovation énergétique
  { keyword: "MaPrimeRénov'", path: "/guides/relance-devis-renovation-energetique" },
  { keyword: "prime CEE", path: "/guides/relance-devis-renovation-energetique" },
  { keyword: "pompe à chaleur", path: "/guides/relance-devis-renovation-energetique" },
  { keyword: "entreprise RGE", path: "/guides/relance-devis-renovation-energetique" },
  { keyword: "dossier d'aide", path: "/guides/relance-devis-renovation-energetique" },
  // Autres pages
  { keyword: "relance devis couvreur", path: "/relance-devis/couvreur" },
  { keyword: "relance devis menuisier", path: "/relance-devis/menuisier" },
  { keyword: "relance devis chauffagiste", path: "/relance-devis/chauffagiste" },
  { keyword: "relance devis peintre", path: "/relance-devis/peintre" },
];
