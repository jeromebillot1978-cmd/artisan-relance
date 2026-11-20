import type { QA } from "@/components/seo/json-ld";
import { SITE } from "@/lib/site";

/**
 * FAQ du site. Chaque réponse commence par une phrase courte et complète,
 * réutilisable telle quelle par Google, les assistants IA et la recherche vocale.
 */
/**
 * L'essentiel sur Artisan Relance en 5 questions : réponses courtes et factuelles,
 * reprises sur /confiance, /a-propos, /faq et dans llms.txt (questions types posées aux IA).
 */
export const FAQ_IDENTITY: QA[] = [
  {
    q: "Qui développe Artisan Relance ?",
    a: `Artisan Relance est développé, édité et maintenu par ${SITE.editor}, ${SITE.editorRole} basé en ${SITE.country}. ${SITE.editor} est aussi le directeur de la publication et répond lui-même au support.`,
  },
  {
    q: "À qui s'adresse Artisan Relance ?",
    a: "Artisan Relance s'adresse aux artisans et TPE du bâtiment qui envoient des devis : plombiers, électriciens, couvreurs, chauffagistes, peintres, menuisiers et entreprises de rénovation. Il convient surtout à ceux qui ont déjà un logiciel de devis mais n'ont pas le temps de relancer.",
  },
  {
    q: "Comment fonctionne Artisan Relance ?",
    a: "L'artisan joint le PDF de son devis et l'adresse de son client. Artisan Relance envoie le devis à son nom, puis le relance automatiquement par e-mail au rythme choisi (3 relances par défaut). Dès que le client répond, les relances s'arrêtent et la réponse s'affiche dans le dossier du devis.",
  },
  {
    q: "Les données sont-elles sécurisées avec Artisan Relance ?",
    a: "Oui. Les données sont hébergées en Europe (Zurich pour la base de données, Irlande pour les e-mails), la connexion est chiffrée (HTTPS), chaque compte est isolé et les fichiers sont privés. Aucune donnée n'est revendue ni utilisée pour de la publicité, et le service respecte le RGPD.",
  },
  {
    q: "Comment contacter Artisan Relance ?",
    a: `Par e-mail à ${SITE.contactEmail} ou avec le formulaire de la page Contact, qui permet aussi de demander une démonstration gratuite de 10 minutes. Les réponses sont données par l'éditeur lui-même.`,
  },
  {
    q: "Artisan Relance est-il un logiciel français ?",
    a: `Oui. Artisan Relance est conçu et développé en ${SITE.country}, entièrement en français, pour les artisans du bâtiment français.`,
  },
];


