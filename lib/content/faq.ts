import type { QA } from "@/components/seo/json-ld";

/**
 * FAQ du site. Chaque réponse commence par une phrase courte et complète,
 * réutilisable telle quelle par Google, les assistants IA et la recherche vocale.
 */
export const FAQ_GROUPS: { title: string; items: QA[] }[] = [
  {
    title: "Choisir un outil de relance de devis",
    items: [
      {
        q: "Quel outil utiliser pour relancer un devis d'artisan ?",
        a: "Un outil de relance spécialisé, comme Artisan Relance, est la solution la plus simple quand l'artisan a déjà un logiciel de devis. Il envoie le devis PDF par e-mail au nom de l'artisan, programme les relances (tous les 3, 7, 14 ou 30 jours) et les arrête en un clic quand le client répond. Il est gratuit aujourd'hui et ne remplace pas le logiciel de devis.",
      },
      {
        q: "Comment augmenter son taux d'acceptation de devis ?",
        a: "En envoyant le devis vite, en le relançant au bon moment et en facilitant la décision. Concrètement : devis envoyé sous 48 heures, première relance 3 à 7 jours après, deux ou trois relances qui apportent chacune une information utile (délai, variante, phasage), une date de validité claire et un suivi des devis gagnés et perdus pour comprendre ce qui bloque.",
      },
      {
        q: "Quel logiciel de relance de devis choisir dans le bâtiment ?",
        a: "Tout dépend de ce qui manque. Un artisan sans logiciel de devis choisira un logiciel complet (Obat, Tolteck, Batappli…). Un artisan qui a déjà son outil de devis mais oublie de relancer a besoin d'un outil spécialisé dans la relance, comme Artisan Relance, compatible avec tous les devis au format PDF.",
      },
      {
        q: "Artisan Relance remplace-t-il Obat, Batappli ou Tolteck ?",
        a: "Non, il les complète. Artisan Relance ne fait ni devis ni factures : il prend le PDF produit par votre logiciel habituel, l'envoie à votre client et s'occupe des relances jusqu'à la réponse, puis de la demande d'avis Google après le chantier.",
      },
      {
        q: "Artisan Relance peut-il demander des avis Google à mes clients ?",
        a: "Oui. Quand un devis est marqué « Gagné » ou « Terminé », Artisan Relance peut envoyer automatiquement, après le délai choisi, un e-mail avec le lien vers votre fiche Google. Une seule demande par client, avec un lien de désinscription, et un suivi des clics.",
      },
    ],
  },
  {
    title: "Relancer un devis",
    items: [
      {
        q: "Au bout de combien de temps relancer un devis ?",
        a: "Relancez un devis 3 à 7 jours après l'envoi. Le premier rappel sert à vérifier que le client a bien reçu le devis et à répondre à ses questions ; les suivants peuvent s'espacer d'une semaine. Pour un gros chantier (toiture, rénovation complète), comptez plutôt 7 jours, car le client compare souvent plusieurs devis.",
      },
      {
        q: "Combien de relances envoyer pour un devis sans réponse ?",
        a: "Trois relances suffisent dans la plupart des cas. Une première courte à J+3 ou J+7, une deuxième qui apporte une information utile (délai de démarrage, validité du devis), puis un dernier message de clôture qui propose d'en reparler plus tard. Au-delà, le client perçoit de l'insistance.",
      },
      {
        q: "Que faire quand un client ne répond pas à un devis ?",
        a: "Relancez-le par écrit, puis changez de canal. Un e-mail courtois rappelant le devis et sa date, puis un appel téléphonique si l'e-mail reste sans réponse. Le silence est rarement un refus : le client manque souvent de temps, attend un financement ou compare. Un message de clôture permet ensuite de classer le dossier sans fermer la porte.",
      },
      {
        q: "Que mettre dans un mail de relance de devis ?",
        a: "Un objet qui reprend le devis, une phrase de rappel, une question simple. Exemple : « Bonjour Madame Martin, je reviens vers vous au sujet du devis de rénovation de votre salle de bain envoyé le 3 mars. Avez-vous eu le temps de le consulter ? Je peux l'ajuster si besoin. » Restez bref et proposez une action facile : répondre, appeler, fixer un rendez-vous.",
      },
      {
        q: "Vaut-il mieux relancer un devis par e-mail ou par téléphone ?",
        a: "Commencez par l'e-mail, terminez par le téléphone. L'e-mail laisse une trace et ne dérange pas ; le téléphone débloque les dossiers où le client hésite sur un détail. Artisan Relance automatise les e-mails pour que vous gardiez votre temps d'appel pour les clients qui en valent la peine.",
      },
    ],
  },
  {
    title: "Taux de transformation",
    items: [
      {
        q: "Qu'est-ce que le taux de transformation des devis ?",
        a: "C'est la part de vos devis qui deviennent des chantiers signés. Il se calcule ainsi : devis signés ÷ devis envoyés × 100. Avec 8 devis signés sur 20 envoyés, votre taux de transformation est de 40 %. Artisan Relance l'affiche dans votre tableau de bord sous le nom « taux de signature ».",
      },
      {
        q: "Comment améliorer le taux de transformation de ses devis ?",
        a: "Relancez systématiquement, répondez vite et rendez le devis facile à comprendre. Une partie des devis perdus le sont simplement faute de relance : le client signe avec l'entreprise qui l'a recontacté. Envoyer le devis rapidement après la visite, détailler clairement les postes et indiquer un délai de démarrage aident aussi.",
      },
      {
        q: "Pourquoi mes devis ne sont-ils pas signés ?",
        a: "Les causes les plus fréquentes sont l'absence de relance, un devis envoyé trop tard, un prix sans explication et un client qui compare plusieurs offres. Avant de baisser vos prix, vérifiez que chaque devis a reçu au moins deux relances : c'est l'action la moins chère pour récupérer des chantiers.",
      },
    ],
  },
  {
    title: "Fonctionnement d'Artisan Relance",
    items: [
      {
        q: "Comment fonctionnent les relances automatiques ?",
        a: "Vous envoyez votre devis depuis Artisan Relance (PDF joint) et choisissez un rythme : tous les 3, 7, 14 ou 30 jours, ou un intervalle personnalisé, avec un nombre maximum de relances et une date de fin. Les relances partent ensuite seules, du lundi au samedi entre 8 h et 19 h, à votre nom.",
      },
      {
        q: "Que se passe-t-il quand le client répond ?",
        a: "Sa réponse arrive directement dans votre boîte mail, car il répond à votre adresse. Vous arrêtez ensuite les relances en un clic depuis le tableau des devis : « Répondu », « Gagné » ou « Perdu ». Pensez-y dès que le client vous a répondu, par e-mail ou par téléphone, pour qu'il ne reçoive pas de relance inutile.",
      },
      {
        q: "Mes clients voient-ils que les relances sont automatiques ?",
        a: "Non. L'e-mail est envoyé au nom de votre entreprise, avec votre signature et le message que vous avez rédigé. Chaque relance reprend l'objet du premier e-mail, comme si vous l'aviez écrite vous-même, et le client vous répond directement.",
      },
      {
        q: "Dois-je changer de logiciel de devis ?",
        a: "Non. Vous continuez à faire vos devis avec votre outil habituel (Obat, Batappli, Tolteck, Excel, Word…), vous exportez le PDF et vous le joignez dans Artisan Relance. Si le devis est déjà parti, vous l'enregistrez simplement : seules les relances seront envoyées.",
      },
      {
        q: "Puis-je arrêter, suspendre ou reprendre les relances ?",
        a: "Oui, à tout moment et en un clic. Depuis le menu de chaque devis : arrêter les relances, les reprendre, marquer le devis gagné, perdu, répondu ou terminé. La prochaine date de relance se recalcule automatiquement.",
      },
      {
        q: "Combien coûte Artisan Relance ?",
        a: "Artisan Relance est gratuit aujourd'hui, sans carte bancaire. Une offre payante est prévue à 19 € HT par mois : les comptes existants seront prévenus au moins 30 jours avant et pourront exporter leurs données ou supprimer leur compte.",
      },
    ],
  },
  {
    title: "Données et RGPD",
    items: [
      {
        q: "Ai-je le droit de relancer un client par e-mail (RGPD) ?",
        a: "Oui, quand le client vous a demandé un devis. La relance s'appuie alors sur des mesures précontractuelles demandées par la personne et sur votre intérêt légitime à donner suite à sa demande. Restez dans le cadre du devis, limitez le nombre de relances et arrêtez dès que le client le demande : chaque e-mail d'Artisan Relance propose de répondre « STOP ».",
      },
      {
        q: "Où sont stockées mes données et celles de mes clients ?",
        a: "En Europe. La base de données est hébergée par Supabase à Zurich (Suisse), les e-mails sont envoyés par Resend depuis l'Irlande. Chaque compte est isolé : vous seul voyez vos devis, vos clients et vos fichiers, et aucune donnée n'est revendue.",
      },
      {
        q: "Combien de temps sont conservés les devis et les pièces jointes ?",
        a: "Les devis restent tant que votre compte est actif ; les pièces jointes sont supprimées automatiquement 12 mois après la clôture du dossier. Vous pouvez supprimer un devis, ses fichiers et son historique à tout moment, et exporter vos données au format CSV.",
      },
      {
        q: "Qui est responsable des données de mes clients ?",
        a: "Vous restez responsable du traitement des données de vos clients ; Artisan Relance agit comme sous-traitant. Nous traitons ces données uniquement pour envoyer vos devis et vos relances, selon vos instructions, comme le prévoient nos conditions générales d'utilisation.",
      },
    ],
  },
];

export const FAQ_ALL: QA[] = FAQ_GROUPS.flatMap((g) => g.items);

/** Questions mises en avant sur l'accueil. */
export const FAQ_HOME: QA[] = [
  FAQ_GROUPS[0].items[0],
  FAQ_GROUPS[0].items[3],
  FAQ_GROUPS[0].items[1],
  FAQ_GROUPS[3].items[0],
  FAQ_GROUPS[1].items[0],
  FAQ_GROUPS[3].items[5],
];
