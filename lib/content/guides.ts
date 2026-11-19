import { enrich, type ContentPage } from "./types";
import { GUIDE_ENRICHMENTS } from "./enrichments";
import { GUIDES_2 } from "./guides-2";

const DATE = "2026-11-15";

const GUIDES_1: (ContentPage & { short: string })[] = [
  // ------------------------------------------------------------------ QUAND RELANCER
  {
    slug: "quand-relancer-un-devis",
    short: "Quand relancer un devis ?",
    title: "Quand relancer un devis après un rendez-vous ? Les bons délais",
    description:
      "Quand envoyer et relancer un devis après un rendez-vous client ? Délai d'envoi, calendrier J+3, J+7, J+14 selon le chantier et erreurs à éviter pour artisans.",
    h1: "Quand relancer un devis après un rendez-vous ? Le calendrier qui fonctionne pour les artisans",
    answer:
      "Après un rendez-vous, envoyez le devis dans les 48 heures, relancez-le 3 à 7 jours après l'envoi, puis une deuxième fois une semaine plus tard, et envoyez un dernier message de clôture vers trois à quatre semaines. Plus le chantier est petit et urgent, plus la relance doit être rapide ; plus il est important, plus vous pouvez espacer.",
    sections: [
      {
        h2: "Pourquoi le moment de la relance compte autant",
        paragraphs: [
          "Un devis envoyé entre dans une période de réflexion. Les premiers jours, le client le lit, le compare et se pose des questions. C'est le meilleur moment pour reprendre contact : votre devis est encore frais dans son esprit, et une question restée sans réponse peut faire basculer la décision en votre faveur.",
          "Trop tôt, la relance paraît pressante : le client n'a pas eu le temps d'ouvrir le document. Trop tard, il a déjà choisi, souvent l'entreprise qui l'a recontacté en premier. Entre les deux, une fenêtre de quelques jours où la relance est perçue comme du sérieux, pas comme de l'insistance.",
        ],
      },
      {
        h2: "Après le rendez-vous : envoyer le devis dans les 48 heures",
        paragraphs: [
          "Le compte à rebours commence au rendez-vous, pas à l'envoi du devis. Pendant la visite, le client vous a montré la pièce, posé ses questions et s'est fait une première idée de vous. Ce souvenir s'efface vite, surtout s'il reçoit d'autres artisans dans la même semaine. Un devis envoyé dans les 48 heures arrive pendant que la visite est encore fraîche ; un devis envoyé quinze jours plus tard arrive souvent après la décision.",
          "Si un poste demande une vérification (prix d'un matériau, disponibilité d'un équipement), envoyez quand même le devis rapidement en le signalant, puis complétez-le. Mieux vaut un devis rapide précisé ensuite qu'un devis parfait arrivé trop tard.",
          "Profitez du rendez-vous pour préparer la relance : demandez au client quand il compte décider, s'il attend d'autres devis, s'il dépend d'un financement et par quel moyen il préfère être recontacté. Notez ces réponses : elles fixent le bon délai de relance bien mieux qu'une règle générale.",
        ],
      },
      {
        h2: "Annoncer la relance pendant le rendez-vous",
        paragraphs: [
          "La relance la mieux acceptée est celle que le client attend. En fin de visite, une phrase suffit : « Je vous envoie le devis d'ici jeudi, et je vous recontacte la semaine suivante pour répondre à vos questions. » Le client sait à quoi s'attendre, et votre message ne sera pas perçu comme une surprise ou une pression.",
          "Si le client vous dit qu'il décidera après les vacances, après le passage d'un autre artisan ou après un rendez-vous à la banque, calez votre première relance juste après cette date. Une relance envoyée trop tôt tombe dans le vide ; une relance envoyée au bon moment montre que vous l'avez écouté.",
        ],
        list: [
          "Le client compare plusieurs devis : première relance à J+5, quand il a reçu les autres.",
          "Le client attend un financement : relance après la date de son rendez-vous bancaire ou de sa demande d'aide.",
          "Le client doit en parler à son conjoint ou à sa famille : relance le lundi, après le week-end où la décision se prend souvent.",
          "Le client est pressé (panne, dégât) : relance à J+2, puis appel.",
        ],
      },
      {
        h2: "Le calendrier de relance en 3 temps",
        steps: [
          { title: "Première relance : entre J+3 et J+7", text: "Vérifiez que le devis est bien arrivé et proposez de répondre aux questions. Message court, ton cordial, aucune pression." },
          { title: "Deuxième relance : une semaine plus tard", text: "Apportez un élément nouveau : une date de démarrage possible, une variante moins chère, une précision technique. La relance doit être utile au client." },
          { title: "Message de clôture : vers J+21 à J+30", text: "Indiquez que vous classez le dossier tout en restant disponible, et rappelez la durée de validité du devis. Ce message obtient souvent une réponse, même négative, qui vous permet de passer à autre chose." },
        ],
      },
      {
        h2: "Adapter le délai au type de chantier",
        paragraphs: [
          "Le bon délai dépend surtout de l'urgence du client et du montant engagé. Quelques repères :",
        ],
        list: [
          "Dépannage ou réparation programmée (chauffe-eau, fuite, tuiles) : relances à J+2 ou J+3, puis J+7.",
          "Petits travaux d'aménagement (peinture d'une pièce, porte, prises) : J+3 puis J+10.",
          "Rénovation d'une pièce (salle de bain, cuisine) : J+5, J+12, puis clôture vers J+25.",
          "Gros chantier (toiture, chauffage, rénovation complète) : J+7, puis toutes les deux semaines, trois à quatre fois.",
          "Dossier soumis à une aide, un crédit ou une copropriété : toutes les deux à trois semaines, avec une date de fin.",
        ],
      },
      {
        h2: "Les meilleurs jours et heures pour relancer",
        paragraphs: [
          "Les particuliers lisent leurs e-mails le matin et le soir, et prennent leurs décisions de travaux le week-end. Une relance envoyée en semaine, en matinée, a le temps d'être lue avant ces moments de décision. Évitez le dimanche et les heures tardives, qui donnent une image de surcharge plutôt que d'organisation.",
          "Pour les clients professionnels (commerces, syndics, entreprises), privilégiez du mardi au jeudi, en journée. Le lundi est souvent saturé et le vendredi après-midi peu propice aux décisions.",
          "Artisan Relance applique automatiquement cette règle : les relances partent du lundi au samedi, entre 8 h et 19 h, heure de Paris.",
        ],
      },
      {
        h2: "Les erreurs de timing les plus fréquentes",
        list: [
          "Relancer le lendemain de l'envoi : le client n'a pas encore lu le devis.",
          "Attendre que le client rappelle : il ne le fait presque jamais, même quand il est intéressé.",
          "Relancer tous les deux jours : l'insistance fait fuir, surtout sur les gros montants.",
          "Ne relancer qu'une fois : une grande partie des réponses arrive après la deuxième relance.",
          "Relancer indéfiniment : fixez une date de fin et un nombre maximum de relances.",
        ],
      },
      {
        h2: "Programmer ses relances dès l'envoi du devis",
        paragraphs: [
          "Le vrai problème n'est pas de connaître le bon délai, c'est de s'en souvenir au milieu des chantiers. La solution la plus fiable consiste à programmer les relances au moment même où vous envoyez le devis : vous décidez une fois, et le suivi se fait sans vous.",
          "C'est ce que fait Artisan Relance : vous joignez votre devis, choisissez l'intervalle (3, 7, 14 ou 30 jours, ou un nombre de jours personnalisé), le nombre maximum de relances et une date de fin. Les e-mails partent à votre nom. Quand votre client répond, les relances s'arrêtent d'elles-mêmes et sa réponse s'affiche dans le dossier du devis ; quand il signe, un clic le marque « Gagné ».",
        ],
      },
    ],
    faq: [
      { q: "Au bout de combien de jours relancer un devis ?", a: "Entre 3 et 7 jours après l'envoi pour la première relance, puis une semaine plus tard pour la deuxième." },
      { q: "Peut-on relancer un devis le lendemain ?", a: "C'est trop tôt dans la plupart des cas : le client n'a pas encore lu ni comparé. Sauf urgence, attendez au moins 3 jours." },
      { q: "Quand arrêter de relancer un devis ?", a: "Après trois relances sans réponse, ou à l'expiration du devis. Un dernier message de clôture permet de terminer proprement." },
      { q: "Quel est le meilleur jour pour relancer un client ?", a: "En semaine, le matin, pour un particulier ; du mardi au jeudi pour un professionnel. Évitez le dimanche et le soir tard." },
      { q: "Combien de temps après un rendez-vous envoyer le devis ?", a: "Dans les 48 heures. Le client a encore la visite en tête, et votre devis arrive avant ou en même temps que ceux de vos concurrents." },
      { q: "Faut-il relancer un client après un rendez-vous sans devis ?", a: "Oui, si le devis devait suivre : prévenez de la date d'envoi. Si le client devait vous recontacter, un message une semaine plus tard pour proposer le devis est bienvenu." },
    ],
    related: [
      { href: "/guides/combien-de-relances-devis", label: "Combien de relances envoyer ?" },
      { href: "/guides/modele-mail-relance-devis", label: "Exemples de mail de relance" },
      { href: "/guides/relancer-devis-sans-harceler", label: "Relancer sans harceler" },
      { href: "/relance-devis/plombier", label: "Relance de devis pour plombier" },
    ],
    date: DATE,
    updated: "2026-11-18",
  },

  // ------------------------------------------------------------------ MODÈLES DE MAIL
  {
    slug: "modele-mail-relance-devis",
    short: "Exemples de mail de relance",
    title: "Exemple de mail de relance de devis pour artisan : 9 modèles",
    description:
      "9 exemples de mail de relance de devis pour artisan : première relance, date de démarrage, variante, plombier, électricien, couvreur, clôture. Objets à copier.",
    h1: "Exemple de mail de relance de devis pour artisan : 9 modèles prêts à copier",
    answer:
      "Un bon mail de relance de devis tient en 4 à 6 lignes : un objet qui rappelle le devis, une phrase qui situe le projet et sa date d'envoi, une proposition d'aide ou une information nouvelle, et une question simple qui appelle une réponse.",
    sections: [
      {
        h2: "La structure d'un mail de relance efficace",
        list: [
          "Un objet précis : « Votre devis de rénovation de salle de bain du 3 mars » plutôt que « Relance ».",
          "Une phrase de contexte : quel devis, quel projet, envoyé quand.",
          "Un élément utile : réponse à une question, date de disponibilité, variante, document complémentaire.",
          "Une question facile : « Souhaitez-vous que je vous rappelle ? » ou « Le créneau du 12 vous conviendrait-il ? »",
          "Votre signature complète avec téléphone : le client doit pouvoir vous appeler en un geste.",
        ],
      },
      {
        h2: "Modèle 1 : la première relance",
        template: {
          label: "Première relance (J+3 à J+7)",
          subject: "Votre devis du {date_envoi} — avez-vous des questions ?",
          body: "Bonjour {client},\n\nJe me permets de revenir vers vous au sujet du devis{reference} envoyé le {date_envoi}.\n\nAvez-vous eu le temps d'en prendre connaissance ? Si un point mérite une explication, je vous réponds volontiers par e-mail ou par téléphone.\n\nBonne journée,",
        },
      },
      {
        h2: "Modèle 2 : la relance avec une date de démarrage",
        paragraphs: ["Proposer une date concrète transforme une relance en proposition. C'est souvent la plus efficace pour les clients qui ont une contrainte de calendrier."],
        template: {
          label: "Relance avec disponibilité",
          subject: "Votre projet — un créneau possible le mois prochain",
          body: "Bonjour {client},\n\nJe reviens vers vous concernant le devis{reference} du {date_envoi}.\n\nJ'ai un créneau qui se libère le mois prochain. Si le projet vous convient, je peux vous le réserver dès maintenant ; il me suffit de votre accord sur le devis.\n\nCordialement,",
        },
      },
      {
        h2: "Modèle 3 : la relance avec une variante",
        paragraphs: ["Quand vous sentez que le prix bloque, proposez une alternative plutôt qu'une remise : un phasage des travaux, un matériau différent, une partie réalisée par le client."],
        template: {
          label: "Proposition d'une variante",
          subject: "Une variante pour votre projet",
          body: "Bonjour {client},\n\nSuite au devis{reference} envoyé le {date_envoi}, je me suis demandé si le budget pouvait être un frein.\n\nSi c'est le cas, je peux vous proposer une variante : réaliser les travaux en deux étapes, ou adapter certains matériaux sans toucher à la qualité de la pose. Dites-moi ce qui vous conviendrait.\n\nBien à vous,",
        },
      },
      {
        h2: "Modèle 4 : la relance pour un gros projet",
        template: {
          label: "Relance d'un chantier important",
          subject: "Votre projet de rénovation — point d'étape",
          body: "Bonjour {client},\n\nJe sais qu'un projet comme le vôtre demande réflexion, et je ne veux pas vous presser.\n\nSi vous attendez une réponse de votre banque, d'un organisme d'aide ou d'un autre professionnel, n'hésitez pas à me le dire : je peux vous fournir les documents utiles et adapter le planning.\n\nJe reste à votre disposition,",
        },
      },
      {
        h2: "Modèle 5 : la relance d'un client professionnel",
        template: {
          label: "Client professionnel ou syndic",
          subject: "Devis{reference} — validation avant la prochaine réunion ?",
          body: "Bonjour {client},\n\nJe me permets de revenir vers vous concernant notre devis{reference} transmis le {date_envoi}.\n\nSi sa validation doit passer par une réunion ou une assemblée, je peux vous fournir une version synthétique ou répondre aux questions des autres décideurs.\n\nCordialement,",
        },
      },
      {
        h2: "Modèle 6 : le message de clôture",
        paragraphs: ["Le dernier message n'est pas un ultimatum. Il clarifie la situation, laisse la porte ouverte et obtient souvent une réponse, même pour dire non, ce qui vous permet de classer le dossier."],
        template: {
          label: "Clôture (J+21 à J+30)",
          subject: "Je classe votre dossier — sauf si vous souhaitez en reparler",
          body: "Bonjour {client},\n\nSans nouvelles de votre part, je suppose que le projet est reporté ou que vous avez fait un autre choix, ce que je comprends très bien.\n\nJe classe donc le dossier. Si vous souhaitez le reprendre plus tard, il vous suffit de répondre à ce message.\n\nBonne continuation,",
        },
      },
      {
        h2: "Modèle 7 : la relance d'un plombier ou d'un chauffagiste",
        paragraphs: ["Un exemple concret vaut mieux qu'un message générique : nommez l'équipement et donnez un repère de durée, c'est ce qui rassure le client sur l'organisation du chantier."],
        template: {
          label: "Plombier — remplacement de chauffe-eau",
          subject: "Votre chauffe-eau — devis du {date_envoi}",
          body: "Bonjour {client},\n\nJe reviens vers vous au sujet du devis de remplacement de votre chauffe-eau envoyé le {date_envoi}.\n\nPour information, l'intervention dure une demi-journée et je peux la programmer sous dix jours. Si vous hésitez entre les deux modèles proposés, je vous explique la différence en deux minutes.\n\nBonne journée,",
        },
      },
      {
        h2: "Modèle 8 : la relance d'un électricien",
        template: {
          label: "Électricien — tableau électrique ou mise en sécurité",
          subject: "Votre tableau électrique — une question sur le devis ?",
          body: "Bonjour {client},\n\nAvez-vous pu consulter le devis{reference} de remplacement de votre tableau électrique, envoyé le {date_envoi} ?\n\nJ'ai détaillé les protections prévues pour chaque circuit. Si certains termes vous semblent techniques, je vous les explique volontiers par téléphone.\n\nCordialement,",
        },
      },
      {
        h2: "Modèle 9 : la relance d'un couvreur après une visite de toiture",
        template: {
          label: "Couvreur — réfection ou réparation de toiture",
          subject: "Votre toiture — photos et devis du {date_envoi}",
          body: "Bonjour {client},\n\nSuite à ma visite, je vous ai envoyé le {date_envoi} le devis{reference} pour votre toiture, avec les photos des tuiles abîmées.\n\nSi votre assurance ou un autre professionnel doit donner son avis, je peux leur transmettre ces éléments directement. Avant la période des intempéries, j'ai encore quelques créneaux.\n\nBien à vous,",
        },
      },
      {
        h2: "Les erreurs qui rendent un mail de relance inefficace",
        list: [
          "Un objet vague (« Relance », « Suivi ») qui ne dit pas de quel projet il s'agit.",
          "Un message trop long : au-delà de six lignes, le client remet la lecture à plus tard.",
          "Aucune question en fin de message : le client ne sait pas quoi répondre.",
          "Un ton de reproche (« toujours sans nouvelles de votre part »).",
          "L'absence de numéro de téléphone dans la signature.",
          "Le même message envoyé trois fois : chaque relance doit apporter quelque chose de nouveau.",
        ],
        paragraphs: [
          "Relisez votre modèle avec les yeux du client : comprend-il en deux secondes de quel devis il s'agit, ce que vous lui proposez et ce qu'il doit répondre ? Si oui, votre mail de relance est prêt.",
        ],
      },
      {
        h2: "10 objets d'e-mail qui se font ouvrir",
        list: [
          "Votre devis du {date} — une question ?",
          "Votre projet de salle de bain",
          "Petit point sur votre devis",
          "Un créneau possible pour vos travaux",
          "Une variante pour votre projet",
          "Votre devis reste valable jusqu'au {date}",
          "Avez-vous bien reçu notre devis ?",
          "Votre projet — où en êtes-vous ?",
          "Les documents pour votre dossier d'aide",
          "Je classe votre dossier ?",
        ],
        paragraphs: [
          "Évitez les objets en majuscules, les points d'exclamation et les mots « urgent » ou « dernière chance » : ils ressemblent à de la publicité et finissent plus souvent dans les indésirables.",
        ],
      },
      {
        h2: "Personnaliser sans y passer de temps",
        paragraphs: [
          "Un modèle n'est efficace que s'il est personnalisé : le nom du client, l'objet du devis, la date d'envoi. Artisan Relance remplit automatiquement ces informations grâce à des variables ({client}, {date_envoi}, {reference}, {montant}) : vous rédigez votre message une fois, chaque relance part personnalisée, à votre nom.",
        ],
      },
    ],
    faq: [
      { q: "Quel objet mettre pour un mail de relance de devis ?", a: "Un objet précis qui rappelle le projet et la date : « Votre devis de toiture du 3 mars — une question ? ». Évitez « Relance » seul, trop impersonnel." },
      { q: "Comment relancer un devis poliment ?", a: "Restez bref, rappelez le contexte, proposez votre aide plutôt que de demander une décision, et terminez par une question simple." },
      { q: "Faut-il joindre le devis à la relance ?", a: "Oui pour les gros projets, afin que le client le retrouve sans chercher. Pour les petits devis, un rappel de la date suffit." },
      { q: "Peut-on utiliser le même modèle pour tous les clients ?", a: "Oui, à condition de le personnaliser avec le nom du client, l'objet et la date du devis, et de varier le message entre la première et la deuxième relance." },
      { q: "Quelle longueur pour un mail de relance de devis ?", a: "Quatre à six lignes : le contexte, une information ou une aide, une question simple. Au-delà, le client remet la lecture à plus tard." },
    ],
    related: [
      { href: "/guides/quand-relancer-un-devis", label: "Quand relancer un devis ?" },
      { href: "/guides/exemple-sms-relance-devis", label: "Exemples de SMS de relance" },
      { href: "/guides/relancer-client-qui-ne-repond-plus", label: "Relancer un client qui ne répond plus" },
      { href: "/relance-devis/peintre", label: "Relance de devis pour peintre" },
    ],
    date: DATE,
    updated: "2026-11-18",
  },

  // ------------------------------------------------------------------ CLIENT QUI NE RÉPOND PLUS
  {
    slug: "relancer-client-qui-ne-repond-plus",
    short: "Client qui ne répond plus",
    title: "Comment relancer un client qui ne répond plus après un devis",
    description:
      "Votre client ne répond plus après votre devis ? Les vraies raisons de son silence, la méthode en 4 étapes pour le relancer et les messages à envoyer.",
    h1: "Comment relancer un client qui ne répond plus après un devis",
    answer:
      "Un client qui ne répond plus n'a pas forcément refusé votre devis. Relancez-le par écrit deux fois en apportant une information utile, puis appelez-le, et terminez par un message de clôture qui l'invite à vous dire où il en est. Cette méthode obtient une réponse dans la majorité des cas, même négative.",
    sections: [
      {
        h2: "Pourquoi un client ne répond plus",
        paragraphs: [
          "Le silence après un devis est l'une des situations les plus frustrantes pour un artisan : vous avez pris le temps de vous déplacer, de mesurer, de chiffrer, et plus rien. Avant d'en conclure que le client vous a écarté, regardez les raisons les plus fréquentes :",
        ],
        list: [
          "Il n'a pas encore pris le temps de lire le devis en détail.",
          "Il attend les autres devis pour comparer.",
          "Il attend une réponse de sa banque, d'un organisme d'aide ou d'un proche.",
          "Un poste du devis le gêne (prix, matériau, délai) et il n'ose pas le dire.",
          "Le projet est reporté pour une raison personnelle.",
          "Il a choisi un autre artisan et ne sait pas comment vous l'annoncer.",
        ],
      },
      {
        h2: "La méthode en 4 étapes",
        steps: [
          { title: "1. Une relance écrite courte (J+3 à J+7)", text: "Demandez s'il a bien reçu le devis et proposez de répondre à ses questions. Pas de pression." },
          { title: "2. Une relance utile (J+10 à J+14)", text: "Apportez un élément nouveau : date de disponibilité, variante, précision technique. Donnez une raison de répondre." },
          { title: "3. Un appel téléphonique", text: "Si les deux e-mails restent sans réponse, appelez. Beaucoup de clients répondent plus facilement à une question directe qu'à un e-mail." },
          { title: "4. Le message de clôture (J+21 à J+30)", text: "Annoncez que vous classez le dossier, sans reproche, en laissant la porte ouverte. C'est souvent ce message qui déclenche une réponse." },
        ],
      },
      {
        h2: "Ce qu'il ne faut pas faire",
        list: [
          "Envoyer un message de reproche (« sans réponse de votre part depuis trois semaines… »).",
          "Baisser votre prix sans qu'on vous le demande : vous dévalorisez votre travail.",
          "Multiplier les canaux le même jour (e-mail, SMS, appel, message vocal).",
          "Relancer pendant des mois sans fin définie.",
          "Oublier de noter le résultat : un devis perdu est une information utile pour la suite.",
        ],
      },
      {
        h2: "Le message de clôture qui fait réagir",
        paragraphs: [
          "Le message de clôture fonctionne parce qu'il libère le client : il n'a plus à justifier son silence, il lui suffit de répondre en une ligne. Beaucoup répondent « Merci, le projet est repoussé à l'automne » ou « Nous avons choisi une autre entreprise » ; certains, au contraire, se rendent compte qu'ils allaient perdre votre créneau et signent.",
        ],
        template: {
          label: "Message de clôture",
          subject: "Votre projet — je classe le dossier ?",
          body: "Bonjour {client},\n\nJe n'ai pas eu de retour concernant le devis{reference} du {date_envoi}, et je ne veux pas vous importuner.\n\nSi le projet est reporté ou si vous avez fait un autre choix, une simple réponse en une ligne me permet de mettre à jour mon planning. Et si vous souhaitez en reparler, je suis disponible.\n\nBien cordialement,",
        },
      },
      {
        h2: "Tirer des enseignements des devis perdus",
        paragraphs: [
          "Quand un client vous répond qu'il a choisi quelqu'un d'autre, remerciez-le et demandez, en une phrase, ce qui a fait la différence : le prix, le délai, la confiance. Notez la réponse. Au bout de quelques mois, ces notes vous montrent ce qu'il faut améliorer : la présentation de vos devis, vos délais d'envoi ou votre façon de relancer.",
          "Dans Artisan Relance, marquer un devis « Perdu » arrête les relances et alimente votre taux de signature, pour mesurer vos progrès d'un mois sur l'autre.",
        ],
      },
      {
        h2: "Le cas des devis soumis à un financement",
        paragraphs: [
          "Un client qui attend un prêt, une aide à la rénovation ou l'accord d'une copropriété ne répond souvent pas parce qu'il n'a rien de nouveau à dire. Dans ce cas, changez de question : au lieu de demander s'il a pris une décision, demandez où en est son dossier et proposez de fournir les documents qui lui manquent. Vous restez présent sans le mettre mal à l'aise, et vous serez le premier informé quand le financement sera accordé.",
        ],
      },
      {
        h2: "Ne plus avoir à y penser",
        paragraphs: [
          "Les étapes 1, 2 et 4 de la méthode peuvent être programmées à l'avance. Avec Artisan Relance, vous rédigez vos messages une fois, choisissez le rythme et le nombre de relances, et les e-mails partent seuls, à votre nom. Il ne vous reste que l'appel téléphonique, au moment où il est vraiment utile.",
        ],
      },
    ],
    faq: [
      { q: "Mon client ne répond plus après le devis, est-ce un refus ?", a: "Pas forcément. Il attend souvent d'autres devis, un financement ou n'a pas pris le temps de lire. Deux relances et un appel permettent de le savoir." },
      { q: "Combien de temps attendre avant de considérer un devis perdu ?", a: "Environ un mois après l'envoi, ou à l'expiration de la durée de validité du devis, après trois relances sans réponse." },
      { q: "Faut-il proposer une remise à un client qui ne répond plus ?", a: "Non, pas spontanément. Proposez plutôt une variante (phasage, autre matériau) si vous pensez que le budget bloque." },
      { q: "Comment relancer sans paraître insistant ?", a: "Espacez les messages d'au moins une semaine, apportez une information nouvelle à chaque fois et ne dépassez pas trois relances." },
    ],
    related: [
      { href: "/guides/relance-devis-email-ou-telephone", label: "Relance de devis : e-mail ou téléphone ?" },
      { href: "/guides/modele-mail-relance-devis", label: "Exemples de mail de relance" },
      { href: "/relance-devis/couvreur", label: "Relance de devis pour couvreur" },
    ],
    date: DATE,
  },

  // ------------------------------------------------------------------ COMBIEN DE RELANCES
  {
    slug: "combien-de-relances-devis",
    short: "Combien de relances envoyer ?",
    title: "Combien de relances pour un devis ? La bonne fréquence",
    description:
      "Combien de fois relancer un devis sans paraître insistant ? Nombre de relances conseillé, intervalle, cas particuliers et règles pour les artisans.",
    h1: "Combien de relances envoyer pour un devis ?",
    answer:
      "Trois relances suffisent pour la plupart des devis : une première à J+3 à J+7, une deuxième une semaine plus tard, et un message de clôture vers J+21 à J+30. Pour les gros projets qui dépendent d'un financement, allez jusqu'à quatre relances espacées de deux à trois semaines, puis arrêtez.",
    sections: [
      {
        h2: "Pourquoi une seule relance ne suffit pas",
        paragraphs: [
          "Beaucoup d'artisans relancent une fois, n'obtiennent pas de réponse et abandonnent. C'est dommage : une première relance arrive souvent à un moment où le client n'est pas disponible (travail, enfants, vacances). La deuxième relance, envoyée quelques jours plus tard, tombe à un meilleur moment et obtient une part importante des réponses.",
          "À l'inverse, multiplier les relances finit par nuire à votre image. Au-delà de trois ou quatre messages, le client se sent poursuivi et l'e-mail risque d'être classé comme indésirable, ce qui peut dégrader la réception de vos futurs envois.",
        ],
      },
      {
        h2: "Le nombre de relances selon le type de devis",
        list: [
          "Petit devis (moins de 1 000 €) ou dépannage programmé : 2 relances, à J+3 et J+7.",
          "Devis moyen (1 000 à 10 000 €) : 3 relances, à J+5, J+12 et un message de clôture vers J+25.",
          "Gros projet (plus de 10 000 €) : 3 à 4 relances espacées de deux semaines.",
          "Dossier lié à une aide, un crédit ou une copropriété : 4 relances toutes les trois semaines, avec une date de fin.",
          "Client professionnel : 3 relances, en semaine, en ajoutant tous les décideurs en destinataires.",
        ],
      },
      {
        h2: "Quel intervalle entre deux relances ?",
        paragraphs: [
          "Laissez au moins 4 jours entre deux relances, et idéalement une semaine. L'intervalle peut s'allonger avec le temps : une première relance rapide montre votre réactivité, les suivantes plus espacées montrent votre patience.",
          "Un bon repère consiste à doubler l'écart : relance à J+5, puis J+12, puis J+26. Le client sent un suivi régulier mais jamais pressant.",
        ],
      },
      {
        h2: "Varier le contenu de chaque relance",
        paragraphs: [
          "Le nombre de relances compte moins que leur contenu. Trois messages identiques (« Avez-vous pris une décision ? ») agacent ; trois messages qui apportent chacun quelque chose sont perçus comme un service.",
        ],
        steps: [
          { title: "Relance 1 : la vérification", text: "Le devis est-il bien arrivé ? Avez-vous des questions ?" },
          { title: "Relance 2 : l'information utile", text: "Une date possible, une variante, une précision technique, une photo de chantier similaire." },
          { title: "Relance 3 : la clôture", text: "Je classe le dossier, sauf si vous souhaitez en reparler." },
        ],
      },
      {
        h2: "Quand arrêter immédiatement de relancer",
        list: [
          "Le client a répondu, même pour dire qu'il réfléchit encore.",
          "Le client a signé, chez vous ou ailleurs.",
          "Le client demande d'arrêter (« STOP », « merci de ne plus me relancer »).",
          "Le devis a expiré et vous ne souhaitez pas le renouveler.",
        ],
        paragraphs: [
          "Respecter une demande d'arrêt n'est pas qu'une question de politesse : c'est aussi une obligation au regard de la protection des données personnelles.",
        ],
      },
      {
        h2: "Exemple : un devis de salle de bain de 6 500 €",
        paragraphs: [
          "Le devis part le lundi 3. Première relance le lundi 10 : « Avez-vous bien reçu le devis ? Je peux vous expliquer le choix du receveur. » Pas de réponse. Deuxième relance le lundi 17 : « Mon carreleur est disponible à partir du 14 du mois prochain, je peux vous réserver ce créneau. » La cliente répond le soir même : elle attendait l'avis de son mari sur la couleur du carrelage.",
          "Sans la deuxième relance, ce devis serait resté dans la pile. Avec une troisième relance automatique programmée au 31, il n'aurait pas pu être oublié non plus. C'est le rôle du nombre maximum de relances : assez pour ne rien laisser filer, pas assez pour agacer.",
        ],
      },
      {
        h2: "Mesurer l'effet de vos relances",
        paragraphs: [
          "Pour savoir si votre nombre de relances est le bon, suivez deux chiffres pendant trois mois : votre taux de réponse (clients qui ont répondu, même pour dire non) et votre taux de signature (devis gagnés sur devis clôturés). Si la plupart des réponses arrivent après la dernière relance, vous pouvez en ajouter une. Si personne ne répond après la deuxième, la troisième est peut-être de trop pour ce type de devis.",
        ],
      },
      {
        h2: "Fixer le nombre de relances une fois pour toutes",
        paragraphs: [
          "Avec Artisan Relance, vous choisissez pour chaque devis le nombre maximum de relances (de 1 à 20) et l'intervalle entre elles. Vous pouvez aussi fixer une date de fin ou une durée maximale. Une fois la dernière relance envoyée, plus rien ne part : impossible de relancer trop, impossible d'oublier.",
          "Et dès que votre client répond, un clic sur « Répondu », « Gagné » ou « Perdu » arrête immédiatement les relances suivantes.",
        ],
      },
    ],
    faq: [
      { q: "Combien de fois relancer un devis ?", a: "Trois fois en général : deux relances et un message de clôture, sur trois à quatre semaines." },
      { q: "Quatre relances, est-ce trop ?", a: "Pour un petit devis, oui. Pour un gros projet qui dépend d'un financement, quatre relances espacées de deux à trois semaines restent acceptables." },
      { q: "Quel délai entre deux relances de devis ?", a: "Au moins 4 jours, idéalement une semaine, en allongeant l'intervalle au fil des relances." },
      { q: "Faut-il relancer un client qui a dit qu'il réfléchissait ?", a: "Oui, mais plus tard : convenez d'une date avec lui (« je vous recontacte dans quinze jours ? ») et tenez-la." },
    ],
    related: [
      { href: "/guides/quand-relancer-un-devis", label: "Quand relancer un devis ?" },
      { href: "/guides/relancer-client-qui-ne-repond-plus", label: "Relancer un client qui ne répond plus" },
      { href: "/relance-devis/chauffagiste", label: "Relance de devis pour chauffagiste" },
    ],
    date: DATE,
  },

  // ------------------------------------------------------------------ EMAIL OU TÉLÉPHONE
  {
    slug: "relance-devis-email-ou-telephone",
    short: "E-mail ou téléphone ?",
    title: "Relance de devis : e-mail ou téléphone ? Le bon canal",
    description:
      "Faut-il relancer un devis par e-mail, par téléphone ou par SMS ? Avantages, limites, script d'appel et combinaison gagnante pour les artisans.",
    h1: "Relance de devis : e-mail ou téléphone ?",
    answer:
      "Commencez par l'e-mail et terminez par le téléphone. L'e-mail est discret, laisse une trace et peut être automatisé ; l'appel débloque les dossiers où le client hésite sur un détail. La combinaison la plus efficace : deux relances par e-mail, puis un appel si le devis reste sans réponse.",
    sections: [
      {
        h2: "Les atouts de la relance par e-mail",
        list: [
          "Le client la lit quand il veut : elle ne le dérange pas au travail ou en famille.",
          "Elle laisse une trace écrite : date, contenu, devis joint.",
          "Elle peut reprendre le devis en pièce jointe pour que le client le retrouve facilement.",
          "Elle peut être programmée à l'avance et envoyée automatiquement.",
          "Elle permet de mettre plusieurs décideurs en copie (couple, syndic, gérant).",
        ],
        paragraphs: [
          "Sa limite : un e-mail peut être lu en diagonale, oublié ou arriver dans les indésirables. C'est pourquoi il faut soigner l'objet et ne pas se contenter d'un seul envoi.",
        ],
      },
      {
        h2: "Les atouts de la relance par téléphone",
        list: [
          "Elle crée un vrai échange : vous entendez l'hésitation et pouvez y répondre.",
          "Elle débloque les objections que le client n'écrira jamais (prix, doute sur un poste).",
          "Elle montre votre implication sur les gros projets.",
        ],
        paragraphs: [
          "Ses limites : elle prend du temps, tombe souvent sur la messagerie et peut déranger. Impossible d'appeler tous vos clients plusieurs fois au milieu des chantiers. Réservez le téléphone aux dossiers où il apporte vraiment quelque chose.",
        ],
      },
      {
        h2: "Et le SMS ?",
        paragraphs: [
          "Le SMS est très lu, mais il est perçu comme plus intrusif pour une relance commerciale, et il se prête mal à un devis détaillé. Il peut servir à prévenir qu'un e-mail vient d'être envoyé (« Je vous ai renvoyé le devis par e-mail, bonne journée ») ou à confirmer un rendez-vous. Pour la relance elle-même, l'e-mail reste plus adapté.",
        ],
      },
      {
        h2: "La combinaison gagnante",
        steps: [
          { title: "J+3 à J+7 : e-mail", text: "Première relance courte, automatisée." },
          { title: "J+10 à J+14 : e-mail", text: "Deuxième relance avec une information utile, automatisée." },
          { title: "J+15 à J+20 : appel", text: "Pour les dossiers importants restés sans réponse." },
          { title: "J+21 à J+30 : e-mail de clôture", text: "Pour classer proprement le dossier." },
        ],
        paragraphs: [
          "Cette séquence vous fait gagner un temps considérable : les e-mails partent seuls, et vous ne décrochez votre téléphone que pour les clients qui n'ont pas répondu, en sachant exactement où en est chaque dossier.",
        ],
      },
      {
        h2: "Script d'appel de relance de devis",
        paragraphs: [
          "Un appel de relance réussi dure deux à trois minutes. Préparez-le avec le devis sous les yeux.",
        ],
        list: [
          "Présentez-vous et rappelez le projet : « Bonjour Madame Martin, c'est Paul, le plombier qui est venu pour votre salle de bain le 3 mars. »",
          "Vérifiez la réception : « Vous avez bien reçu le devis ? »",
          "Posez une question ouverte : « Qu'en avez-vous pensé ? » puis écoutez sans interrompre.",
          "Répondez à l'objection ou proposez une variante si le budget bloque.",
          "Concluez par une étape claire : « Je vous renvoie le devis ajusté ce soir » ou « Je vous rappelle jeudi ? ».",
        ],
      },
      {
        h2: "Adapter le canal au client",
        list: [
          "Particulier actif, joignable en journée difficilement : e-mail en priorité, appel en fin de journée.",
          "Personne âgée ou peu à l'aise avec l'e-mail : appel dès la deuxième relance, en confirmant ensuite par écrit.",
          "Couple qui décide à deux : e-mail aux deux adresses, pour que chacun ait le devis sous les yeux.",
          "Professionnel, syndic, gestionnaire : e-mail en semaine, appel au standard si besoin, jamais de SMS.",
        ],
        paragraphs: [
          "Le meilleur canal est celui que le client a lui-même utilisé pour vous contacter. S'il vous a appelé pour demander le devis, un appel de relance sera naturel ; s'il a rempli un formulaire en ligne, l'e-mail est attendu. Notez-le dans votre dossier client dès le premier contact.",
          "Dernier point : quel que soit le canal, gardez une trace de chaque relance. Un historique daté évite de relancer deux fois le même jour par deux moyens différents et vous permet de reprendre la conversation exactement là où elle s'était arrêtée.",
        ],
      },
      {
        h2: "Automatiser la partie e-mail",
        paragraphs: [
          "Artisan Relance automatise les relances par e-mail : vous joignez votre devis, choisissez le rythme et le nombre de relances, et les messages partent à votre nom, du lundi au samedi en journée. Le tableau de bord vous montre les devis toujours sans réponse : ce sont ceux qui méritent votre appel.",
        ],
      },
    ],
    faq: [
      { q: "Vaut-il mieux relancer un devis par e-mail ou par téléphone ?", a: "Commencez par l'e-mail, discret et automatisable, puis appelez si le devis reste sans réponse après deux relances." },
      { q: "Le SMS peut-il remplacer l'e-mail pour relancer un devis ?", a: "Rarement : il est perçu comme plus intrusif et se prête mal à un message détaillé. Il sert surtout à prévenir qu'un e-mail vient d'être envoyé ou à signaler une disponibilité." },
      { q: "Que dire au téléphone pour relancer un devis ?", a: "Rappelez le projet, vérifiez que le devis est arrivé, demandez ce que le client en pense, répondez à ses questions et convenez d'une prochaine étape." },
      { q: "Faut-il laisser un message vocal ?", a: "Oui, court : votre nom, le projet, et le fait que vous lui envoyez un e-mail. Le client rappelle rarement, mais il lira l'e-mail." },
    ],
    related: [
      { href: "/guides/combien-de-relances-devis", label: "Combien de relances envoyer ?" },
      { href: "/guides/quand-relancer-un-devis", label: "Quand relancer un devis ?" },
      { href: "/relance-devis/electricien", label: "Relance de devis pour électricien" },
    ],
    date: DATE,
  },
];

export const GUIDES: (ContentPage & { short: string })[] = [...GUIDES_1, ...GUIDES_2].map((g) => enrich(g, GUIDE_ENRICHMENTS[g.slug]));

export function getGuide(slug: string) {
  return GUIDES.find((g) => g.slug === slug);
}