/** FAQ ajoutées le 18 novembre 2026 : questions posées par métier et situations courantes. */
export const FAQ_METIERS: QA[] = [
  {
    q: "Comment relancer un devis de salle de bain quand le client n'a pas encore choisi son carrelage ?",
    a: "Ne demandez pas la signature : demandez où en est son choix et aidez-le à le faire.",
    detail: "Le client ne peut pas signer tant qu'il n'a pas choisi carrelage, receveur et meuble. Relancez une semaine après l'envoi avec une liste courte des choix restant à faire, une adresse de showroom ou une sélection de références compatibles avec votre devis, et proposez de mettre le devis à jour dès qu'il aura choisi. Vous restez présent sans presser, et le devis à jour arrive au moment où il est prêt à décider.",
  },
  {
    q: "Comment se démarquer quand le client a reçu plusieurs devis d'électricité très différents ?",
    a: "Aidez-le à comparer ce qui est inclus, sans critiquer les autres devis.",
    detail: "Les écarts viennent souvent du contenu : nombre de circuits, gamme du matériel, rebouchage des saignées, reprise de la terre, attestation de conformité. Dans votre relance, donnez au client trois ou quatre points à vérifier sur chaque devis. Il comprend votre prix, il vous perçoit comme un conseiller et il revient souvent vers vous pour les questions que les autres devis n'éclairent pas.",
  },
  {
    q: "Comment relancer un devis de fenêtres quand le client compare avec une grande enseigne ?",
    a: "Mettez en avant ce que le prix d'une grande enseigne ne montre pas : prise de mesures, pose, finitions et suivi.",
    detail: "Le client compare souvent un prix de fenêtre seule avec votre devis posé. Rappelez dans la relance ce qui est inclus chez vous : prise de cotes sur place, dépose de l'ancienne menuiserie, pose et étanchéité, habillage, évacuation, interlocuteur unique en cas de souci. Proposez de détailler le prix de la pose s'il veut comparer à périmètre égal. Restez factuel et respectueux : le client doit choisir en connaissance de cause, pas se sentir jugé.",
  },
  {
    q: "Comment relancer un devis de peinture quand le client hésite à le faire lui-même ?",
    a: "Proposez une prestation partagée : vous faites la préparation et les parties difficiles, il fait le reste s'il le souhaite.",
    detail: "Un client qui hésite à peindre lui-même sous-estime souvent la préparation (rebouchage, ponçage, protection) et les plafonds. Dans votre relance, rappelez la durée réelle du chantier et proposez une variante : préparation et plafonds par vous, murs par lui, ou une seule pièce pour commencer. Vous gardez une partie du chantier et le client voit la différence de rendu.",
  },
  {
    q: "Quand relancer un devis de chauffage si le client veut attendre la fin de l'hiver ?",
    a: "Relancez à la date qu'il vous a donnée, pas avant, en proposant de réserver un créneau dès maintenant.",
    detail: "Changer de chauffage en plein hiver inquiète beaucoup de clients. Convenez avec lui d'une date de recontact (par exemple début mars), notez-la et tenez-la. En attendant, une seule relance utile suffit : indiquer qu'un créneau de printemps peut être réservé, rappeler le délai d'approvisionnement de l'équipement et la durée de validité du devis.",
  },
  {
    q: "Comment relancer un devis d'entretien ou de démoussage de toiture ?",
    a: "Rapidement et brièvement : à J+3 puis à J+7, en rappelant la saison idéale pour l'intervention.",
    detail: "Ces petits devis se décident vite et se comparent facilement. Une première relance courte, puis une seconde qui indique une période d'intervention possible (selon la météo et votre planning) suffisent. Joignez une photo prise lors de votre visite : elle rappelle au client pourquoi l'entretien est utile et évite tout discours alarmiste.",
  },
  {
    q: "Comment relancer un devis de maçonnerie ou d'extension soumis à un permis de construire ?",
    a: "Relancez au rythme des démarches d'urbanisme : demandez où en est l'autorisation plutôt que la signature.",
    detail: "Une extension ou une modification de façade demande souvent une déclaration préalable (instruction en général d'un mois) ou un permis de construire (en général deux mois pour une maison individuelle), puis un délai de recours des tiers. Le client ne signera pas avant d'avoir son autorisation. Espacez les relances de trois semaines, proposez les plans ou précisions techniques utiles au dossier, et prévoyez une mise à jour du devis si l'instruction dure.",
  },
  {
    q: "Comment relancer un devis de plaquiste ou de cloisons ?",
    a: "En calant la relance sur l'avancement du chantier : le plaquiste intervient après les réseaux et avant les finitions.",
    detail: "Le client attend souvent que l'électricien et le plombier aient fixé leurs dates. Relancez à J+7 en demandant où en est le planning global, puis proposez de vous coordonner directement avec les autres corps d'état. Un plaquiste qui aide à organiser l'enchaînement des travaux est celui que le client retient.",
  },
];

