import type { ContentPage } from "./types";

const DATE = "2026-11-15";

const commonRelated = [
  { href: "/guides/quand-relancer-un-devis", label: "Quand relancer un devis ?" },
  { href: "/guides/modele-mail-relance-devis", label: "Modèles de mail de relance de devis" },
  { href: "/guides/combien-de-relances-devis", label: "Combien de relances envoyer ?" },
];

export const METIERS: (ContentPage & { metier: string; short: string })[] = [
  // ------------------------------------------------------------------ PLOMBIER
  {
    slug: "plombier",
    metier: "plombier",
    short: "Plombier",
    title: "Relance de devis plombier : méthode, modèles et outil gratuit",
    description:
      "Plombiers : relancez vos devis de salle de bain, chauffe-eau ou rénovation au bon moment. Calendrier, modèles de mail et relances automatiques gratuites.",
    h1: "Relance de devis pour plombier : ne laissez plus un chantier de salle de bain filer",
    answer:
      "Un plombier doit relancer ses devis de travaux (salle de bain, remplacement de chauffe-eau, réseau complet) 3 à 5 jours après l'envoi, puis une semaine plus tard. Les dépannages urgents se signent sur place ; ce sont les devis de projet, que le client compare, qui se perdent faute de relance.",
    sections: [
      {
        h2: "Pourquoi les devis de plomberie restent sans réponse",
        paragraphs: [
          "En plomberie, deux mondes coexistent. Le dépannage d'abord : une fuite, un WC bouché, un ballon qui ne chauffe plus. Le client a besoin de vous tout de suite, il accepte le devis sur place et la question de la relance ne se pose pas. Puis les projets : création ou rénovation de salle de bain, remplacement d'un chauffe-eau par un thermodynamique, reprise d'une installation en cuivre, adaptation d'une douche pour une personne âgée. Là, le client prend son temps.",
          "Sur un projet de salle de bain, le particulier demande en général plusieurs devis. Il les reçoit à quelques jours d'écart, les pose sur la table de la cuisine et attend d'en parler en famille, de passer en magasin pour choisir le carrelage ou de vérifier son budget. Pendant ce temps, vous êtes sur un autre chantier. Le premier plombier qui le rappelle, poliment et au bon moment, a souvent un avantage décisif : il montre qu'il est organisé et que le projet l'intéresse.",
          "Le devis non relancé n'est donc pas forcément un devis refusé. C'est souvent un devis oublié, ou un client qui n'ose pas poser une question sur un poste qu'il ne comprend pas (la différence entre un receveur extra-plat et un receveur à carreler, par exemple).",
        ],
      },
      {
        h2: "Le bon calendrier de relance pour un plombier",
        paragraphs: [
          "Adaptez le rythme au type de devis. Un remplacement de chauffe-eau se décide vite : l'appareil est souvent en fin de vie et le client veut de l'eau chaude. Une salle de bain complète se décide en semaines.",
        ],
        steps: [
          { title: "Chauffe-eau, robinetterie, petite intervention programmée", text: "Relance à J+3, puis à J+7. Au-delà, le client a soit trouvé quelqu'un, soit reporté." },
          { title: "Salle de bain, douche à l'italienne, adaptation PMR", text: "Relance à J+5, à J+12 avec une information utile (délai de démarrage, disponibilité du carreleur), puis un message de clôture vers J+25." },
          { title: "Réseau complet ou rénovation de logement", text: "Relance à J+7, puis toutes les deux semaines, trois fois au maximum. Ces dossiers dépendent souvent d'un crédit ou d'un autre corps d'état." },
        ],
      },
      {
        h2: "Ce qu'il faut écrire dans une relance de devis de plomberie",
        paragraphs: [
          "Une bonne relance de plombier est courte, concrète et rassurante. Rappelez l'objet précis (« le devis de rénovation de votre salle de bain à l'étage »), proposez de répondre à une question et donnez un élément qui aide à décider : la marque du mitigeur proposée, un délai de démarrage, la durée prévisible du chantier pendant laquelle la salle de bain sera inutilisable.",
          "Évitez les formules qui mettent la pression (« sans réponse de votre part, je considère le dossier clos ») dès la première relance. Gardez-les pour le dernier message.",
        ],
        template: {
          label: "Modèle de relance — salle de bain",
          subject: "Votre projet de salle de bain — devis du {date_envoi}",
          body: "Bonjour {client},\n\nJe reviens vers vous au sujet du devis de rénovation de votre salle de bain envoyé le {date_envoi}.\n\nSi un poste vous semble flou (receveur, mitigeur thermostatique, évacuation), je vous l'explique volontiers en deux minutes au téléphone. Je peux aussi proposer une variante si le budget doit être ajusté.\n\nÀ ce jour, je pourrais démarrer le chantier sous trois semaines.\n\nBonne journée,",
        },
      },
      {
        h2: "Relancer sans y penser avec Artisan Relance",
        paragraphs: [
          "Artisan Relance envoie votre devis PDF par e-mail, à votre nom, puis programme les relances selon le rythme choisi : tous les 3, 7, 14 ou 30 jours, avec un nombre maximum de relances. Les messages partent du lundi au samedi en journée, jamais le dimanche ni la nuit. Votre client vous répond directement, sur votre adresse e-mail.",
          "Vous gardez votre logiciel de devis habituel. Vous exportez le PDF, vous l'ajoutez dans Artisan Relance avec l'adresse du client, et c'est tout. Quand le client répond ou signe, un clic sur « Répondu » ou « Gagné » arrête les relances.",
        ],
        list: [
          "Envoi du devis et des relances depuis votre téléphone, entre deux interventions",
          "Relances à votre nom, avec votre signature",
          "Tableau de bord : devis en attente, gagnés, perdus et montant signé",
          "Gratuit pendant la phase de lancement, sans carte bancaire",
        ],
      },
      {
        h2: "Exemple : ce qu'une relance peut rapporter à un plombier",
        paragraphs: [
          "Prenons un exemple chiffré simple, à adapter à votre activité. Vous envoyez 10 devis de projet par mois, d'un montant moyen de 4 000 €. Si une relance régulière vous fait signer un seul devis de plus tous les deux mois, cela représente 6 chantiers et 24 000 € de chiffre d'affaires sur l'année, pour quelques secondes de saisie par devis.",
          "Le calcul n'est pas une promesse : il montre surtout qu'il suffit de très peu de devis récupérés pour que la relance soit l'action commerciale la plus rentable de votre semaine.",
        ],
      },
    ],
    faq: [
      {
        q: "Faut-il relancer un devis de dépannage de plomberie ?",
        a: "Rarement. Un dépannage urgent se décide sur place. En revanche, si vous avez laissé un devis pour une réparation non urgente ou un remplacement d'équipement, une relance à J+3 est utile : le client a peut-être simplement oublié.",
      },
      {
        q: "Un devis est-il obligatoire pour des travaux de plomberie ?",
        a: "Pour les travaux de dépannage, de réparation et d'entretien dans le bâtiment, un devis écrit doit être remis avant les travaux lorsque leur montant dépasse 150 € TTC, ou à la demande du client. Pour les projets de rénovation, le devis détaillé est de toute façon la base de la décision du client.",
      },
      {
        q: "Combien de relances pour un devis de salle de bain ?",
        a: "Trois relances sur environ un mois : une première à 5 jours, une deuxième avec une information utile, puis un message de clôture. Au-delà, mieux vaut un appel téléphonique.",
      },
      {
        q: "Mon client a choisi un autre plombier : que faire ?",
        a: "Marquez le devis « Perdu » pour arrêter les relances, et notez si possible la raison (prix, délai, autre entreprise). Après quelques mois, ces raisons vous montrent ce qu'il faut ajuster dans vos devis.",
      },
    ],
    related: [{ href: "/relance-devis/chauffagiste", label: "Relance de devis pour chauffagiste" }, ...commonRelated],
    date: DATE,
  },

  // ------------------------------------------------------------------ ÉLECTRICIEN
  {
    slug: "electricien",
    metier: "électricien",
    short: "Électricien",
    title: "Relance de devis électricien : signer plus de chantiers",
    description:
      "Électriciens : relancez vos devis de mise aux normes, rénovation électrique ou borne de recharge. Calendrier, modèles de mail et relances automatiques.",
    h1: "Relance de devis pour électricien : mise aux normes, rénovation, borne de recharge",
    answer:
      "Un électricien a intérêt à relancer ses devis 4 à 7 jours après l'envoi, puis une à deux fois à une semaine d'intervalle. Les devis de mise aux normes et de rénovation complète sont souvent repoussés par le client faute de comprendre l'urgence : la relance sert à l'expliquer.",
    sections: [
      {
        h2: "Pourquoi les devis d'électricité restent en attente",
        paragraphs: [
          "Le devis d'électricité a un problème particulier : le client ne voit pas toujours ce qu'il achète. Un tableau neuf, des circuits séparés, une liaison équipotentielle ou une prise de terre refaite ne changent rien au quotidien tant que tout fonctionne. Face à un devis de 3 000 € pour une mise en sécurité, beaucoup de particuliers se disent qu'ils verront plus tard.",
          "D'autres devis attendent pour des raisons pratiques : une borne de recharge suspendue à la livraison du véhicule, une rénovation électrique qui dépend de l'avancement du plaquiste, un local professionnel dont le bail n'est pas encore signé. Dans tous ces cas, le client n'a pas dit non. Il a simplement besoin qu'on lui rappelle le dossier au bon moment.",
          "Enfin, l'électricité est un métier où la confiance compte beaucoup : le client confie la sécurité de son logement. Une relance claire et professionnelle renforce cette confiance ; un silence total après l'envoi du devis l'affaiblit.",
        ],
      },
      {
        h2: "Quel rythme de relance pour un électricien ?",
        steps: [
          { title: "Mise en sécurité ou mise aux normes", text: "Relance à J+5 en rappelant ce que le diagnostic a montré, puis à J+12. Un appel ensuite si le logement présente un risque réel." },
          { title: "Rénovation électrique complète", text: "Relance à J+7, puis à J+15 et J+30 : ces chantiers suivent le planning des autres corps d'état." },
          { title: "Borne de recharge, climatisation, petits travaux", text: "Relance à J+4 et J+10. Ces décisions sont rapides ; au-delà de deux semaines, le client a souvent fait appel à quelqu'un d'autre." },
        ],
      },
      {
        h2: "Ce qui fait signer un devis d'électricien",
        paragraphs: [
          "Dans votre relance, traduisez le technique en bénéfice concret. Plutôt que « remplacement du tableau et création de circuits spécialisés », écrivez « un tableau neuf avec les protections actuelles, pour que le lave-linge et le four ne fassent plus sauter le courant ». Le client comprend ce qu'il gagne.",
          "Si le devis comprend plusieurs options (prises supplémentaires, éclairage extérieur, domotique), rappelez qu'il peut commencer par la partie sécurité et ajouter le reste plus tard. Proposer une première étape fait souvent débloquer un dossier qui semblait trop cher.",
        ],
        template: {
          label: "Modèle de relance — mise en sécurité",
          subject: "Mise en sécurité de votre installation — devis du {date_envoi}",
          body: "Bonjour {client},\n\nJe me permets de revenir vers vous concernant le devis de mise en sécurité électrique envoyé le {date_envoi}.\n\nLors de ma visite, j'avais relevé l'absence de différentiel sur plusieurs circuits : c'est le point le plus important à traiter. Si le budget est une question, nous pouvons commencer par cette partie et prévoir le reste dans un second temps.\n\nJe reste disponible pour en parler.\n\nCordialement,",
        },
      },
      {
        h2: "Les documents qui rassurent le client",
        paragraphs: [
          "Joignez à votre devis ou à votre première relance ce qui prouve votre sérieux : attestation d'assurance décennale, qualification éventuelle (par exemple pour l'installation de bornes de recharge), et pour une mise en sécurité, une ou deux photos commentées de l'installation existante. Un client qui voit le problème comprend mieux le prix de la solution.",
        ],
      },
      {
        h2: "Automatiser les relances de vos devis d'électricité",
        paragraphs: [
          "Artisan Relance s'occupe du suivi à votre place. Vous joignez le PDF de votre devis, vous choisissez le rythme des relances et un nombre maximum, et les e-mails partent à votre nom aux dates prévues, du lundi au samedi entre 8 h et 19 h. Les réponses de vos clients arrivent dans votre boîte mail habituelle.",
          "Vous voyez en un coup d'œil les devis qui attendent, les prochaines relances et votre taux de signature. Un devis signé ? Un clic sur « Gagné » et les relances s'arrêtent.",
        ],
        list: [
          "Compatible avec vos devis faits sur n'importe quel logiciel (export PDF)",
          "Plusieurs destinataires possibles : le couple, le gestionnaire, l'architecte",
          "Relances espacées selon le type de chantier",
          "Gratuit pendant le lancement",
        ],
      },
      {
        h2: "Le cas des devis pour professionnels et syndics",
        paragraphs: [
          "Pour un commerce, un bureau ou une copropriété, le devis passe souvent entre plusieurs mains : gérant, comptable, syndic, conseil syndical. Ajoutez tous les décideurs en destinataires et espacez davantage les relances, toutes les deux semaines par exemple, car ces décisions suivent des réunions ou des assemblées. Rappeler la date de validité du devis aide aussi à fixer une échéance.",
        ],
      },
    ],
    faq: [
      {
        q: "Combien de temps un devis d'électricité reste-t-il valable ?",
        a: "La loi ne fixe pas de durée : c'est vous qui l'indiquez sur le devis, souvent 1 à 3 mois, car le prix du matériel évolue. Rappeler cette date dans la dernière relance aide le client à se décider.",
      },
      {
        q: "Faut-il relancer un devis de borne de recharge ?",
        a: "Oui, rapidement : à J+4 puis à J+10. Ces demandes sont souvent faites à plusieurs installateurs en même temps, et le client choisit vite.",
      },
      {
        q: "Comment relancer un syndic ou une copropriété ?",
        a: "Ajoutez le syndic et un membre du conseil syndical en destinataires, espacez les relances de deux semaines et rappelez la date de la prochaine assemblée si le vote en dépend.",
      },
      {
        q: "Les relances peuvent-elles partir le week-end ?",
        a: "Avec Artisan Relance, les relances partent du lundi au samedi entre 8 h et 19 h, jamais le dimanche ni la nuit.",
      },
    ],
    related: [{ href: "/relance-devis/chauffagiste", label: "Relance de devis pour chauffagiste" }, ...commonRelated],
    date: DATE,
  },

  // ------------------------------------------------------------------ COUVREUR
  {
    slug: "couvreur",
    metier: "couvreur",
    short: "Couvreur",
    title: "Relance de devis couvreur : toiture, zinguerie, isolation",
    description:
      "Couvreurs : relancez vos devis de réfection de toiture, zinguerie ou isolation au bon moment, selon la saison. Modèles de mail et relances automatiques.",
    h1: "Relance de devis pour couvreur : signer vos chantiers de toiture avant la saison",
    answer:
      "Un couvreur doit relancer ses devis de toiture 7 jours après l'envoi, puis deux à trois fois toutes les deux semaines. Les gros devis de couverture se décident lentement, mais les clients signent avec l'entreprise qui leur garantit une date de chantier : la relance est le bon moment pour la proposer.",
    sections: [
      {
        h2: "Les particularités du devis de couverture",
        paragraphs: [
          "Un devis de toiture est souvent l'un des plus gros montants qu'un particulier signe pour sa maison, après la cuisine ou le chauffage. Réfection complète, remplacement de tuiles, reprise de la zinguerie, isolation par l'extérieur, pose de fenêtres de toit : le client hésite, compare au moins deux ou trois couvreurs et cherche à comprendre les écarts de prix.",
          "La météo joue aussi. Un client qui découvre une fuite en novembre veut une intervention avant l'hiver ; celui qui prépare une réfection complète vise souvent le printemps ou l'été. Votre planning, lui, se remplit des mois à l'avance. Relancer au bon moment permet de caler les chantiers et d'éviter les trous dans l'agenda.",
          "Enfin, une partie des devis de couverture dépend d'un tiers : expert d'assurance après une tempête, aide à la rénovation énergétique pour l'isolation, accord de la copropriété ou déclaration préalable en mairie. Ces délais rallongent la décision et rendent la relance encore plus nécessaire.",
        ],
      },
      {
        h2: "Calendrier de relance conseillé",
        steps: [
          { title: "Réparation, fuite, remplacement de quelques tuiles", text: "Relance à J+3 et J+7. Le client veut une intervention rapide ; une date proposée fait souvent signer." },
          { title: "Réfection complète, isolation, charpente", text: "Relance à J+7, J+21 et J+35. Rappelez à chaque fois votre délai de démarrage, qui évolue avec la saison." },
          { title: "Dossier lié à une assurance ou une aide", text: "Relance à J+10 en demandant où en est le dossier, puis toutes les trois semaines. Proposez d'envoyer les pièces utiles à l'expert ou au conseiller." },
        ],
      },
      {
        h2: "Ce qu'un client attend dans une relance de couvreur",
        paragraphs: [
          "Le client veut être rassuré sur trois points : la qualité des matériaux, le respect du planning et les garanties. Votre relance peut rappeler l'un d'eux à chaque fois, plutôt que de répéter la même phrase : la marque et la gamme des tuiles proposées, la date de démarrage possible, votre assurance décennale.",
          "Si votre devis est plus cher qu'un concurrent, la relance est le moment d'expliquer pourquoi, sans dénigrer personne : écran sous-toiture, remplacement des liteaux, zinguerie refaite plutôt que réparée.",
        ],
        template: {
          label: "Modèle de relance — réfection de toiture",
          subject: "Réfection de votre toiture — disponibilité au printemps",
          body: "Bonjour {client},\n\nJe reviens vers vous au sujet du devis de réfection de toiture envoyé le {date_envoi}.\n\nMon planning de printemps se remplit : si le projet vous convient, je peux vous réserver une période de chantier dès maintenant, sans engagement de date ferme avant la signature.\n\nJe peux aussi repasser pour vous montrer les tuiles proposées.\n\nBien cordialement,",
        },
      },
      {
        h2: "Expliquer les écarts de prix entre deux devis de toiture",
        paragraphs: [
          "Deux devis de réfection peuvent varier du simple au double pour la même maison. Les écarts viennent en général de la dépose complète ou non, du remplacement des liteaux et des contre-liteaux, de la pose d'un écran sous-toiture, de la zinguerie neuve ou réparée, de l'échafaudage et de l'évacuation des déchets. Lister ces postes dans votre relance aide le client à comparer à prestation égale, sans jamais critiquer un confrère.",
        ],
      },
      {
        h2: "Des relances automatiques adaptées aux longs délais de décision",
        paragraphs: [
          "Avec Artisan Relance, vous choisissez pour chaque devis l'intervalle entre les relances (3, 7, 14 ou 30 jours, ou un nombre de jours personnalisé), le nombre maximum de relances et une date de fin. Un devis de réfection complète peut ainsi recevoir trois relances espacées de deux semaines, pendant qu'un devis de réparation est relancé deux fois en une semaine.",
          "Les e-mails partent à votre nom, avec le devis en pièce jointe si vous le souhaitez, et le client vous répond directement. Vous suivez tout depuis votre téléphone, même sur le toit.",
        ],
        list: [
          "Intervalle et nombre de relances réglables devis par devis",
          "Pièce jointe renvoyée à chaque relance si vous le souhaitez",
          "Arrêt en un clic quand le client répond ou signe",
          "Gratuit pendant le lancement",
        ],
      },
      {
        h2: "Exemple de gain pour une entreprise de couverture",
        paragraphs: [
          "Exemple à adapter : 6 devis de réfection par mois d'un montant moyen de 12 000 €. Si les relances permettent de signer un chantier de plus par trimestre, c'est 48 000 € de chiffre d'affaires supplémentaire sur l'année. Sur des montants pareils, une seule signature récupérée suffit à justifier l'organisation.",
        ],
      },
    ],
    faq: [
      {
        q: "Quand relancer un devis de toiture après une tempête ?",
        a: "Rapidement : à J+3, en demandant si l'expert est passé, puis à J+10. Les sinistres se traitent dans l'urgence et le client choisit souvent l'entreprise qui l'aide dans ses démarches.",
      },
      {
        q: "Combien de relances pour un gros devis de couverture ?",
        a: "Trois relances espacées de deux à trois semaines, puis un appel. Ces projets se décident sur plusieurs semaines : relancer trop vite agace, relancer trop peu fait oublier.",
      },
      {
        q: "Faut-il joindre de nouveau le devis à chaque relance ?",
        a: "Pour un gros chantier, oui : le client retrouve le document sans fouiller sa boîte mail. Artisan Relance permet de joindre les pièces aux relances, devis par devis.",
      },
      {
        q: "Que faire si le client attend une aide à la rénovation ?",
        a: "Espacez les relances (toutes les trois semaines), demandez où en est le dossier et proposez de fournir les documents dont il a besoin. Une date de fin de campagne évite de relancer indéfiniment.",
      },
    ],
    related: [{ href: "/relance-devis/menuisier", label: "Relance de devis pour menuisier" }, ...commonRelated],
    date: DATE,
  },

  // ------------------------------------------------------------------ CHAUFFAGISTE
  {
    slug: "chauffagiste",
    metier: "chauffagiste",
    short: "Chauffagiste",
    title: "Relance de devis chauffagiste : PAC, chaudière, aides",
    description:
      "Chauffagistes : relancez vos devis de pompe à chaleur, chaudière ou climatisation pendant que le client monte son dossier d'aides. Modèles et outil gratuit.",
    h1: "Relance de devis pour chauffagiste : pompe à chaleur, chaudière, climatisation",
    answer:
      "Un chauffagiste doit relancer ses devis de pompe à chaleur ou de chaudière 5 à 7 jours après l'envoi, puis toutes les deux semaines tant que le client monte son dossier d'aides. Le remplacement d'une chaudière en panne, lui, se relance dès J+2 : le client a besoin de chauffage.",
    sections: [
      {
        h2: "Pourquoi les devis de chauffage prennent du temps",
        paragraphs: [
          "Un changement de mode de chauffage est une décision lourde : plusieurs milliers d'euros, des travaux dans la maison, et des aides financières qui peuvent changer fortement le reste à charge. Avant de signer, le client compare les solutions (pompe à chaleur air-eau, chaudière à granulés, poêle, chaudière gaz à condensation), lit des avis, demande conseil à ses proches et consulte parfois un accompagnateur rénovation.",
          "Les aides ajoutent une étape. Pour bénéficier des aides publiques à la rénovation énergétique, le client doit en général choisir une entreprise qualifiée RGE et déposer sa demande avant le début des travaux, avec un devis. Il peut donc garder votre devis plusieurs semaines sans le signer, simplement parce que son dossier est en cours d'instruction.",
          "Résultat : beaucoup de devis de chauffage « dorment ». Sans relance, le client qui obtient enfin son accord peut très bien signer avec l'installateur qui l'a appelé la veille.",
        ],
      },
      {
        h2: "Le calendrier de relance du chauffagiste",
        steps: [
          { title: "Panne de chaudière, remplacement urgent", text: "Relance à J+2, puis à J+5. Le client a froid ; la disponibilité prime." },
          { title: "Pompe à chaleur, granulés, rénovation du chauffage", text: "Relance à J+7, puis toutes les deux semaines jusqu'à quatre relances, en demandant où en est le dossier d'aides." },
          { title: "Climatisation", text: "Relance à J+4 et J+10. La demande est saisonnière : au début de l'été, les délais d'installation s'allongent et le client choisit vite." },
        ],
      },
      {
        h2: "Ce que doit contenir votre relance",
        paragraphs: [
          "Dans un devis de chauffage, le client cherche avant tout son reste à charge et ses économies futures. Votre relance peut proposer de l'aider : vérifier une pièce du dossier, préciser la puissance retenue, expliquer le niveau sonore de l'unité extérieure ou le fonctionnement du ballon.",
          "Restez prudent sur les chiffres : ne promettez pas un montant d'aide ou une économie que vous ne pouvez pas garantir. Mieux vaut renvoyer vers une simulation officielle et proposer votre aide pour les documents techniques.",
        ],
        template: {
          label: "Modèle de relance — pompe à chaleur",
          subject: "Votre projet de pompe à chaleur — où en est votre dossier ?",
          body: "Bonjour {client},\n\nJe reviens vers vous au sujet du devis de pompe à chaleur envoyé le {date_envoi}.\n\nOù en est votre demande d'aide ? Si l'organisme vous demande un document technique (fiche produit, attestation, détail des travaux), je vous l'envoie le jour même.\n\nPour information, je peux programmer l'installation dans les quatre semaines suivant votre accord.\n\nBien cordialement,",
        },
      },
      {
        h2: "Des relances qui suivent le rythme des dossiers d'aides",
        paragraphs: [
          "Artisan Relance vous permet de régler chaque devis selon son contexte. Un remplacement de chaudière en panne : relances tous les 3 jours, deux au maximum. Une pompe à chaleur avec dossier d'aides : relances tous les 14 jours, quatre au maximum, avec une date de fin. Les e-mails partent à votre nom, le client vous répond directement, et vous arrêtez les relances en un clic dès qu'il signe.",
          "Le tableau de bord vous montre les devis en attente et le montant correspondant : un bon indicateur pour anticiper votre planning d'installation.",
        ],
        list: [
          "Rythme de relance différent pour chaque devis",
          "Date de fin pour ne pas relancer indéfiniment un dossier bloqué",
          "Suivi du montant des devis en attente",
          "Gratuit pendant le lancement",
        ],
      },
      {
        h2: "Les questions qui reviennent avant la signature",
        paragraphs: [
          "Avant de signer un devis de pompe à chaleur, les clients posent presque toujours les mêmes questions : le bruit de l'unité extérieure pour les voisins, le maintien ou non des radiateurs existants, la place nécessaire pour le ballon, l'entretien annuel et la garantie. Préparez une réponse courte à chacune et placez-en une dans chaque relance : vos e-mails deviennent utiles au lieu d'être insistants.",
        ],
      },
      {
        h2: "Contrats d'entretien : une seconde occasion de relancer",
        paragraphs: [
          "L'entretien annuel de chaudière est une obligation pour la plupart des chaudières : c'est une occasion naturelle de reprendre contact avec vos clients. Lors de la visite, vous repérez une chaudière en fin de vie et remettez un devis de remplacement. Ce devis-là mérite la même discipline de relance qu'un devis de nouveau client, car le client vous connaît déjà et vous fait confiance.",
        ],
      },
    ],
    faq: [
      {
        q: "Pourquoi mes devis de pompe à chaleur ne sont-ils pas signés ?",
        a: "Souvent parce que le client attend la réponse à sa demande d'aide, compare plusieurs installateurs ou hésite sur le reste à charge. Une relance toutes les deux semaines qui propose de l'aider dans son dossier fait avancer la décision.",
      },
      {
        q: "Faut-il relancer un client qui attend son accord d'aide ?",
        a: "Oui, en espaçant les relances : toutes les deux à trois semaines. Demandez où en est le dossier plutôt que de pousser à signer.",
      },
      {
        q: "Combien de relances pour un devis de chaudière ?",
        a: "Deux relances rapprochées pour une panne (J+2 et J+5), trois à quatre relances espacées pour un projet de remplacement programmé.",
      },
      {
        q: "Puis-je relancer un devis remis lors d'un entretien ?",
        a: "Oui. Enregistrez simplement le devis dans Artisan Relance comme « déjà envoyé » : seules les relances partiront, aux dates choisies.",
      },
    ],
    related: [{ href: "/relance-devis/plombier", label: "Relance de devis pour plombier" }, ...commonRelated],
    date: DATE,
  },

  // ------------------------------------------------------------------ PEINTRE
  {
    slug: "peintre",
    metier: "peintre",
    short: "Peintre",
    title: "Relance de devis peintre en bâtiment : modèles et méthode",
    description:
      "Peintres en bâtiment : relancez vos devis de peinture intérieure, ravalement ou revêtement. Calendrier, modèles de mail et relances automatiques gratuites.",
    h1: "Relance de devis pour peintre en bâtiment : intérieur, ravalement, revêtements",
    answer:
      "Un peintre en bâtiment doit relancer ses devis 3 à 5 jours après l'envoi : en peinture, le client compare surtout les prix et choisit vite. Une deuxième relance une semaine plus tard, avec une date de disponibilité, suffit souvent à faire signer.",
    sections: [
      {
        h2: "Un métier où le client compare beaucoup",
        paragraphs: [
          "La peinture est l'un des travaux pour lesquels les particuliers demandent le plus de devis. Le client pense comprendre ce qu'il achète (« repeindre trois pièces »), et compare donc surtout le prix total. Or deux devis de peinture peuvent couvrir des prestations très différentes : nombre de couches, préparation des supports, rebouchage, protection des sols, gamme de peinture.",
          "La relance est votre occasion d'expliquer cette différence. Un client qui comprend que votre devis comprend le lessivage, la sous-couche et deux couches d'une peinture lessivable n'a plus le même regard sur l'écart de prix avec un concurrent moins détaillé.",
          "Autre particularité : les projets de peinture sont souvent liés à un événement. Un déménagement, une mise en location, une naissance, une vente. La date compte autant que le prix. Proposer un créneau précis dans la relance est un argument fort.",
        ],
      },
      {
        h2: "Le bon rythme de relance pour un peintre",
        steps: [
          { title: "Peinture intérieure, petite surface", text: "Relance à J+3, puis à J+7 avec un créneau de disponibilité. La décision se prend en une à deux semaines." },
          { title: "Ravalement de façade, copropriété", text: "Relance à J+7, puis toutes les deux semaines. Ajoutez le syndic ou le conseil syndical en destinataires ; la décision suit souvent une assemblée générale." },
          { title: "Revêtements muraux, décoration", text: "Relance à J+5 et J+12, en proposant d'apporter des échantillons ou un nuancier." },
        ],
      },
      {
        h2: "Des relances qui valorisent votre travail",
        paragraphs: [
          "Utilisez chaque relance pour apporter un élément nouveau : la marque de peinture et sa classe d'émission, le temps de séchage entre deux couches, la protection des meubles, la propreté du chantier. Ces détails rassurent un client qui craint les traces et les retards.",
          "Pour un logement à louer ou à vendre, rappelez qu'un délai court est possible. Pour un ravalement, rappelez la durée de validité du devis et la nécessité éventuelle d'une déclaration préalable en mairie.",
        ],
        template: {
          label: "Modèle de relance — peinture intérieure",
          subject: "Peinture de votre séjour — créneau disponible",
          body: "Bonjour {client},\n\nJe reviens vers vous au sujet du devis de peinture envoyé le {date_envoi}.\n\nJe vous précise qu'il comprend la préparation complète des murs (rebouchage, ponçage, sous-couche) et deux couches d'une peinture lessivable : un point qui fait souvent la différence entre deux devis.\n\nJ'ai un créneau la semaine du 12 : je peux vous le réserver si vous le souhaitez.\n\nBonne journée,",
        },
      },
      {
        h2: "Automatiser les relances de vos devis de peinture",
        paragraphs: [
          "Artisan Relance envoie votre devis PDF au client, puis programme les relances automatiquement : vous choisissez le rythme et le nombre de relances, devis par devis. Les messages partent à votre nom et vos clients vous répondent directement. Vous n'avez plus à noter sur un carnet qui relancer ni quand.",
          "Dès qu'un client signe, un clic sur « Gagné » arrête les relances et le montant s'ajoute à votre chiffre signé dans le tableau de bord.",
        ],
        list: [
          "Relances rapides adaptées aux petits chantiers",
          "Plusieurs destinataires pour les copropriétés",
          "Suivi du taux de signature de vos devis",
          "Gratuit pendant le lancement, sans carte bancaire",
        ],
      },
      {
        h2: "Les erreurs qui font perdre un devis de peinture",
        list: [
          "Un devis au mètre carré sans détail de la préparation : le client ne voit pas ce qui justifie votre prix.",
          "Aucune date de disponibilité : le client qui doit emménager choisit l'entreprise qui s'engage sur un créneau.",
          "Une seule relance, trois semaines plus tard : le chantier est souvent déjà attribué.",
          "Une relance qui ne fait que demander « avez-vous pris une décision ? » sans apporter d'information nouvelle.",
          "Oublier le second décideur : dans un couple ou une copropriété, ajoutez toutes les personnes concernées en destinataires.",
        ],
        paragraphs: [
          "Corriger ces cinq points ne demande pas de temps supplémentaire une fois la méthode en place : un devis détaillé, une date proposée et deux relances programmées dès l'envoi.",
        ],
      },
      {
        h2: "Exemple chiffré",
        paragraphs: [
          "Exemple à adapter : 15 devis de peinture par mois, montant moyen 2 200 €. Un devis signé en plus chaque mois grâce aux relances représente 26 400 € de chiffre d'affaires sur l'année. Les petits montants se compensent par le volume : c'est justement parce que vous faites beaucoup de devis que le suivi manuel devient impossible.",
        ],
      },
    ],
    faq: [
      {
        q: "Quand relancer un devis de peinture ?",
        a: "À J+3 puis à J+7. Les clients comparent vite en peinture : une relance rapide avec un créneau de disponibilité fait souvent la différence.",
      },
      {
        q: "Comment justifier un devis de peinture plus cher qu'un concurrent ?",
        a: "Détaillez la préparation des supports, le nombre de couches et la gamme de peinture dans la relance. Le client compare souvent des prestations différentes sans le savoir.",
      },
      {
        q: "Comment relancer un devis de ravalement en copropriété ?",
        a: "Ajoutez le syndic et un membre du conseil syndical en destinataires, espacez les relances de deux semaines et rappelez la date de validité du devis avant l'assemblée générale.",
      },
      {
        q: "Combien de relances pour un petit devis ?",
        a: "Deux relances suffisent en général. Au-delà, un appel téléphonique est plus efficace.",
      },
    ],
    related: [{ href: "/relance-devis/menuisier", label: "Relance de devis pour menuisier" }, ...commonRelated],
    date: DATE,
  },

  // ------------------------------------------------------------------ MENUISIER
  {
    slug: "menuisier",
    metier: "menuisier",
    short: "Menuisier",
    title: "Relance de devis menuisier : fenêtres, portes, agencement",
    description:
      "Menuisiers : relancez vos devis de fenêtres, portes, escaliers ou agencement sur mesure en tenant compte des délais de fabrication. Modèles et outil gratuit.",
    h1: "Relance de devis pour menuisier : fenêtres, portes et agencement sur mesure",
    answer:
      "Un menuisier doit relancer ses devis 5 à 7 jours après l'envoi, puis une à deux fois toutes les deux semaines, en rappelant le délai de fabrication. Le client qui comprend qu'une commande tardive repousse la pose de plusieurs semaines se décide plus vite.",
    sections: [
      {
        h2: "Le devis de menuiserie, entre sur-mesure et délais de fabrication",
        paragraphs: [
          "Remplacement de fenêtres, porte d'entrée, escalier, placards, cuisine ou dressing sur mesure : la menuiserie combine des montants élevés et des choix très personnels (matériau, couleur, vitrage, quincaillerie). Le client a besoin de temps pour se projeter, et il revient souvent avec des questions ou des modifications.",
          "La fabrication ajoute une contrainte que le client oublie : entre la signature et la pose, il faut prévoir le métré définitif, la commande ou la fabrication en atelier, puis la livraison. Chaque semaine de réflexion repousse la pose d'autant. Rappeler ce délai dans votre relance est un argument honnête et efficace.",
          "Les menuiseries extérieures peuvent aussi relever des aides à la rénovation énergétique sous conditions, ce qui rallonge la décision du client pendant qu'il vérifie son éligibilité.",
        ],
      },
      {
        h2: "Le calendrier de relance du menuisier",
        steps: [
          { title: "Remplacement de fenêtres ou porte d'entrée", text: "Relance à J+5, puis à J+15 en rappelant le délai de fabrication et de pose, puis un message de clôture vers J+30." },
          { title: "Agencement sur mesure (cuisine, dressing, escalier)", text: "Relance à J+7, en proposant un rendez-vous pour ajuster le projet, puis à J+21." },
          { title: "Petite intervention (réglage, réparation, porte intérieure)", text: "Relance à J+3 et J+7." },
        ],
      },
      {
        h2: "Faire avancer un projet sur mesure",
        paragraphs: [
          "Un devis d'agencement reste souvent bloqué sur un détail : une couleur, une poignée, la hauteur d'une étagère. Votre relance peut proposer de lever ce blocage : « Souhaitez-vous que je modifie la finition ou que je vous apporte des échantillons ? ». Le client se sent écouté et le projet avance.",
          "Pour les fenêtres, mettez en avant ce que le client gagne : confort thermique et acoustique, sécurité, entretien réduit. Évitez les promesses chiffrées d'économies d'énergie que vous ne pouvez pas garantir.",
        ],
        template: {
          label: "Modèle de relance — remplacement de fenêtres",
          subject: "Vos nouvelles fenêtres — délai de fabrication",
          body: "Bonjour {client},\n\nJe reviens vers vous concernant le devis de remplacement de fenêtres envoyé le {date_envoi}.\n\nPour information, il faut compter environ six semaines entre la validation du métré et la pose. Une décision avant la fin du mois permettrait une pose avant les premiers froids.\n\nSi vous souhaitez modifier la couleur ou le vitrage, je vous envoie un devis ajusté dans la journée.\n\nCordialement,",
        },
      },
      {
        h2: "Des relances automatiques pour vos devis de menuiserie",
        paragraphs: [
          "Artisan Relance envoie votre devis et vos relances par e-mail, à votre nom, selon le rythme que vous choisissez pour chaque devis. Vous pouvez joindre plusieurs fichiers : le devis, des plans, une fiche technique ou une photo de réalisation. Votre client répond directement à votre adresse.",
          "Le tableau de bord vous donne la liste des devis en attente, des prochaines relances et de vos devis gagnés : utile pour planifier l'atelier et les commandes fournisseurs.",
        ],
        list: [
          "Jusqu'à 5 pièces jointes par devis (PDF, images, plans)",
          "Rythme et nombre de relances réglables devis par devis",
          "Arrêt des relances en un clic à la signature",
          "Gratuit pendant le lancement",
        ],
      },
      {
        h2: "Rassurer sur la pose et les finitions",
        paragraphs: [
          "Pour un client, la peur principale en menuiserie n'est pas le produit, c'est la pose : fenêtres mal calfeutrées, raccords d'enduit à reprendre, porte qui frotte, plan de travail mal ajusté. Une relance qui explique votre méthode de pose (dépose totale ou en rénovation, traitement des tableaux, réglages après quelques semaines) répond à cette inquiétude mieux qu'une remise de prix.",
          "Joindre deux photos d'un chantier similaire, avec l'accord de votre client précédent, est souvent plus convaincant qu'un long texte. Si vous assurez un passage de réglage après la pose, dites-le : c'est un argument que beaucoup de concurrents oublient de mettre en avant.",
        ],
      },
      {
        h2: "Exemple de gain pour un menuisier",
        paragraphs: [
          "Exemple à adapter : 8 devis par mois d'un montant moyen de 6 500 €. Si les relances vous font signer un devis de plus tous les deux mois, ce sont 6 chantiers et 39 000 € de chiffre d'affaires supplémentaire sur l'année.",
        ],
      },
    ],
    faq: [
      {
        q: "Quand relancer un devis de fenêtres ?",
        a: "À J+5, puis à J+15 en rappelant le délai de fabrication. Le client se décide plus vite quand il comprend qu'un retard de commande repousse la pose.",
      },
      {
        q: "Comment relancer un devis de cuisine ou de dressing sur mesure ?",
        a: "Proposez un rendez-vous pour ajuster le projet plutôt que de demander une décision. Les devis d'agencement se bloquent souvent sur un détail que vous pouvez régler.",
      },
      {
        q: "Puis-je envoyer des plans avec le devis ?",
        a: "Oui. Artisan Relance accepte jusqu'à 5 fichiers par devis (PDF, JPG, PNG, DOCX, XLSX), 10 Mo par fichier.",
      },
      {
        q: "Que faire quand le client attend une aide pour ses fenêtres ?",
        a: "Espacez les relances toutes les deux à trois semaines, demandez où en est son dossier et rappelez la durée de validité de votre devis.",
      },
    ],
    related: [{ href: "/relance-devis/couvreur", label: "Relance de devis pour couvreur" }, ...commonRelated],
    date: DATE,
  },
];

export function getMetier(slug: string) {
  return METIERS.find((m) => m.slug === slug);
}
