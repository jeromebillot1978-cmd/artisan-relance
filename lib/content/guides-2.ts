import type { ContentPage } from "./types";
import { geoAnswers } from "./geo";

const DATE = "2026-11-18";

/**
 * Guides publiés le 18 novembre 2026 (priorité 5). Chaque guide répond à une intention
 * de recherche distincte des guides existants : pas de doublon de sujet.
 */
export const GUIDES_2: (ContentPage & { short: string })[] = [
  // ------------------------------------------------------------------ SANS HARCELER
  {
    slug: "relancer-devis-sans-harceler",
    short: "Relancer sans harceler",
    title: "Comment relancer un devis sans harceler le client",
    description:
      "Relancer un devis sans être lourd : les 7 règles qui rendent une relance utile, les phrases à éviter, le bon rythme et des exemples de messages pour artisans.",
    h1: "Comment relancer un devis sans harceler le client",
    answer:
      "Une relance n'est pas du harcèlement quand elle est espacée, utile et limitée dans le temps. Concrètement : au moins une semaine entre deux messages, une information nouvelle à chaque relance, trois relances au maximum, jamais le soir ni le dimanche, et un arrêt immédiat dès que le client répond ou demande d'arrêter.",
    sections: [
      {
        h2: "La peur de déranger : le vrai frein à la relance",
        paragraphs: [
          "La plupart des artisans ne relancent pas leurs devis pour une raison simple : ils ont peur de passer pour un vendeur insistant. Vous êtes venu, vous avez mesuré, vous avez chiffré ; rappeler le client donne l'impression de quémander un chantier. Alors on attend que le client revienne de lui-même. Il ne revient presque jamais, même quand il était intéressé.",
          "Du côté du client, la situation est très différente. Il a reçu plusieurs devis, il les a posés quelque part, il manque de temps pour les comparer et il se pose une ou deux questions qu'il n'a pas osé vous poser. Une relance bien faite ne le dérange pas : elle l'aide à avancer. Ce qui dérange, c'est la relance qui n'apporte rien, qui revient trop souvent ou qui culpabilise.",
          "La différence entre suivi professionnel et harcèlement ne tient donc pas au fait de relancer, mais à la manière : le rythme, le ton, le contenu et le moment où l'on s'arrête.",
        ],
      },
      {
        h2: "Les 7 règles d'une relance qui ne dérange pas",
        steps: [
          { title: "1. Espacer les messages", text: "Laissez au moins 4 jours, idéalement une semaine, entre deux relances. Allongez l'intervalle au fil du temps : J+5, puis J+12, puis J+26 par exemple." },
          { title: "2. Apporter une information nouvelle à chaque fois", text: "Une date de démarrage possible, une variante, une précision technique, un document utile. Un message qui ne contient que « Avez-vous pris une décision ? » est perçu comme de la pression." },
          { title: "3. Limiter le nombre de relances", text: "Trois relances suffisent pour la plupart des devis : une vérification, une relance utile et un message de clôture. Fixez ce nombre à l'avance." },
          { title: "4. Choisir les bons horaires", text: "En semaine ou le samedi, en journée. Jamais tard le soir ni le dimanche, qui donnent une image de précipitation." },
          { title: "5. Utiliser un seul canal à la fois", text: "Un e-mail, puis éventuellement un appel quelques jours plus tard. Jamais un e-mail, un SMS et un appel le même jour." },
          { title: "6. Garder un ton neutre et bienveillant", text: "Pas de reproche sur le silence, pas d'urgence artificielle, pas de fausse promotion. Le client doit pouvoir répondre « pas maintenant » sans se sentir coupable." },
          { title: "7. S'arrêter dès que le client répond", text: "Une réponse, même « je réfléchis encore », met fin à la séquence automatique. Une demande d'arrêt (« STOP », « merci de ne plus me relancer ») est définitive." },
        ],
      },
      {
        h2: "Les phrases qui donnent une impression de harcèlement",
        paragraphs: [
          "Certaines formules, pourtant courantes, transforment une relance polie en pression. Elles mettent le client en faute ou le poussent à décider avant d'être prêt :",
        ],
        list: [
          "« Sans réponse de votre part depuis trois semaines… » : le client lit un reproche.",
          "« Je me permets de vous relancer pour la troisième fois » : vous comptez, il se sent surveillé.",
          "« Offre valable jusqu'à vendredi seulement » si ce n'est pas vrai : la fausse urgence se devine et abîme la confiance.",
          "« J'ai besoin d'une réponse rapidement » : votre planning est votre contrainte, pas la sienne.",
          "« Avez-vous reçu mon devis ? » répété à chaque message : la question n'apporte rien et appelle un simple oui.",
        ],
      },
      {
        h2: "Ce qu'il faut écrire à la place",
        paragraphs: [
          "Une bonne relance part du point de vue du client. Elle rappelle le projet, propose une aide concrète et se termine par une question facile. Comparez :",
        ],
        list: [
          "Au lieu de « Avez-vous pris une décision ? » : « Si un poste du devis vous semble flou, je vous l'explique en deux minutes au téléphone. »",
          "Au lieu de « Sans nouvelles de votre part » : « Je reviens vers vous au sujet de votre projet de salle de bain. »",
          "Au lieu de « Il faut vous décider vite » : « À ce jour, je peux démarrer le chantier dans trois semaines. »",
          "Au lieu de « Dernière relance » : « Je classe le dossier, sauf si vous souhaitez en reparler : une réponse en une ligne me suffit. »",
        ],
        template: {
          label: "Relance utile, sans pression",
          subject: "Votre projet — une information pour vous aider à décider",
          body: "Bonjour {client},\n\nJe reviens vers vous au sujet du devis{reference} envoyé le {date_envoi}.\n\nPour vous aider à vous organiser : à ce jour, je pourrais démarrer le chantier dans trois semaines, pour une durée d'environ quatre jours. Si un poste vous pose question, je vous l'explique volontiers.\n\nBonne journée,",
        },
      },
      {
        h2: "Le rythme qui reste toujours acceptable",
        paragraphs: [
          "Pour un devis de quelques milliers d'euros, la séquence suivante est perçue comme du sérieux, jamais comme de l'insistance : une première relance entre J+3 et J+7 pour vérifier que le devis est bien arrivé, une deuxième une semaine plus tard avec une information utile, puis un message de clôture vers J+21 à J+30. Pour les gros chantiers financés par un prêt ou une aide, espacez de deux à trois semaines et ajoutez au plus une relance.",
          "Si le client vous a dit qu'il réfléchissait, convenez d'une date avec lui (« je vous recontacte dans quinze jours ? ») et tenez-la. Une relance annoncée et acceptée n'est jamais intrusive.",
        ],
      },
      {
        h2: "Le message de clôture : la relance la plus respectueuse",
        paragraphs: [
          "Le dernier message est souvent celui qui obtient le plus de réponses, parce qu'il libère le client. Il n'a plus à expliquer son silence : il lui suffit de répondre « le projet est reporté » ou « nous avons choisi une autre entreprise ». Vous classez le dossier proprement, sans rancune, et vous gardez une bonne image pour la prochaine fois.",
          "Ce message ne doit jamais ressembler à un ultimatum. Il constate, il remercie et il laisse la porte ouverte en rappelant que le devis reste valable jusqu'à sa date d'échéance.",
        ],
      },
      {
        h2: "Le cadre légal : relancer un client qui a demandé un devis",
        paragraphs: [
          "Relancer par e-mail un particulier qui vous a lui-même demandé un devis est une démarche normale : vous donnez suite à sa demande. Restez dans ce cadre : parlez du devis et du projet, pas de vos autres prestations, limitez le nombre de messages et arrêtez dès que la personne le demande. C'est à la fois une question de respect et de protection des données personnelles.",
          "Artisan Relance applique ces règles automatiquement : chaque e-mail permet de répondre « STOP », un client qui le fait n'est plus jamais relancé, et les réponses automatiques d'absence ne sont pas confondues avec une vraie réponse.",
        ],
      },
      {
        h2: "Automatiser sans perdre la politesse",
        paragraphs: [
          "Automatiser une relance ne la rend pas impersonnelle si le message est bien écrit. Avec Artisan Relance, vous rédigez vos relances une fois, avec votre ton et votre signature. Les variables ({client}, {date_envoi}, {reference}, {montant}) personnalisent chaque envoi, les e-mails partent à votre nom du lundi au samedi entre 8 h et 19 h, et la séquence s'arrête dès que le client répond. Vous fixez le nombre maximum de relances et une date de fin : impossible de relancer trop, impossible d'oublier.",
        ],
      },
    ],
    quick: geoAnswers({
      software: "Les relances partent du lundi au samedi en journée et s'arrêtent à la première réponse, ce qui évite toute insistance.",
      automate: "Pour ne jamais harceler, fixez dès le départ un maximum de trois relances et une date de fin.",
      rate: "Une relance utile et espacée rapporte plus qu'une relance fréquente : c'est le contenu qui fait répondre, pas la répétition.",
    }),
    faq: [
      { q: "Relancer un devis, est-ce du harcèlement ?", a: "Non, tant que la relance est espacée, utile et limitée : trois messages sur trois à quatre semaines restent un suivi professionnel. L'insistance commence quand les messages se répètent sans rien apporter ou continuent après une demande d'arrêt." },
      { q: "Combien de jours entre deux relances pour ne pas déranger ?", a: "Au moins 4 jours, idéalement une semaine, en allongeant l'intervalle au fil des relances." },
      { q: "Comment relancer un devis poliment par e-mail ?", a: "Rappelez le projet et la date du devis, proposez une aide concrète (explication, date, variante) et terminez par une question simple. Évitez tout reproche sur le silence du client." },
      { q: "Que faire si le client demande d'arrêter les relances ?", a: "Arrêtez immédiatement et définitivement. Avec Artisan Relance, une réponse « STOP » bloque automatiquement toute nouvelle relance vers ce client." },
    ],
    related: [
      { href: "/guides/combien-de-relances-devis", label: "Combien de relances envoyer ?" },
      { href: "/guides/exemple-sms-relance-devis", label: "Exemples de SMS de relance" },
      { href: "/guides/modele-mail-relance-devis", label: "Exemples de mail de relance" },
      { href: "/guides/pourquoi-devis-pas-signe", label: "Pourquoi un devis n'est pas signé" },
    ],
    date: DATE,
  },

  // ------------------------------------------------------------------ SMS
  {
    slug: "exemple-sms-relance-devis",
    short: "Exemples de SMS de relance",
    title: "Exemple de SMS de relance de devis : 12 messages à copier",
    description:
      "12 exemples de SMS pour relancer un devis : après le rendez-vous, après l'e-mail, disponibilité, clôture. Règles d'envoi, horaires et WhatsApp pour artisans.",
    h1: "Exemple de SMS de relance de devis : 12 messages courts pour artisans",
    answer:
      "Un SMS de relance efficace tient en moins de 300 caractères : votre prénom et votre entreprise, le projet concerné, une information ou une question simple, et rien d'autre. Utilisez-le en complément de l'e-mail, en journée et en semaine, une ou deux fois au maximum par devis.",
    sections: [
      {
        h2: "Quand le SMS est le bon canal",
        paragraphs: [
          "Le SMS est lu presque immédiatement, ce qui en fait un outil puissant mais aussi plus intrusif qu'un e-mail. Il arrive sur le téléphone personnel du client, au milieu de ses messages familiaux. Il faut donc l'utiliser avec mesure, pour des usages précis :",
        ],
        list: [
          "Prévenir que le devis vient d'être envoyé par e-mail, pour qu'il ne passe pas inaperçu.",
          "Signaler une disponibilité concrète dans votre planning.",
          "Relancer un client qui vous a lui-même contacté par téléphone ou par SMS.",
          "Envoyer un message court après deux e-mails restés sans réponse.",
          "Confirmer un rendez-vous de visite ou de signature.",
        ],
      },
      {
        h2: "Les règles d'un bon SMS de relance",
        list: [
          "Présentez-vous dès le début : le client n'a pas forcément enregistré votre numéro.",
          "Citez le projet (« votre salle de bain », « votre toiture ») plutôt qu'un numéro de devis.",
          "Une seule idée par message : une question ou une information, pas les deux.",
          "Pas d'abréviations ni d'émojis : vous écrivez à un client, pas à un ami.",
          "Envoyez en semaine ou le samedi entre 9 h et 19 h, jamais le dimanche ni le soir tard.",
          "Deux SMS au maximum par devis : le reste passe par l'e-mail ou un appel.",
        ],
      },
      {
        h2: "SMS juste après le rendez-vous ou l'envoi du devis",
        list: [
          "« Bonjour Madame Martin, c'est Paul de Martin Plomberie. Je vous ai envoyé le devis de votre salle de bain par e-mail. Pensez à vérifier vos courriers indésirables. Bonne journée. »",
          "« Bonjour, Paul de Martin Plomberie. Merci pour votre accueil ce matin. Le devis pour le remplacement du chauffe-eau part ce soir par e-mail. »",
          "« Bonjour Monsieur Petit, c'est Karim, électricien. Votre devis de mise en sécurité est dans votre boîte e-mail. Je reste disponible pour toute question. »",
        ],
      },
      {
        h2: "SMS de relance après quelques jours",
        list: [
          "« Bonjour Madame Martin, Paul de Martin Plomberie. Avez-vous pu regarder le devis de votre salle de bain ? Je peux vous l'expliquer en deux minutes au téléphone. »",
          "« Bonjour, c'est Julie, peintre. Une question sur le devis de votre séjour ? Je vous réponds volontiers par message ou par téléphone. »",
          "« Bonjour Monsieur Leroy, Thomas de TL Couverture. Je n'ai pas eu de retour sur le devis de votre toiture : souhaitez-vous que je passe vous l'expliquer ? »",
        ],
      },
      {
        h2: "SMS avec une disponibilité",
        paragraphs: [
          "Proposer une date transforme la relance en information utile. C'est souvent le SMS qui obtient le plus de réponses, parce qu'il appelle une décision simple : oui ou non pour ce créneau.",
        ],
        list: [
          "« Bonjour Madame Martin, une place s'est libérée dans mon planning à partir du 12 pour votre salle de bain. Voulez-vous que je la réserve ? Paul, Martin Plomberie. »",
          "« Bonjour, Thomas de TL Couverture. Je serai dans votre quartier la semaine prochaine : je peux démarrer votre toiture le 18 si le devis vous convient. »",
          "« Bonjour Monsieur Petit, Karim, électricien. Je peux intervenir pour votre tableau électrique sous dix jours. Souhaitez-vous bloquer une date ? »",
        ],
      },
      {
        h2: "SMS de clôture",
        paragraphs: [
          "Le dernier SMS clôt le dossier sans reproche. Il obtient souvent une réponse, même pour dire non, ce qui vous permet de mettre votre planning à jour.",
        ],
        list: [
          "« Bonjour Madame Martin, je classe votre dossier salle de bain sauf avis contraire. Le devis reste valable jusqu'à fin mars. Bonne continuation, Paul. »",
          "« Bonjour, sans nouvelles, je suppose que le projet est reporté. Un simple message suffira pour le reprendre. Bonne journée, Julie, peintre. »",
          "« Bonjour Monsieur Leroy, je clôture le dossier toiture. N'hésitez pas à me recontacter si le projet revient. Thomas, TL Couverture. »",
        ],
      },
      {
        h2: "Et WhatsApp ?",
        paragraphs: [
          "Beaucoup d'artisans échangent déjà avec leurs clients sur WhatsApp, pour envoyer des photos ou caler un rendez-vous. Si le client a lui-même ouvert la conversation sur WhatsApp, vous pouvez y relancer son devis, avec les mêmes règles que pour un SMS : message court, en journée, une ou deux fois au maximum. S'il ne vous a jamais écrit sur WhatsApp, restez sur l'e-mail ou le SMS.",
          "Dans tous les cas, gardez le devis lui-même sur l'e-mail : c'est là que le client le retrouvera, qu'il pourra le transférer à son conjoint ou à sa banque, et que vous garderez une trace datée de l'envoi et des relances.",
        ],
      },
      {
        h2: "Combiner e-mail et SMS sans en faire trop",
        steps: [
          { title: "Jour de l'envoi : e-mail avec le devis, éventuellement un SMS de prévenance", text: "Le SMS évite que l'e-mail se perde dans la boîte de réception." },
          { title: "J+5 à J+7 : relance par e-mail", text: "Courte, avec une proposition d'aide." },
          { title: "J+12 à J+14 : relance par e-mail avec une information utile", text: "Date de démarrage, variante, précision technique." },
          { title: "J+15 à J+20 : un SMS ou un appel", text: "Seulement si le dossier compte et reste sans réponse." },
          { title: "J+21 à J+30 : message de clôture", text: "Par e-mail, éventuellement doublé d'un SMS court." },
        ],
        paragraphs: [
          "Artisan Relance s'occupe de la partie e-mail : envoi du devis, relances programmées et arrêt automatique quand le client répond. Il n'envoie pas de SMS : les modèles de cette page sont à envoyer depuis votre téléphone, au moment où le tableau de bord vous montre qu'un devis important reste sans réponse.",
        ],
      },
    ],
    quick: geoAnswers({
      software: "Il relance par e-mail uniquement ; les SMS restent à envoyer depuis le téléphone de l'artisan, aux moments clés.",
      automate: "Automatisez la partie e-mail et gardez le SMS ou l'appel pour les devis importants restés sans réponse.",
      rate: "Un SMS de disponibilité (« une place s'est libérée le 12 ») est souvent le message qui fait répondre un client hésitant.",
    }),
    faq: [
      { q: "Peut-on relancer un devis par SMS ?", a: "Oui, en complément de l'e-mail : un ou deux SMS courts par devis, en journée, en vous présentant et en citant le projet." },
      { q: "Que dire dans un SMS de relance de devis ?", a: "Votre prénom et votre entreprise, le projet concerné, puis une seule chose : une question simple ou une disponibilité concrète." },
      { q: "À quelle heure envoyer un SMS de relance ?", a: "En semaine ou le samedi, entre 9 h et 19 h. Jamais le dimanche ni le soir tard." },
      { q: "Artisan Relance envoie-t-il des SMS ?", a: "Non. Artisan Relance envoie le devis et les relances par e-mail ; les SMS se font depuis votre téléphone avec les modèles de cette page." },
    ],
    related: [
      { href: "/guides/relance-devis-email-ou-telephone", label: "E-mail, téléphone ou SMS ?" },
      { href: "/guides/modele-mail-relance-devis", label: "Exemples de mail de relance" },
      { href: "/guides/relancer-devis-sans-harceler", label: "Relancer sans harceler" },
      { href: "/relance-devis/couvreur", label: "Relance de devis pour couvreur" },
    ],
    date: DATE,
  },

  // ------------------------------------------------------------------ POURQUOI PAS SIGNÉ
  {
    slug: "pourquoi-devis-pas-signe",
    short: "Pourquoi un devis n'est pas signé",
    title: "Pourquoi un devis n'est pas signé : 10 causes et solutions",
    description:
      "Devis sans réponse ou refusé ? Les 10 causes les plus fréquentes chez les artisans (prix, délai, relance, présentation) et comment corriger chacune.",
    h1: "Pourquoi un devis n'est pas signé : les 10 causes les plus fréquentes",
    answer:
      "Un devis n'est pas signé le plus souvent parce qu'il n'a pas été relancé, qu'il est arrivé trop tard, que le prix n'est pas expliqué ou que le client compare plusieurs offres sans savoir les départager. Le prix n'est qu'une cause parmi d'autres : avant de baisser vos tarifs, vérifiez le délai d'envoi, la clarté du devis et le suivi.",
    sections: [
      {
        h2: "Un devis sans réponse n'est pas forcément un devis refusé",
        paragraphs: [
          "Quand un devis reste sans nouvelles, on pense spontanément au prix. C'est rarement la seule raison. Un client qui ne signe pas peut être en train de comparer, d'attendre un financement, d'hésiter sur un détail technique ou tout simplement d'avoir oublié. Comprendre la vraie cause change complètement la façon de réagir : on ne relance pas de la même manière un client qui trouve le devis trop cher et un client qui attend l'accord de sa banque.",
          "Voici les dix causes que l'on retrouve le plus souvent chez les artisans du bâtiment, avec, pour chacune, ce qui permet de la corriger.",
        ],
      },
      {
        h2: "Les causes liées au suivi",
        steps: [
          { title: "1. Le devis n'a jamais été relancé", text: "C'est la cause la plus fréquente et la plus facile à corriger. Le client signe souvent avec l'entreprise qui l'a recontacté en premier. Solution : programmer deux ou trois relances dès l'envoi du devis." },
          { title: "2. Le devis est arrivé trop tard", text: "Un devis envoyé trois semaines après la visite arrive quand le client a déjà choisi. Solution : envoyer le devis dans les 48 heures, quitte à préciser certains postes ensuite." },
          { title: "3. Le devis s'est perdu", text: "Courrier indésirable, boîte e-mail saturée, adresse mal recopiée. Solution : prévenir par SMS que le devis est parti et vérifier l'adresse au rendez-vous." },
        ],
      },
      {
        h2: "Les causes liées au devis lui-même",
        steps: [
          { title: "4. Le prix n'est pas expliqué", text: "Un total sans détail paraît toujours cher. Solution : détailler les postes, préciser les marques et les quantités, expliquer ce qui distingue votre prestation (préparation, finitions, garantie)." },
          { title: "5. Le devis est difficile à comparer", text: "Le client a trois devis présentés différemment et ne sait pas lequel est le plus complet. Solution : résumer en tête du devis ce qui est inclus et ce qui ne l'est pas." },
          { title: "6. Aucune date de démarrage ni de validité", text: "Sans date, rien ne pousse le client à décider maintenant. Solution : indiquer une date de démarrage possible et une durée de validité du devis." },
          { title: "7. Un poste inquiète le client", text: "Un terme technique, une option qu'il ne comprend pas, une quantité qui l'étonne. Il n'ose pas toujours poser la question. Solution : proposer, dans la relance, d'expliquer le devis en quelques minutes." },
        ],
      },
      {
        h2: "Les causes liées au client",
        steps: [
          { title: "8. Le budget ou le financement n'est pas bouclé", text: "Prêt travaux, aide à la rénovation, déblocage d'épargne. Solution : demander où en est le dossier plutôt que la signature, et proposer un phasage des travaux." },
          { title: "9. Le projet est reporté", text: "Naissance, mutation, autre priorité. Solution : un message de clôture qui laisse la porte ouverte, et une note dans votre suivi pour recontacter le client plus tard." },
          { title: "10. Le client a choisi un concurrent", text: "Pour le prix, le délai ou la confiance. Solution : le remercier et lui demander, en une phrase, ce qui a fait la différence. Ces réponses vous apprennent beaucoup." },
        ],
      },
      {
        h2: "Le cas du client qui trouve le devis trop cher",
        paragraphs: [
          "Quand le prix bloque, la pire réponse est la remise spontanée : elle laisse penser que votre premier prix était gonflé et dévalorise votre travail. Commencez par comprendre ce que le client compare. Souvent, l'autre devis ne comprend pas la même chose : pas de dépose, pas d'évacuation des gravats, un matériel d'entrée de gamme, une garantie différente.",
          "Expliquez ensuite ce qui justifie votre prix, sans critiquer le concurrent. Puis, si le budget est vraiment le problème, proposez une variante plutôt qu'une baisse : réaliser les travaux en deux temps, choisir un autre matériau, laisser au client une partie simple (peinture de finition, débarras). Le client garde la qualité de votre pose, et vous gardez votre marge.",
        ],
      },
      {
        h2: "Comment savoir quelle cause s'applique à vous",
        paragraphs: [
          "Pendant deux ou trois mois, notez pour chaque devis non signé la raison connue : pas de réponse, prix, délai, projet reporté, concurrent. Si la majorité de vos devis perdus sont « sans réponse », votre problème n'est pas le prix mais le suivi. Si les clients répondent souvent « trop cher », regardez la présentation de vos devis avant vos tarifs. Si c'est le délai, c'est votre planning ou votre réactivité d'envoi qu'il faut revoir.",
          "Artisan Relance vous aide à faire ce tri sans tableau à tenir : chaque devis est classé « En cours », « Répondu », « Gagné » ou « Perdu », et le tableau de bord affiche votre taux de réponse et votre taux de signature d'un mois sur l'autre.",
        ],
      },
      {
        h2: "La correction la plus rentable : relancer chaque devis",
        paragraphs: [
          "Parmi ces dix causes, trois disparaissent presque entièrement avec un suivi régulier : le devis jamais relancé, le devis perdu dans la boîte e-mail et le poste qui inquiète sans que le client ose le dire. C'est pourquoi la relance est l'action commerciale la moins chère d'un artisan : elle ne demande ni publicité ni baisse de prix, seulement de ne pas laisser un devis sans suite.",
          "Avec Artisan Relance, vous joignez le PDF de votre devis, vous choisissez le rythme et le nombre de relances, et les e-mails partent à votre nom. Dès que le client répond, sa réponse arrive dans le dossier du devis et les relances s'arrêtent.",
        ],
      },
    ],
    quick: geoAnswers({
      software: "En relançant chaque devis, il supprime la première cause de devis non signé : l'absence de suivi.",
      automate: "Classez ensuite chaque devis gagné ou perdu pour savoir pourquoi vos devis ne se signent pas.",
      rate: "Avant de baisser vos prix, vérifiez que chaque devis a été envoyé sous 48 heures et relancé au moins deux fois.",
    }),
    faq: [
      { q: "Pourquoi mon client ne signe pas mon devis ?", a: "Le plus souvent parce qu'il n'a pas été relancé, qu'il compare plusieurs devis, qu'un poste l'inquiète ou que son financement n'est pas bouclé. Le prix n'est qu'une cause parmi d'autres." },
      { q: "Faut-il baisser son prix quand un devis n'est pas signé ?", a: "Pas en premier. Vérifiez d'abord le délai d'envoi, la clarté du devis et le suivi. Si le budget bloque vraiment, proposez une variante ou un phasage plutôt qu'une remise." },
      { q: "Comment savoir pourquoi un devis a été refusé ?", a: "Demandez-le simplement, en une phrase, après avoir remercié le client : le prix, le délai ou la confiance. Notez la réponse pour repérer les tendances." },
      { q: "Au bout de combien de temps un devis non signé est-il perdu ?", a: "En général un mois après l'envoi, ou à la fin de sa durée de validité, après trois relances sans réponse." },
    ],
    related: [
      { href: "/guides/augmenter-taux-signature-devis", label: "Augmenter son taux de signature" },
      { href: "/guides/relancer-client-qui-ne-repond-plus", label: "Client qui ne répond plus" },
      { href: "/guides/suivi-des-devis", label: "Suivre ses devis efficacement" },
      { href: "/relance-devis/renovation", label: "Relance de devis de rénovation" },
    ],
    date: DATE,
  },

  // ------------------------------------------------------------------ TAUX DE SIGNATURE
  {
    slug: "augmenter-taux-signature-devis",
    short: "Augmenter son taux de signature",
    title: "Comment augmenter son taux de signature de devis (artisans)",
    description:
      "Taux de signature ou de transformation des devis : comment le calculer et 9 leviers concrets pour signer plus de chantiers sans baisser vos prix.",
    h1: "Comment augmenter son taux de signature de devis",
    answer:
      "Pour augmenter votre taux de signature, agissez sur quatre leviers : envoyer le devis dans les 48 heures, le rendre clair et comparable, le relancer deux à trois fois avec une information utile, et suivre vos devis gagnés et perdus pour corriger ce qui bloque. La relance systématique est le levier le plus rapide et le moins coûteux.",
    sections: [
      {
        h2: "Calculer son taux de signature",
        paragraphs: [
          "Le taux de signature, aussi appelé taux de transformation ou taux d'acceptation des devis, mesure la part de vos devis qui deviennent des chantiers. Le calcul est simple : nombre de devis signés divisé par le nombre de devis envoyés, multiplié par 100. Avec 8 devis signés sur 20 envoyés, votre taux est de 40 %.",
          "Il n'existe pas de chiffre de référence fiable pour tout le bâtiment : un dépanneur qui chiffre sur place signe presque tous ses devis, une entreprise de rénovation qui répond à des appels d'offres beaucoup moins. Le seul chiffre qui compte est le vôtre, et surtout son évolution. Calculez-le sur trois mois, par type de chantier si possible, puis suivez-le chaque mois.",
          "Un conseil pour ne pas vous tromper : ne comptez que les devis clôturés (gagnés ou perdus). Un devis envoyé la semaine dernière n'est pas encore un échec.",
        ],
      },
      {
        h2: "9 leviers pour signer plus de devis",
        steps: [
          { title: "1. Répondre vite à la demande", text: "Rappelez le client le jour même et fixez la visite rapidement. Le premier artisan sur place part avec un avantage." },
          { title: "2. Envoyer le devis dans les 48 heures", text: "Plus le devis arrive tôt, plus il a de chances d'être lu avant les autres. Un devis rapide montre aussi que vous serez organisé sur le chantier." },
          { title: "3. Rendre le devis lisible", text: "Postes détaillés, marques et références, quantités, ce qui est inclus et ce qui ne l'est pas. Un résumé en tête du devis aide le client à comparer." },
          { title: "4. Indiquer une date de démarrage et une validité", text: "Le client se projette et sait jusqu'à quand le prix tient. Sans date, rien ne le pousse à décider." },
          { title: "5. Relancer systématiquement", text: "Deux relances et un message de clôture sur trois à quatre semaines. C'est le levier qui récupère le plus de devis oubliés." },
          { title: "6. Apporter une information utile à chaque relance", text: "Une disponibilité, une variante, une précision technique, une photo d'un chantier comparable." },
          { title: "7. Proposer une variante plutôt qu'une remise", text: "Phasage des travaux, autre matériau, partie réalisée par le client : vous gardez le chantier sans brader votre travail." },
          { title: "8. Faciliter la réponse", text: "Une question simple en fin de message, un numéro de téléphone visible, la possibilité de répondre directement à l'e-mail avec des photos ou des questions." },
          { title: "9. Collecter des avis clients", text: "Des avis Google récents et nombreux rassurent le client qui hésite entre deux artisans qu'il ne connaît pas." },
        ],
      },
      {
        h2: "Le levier le plus rentable : la relance",
        paragraphs: [
          "Parmi ces neuf leviers, la relance a un statut à part : elle ne coûte presque rien, elle ne demande pas de changer vos prix et elle agit sur les devis que vous avez déjà faits. Chaque devis non relancé est un déplacement, une prise de mesures et un chiffrage qui risquent de ne rien rapporter.",
          "Prenez un exemple à adapter à votre activité : 15 devis par mois, un montant moyen de 3 000 €. Si un suivi régulier vous fait signer un devis de plus par mois, cela représente 12 chantiers et 36 000 € de chiffre d'affaires sur l'année. Ce n'est pas une promesse, mais un ordre de grandeur : quelques devis récupérés suffisent à faire de la relance la meilleure heure de votre semaine.",
        ],
      },
      {
        h2: "Ce qui fait baisser le taux de signature",
        list: [
          "Envoyer des devis à des demandes peu sérieuses sans les qualifier (pas de budget, pas de date, simple curiosité).",
          "Envoyer un devis global sans détail que le client ne peut pas comparer.",
          "Attendre que le client rappelle.",
          "Baisser son prix à la première hésitation.",
          "Oublier de noter les devis perdus et leurs raisons.",
        ],
        paragraphs: [
          "Qualifier la demande au premier appel (le projet, le budget approximatif, la date souhaitée, les autres devis demandés) vous évite de chiffrer des projets qui ne se feront jamais, et votre taux de signature reflète mieux la réalité.",
        ],
      },
      {
        h2: "Suivre son taux de signature mois après mois",
        paragraphs: [
          "Un taux de signature ne se mesure pas une fois, il se suit. Notez chaque mois le nombre de devis envoyés, gagnés et perdus, et le montant signé. Au bout de trois mois, vous verrez l'effet de chaque changement : un devis plus détaillé, des relances systématiques, un délai d'envoi raccourci.",
          "Le tableau de bord d'Artisan Relance calcule ces chiffres automatiquement : devis en attente, relances prévues, taux de réponse, taux de signature et montant signé, avec un export CSV pour votre comptable ou votre tableur.",
        ],
      },
      {
        h2: "Mettre ces leviers en place sans y passer ses soirées",
        paragraphs: [
          "La plupart de ces leviers demandent de la régularité plus que du temps. Avec Artisan Relance, vous joignez le PDF fait avec votre logiciel habituel, vous choisissez le rythme des relances et le nombre maximum, et le suivi se fait sans vous. Dès que le client répond, les relances s'arrêtent ; quand il signe, un clic sur « Gagné » met à jour votre taux de signature. Après le chantier, une demande d'avis Google peut partir automatiquement.",
        ],
      },
    ],
    quick: geoAnswers({
      software: "Son tableau de bord calcule en plus le taux de réponse, le taux de signature et le montant signé.",
      automate: "Marquez ensuite chaque devis « Gagné » ou « Perdu » pour que votre taux de signature se calcule tout seul.",
      rate: "Mesurez-le sur les devis clôturés uniquement : devis signés ÷ devis envoyés × 100, suivi chaque mois.",
    }),
    faq: [
      { q: "Comment calculer le taux de signature de ses devis ?", a: "Devis signés ÷ devis envoyés × 100, en ne comptant que les devis clôturés. Exemple : 8 devis signés sur 20 envoyés = 40 %." },
      { q: "Quel est un bon taux de transformation de devis pour un artisan ?", a: "Il n'existe pas de référence fiable commune à tous les métiers : il varie selon le type de chantier et la qualité des demandes. Le bon repère est l'évolution de votre propre taux, mois après mois." },
      { q: "Quel est le moyen le plus rapide d'augmenter son taux de signature ?", a: "Relancer chaque devis deux à trois fois, avec une information utile à chaque relance. C'est le levier le moins coûteux et le plus rapide à mettre en place." },
      { q: "Les avis Google aident-ils à signer des devis ?", a: "Oui : un client qui hésite entre deux artisans qu'il ne connaît pas se fie souvent aux avis récents. Demander un avis après chaque chantier terminé en augmente le nombre." },
    ],
    related: [
      { href: "/guides/pourquoi-devis-pas-signe", label: "Pourquoi un devis n'est pas signé" },
      { href: "/guides/suivi-des-devis", label: "Suivre ses devis efficacement" },
      { href: "/guides/relancer-devis-sans-harceler", label: "Relancer sans harceler" },
      { href: "/relance-devis/menuisier", label: "Relance de devis pour menuisier" },
    ],
    date: DATE,
  },

  // ------------------------------------------------------------------ SUIVI DES DEVIS
  {
    slug: "suivi-des-devis",
    short: "Suivre ses devis",
    title: "Suivi des devis : comment suivre ses devis efficacement",
    description:
      "Suivre ses devis d'artisan sans en oublier : statuts, informations à noter, tableau Excel ou outil dédié, routine hebdomadaire et indicateurs à suivre.",
    h1: "Suivi des devis : comment suivre ses devis efficacement",
    answer:
      "Un bon suivi des devis tient en trois éléments : un statut pour chaque devis (en cours, répondu, gagné, perdu), une date de prochaine relance, et un point de dix minutes chaque semaine pour traiter les devis en attente. Un tableur peut suffire ; un outil de relance automatique évite d'avoir à y penser.",
    sections: [
      {
        h2: "Pourquoi les devis se perdent sans suivi",
        paragraphs: [
          "Un artisan envoie ses devis le soir, entre deux chantiers, depuis son logiciel ou son téléphone. Une fois partis, ils disparaissent de son quotidien. Le carnet, les notes du téléphone ou la mémoire ne suffisent plus dès que l'on dépasse quelques devis par mois : on ne sait plus lequel relancer, depuis quand le client n'a pas répondu, ni si un devis a été signé ou perdu.",
          "Le suivi des devis n'est pas une tâche administrative de plus. C'est ce qui transforme les heures passées à se déplacer et à chiffrer en chantiers signés.",
        ],
      },
      {
        h2: "Les informations à suivre pour chaque devis",
        list: [
          "Le client : nom, adresse e-mail, téléphone, et le canal par lequel il vous a contacté.",
          "Le projet : nature des travaux, montant, référence du devis.",
          "Les dates : visite, envoi du devis, fin de validité.",
          "Le statut : en cours, répondu, gagné, perdu, terminé.",
          "La prochaine action : relance prévue à telle date, appel à passer, document à envoyer.",
          "Le résultat : si le devis est perdu, la raison connue (prix, délai, concurrent, projet reporté).",
        ],
      },
      {
        h2: "Des statuts simples et clairs",
        steps: [
          { title: "En cours", text: "Le devis est parti, le client n'a pas encore répondu. Des relances sont prévues." },
          { title: "Répondu", text: "Le client a réagi : question, demande de modification, « je réfléchis ». Les relances automatiques s'arrêtent, la suite se fait en direct." },
          { title: "Gagné", text: "Le devis est signé. Le chantier entre dans votre planning." },
          { title: "Perdu", text: "Le client a refusé, choisi un autre artisan ou abandonné le projet. Notez la raison." },
          { title: "Terminé", text: "Le chantier est réalisé. C'est le bon moment pour demander un avis." },
        ],
      },
      {
        h2: "Suivre ses devis sur un tableur : avantages et limites",
        paragraphs: [
          "Un tableau Excel ou Google Sheets est la première solution de beaucoup d'artisans. Une ligne par devis, une colonne par information ci-dessus, un filtre sur le statut « En cours » et un tri par date de prochaine relance. C'est gratuit et souple.",
          "Ses limites apparaissent vite : il faut le mettre à jour à la main, il ne relance personne, il ne vous prévient pas quand une date arrive et il est rarement à jour quand on est sur un chantier. Le tableur dit ce qu'il faudrait faire ; il ne le fait pas.",
        ],
      },
      {
        h2: "Suivre ses devis avec son logiciel de devis",
        paragraphs: [
          "Les logiciels de devis et de facturation proposent souvent un statut par devis (accepté, refusé, en attente). C'est utile pour la comptabilité, mais le suivi commercial reste manuel : vous devez penser à ouvrir la liste, repérer les devis en attente et écrire chaque relance vous-même. Certains logiciels complets proposent des relances, dans des formules plus chères.",
        ],
      },
      {
        h2: "Suivre ses devis avec un outil de relance",
        paragraphs: [
          "Un outil spécialisé comme Artisan Relance combine le suivi et l'action. Vous joignez le PDF de votre devis (fait avec Obat, Batappli, Tolteck, EBP, Excel ou Word), l'adresse du client et le rythme des relances. À partir de là :",
        ],
        list: [
          "chaque devis a un statut et une date de prochaine relance, calculée automatiquement ;",
          "les relances partent à votre nom, du lundi au samedi entre 8 h et 19 h ;",
          "quand le client répond, les relances s'arrêtent et sa réponse, avec ses photos, s'affiche dans le dossier du devis ;",
          "un clic marque le devis répondu, gagné, perdu ou terminé ;",
          "le tableau de bord affiche les devis en attente, les relances prévues, le taux de réponse, le taux de signature et le montant signé, avec un export CSV.",
        ],
      },
      {
        h2: "La routine de suivi en 10 minutes par semaine",
        steps: [
          { title: "1. Ouvrir la liste des devis en cours", text: "Le lundi matin ou le vendredi soir, toujours au même moment." },
          { title: "2. Traiter les réponses reçues", text: "Répondre aux questions, envoyer un devis modifié, fixer une date." },
          { title: "3. Appeler les devis importants restés sans réponse", text: "Ceux qui ont déjà reçu deux relances écrites." },
          { title: "4. Mettre à jour les statuts", text: "Gagné, perdu, terminé, avec la raison des devis perdus." },
          { title: "5. Regarder ses chiffres une fois par mois", text: "Devis envoyés, taux de signature, montant signé : ce qui progresse et ce qui bloque." },
        ],
        paragraphs: [
          "Avec des relances automatiques, cette routine se limite aux décisions : tout le travail répétitif (se souvenir, écrire, envoyer) est déjà fait.",
        ],
      },
      {
        h2: "Exemple : le suivi d'un artisan qui envoie 15 devis par mois",
        paragraphs: [
          "Prenons un menuisier qui envoie une quinzaine de devis par mois : fenêtres, portes, placards sur mesure. Sans suivi, il relance quand il y pense, souvent le dimanche soir, et une partie de ses devis ne reçoit jamais de deuxième message. Il ne sait pas combien il en signe réellement.",
          "Avec un suivi organisé, chaque devis part avec trois relances programmées. Le lundi matin, il ouvre la liste des devis en cours : deux clients ont répondu pendant le week-end avec des questions sur les coloris, un troisième a envoyé une photo de son mur pour un placard. Il leur répond en dix minutes. Il appelle ensuite les deux devis importants restés sans réponse après deux relances, puis marque comme perdus ceux dont les clients ont choisi un autre artisan, en notant la raison.",
          "À la fin du mois, il voit combien de devis il a envoyés, combien sont signés, quel montant cela représente et pourquoi il a perdu les autres. Il n'a pas passé plus de temps qu'avant ; il l'a simplement passé sur les bons dossiers.",
        ],
      },
      {
        h2: "Les indicateurs qui comptent vraiment",
        list: [
          "Le nombre de devis envoyés par mois : votre volume d'activité commerciale.",
          "Le taux de réponse : la part des clients qui ont réagi, même pour dire non.",
          "Le taux de signature : devis gagnés sur devis clôturés.",
          "Le montant signé : ce que vos devis rapportent réellement.",
          "Les raisons des devis perdus : ce qu'il faut corriger.",
        ],
      },
    ],
    quick: geoAnswers({
      software: "Chaque devis y a un statut, une date de prochaine relance et un historique des échanges avec le client.",
      automate: "Le suivi devient alors automatique : il ne vous reste qu'à traiter les réponses et à appeler les dossiers importants.",
      rate: "Un suivi hebdomadaire des devis en cours et un bilan mensuel du taux de signature montrent ce qui progresse.",
    }),
    faq: [
      { q: "Comment suivre ses devis quand on est artisan ?", a: "Donnez un statut à chaque devis (en cours, répondu, gagné, perdu), notez la date de prochaine relance et faites un point de dix minutes chaque semaine." },
      { q: "Faut-il un logiciel pour suivre ses devis ?", a: "Un tableur suffit pour quelques devis par mois. Au-delà, un outil qui relance automatiquement et met à jour les statuts évite les oublis." },
      { q: "Quels statuts utiliser pour suivre ses devis ?", a: "En cours, répondu, gagné, perdu et terminé. Cinq statuts suffisent à savoir où en est chaque devis." },
      { q: "Peut-on exporter le suivi de ses devis ?", a: "Oui, avec Artisan Relance : la liste de vos devis et de leurs statuts s'exporte au format CSV, lisible dans Excel ou Google Sheets." },
    ],
    related: [
      { href: "/guides/augmenter-taux-signature-devis", label: "Augmenter son taux de signature" },
      { href: "/guides/quand-relancer-un-devis", label: "Quand relancer un devis ?" },
      { href: "/guides/pourquoi-devis-pas-signe", label: "Pourquoi un devis n'est pas signé" },
      { href: "/relance-devis/electricien", label: "Relance de devis pour électricien" },
    ],
    date: DATE,
  },

  // ------------------------------------------------------------------ RÉNOVATION ÉNERGÉTIQUE
  {
    slug: "relance-devis-renovation-energetique",
    short: "Rénovation énergétique",
    title: "Relance de devis de rénovation énergétique : aides et délais",
    description:
      "Relancer un devis de pompe à chaleur, d'isolation ou de rénovation d'ampleur quand le client attend MaPrimeRénov' ou une prime CEE : rythme et messages.",
    h1: "Relance de devis de rénovation énergétique : accompagner le client pendant ses démarches d'aides",
    answer:
      "Un devis de rénovation énergétique se relance toutes les deux à trois semaines, en demandant où en est le dossier d'aide plutôt que la signature. Le client attend souvent MaPrimeRénov', une prime CEE ou un prêt : la bonne relance l'aide à avancer dans ses démarches, avec les documents dont il a besoin, sans jamais lui promettre une aide.",
    sections: [
      {
        h2: "Pourquoi ces devis sont les plus longs à signer",
        paragraphs: [
          "Isolation, pompe à chaleur, chauffe-eau thermodynamique, fenêtres, ventilation ou rénovation d'ampleur : les travaux de rénovation énergétique ont une particularité. Le client ne décide pas seulement sur votre devis, il décide sur le reste à charge après aides. Tant qu'il ne sait pas combien il touchera, il ne signe pas.",
          "Or les démarches prennent du temps : création du compte, rendez-vous avec un conseiller France Rénov', diagnostic ou audit énergétique selon le parcours, dépôt du dossier avec les devis, instruction, puis accord. Une prime CEE ajoute ses propres étapes, et un éco-prêt à taux zéro passe par la banque. Un devis envoyé en septembre peut ainsi se signer en novembre, ou jamais si le client se décourage en route.",
          "C'est précisément là que la relance fait la différence : l'entreprise qui accompagne le client pendant ces semaines, sans le presser, est souvent celle qu'il choisit.",
        ],
      },
      {
        h2: "Ce qu'il faut savoir avant de relancer",
        paragraphs: [
          "Quelques principes stables guident la relance, même si les règles détaillées des aides changent souvent :",
        ],
        list: [
          "Pour MaPrimeRénov' et les primes CEE, les travaux doivent être réalisés par une entreprise certifiée RGE pour le type de travaux concerné.",
          "La demande d'aide doit être déposée avant le démarrage des travaux : un chantier commencé trop tôt peut faire perdre l'aide au client.",
          "Pour une prime CEE, l'offre de prime doit en général être acceptée avant la signature du devis.",
          "Pour une rénovation d'ampleur accompagnée, le calendrier de signature dépend de l'accord du dossier : le conseiller ou l'accompagnateur du client le précise.",
          "Les conditions ont encore évolué pour les demandes déposées à partir du 1er septembre 2026 : vérifiez toujours les règles en vigueur sur france-renov.gouv.fr avant de conseiller un client.",
        ],
      },
      {
        h2: "Le bon rythme de relance",
        steps: [
          { title: "J+5 : vérifier que le devis convient au dossier", text: "Le client a-t-il tout ce qu'il faut pour sa demande d'aide ? Proposez votre attestation RGE et les précisions techniques utiles (performances, références des équipements)." },
          { title: "J+15 à J+20 : demander où en est la démarche", text: "Dossier créé, rendez-vous France Rénov' pris, demande déposée ? Proposez votre aide pour un document manquant." },
          { title: "Toutes les deux à trois semaines ensuite", text: "Un message court qui fait le point, sans demander la signature tant que le client attend une réponse." },
          { title: "À l'accord de l'aide : proposer une date de démarrage", text: "C'est le moment de passer de l'accompagnement à la planification du chantier." },
          { title: "Fin de validité du devis : message de clôture ou mise à jour", text: "Si le dossier traîne, proposez de mettre à jour le devis plutôt que de le laisser expirer sans nouvelles." },
        ],
      },
      {
        h2: "Que dire dans la relance",
        paragraphs: [
          "Changez de question. Au lieu de « Avez-vous pris une décision ? », demandez « Où en est votre dossier ? » ou « Vous manque-t-il un document de ma part ? ». Le client n'a souvent rien de nouveau à vous dire sur la décision, mais il a beaucoup à dire sur ses démarches, et votre aide sur ce point crée la confiance.",
          "Ne promettez jamais un montant d'aide ni un accord : seul l'organisme qui instruit le dossier décide. Parlez d'estimation, renvoyez vers le conseiller France Rénov' du client et restez factuel sur votre devis.",
        ],
        template: {
          label: "Relance — dossier d'aide en cours",
          subject: "Votre projet de rénovation énergétique — où en est votre dossier ?",
          body: "Bonjour {client},\n\nJe reviens vers vous au sujet du devis{reference} du {date_envoi}.\n\nJe sais que les démarches d'aides prennent du temps. Où en est votre dossier ? S'il vous manque un document de ma part (attestation RGE, fiche technique, devis détaillé par poste), je vous l'envoie dès aujourd'hui.\n\nDès que vous aurez une réponse, nous pourrons fixer une date de démarrage ensemble.\n\nBien cordialement,",
        },
      },
      {
        h2: "Pompe à chaleur, isolation, fenêtres : adapter le message",
        list: [
          "Pompe à chaleur ou chaudière : relancez avant la saison de chauffe, quand le client se projette sur l'hiver, et précisez le délai d'approvisionnement et d'installation.",
          "Isolation des combles, des murs ou du plancher : expliquez la préparation du chantier et sa durée ; c'est souvent l'inconnue qui fait hésiter.",
          "Fenêtres et portes : rappelez le délai de fabrication, qui allonge le planning entre signature et pose.",
          "Ventilation : expliquez simplement le rôle de l'équipement, souvent mal compris, surtout après une isolation.",
          "Rénovation d'ampleur : coordonnez vos relances avec l'accompagnateur du client et proposez un point commun sur le planning des différents corps d'état.",
        ],
      },
      {
        h2: "Les erreurs qui font perdre ces chantiers",
        list: [
          "Relancer pour la signature pendant que le client attend une réponse de l'organisme d'aide.",
          "Annoncer un montant d'aide comme acquis.",
          "Laisser expirer le devis sans proposer de mise à jour.",
          "Démarrer ou laisser démarrer les travaux avant que le client ait déposé sa demande.",
          "Oublier de joindre l'attestation RGE ou les caractéristiques techniques demandées pour le dossier.",
        ],
      },
      {
        h2: "Programmer des relances longues sans y penser",
        paragraphs: [
          "Avec Artisan Relance, vous choisissez un intervalle adapté à ces dossiers (14 jours, ou un nombre de jours personnalisé), un nombre maximum de relances et une date de fin calée sur la validité du devis. Vous pouvez joindre jusqu'à 5 fichiers par devis (devis, attestation, fiches techniques), et le client peut vous répondre avec ses propres documents : tout arrive dans le dossier du devis. Dès qu'il répond, les relances s'arrêtent ; vous reprenez la main pour la suite de ses démarches.",
        ],
      },
    ],
    quick: geoAnswers({
      software: "Pour la rénovation énergétique, il permet des intervalles longs (14 jours ou personnalisés) et 5 fichiers joints par devis, comme l'attestation RGE.",
      automate: "Pour un dossier d'aide, espacez les relances de deux à trois semaines et calez la date de fin sur la validité du devis.",
      rate: "En rénovation énergétique, aider le client dans ses démarches d'aides fait plus signer que de lui demander une décision.",
    }),
    faq: [
      { q: "Faut-il relancer un client qui attend MaPrimeRénov' ?", a: "Oui, toutes les deux à trois semaines, en demandant où en est son dossier et s'il lui manque un document, plutôt qu'en demandant la signature." },
      { q: "Le client peut-il signer le devis avant d'avoir l'accord de l'aide ?", a: "Cela dépend de l'aide et du parcours : pour une prime CEE, l'offre de prime doit en général être acceptée avant la signature ; pour MaPrimeRénov', la demande doit être déposée avant le début des travaux. Vérifiez les règles en vigueur sur france-renov.gouv.fr." },
      { q: "Quelle durée de validité pour un devis de rénovation énergétique ?", a: "Une durée suffisante pour couvrir l'instruction des aides, souvent deux à trois mois, en prévoyant une mise à jour si le dossier dure plus longtemps." },
      { q: "Peut-on annoncer le montant de l'aide au client ?", a: "Seulement comme une estimation : l'aide n'est jamais acquise avant la décision de l'organisme qui instruit le dossier." },
    ],
    related: [
      { href: "/relance-devis/renovation", label: "Relance de devis de rénovation" },
      { href: "/relance-devis/chauffagiste", label: "Relance de devis pour chauffagiste" },
      { href: "/relance-devis/menuisier", label: "Relance de devis pour menuisier" },
      { href: "/guides/combien-de-relances-devis", label: "Combien de relances envoyer ?" },
    ],
    date: DATE,
  },
];