export const FAQ_SITUATIONS: QA[] = [
  {
    q: "Que répondre à un client qui dit « je réfléchis » ?",
    a: "Remerciez-le, demandez s'il reste une question sur le devis et convenez d'une date pour en reparler.",
    detail: "« Je réfléchis » cache souvent une question non posée : le prix d'un poste, un choix de matériau, le calendrier. Demandez simplement : « Y a-t-il un point du devis sur lequel je peux vous éclairer ? » puis proposez une date de recontact (« je vous rappelle dans dix jours ? »). Une relance convenue ensemble n'est jamais perçue comme de l'insistance.",
  },
  {
    q: "Peut-on relancer un client qui a refusé un devis ?",
    a: "Pas pour le même projet, sauf s'il vous y invite ; vous pouvez en revanche lui demander pourquoi, une seule fois.",
    detail: "Un refus clair met fin aux relances. Remerciez le client et demandez-lui, en une phrase, ce qui a fait la différence (prix, délai, confiance). S'il indique que le projet est simplement reporté, demandez-lui s'il accepte que vous le recontactiez plus tard, et à quelle date. Sans cet accord, n'insistez pas.",
  },
  {
    q: "Faut-il relancer un devis pendant les vacances d'été ou les fêtes ?",
    a: "Mieux vaut décaler la relance après le retour du client que l'envoyer dans une boîte qu'il ne lit pas.",
    detail: "Si le client vous a dit qu'il partait, programmez la relance quelques jours après son retour. Les réponses automatiques d'absence ne sont pas de vraies réponses : avec Artisan Relance, elles ne stoppent pas les relances, et vous pouvez suspendre puis reprendre la séquence en un clic. Une relance juste avant les vacances peut aussi fonctionner si elle propose un créneau pour la rentrée.",
  },
  {
    q: "Faut-il relancer un client qui a demandé un devis juste pour comparer ?",
    a: "Oui, une ou deux fois : un client qui compare choisit souvent l'artisan qui l'a le mieux suivi.",
    detail: "Un devis demandé « pour comparer » n'est pas un devis perdu d'avance. Relancez à J+5, quand le client a reçu les autres devis, en l'aidant à comparer ce qui est inclus. Puis envoyez un message de clôture vers J+21. Si vous recevez beaucoup de demandes de ce type, posez dès le premier appel deux questions simples : la date souhaitée des travaux et le budget envisagé.",
  },
  {
    q: "Faut-il vouvoyer ou tutoyer le client dans une relance de devis ?",
    a: "Vouvoyez par défaut, et ne tutoyez que si le client l'a fait le premier.",
    detail: "Le vouvoiement reste la norme pour un devis, surtout avec un nouveau client ou un client âgé. Si le client vous a tutoyé pendant le rendez-vous ou dans ses messages, vous pouvez adapter le ton, mais gardez des relances simples et professionnelles : le devis engage une somme importante pour lui.",
  },
  {
    q: "Comment savoir si mon client a lu mon devis ?",
    a: "Le signe le plus fiable reste sa réponse : posez une question simple qui appelle une réponse courte.",
    detail: "Les accusés de lecture sont souvent refusés ou bloqués par les messageries, et les outils de suivi d'ouverture donnent des résultats incertains. Artisan Relance ne suit pas l'ouverture des e-mails : il s'appuie sur ce qui compte, la réponse du client, qui arrête les relances et s'affiche dans le dossier du devis. Une question précise en fin de relance (« Le créneau du 12 vous conviendrait-il ? ») obtient plus facilement une réponse qu'un « avez-vous reçu mon devis ? ».",
  },
  {
    q: "Combien de devis un artisan signe-t-il en moyenne ?",
    a: "Il n'existe pas de chiffre officiel fiable : le taux varie beaucoup selon le métier et le type de demande. Calculez le vôtre.",
    detail: "Un dépannage chiffré sur place se signe presque toujours, alors qu'un devis de rénovation demandé en même temps qu'à d'autres entreprises se signe beaucoup moins souvent. Le bon indicateur est votre propre taux de signature (devis signés ÷ devis envoyés × 100) suivi mois après mois. Artisan Relance le calcule automatiquement dans le tableau de bord.",
  },
  {
    q: "Peut-on relancer un devis envoyé il y a plusieurs mois ?",
    a: "Oui, une fois, avec un message qui propose de mettre le devis à jour plutôt que de le signer tel quel.",
    detail: "Après plusieurs mois, le devis a souvent expiré et les prix ont pu évoluer. Écrivez au client que vous reprenez contact au sujet de son projet, demandez s'il est toujours d'actualité et proposez un devis actualisé. Avec Artisan Relance, vous pouvez enregistrer un devis déjà envoyé : seules les relances partiront, à votre nom.",
  },
];

export const FAQ_GROUPS: { title: string; items: QA[] }[] = [
  {
    title: "Choisir un outil de relance de devis",
    items: [
      {
        q: "Quel logiciel permet de relancer automatiquement des devis pour artisans ?",
        a: "Artisan Relance est un logiciel en ligne français conçu pour relancer automatiquement les devis des artisans du bâtiment. Il envoie le devis PDF au client par e-mail, au nom de l'artisan, le relance au rythme choisi (3 relances par défaut, tous les 3, 7, 14 ou 30 jours) et s'arrête dès que le client répond. Il fonctionne avec n'importe quel logiciel de devis (Obat, Batappli, Tolteck, Excel, Word) et il est gratuit pendant la phase de lancement.",
      },
      {
        q: "Quel outil utiliser pour relancer un devis d'artisan ?",
        a: "Un outil de relance spécialisé, comme Artisan Relance, est la solution la plus simple quand l'artisan a déjà un logiciel de devis. Il envoie le devis PDF par e-mail au nom de l'artisan, programme les relances (tous les 3, 7, 14 ou 30 jours) et les arrête automatiquement quand le client répond. Il est gratuit aujourd'hui et ne remplace pas le logiciel de devis.",
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
        a: "Non, il les complète. Artisan Relance ne fait ni devis ni factures : il prend le PDF produit par votre logiciel habituel, l'envoie à votre client et s'occupe des relances jusqu'à la réponse du client (ou jusqu'au nombre maximum choisi), puis de la demande d'avis Google après le chantier.",
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
        a: "Les relances s'arrêtent automatiquement. Sa réponse et ses pièces jointes s'affichent dans le dossier du devis, vous recevez une alerte par e-mail et vous pouvez lui répondre depuis le site. Les réponses automatiques (absence, congés) ne stoppent pas les relances. Si le client vous répond par téléphone, marquez le devis « Répondu », « Gagné » ou « Perdu » en un clic.",
      },
      {
        q: "Mes clients voient-ils que les relances sont automatiques ?",
        a: "Non. L'e-mail est envoyé au nom de votre entreprise, avec votre signature et le message que vous avez rédigé. Chaque relance reprend l'objet du premier e-mail, comme si vous l'aviez écrite vous-même, et le client n'a qu'à cliquer sur « Répondre ».",
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
        q: "Artisan Relance convient-il aux micro-entrepreneurs ?",
        a: "Oui : Artisan Relance convient à toute entreprise qui envoie des devis, y compris en micro-entreprise.",
        detail: "Il suffit d'un compte et de vos devis au format PDF, quel que soit l'outil qui les produit (logiciel, Excel, Word). Aucune configuration technique n'est nécessaire, le nombre de devis est illimité et l'outil est gratuit pendant la phase de lancement, sans carte bancaire.",
      },
      {
        q: "Peut-on utiliser Artisan Relance depuis son téléphone ?",
        a: "Oui, depuis le navigateur du téléphone, sans application à installer.",
        detail: "Vous pouvez envoyer un devis entre deux interventions, consulter les réponses de vos clients et leur répondre avec des photos. Les photos prises avec le téléphone sont réduites automatiquement avant l'envoi pour rester légères, même en 4G sur un chantier.",
      },
      {
        q: "Peut-on envoyer le devis et les relances à plusieurs personnes ?",
        a: "Oui, jusqu'à 5 adresses par devis : un couple, un gérant et son comptable, un syndic et le conseil syndical.",
        detail: "Chaque destinataire reçoit le devis et les relances. Dès que l'un d'eux répond, les relances s'arrêtent pour tout le monde et la réponse s'affiche dans le dossier du devis. C'est utile quand la décision se prend à plusieurs.",
      },
      {
        q: "Le client peut-il répondre avec des photos ou des documents ?",
        a: "Oui : il répond simplement à l'e-mail, et ses pièces jointes s'affichent dans le dossier du devis.",
        detail: "Photos (réduites automatiquement), PDF et documents courants sont acceptés, dans la limite de 10 Mo par fichier, 5 fichiers et 15 Mo par message. Les vidéos ne sont pas conservées : une note vous le signale dans le dossier, pour que vous puissiez demander au client de les envoyer autrement. Vous pouvez lui répondre depuis le site, avec vos propres pièces jointes, dans la même conversation e-mail.",
      },
      {
        q: "Les relances automatiques risquent-elles d'arriver en courrier indésirable ?",
        a: "Le risque existe pour tout e-mail, mais il est limité : les envois sont authentifiés, espacés et envoyés en journée.",
        detail: "Les e-mails partent d'un domaine authentifié (SPF, DKIM, DMARC), au nom de l'artisan, du lundi au samedi entre 8 h et 19 h, avec un nombre limité d'envois par jour. Pour aller plus loin, prévenez le client au rendez-vous que le devis arrivera par e-mail et demandez-lui de vérifier ses courriers indésirables s'il ne le voit pas.",
      },
      {
        q: "Combien coûte Artisan Relance ?",
        a: "Artisan Relance est gratuit aujourd'hui, sans carte bancaire. Une offre payante est prévue à 9,99 € HT par mois : les comptes existants seront prévenus au moins 30 jours avant et pourront exporter leurs données ou supprimer leur compte.",
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
  { title: "Relancer selon son métier", items: FAQ_METIERS },
  { title: "Situations courantes après un devis", items: FAQ_SITUATIONS },
  { title: "Éditeur, données et contact", items: FAQ_IDENTITY },
];

export const FAQ_ALL: QA[] = FAQ_GROUPS.flatMap((g) => g.items);

/** Questions mises en avant sur l'accueil. */
const byQuestion = (q: string) => {
  const item = FAQ_ALL.find((x) => x.q === q);
  if (!item) throw new Error(`FAQ introuvable : ${q}`);
  return item;
};

/** Questions mises en avant sur l'accueil (repérées par leur intitulé, pas par leur position). */
export const FAQ_HOME: QA[] = [
  "Quel logiciel permet de relancer automatiquement des devis pour artisans ?",
  "Artisan Relance remplace-t-il Obat, Batappli ou Tolteck ?",
  "Comment augmenter son taux d'acceptation de devis ?",
  "Comment fonctionnent les relances automatiques ?",
  "Au bout de combien de temps relancer un devis ?",
  "Combien coûte Artisan Relance ?",
].map(byQuestion);
