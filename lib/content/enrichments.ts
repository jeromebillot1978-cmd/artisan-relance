import type { Enrichment } from "./types";

/**
 * Enrichissements SEO du 19 novembre 2026 (audit « Explorée, actuellement non indexée »).
 * Chaque bloc ajoute à UNE page des sections, questions et liens qui n'existent nulle part
 * ailleurs sur le site : cas concrets, exemples chiffrés à adapter, méthodes propres au sujet.
 * Liens internes contextuels : syntaxe [ancre](/chemin), rendue par <RichText>.
 * Contrôle : npx tsx --tsconfig tsconfig.json scripts/check-content.ts (≥ 1 500 mots par page).
 */
const UPDATED = "2026-11-19";

// ============================================================================ GUIDES

export const GUIDE_ENRICHMENTS: Record<string, Enrichment> = {
  // -------------------------------------------------------------------------- QUAND RELANCER
  "quand-relancer-un-devis": {
    updated: UPDATED,
    before: "Programmer ses relances dès l'envoi du devis",
    sections: [
      {
        h2: "Trois calendriers types, jour par jour",
        paragraphs: [
          "Les repères généraux deviennent plus clairs quand on les pose sur un vrai calendrier. Voici trois situations courantes, avec les dates à reporter dans votre agenda ou dans votre outil de relance. Le jour 0 est toujours le jour d'envoi du devis, pas celui du rendez-vous.",
        ],
        steps: [
          { title: "Remplacement d'un ballon d'eau chaude (≈ 1 500 €)", text: "Rendez-vous le mardi, devis envoyé le mercredi (J0). Relance le samedi (J+3) : « Avez-vous pu regarder les deux modèles ? ». Deuxième relance le mercredi suivant (J+7) avec une date d'intervention. Si rien n'arrive, un appel à J+9 suffit : sur ce type de devis, le client a soit choisi, soit oublié." },
          { title: "Salle de bain complète (≈ 9 000 €)", text: "Devis envoyé le lundi (J0). Première relance le samedi (J+5), quand le client a reçu les autres devis. Deuxième relance à J+12 avec la date de démarrage et la durée pendant laquelle la pièce sera inutilisable. Message de clôture à J+26, juste avant la fin de validité si celle-ci est d'un mois." },
          { title: "Réfection de toiture avec dossier d'assurance (≈ 15 000 €)", text: "Devis envoyé à J0, relance à J+7 pour demander si l'expert est passé, puis à J+21 et J+35 en rappelant votre délai de démarrage. Une date de fin fixée à J+60 évite de relancer un dossier abandonné." },
        ],
      },
      {
        h2: "Quand le calendrier du client bouscule le vôtre",
        paragraphs: [
          "Certaines périodes décalent toutes les décisions. Entre mi-juillet et fin août, comme pendant les fêtes de fin d'année, une relance envoyée tombe dans une boîte que personne ne lit. Dans ces cas, ne relancez pas pour rien : envoyez une première relance juste avant le départ (« je reste disponible à votre retour ») et programmez la suivante pour la semaine de la rentrée.",
          "Même logique pour les échéances que le client vous a confiées : un versement de prime, une vente immobilière, un rendez-vous chez le notaire. Une relance calée sur ces dates est perçue comme de l'attention, pas comme de l'insistance. Notez-les dès le rendez-vous, puis reportez-les dans l'outil sous forme de date de première relance.",
          "Enfin, si le client vous répond « je vous rappelle la semaine prochaine », ne considérez pas l'affaire réglée : marquez le devis comme répondu, puis fixez vous-même une relance huit jours plus tard. Les clients qui promettent de rappeler oublient aussi souvent que les autres. Le guide [relancer un client qui ne répond plus](/guides/relancer-client-qui-ne-repond-plus) détaille la suite quand le silence s'installe.",
        ],
      },
      {
        h2: "Relancer un devis ancien : trop tard ou encore possible ?",
        paragraphs: [
          "Un devis envoyé il y a deux ou trois mois n'est pas forcément perdu. Beaucoup de projets ont simplement été mis de côté, et le client ne sait plus comment reprendre contact. Un message honnête suffit : rappelez le projet, signalez que les prix ou les délais ont pu évoluer, et proposez de mettre le devis à jour. Si votre devis a expiré, envoyez une version actualisée plutôt que l'ancienne.",
          "Pour ces relances tardives, une seule tentative écrite suivie d'un appel est plus adaptée qu'une nouvelle série de trois messages. Le nombre de relances conseillé selon le montant est détaillé dans le guide [combien de relances envoyer pour un devis](/guides/combien-de-relances-devis).",
        ],
      },
    ],
    faq: [
      { q: "Faut-il relancer un devis pendant les vacances du client ?", a: "Non. Envoyez une relance juste avant son départ en restant disponible à son retour, puis programmez la suivante pour la semaine de la rentrée." },
      { q: "Le délai de relance compte-t-il à partir du rendez-vous ou de l'envoi du devis ?", a: "À partir de l'envoi du devis. Le rendez-vous fixe surtout le délai d'envoi, idéalement sous 48 heures." },
    ],
    related: [{ href: "/guides/relancer-client-qui-ne-repond-plus", label: "Relancer un client qui ne répond plus" }, { href: "/relance-devis/couvreur", label: "Relance de devis pour couvreur" }],
  },

  // -------------------------------------------------------------------------- MODÈLES DE MAIL
  "modele-mail-relance-devis": {
    updated: UPDATED,
    before: "Personnaliser sans y passer de temps",
    sections: [
      {
        h2: "Modèle bonus : la relance après une question du client",
        paragraphs: [
          "Quand le client vous a posé une question au téléphone ou par message, la relance la plus efficace est celle qui y répond par écrit. Elle n'a rien d'insistant : vous tenez parole, et vous donnez au client un document qu'il peut montrer à son conjoint ou à son banquier.",
        ],
        template: {
          label: "Réponse écrite à une question",
          subject: "Votre question sur le devis du {date_envoi}",
          body: "Bonjour {client},\n\nComme promis, voici la réponse à votre question sur le devis{reference} : la dépose de l'ancien équipement et l'évacuation des gravats sont bien comprises dans le prix, sans supplément.\n\nSi d'autres points vous font hésiter, dites-le-moi : je préfère ajuster le devis maintenant plutôt que de vous laisser dans le doute.\n\nBonne journée,",
        },
      },
      {
        h2: "Une séquence complète de trois mails pour le même devis",
        paragraphs: [
          "Un modèle isolé ne suffit pas : ce qui fait signer, c'est l'enchaînement. Voici comment combiner les modèles de cette page pour un devis de cuisine de 11 000 € envoyé un lundi, en changeant d'angle à chaque message.",
        ],
        steps: [
          { title: "J+5 — la vérification (modèle 1)", text: "Objet « Votre devis de cuisine du 3 mars — avez-vous des questions ? ». Trois lignes, aucune demande de décision. Le but est d'obtenir un premier échange." },
          { title: "J+14 — l'information utile (modèle 2 ou 3)", text: "Un créneau de pose avant l'été, ou une variante avec un plan de travail stratifié au lieu du quartz. Le client a une raison concrète de répondre." },
          { title: "J+28 — la clôture (modèle 6)", text: "Vous classez le dossier sans reproche. C'est souvent ce message qui obtient la réponse, positive ou négative." },
        ],
      },
      {
        h2: "Vouvoiement, signature et pièce jointe : les détails qui comptent",
        list: [
          "Gardez le vouvoiement dans les relances écrites, même si vous avez tutoyé le client sur place : un e-mail se transfère, et le ton professionnel rassure le conjoint ou l'associé qui le lira.",
          "Signez avec votre prénom, votre nom, le nom de l'entreprise et un numéro de portable : beaucoup de clients préfèrent rappeler que répondre par écrit.",
          "Joignez à nouveau le devis sur les gros montants, mais pas à chaque relance d'un petit devis : un mail léger se lit plus vite sur un téléphone.",
          "Évitez les images de bannière et les liens multiples : un message simple, comme écrit à la main, arrive plus souvent dans la boîte de réception.",
          "Relisez le nom du client et la date du devis : une erreur sur ces deux points annule l'effet de personnalisation.",
        ],
        outro: [
          "Si vous préférez un message plus court lu sur téléphone, les [exemples de SMS de relance](/guides/exemple-sms-relance-devis) complètent ces mails. Pour le choix du moment d'envoi, voyez [quand relancer un devis](/guides/quand-relancer-un-devis).",
        ],
      },
    ],
    faq: [
      { q: "Faut-il relancer par mail en répondant au premier e-mail ou en écrivant un nouveau message ?", a: "Répondez dans le même fil que l'envoi du devis : le client retrouve l'historique et le devis sans chercher. Changez seulement l'objet si le premier était trop vague." },
    ],
    related: [{ href: "/guides/relancer-devis-sans-harceler", label: "Relancer sans harceler" }],
  },

  // -------------------------------------------------------------------------- CLIENT QUI NE RÉPOND PLUS
  "relancer-client-qui-ne-repond-plus": {
    updated: UPDATED,
    before: "Ne plus avoir à y penser",
    sections: [
      {
        h2: "Reconnaître le type de silence avant de relancer",
        paragraphs: [
          "Tous les silences ne se valent pas, et ne se relancent pas de la même manière. Quelques indices, notés pendant le rendez-vous ou lors du premier échange, permettent de deviner dans quelle situation se trouve votre client et d'adapter le message.",
        ],
        list: [
          "Le client était pressé au rendez-vous et ne répond plus : il a probablement trouvé un autre artisan disponible plus tôt. Une seule relance avec votre date de démarrage, puis un message de clôture.",
          "Le client a posé beaucoup de questions sur le prix : le budget bloque. Proposez une variante ou un phasage plutôt qu'une remise (voir [pourquoi un devis n'est pas signé](/guides/pourquoi-devis-pas-signe)).",
          "Le client a parlé d'une aide, d'un prêt ou d'une copropriété : il attend un tiers. Espacez les relances et demandez où en est le dossier.",
          "Le client a répondu une fois, puis plus rien : un détail le gêne. Une question ouverte au téléphone débloque souvent la situation.",
          "Le client n'a jamais ouvert la discussion après le devis : vérifiez d'abord que le devis est bien arrivé, adresse e-mail comprise.",
        ],
      },
      {
        h2: "Exemple : un client silencieux pendant trois semaines",
        paragraphs: [
          "Un menuisier envoie un devis de 7 400 € pour le remplacement de six fenêtres. Première relance à J+5 : aucune réponse. Deuxième relance à J+14, avec une information nouvelle : le délai de fabrication passe à sept semaines à partir du mois suivant. Toujours rien. À J+17, il appelle en fin de journée et tombe sur la messagerie ; il laisse un message de vingt secondes et annonce un e-mail.",
          "Le message de clôture part à J+24. Le soir même, la cliente répond : son mari trouvait le prix élevé par rapport à une grande enseigne, et elle n'osait pas le dire. Le menuisier propose de comparer les deux devis ligne par ligne au téléphone : même vitrage, mais pose en dépose totale chez lui, en rénovation chez le concurrent. Le devis est signé la semaine suivante.",
          "Ce qui a fonctionné : des messages espacés, une information nouvelle à chaque fois, un appel au bon moment et un message de clôture qui libère la parole. Ce qui aurait fait échouer : une remise spontanée dès la deuxième relance, qui aurait laissé croire que le premier prix était gonflé.",
        ],
      },
      {
        h2: "Le message vocal et le SMS en complément",
        paragraphs: [
          "Quand l'appel tombe sur la messagerie, laissez un message court : votre prénom, votre métier, le projet et le fait qu'un e-mail suit. Ne demandez pas au client de rappeler ; peu le font, mais la plupart liront l'e-mail en sachant de qui il vient.",
          "Un SMS peut remplacer l'appel pour les clients qui ne décrochent jamais : une phrase, signée, sans lien. Les [exemples de SMS de relance](/guides/exemple-sms-relance-devis) donnent des formulations prêtes à l'emploi. Évitez seulement de cumuler appel, SMS et e-mail le même jour : c'est ce qui donne au client l'impression d'être poursuivi.",
        ],
      },
      {
        h2: "Quand il faut vraiment classer le dossier",
        paragraphs: [
          "Après deux relances écrites, un appel et un message de clôture, un client qui ne répond toujours pas a fait son choix, même s'il ne l'a pas formulé. Insister au-delà nuit à votre image et vous prend du temps que vous pourriez consacrer aux devis encore ouverts. Marquez le devis comme perdu, notez la raison si vous la connaissez, et passez à autre chose.",
          "Classer n'empêche pas de revenir plus tard. Un client dont le projet a été reporté peut redevenir prioritaire au printemps suivant ; un court message saisonnier, envoyé une seule fois, est alors tout à fait acceptable. La règle générale de rythme est décrite dans le guide [relancer un devis sans harceler](/guides/relancer-devis-sans-harceler).",
        ],
      },
    ],
    faq: [
      { q: "Faut-il appeler un client qui ne répond pas aux e-mails ?", a: "Oui, après deux relances écrites. Beaucoup de clients répondent plus facilement à une question directe, surtout quand un détail du devis les gêne." },
      { q: "Peut-on relancer un client des mois après son silence ?", a: "Oui, une seule fois et avec un motif : un projet reporté à la saison suivante, ou un devis à mettre à jour. Proposez une version actualisée si le premier devis a expiré." },
      { q: "Que répondre quand le client explique enfin qu'il a choisi un concurrent ?", a: "Remerciez-le, demandez en une phrase ce qui a fait la différence, notez la réponse et marquez le devis comme perdu. Restez cordial : il peut vous recommander ou revenir pour un autre projet." },
    ],
    related: [{ href: "/guides/pourquoi-devis-pas-signe", label: "Pourquoi un devis n'est pas signé" }, { href: "/relance-devis/menuisier", label: "Relance de devis pour menuisier" }],
  },

  // -------------------------------------------------------------------------- COMBIEN DE RELANCES
  "combien-de-relances-devis": {
    updated: UPDATED,
    before: "Fixer le nombre de relances une fois pour toutes",
    sections: [
      {
        h2: "Exemple : deux artisans, deux réglages",
        paragraphs: [
          "Un plombier envoie surtout des devis de 300 à 2 000 € : remplacement de chauffe-eau, robinetterie, petits aménagements. Il règle deux relances, à trois puis sept jours, et appelle les rares dossiers importants restés sans réponse. Ses clients décident vite ; une troisième relance arriverait après leur choix.",
          "Un couvreur envoie peu de devis, mais de 8 000 à 25 000 €. Il règle trois relances espacées de deux semaines, avec une date de fin à deux mois, et place un appel entre la deuxième et la troisième. Ses clients attendent souvent l'avis d'un expert ou d'un proche : une relance trop rapprochée serait inutile, une relance unique serait oubliée. Même outil, même principe, deux réglages différents.",
        ],
      },
      {
        h2: "Le tableau de repères selon le montant et l'urgence",
        paragraphs: [
          "Deux critères suffisent à choisir le nombre de relances : le montant du devis, qui fixe la durée de réflexion du client, et l'urgence de son besoin, qui fixe la vitesse de décision. Croisez-les pour obtenir le bon réglage.",
        ],
        list: [
          "Montant faible, besoin urgent (fuite, panne, vitre cassée) : 1 à 2 relances en une semaine, puis un appel.",
          "Montant faible, sans urgence (peinture d'une chambre, porte intérieure) : 2 relances sur dix jours.",
          "Montant moyen, sans urgence (salle de bain, tableau électrique, fenêtres) : 3 relances sur trois à quatre semaines.",
          "Montant élevé, sans urgence (toiture, rénovation complète, extension) : 3 à 4 relances sur six à huit semaines.",
          "Montant élevé lié à un tiers (aide, banque, copropriété, assurance) : 4 relances maximum toutes les deux à trois semaines, avec une date de fin.",
        ],
      },
      {
        h2: "Pourquoi « plus de relances » ne veut pas dire « plus de signatures »",
        paragraphs: [
          "Au-delà d'un certain nombre, chaque relance supplémentaire rapporte moins qu'elle ne coûte. Les clients intéressés répondent en général pendant les deux ou trois premiers messages ; ceux qui restent silencieux ensuite ont souvent choisi ailleurs ou abandonné le projet. Une cinquième ou sixième relance n'ajoute presque rien, mais elle augmente le risque d'agacer, d'être marqué comme indésirable et d'abîmer la réputation de votre adresse d'envoi.",
          "Le bon nombre de relances est donc celui qui laisse au client assez d'occasions de répondre sans transformer votre suivi en pression. C'est pour cette raison qu'un plafond doit être fixé au départ : sans limite, on relance tant qu'on y pense, c'est-à-dire de façon irrégulière, trop souvent pour certains clients et pas assez pour d'autres.",
        ],
      },
      {
        h2: "Les cas où une seule relance suffit",
        list: [
          "Le client vous a donné une date de décision précise : une relance le lendemain de cette date, pas avant.",
          "Le devis complète un chantier en cours chez le même client : vous le voyez sur place, une relance écrite suffit pour garder une trace.",
          "Le client est un professionnel qui a un processus de validation : une relance avant sa réunion, puis un appel.",
          "Le devis a été demandé pour comparer avec un prestataire déjà choisi : une relance polie, puis clôture.",
        ],
        outro: [
          "Dans ces cas, multiplier les messages n'apporte rien : le client sait exactement où en est son projet. Pour les situations de silence total, la méthode complète est décrite dans [relancer un client qui ne répond plus](/guides/relancer-client-qui-ne-repond-plus).",
        ],
      },
      {
        h2: "Adapter le nombre de relances à votre métier",
        paragraphs: [
          "Les métiers de dépannage et de petits travaux (plomberie, électricité, serrurerie) gagnent à relancer peu mais vite. Les métiers de projet (couverture, menuiserie, chauffage, rénovation) doivent relancer plus longtemps, avec des intervalles plus larges. Chaque page métier donne un calendrier détaillé : [plombier](/relance-devis/plombier), [électricien](/relance-devis/electricien), [couvreur](/relance-devis/couvreur), [chauffagiste](/relance-devis/chauffagiste), [peintre](/relance-devis/peintre) et [menuisier](/relance-devis/menuisier).",
          "Pour savoir à quel moment envoyer chaque relance, le guide [quand relancer un devis](/guides/quand-relancer-un-devis) propose trois calendriers types, jour par jour.",
        ],
      },
    ],
    faq: [
      { q: "Deux relances suffisent-elles pour un petit devis ?", a: "Oui, dans la plupart des cas : une à J+3, une à J+7. Au-delà, un appel est plus utile qu'un troisième e-mail." },
      { q: "Faut-il un nombre maximum de relances ?", a: "Oui. Fixez un plafond et une date de fin dès l'envoi du devis : vous évitez d'oublier certains clients et d'en relancer d'autres trop souvent." },
    ],
    related: [{ href: "/guides/relancer-devis-sans-harceler", label: "Relancer sans harceler" }, { href: "/relance-devis/couvreur", label: "Relance de devis pour couvreur" }],
  },

  // -------------------------------------------------------------------------- E-MAIL OU TÉLÉPHONE
  "relance-devis-email-ou-telephone": {
    updated: UPDATED,
    before: "Automatiser la partie e-mail",
    sections: [
      {
        h2: "Le cas des clients professionnels",
        paragraphs: [
          "Pour un commerce, un syndic ou une entreprise, l'e-mail reste le canal principal : il circule entre les décideurs, se classe dans un dossier et sert de trace pour la comptabilité. Mettez toutes les personnes concernées en destinataires et relancez du mardi au jeudi. L'appel est utile quand la validation dépend d'une réunion : un coup de fil la veille permet de savoir si votre devis est à l'ordre du jour.",
        ],
      },
      {
        h2: "Comparatif : e-mail, téléphone, SMS",
        paragraphs: [
          "Chaque canal a un coût en temps, un niveau d'intrusion et un effet différent sur la décision du client. Ce comparatif résume ce qu'il faut retenir pour choisir sans hésiter.",
        ],
        list: [
          "E-mail : quelques secondes par relance une fois programmé, très peu intrusif, laisse une trace et permet de joindre le devis. Point faible : peut être ignoré ou lu en diagonale.",
          "Téléphone : trois à cinq minutes par appel, plus intrusif, mais le seul canal qui révèle les objections cachées. Point faible : impossible à faire pour chaque devis.",
          "SMS : trente secondes, lu très vite, mais ressenti comme personnel ; à réserver aux clients qui vous ont déjà écrit par ce moyen. Point faible : inadapté à un message détaillé.",
          "Message vocal : utile seulement pour annoncer un e-mail. Le client rappelle rarement.",
          "Visite sur place : réservée aux gros chantiers ou aux clients que vous croisez déjà (chantier voisin, entretien annuel).",
        ],
      },
      {
        h2: "Ce qu'un appel permet et qu'un e-mail ne permet pas",
        paragraphs: [
          "L'e-mail obtient des réponses ; l'appel obtient des explications. Au téléphone, le client dit des choses qu'il n'écrirait jamais : « Votre collègue est moins cher de 2 000 € », « Mon mari préfère attendre l'an prochain », « Je n'ai pas compris pourquoi il faut changer le tableau ». Ces phrases sont précieuses, parce qu'elles vous disent exactement quoi corriger : un poste à détailler, une variante à proposer, une date à décaler.",
          "C'est aussi pour cela que l'appel doit arriver après les e-mails, pas avant. Un client qui a déjà reçu deux messages écrits sait qui vous êtes et de quel devis il s'agit ; l'appel ne le surprend pas. À l'inverse, appeler dès le lendemain de l'envoi donne l'impression d'une vente pressante. Les raisons de ce silence sont détaillées dans [pourquoi un devis n'est pas signé](/guides/pourquoi-devis-pas-signe).",
        ],
      },
      {
        h2: "Choisir le canal selon le métier et le montant",
        paragraphs: [
          "Sur un devis de dépannage ou de petit montant, l'e-mail suffit presque toujours : un appel de relance pour 400 € de travaux prend plus de temps qu'il n'en rapporte. Sur un devis de rénovation, de toiture ou de pompe à chaleur, l'appel devient rentable : quelques minutes au téléphone peuvent sauver un chantier de plusieurs milliers d'euros.",
          "Les métiers diffèrent aussi par leur clientèle. Un [électricien](/relance-devis/electricien) qui travaille pour des syndics privilégiera l'e-mail en semaine, avec tous les décideurs en copie. Un [plombier](/relance-devis/plombier) qui intervient chez des particuliers âgés gagnera à appeler plus tôt. Un [peintre](/relance-devis/peintre) dont les clients comparent surtout le prix utilisera l'e-mail pour détailler la préparation des murs, puis appellera les dossiers indécis.",
        ],
      },
      {
        h2: "Exemple : la même semaine, deux canaux",
        paragraphs: [
          "Le lundi, un couvreur ouvre la liste de ses devis en cours. Quatorze dossiers ont reçu leurs relances automatiques par e-mail la semaine précédente : huit clients ont répondu, deux ont signé, trois ont demandé un ajustement. Il reste trois devis importants sans réponse après deux relances. Ce sont les seuls qu'il appelle, le mardi en fin de journée : un client attendait l'expert de son assurance, un autre a reporté à l'été, le troisième ne décroche pas et recevra le message de clôture.",
          "Résultat : moins de vingt minutes de téléphone dans la semaine, et une situation claire sur chaque devis. C'est tout l'intérêt de combiner les deux canaux plutôt que de choisir l'un contre l'autre. Le nombre total de messages à prévoir est détaillé dans [combien de relances envoyer](/guides/combien-de-relances-devis).",
        ],
      },
    ],
    faq: [
      { q: "À quelle heure appeler un client pour relancer un devis ?", a: "En fin de matinée ou en fin de journée en semaine pour un particulier, en journée du mardi au jeudi pour un professionnel. Évitez l'heure du repas et le week-end." },
      { q: "Faut-il confirmer un appel de relance par écrit ?", a: "Oui. Un court e-mail qui résume ce qui a été convenu (variante, date, prochaine étape) évite les malentendus et garde une trace." },
    ],
    related: [{ href: "/guides/pourquoi-devis-pas-signe", label: "Pourquoi un devis n'est pas signé" }, { href: "/guides/exemple-sms-relance-devis", label: "Exemples de SMS de relance" }],
  },

  // -------------------------------------------------------------------------- SANS HARCELER
  "relancer-devis-sans-harceler": {
    updated: UPDATED,
    before: "Automatiser sans perdre la politesse",
    sections: [
      {
        h2: "Le test des trois questions avant d'envoyer une relance",
        paragraphs: [
          "Avant chaque relance, posez-vous trois questions. Si la réponse est oui aux trois, votre message ne dérangera pas ; si l'une d'elles coince, corrigez avant d'envoyer.",
        ],
        steps: [
          { title: "Mon message apporte-t-il quelque chose de nouveau ?", text: "Une date, une variante, une précision, un document. Si la seule information est « je vous relance », reformulez." },
          { title: "Le délai depuis mon dernier message est-il raisonnable ?", text: "Au moins quatre jours, une semaine de préférence, davantage pour un gros projet. Le guide [combien de relances envoyer](/guides/combien-de-relances-devis) donne les repères par montant." },
          { title: "Le client peut-il répondre en une ligne ?", text: "Terminez par une question fermée ou une proposition simple : « Le créneau du 14 vous conviendrait-il ? ». Un client qui doit rédiger un long message remet sa réponse à plus tard." },
        ],
      },
      {
        h2: "Exemple : la même relance, insistante puis respectueuse",
        paragraphs: [
          "Version insistante, envoyée quatre jours après la précédente : « Bonjour, je reviens encore vers vous car je n'ai toujours pas de réponse. Merci de me dire rapidement si vous acceptez le devis, mon planning se remplit. » Le client se sent pris en faute et pressé ; il a toutes les raisons de ne pas répondre.",
          "Version respectueuse, envoyée dix jours après : « Bonjour, je vous écris pour une information pratique : je peux démarrer votre chantier la semaine du 14 si le projet vous convient toujours. Si vous avez besoin de plus de temps, aucun souci, dites-le-moi simplement. » Le message est utile, il laisse une porte de sortie et appelle une réponse courte. Pour d'autres formulations, voyez les [9 exemples de mail de relance](/guides/modele-mail-relance-devis).",
        ],
      },
    ],
    faq: [
      { q: "Combien de jours entre deux relances pour ne pas déranger ?", a: "Au moins quatre jours, une semaine de préférence, en allongeant l'intervalle au fil des relances : par exemple J+5, J+12, puis J+26." },
    ],
    related: [{ href: "/guides/combien-de-relances-devis", label: "Combien de relances envoyer ?" }],
  },

  // -------------------------------------------------------------------------- SMS
  "exemple-sms-relance-devis": {
    updated: UPDATED,
    before: "Combiner e-mail et SMS sans en faire trop",
    sections: [
      {
        h2: "SMS par métier : six exemples adaptés",
        paragraphs: [
          "Un SMS générique fonctionne, mais un SMS qui nomme le chantier fonctionne mieux. Voici un exemple par métier, à adapter avec vos mots. Chacun tient en moins de 160 caractères, signé, sans lien.",
        ],
        list: [
          "Plombier : « Bonjour M. Durand, c'est Julien (plomberie). Le devis du chauffe-eau est dans vos mails. Je peux intervenir mardi ou jeudi. Bonne journée ! »",
          "Électricien : « Bonjour Mme Petit, Karim, électricien. Je vous ai envoyé le devis du tableau. Une question sur les protections ? Je vous rappelle volontiers. »",
          "Couvreur : « Bonjour, Thomas, couvreur. Devis toiture envoyé avec les photos des tuiles. Créneau possible avant les pluies d'octobre. Bonne soirée. »",
          "Chauffagiste : « Bonjour Mme Leroy, Nicolas (chauffage). Besoin d'une fiche technique pour votre dossier d'aide ? Je vous l'envoie aujourd'hui. »",
          "Peintre : « Bonjour, Sophie, peintre. J'ai un créneau la semaine du 12 pour votre séjour. Je vous le réserve ? Bonne journée. »",
          "Menuisier : « Bonjour M. Roux, Pierre, menuisier. Pour une pose des fenêtres avant l'hiver, la commande doit partir ce mois-ci. Je reste dispo. »",
        ],
      },
      {
        h2: "Ce qu'il ne faut jamais envoyer par SMS",
        list: [
          "Un montant détaillé ou une remise : le client doit pouvoir relire les conditions dans un document écrit.",
          "Un lien raccourci ou un lien de paiement : il ressemble à une arnaque et fait baisser la confiance.",
          "Un message envoyé avant 8 h, après 20 h ou le dimanche : il est vécu comme une intrusion.",
          "Une relance par SMS le jour même où un e-mail et un appel sont déjà partis.",
          "Un SMS à un client qui ne vous a jamais donné son numéro pour ce projet.",
        ],
        outro: [
          "Le SMS reste un complément de l'e-mail, pas un remplaçant. Pour choisir entre les canaux, le guide [relance de devis : e-mail ou téléphone](/guides/relance-devis-email-ou-telephone) compare les avantages de chacun, et [relancer sans harceler](/guides/relancer-devis-sans-harceler) rappelle les règles de rythme à respecter.",
        ],
      },
      {
        h2: "Exemple de séquence avec un SMS bien placé",
        paragraphs: [
          "Pour un devis de salle de bain envoyé le lundi : SMS le soir même pour prévenir que le devis est dans la boîte e-mail, première relance par e-mail à J+5, deuxième relance par e-mail à J+12 avec une date de démarrage, puis un SMS à J+15 seulement si le dossier reste silencieux : « Je vous ai écrit au sujet du créneau du 14, je reste disponible. » Le message de clôture part par e-mail vers J+26.",
          "Dans cette séquence, le SMS sert deux fois, à des moments où il apporte quelque chose : confirmer la réception et signaler un message important. Les autres relances restent écrites et détaillées. Le calendrier complet est expliqué dans [quand relancer un devis](/guides/quand-relancer-un-devis).",
        ],
      },
    ],
    faq: [
      { q: "Un SMS de relance doit-il être signé ?", a: "Oui, toujours : prénom, métier ou nom de l'entreprise. Un SMS non signé venant d'un numéro inconnu est souvent ignoré." },
    ],
    related: [{ href: "/guides/relancer-devis-sans-harceler", label: "Relancer sans harceler" }, { href: "/relance-devis/peintre", label: "Relance de devis pour peintre" }],
  },

  // -------------------------------------------------------------------------- POURQUOI PAS SIGNÉ
  "pourquoi-devis-pas-signe": {
    updated: UPDATED,
    before: "La correction la plus rentable : relancer chaque devis",
    sections: [
      {
        h2: "Grille d'autodiagnostic sur vos 20 derniers devis",
        paragraphs: [
          "Plutôt que de deviner, reprenez vos vingt derniers devis non signés et répondez par oui ou non à chacune de ces questions. Les causes qui reviennent le plus souvent sont celles à corriger en premier.",
        ],
        list: [
          "Le devis est-il parti plus de trois jours après le rendez-vous ?",
          "Le devis a-t-il été relancé au moins deux fois ?",
          "Le client pouvait-il comprendre chaque ligne sans vous appeler ?",
          "Le devis indiquait-il une date de démarrage possible et une durée de validité ?",
          "Le prix était-il présenté avec ce qu'il comprend (préparation, évacuation, garanties) ?",
          "Le second décideur (conjoint, associé, syndic) avait-il reçu le devis ?",
          "Le client dépendait-il d'une aide, d'un crédit ou d'un accord extérieur ?",
          "Connaissez-vous la raison du refus ou du silence ?",
        ],
        outro: [
          "Si la réponse à « relancé au moins deux fois » est non pour la majorité des dossiers, la cause principale est trouvée : c'est la plus fréquente et la plus simple à corriger. Les guides [combien de relances envoyer](/guides/combien-de-relances-devis) et [quand relancer un devis](/guides/quand-relancer-un-devis) donnent la méthode.",
        ],
      },
      {
        h2: "Trois situations réelles et leur correction",
        steps: [
          { title: "Un électricien perd ses devis de mise aux normes", text: "Ses devis listent des références de disjoncteurs incompréhensibles pour un particulier. Correction : une phrase d'explication par poste et une relance qui propose d'expliquer le devis en cinq minutes. Voir la page [relance de devis pour électricien](/relance-devis/electricien)." },
          { title: "Un peintre est jugé trop cher", text: "Ses concurrents chiffrent au mètre carré sans préparation. Correction : détailler lessivage, rebouchage, sous-couche et nombre de couches, et le rappeler dans la deuxième relance. Voir la page [relance de devis pour peintre](/relance-devis/peintre)." },
          { title: "Un chauffagiste attend des semaines", text: "Ses clients montent un dossier d'aide et oublient de revenir vers lui. Correction : relances espacées de deux semaines, centrées sur l'avancement du dossier. Voir la page [relance de devis pour chauffagiste](/relance-devis/chauffagiste)." },
        ],
      },
      {
        h2: "Demander la raison d'un refus sans mettre mal à l'aise",
        paragraphs: [
          "La seule façon de connaître la vraie cause, c'est de la demander. Quand un client vous annonce qu'il a choisi quelqu'un d'autre, une question suffit : « Merci de me prévenir. Pour progresser, pourriez-vous me dire ce qui a fait la différence : le prix, le délai ou autre chose ? » La plupart des clients répondent volontiers, parce que la question est posée sans reproche.",
          "Notez chaque réponse dans le dossier du devis. Après quelques mois, une tendance apparaît : si « le délai » revient souvent, c'est votre planning qu'il faut présenter autrement ; si c'est « le prix », c'est la présentation de votre devis qu'il faut retravailler, comme l'explique le guide [augmenter son taux de signature](/guides/augmenter-taux-signature-devis).",
        ],
      },
    ],
    faq: [
      { q: "Comment savoir pourquoi un client a refusé mon devis ?", a: "Demandez-le simplement quand il vous annonce sa décision : prix, délai ou autre raison. Posée sans reproche, la question obtient presque toujours une réponse." },
    ],
    related: [{ href: "/guides/relance-devis-email-ou-telephone", label: "Relance de devis : e-mail ou téléphone ?" }, { href: "/relance-devis/electricien", label: "Relance de devis pour électricien" }],
  },

  // -------------------------------------------------------------------------- TAUX DE SIGNATURE
  "augmenter-taux-signature-devis": {
    updated: UPDATED,
    before: "Mettre ces leviers en place sans y passer ses soirées",
    sections: [
      {
        h2: "Le taux de signature dépend aussi des devis que vous acceptez de faire",
        paragraphs: [
          "Un rendez-vous pris pour un chantier hors de votre zone, hors de votre spécialité ou pour un client qui cherche seulement un prix de comparaison fait baisser votre taux sans que votre méthode soit en cause. Quelques questions au téléphone avant de vous déplacer (délai souhaité, budget envisagé, autres devis demandés) évitent ces déplacements perdus et vous laissent plus de temps pour les dossiers sérieux.",
        ],
      },
      {
        h2: "Exemple de calcul sur un trimestre",
        paragraphs: [
          "Un artisan a envoyé 36 devis entre janvier et mars. À fin avril, 12 sont signés, 15 sont perdus et 9 sont encore en attente. Son taux de signature sur les devis clôturés est de 12 / (12 + 15), soit 44 %. Calculé sur l'ensemble des devis envoyés, il serait de 12 / 36, soit 33 % : les deux chiffres sont justes, mais il faut toujours comparer le même calcul d'un trimestre à l'autre.",
          "Le chiffre le plus utile se trouve souvent ailleurs : parmi les 15 devis perdus, combien ont été relancés deux fois ? Si la réponse est « quatre », le premier levier n'est pas le prix ni la présentation, c'est le suivi. La méthode pour mettre ce suivi en place est décrite dans le guide [suivi des devis](/guides/suivi-des-devis).",
        ],
      },
      {
        h2: "Un plan d'action sur 30 jours",
        steps: [
          { title: "Semaine 1 : mesurer", text: "Listez vos devis des trois derniers mois avec leur statut et leur montant. Calculez votre taux de signature et le délai moyen entre rendez-vous et envoi." },
          { title: "Semaine 2 : accélérer l'envoi", text: "Fixez-vous une règle : tout devis part dans les 48 heures après le rendez-vous. Préparez des modèles de lignes pour vos prestations courantes." },
          { title: "Semaine 3 : programmer les relances", text: "Chaque nouveau devis part avec deux à trois relances programmées. Pour les messages, inspirez-vous des [modèles de mail de relance](/guides/modele-mail-relance-devis)." },
          { title: "Semaine 4 : clarifier le devis", text: "Ajoutez une date de démarrage possible, une durée de validité et une phrase d'explication sur les postes les plus techniques." },
        ],
        outro: [
          "Refaites le calcul trois mois plus tard, sur la même base. L'objectif n'est pas un chiffre magique, mais une progression régulière, expliquée par des actions précises.",
        ],
      },
      {
        h2: "Ce qui ne fait pas signer plus (et coûte cher)",
        list: [
          "Baisser systématiquement ses prix : le taux de signature monte parfois, la marge baisse toujours.",
          "Multiplier les options dans un même devis : le client hésite davantage et repousse sa décision.",
          "Relancer tous les deux jours : les clients intéressés signent, les autres se braquent.",
          "Accepter tous les rendez-vous, même hors de sa zone ou de son métier : le temps passé sur des devis perdus d'avance se fait au détriment des bons dossiers.",
        ],
        outro: [
          "Pour les causes les plus fréquentes d'un devis sans réponse, le guide [pourquoi un devis n'est pas signé](/guides/pourquoi-devis-pas-signe) propose une grille d'autodiagnostic.",
        ],
      },
    ],
    faq: [
      { q: "Faut-il calculer le taux de signature sur les devis envoyés ou clôturés ?", a: "Les deux sont possibles. Le calcul sur les devis clôturés (signés + perdus) est le plus juste à court terme ; l'essentiel est de garder le même calcul d'une période à l'autre." },
    ],
    related: [{ href: "/guides/suivi-des-devis", label: "Suivi des devis" }],
  },

  // -------------------------------------------------------------------------- SUIVI DES DEVIS
  "suivi-des-devis": {
    updated: UPDATED,
    before: "Les indicateurs qui comptent vraiment",
    sections: [
      {
        h2: "Archiver ses devis sans perdre l'historique",
        paragraphs: [
          "Un devis perdu n'est pas un devis à supprimer. Gardez-le, avec sa raison de refus et ses dates : il servira à calculer votre taux de signature, à retrouver un client qui revient l'année suivante et à justifier vos prix si un projet similaire se présente. Un export régulier au format CSV, lisible dans un tableur, permet aussi de transmettre ces chiffres à votre comptable.",
        ],
      },
      {
        h2: "Le modèle de tableau de suivi, colonne par colonne",
        paragraphs: [
          "Si vous démarrez avec un tableur, voici les colonnes indispensables. Moins de colonnes, c'est un suivi incomplet ; davantage, c'est un tableau que vous ne remplirez plus au bout de trois semaines.",
        ],
        list: [
          "Date d'envoi du devis.",
          "Client et moyen de contact préféré (e-mail, téléphone).",
          "Objet du chantier en quelques mots.",
          "Montant HT.",
          "Statut : envoyé, relancé, répondu, gagné, perdu.",
          "Date de la prochaine relance prévue.",
          "Raison du refus, quand vous la connaissez.",
        ],
        outro: [
          "La colonne la plus importante est « prochaine relance » : c'est elle qui transforme un tableau d'archives en outil de travail. Triez votre tableau sur cette colonne chaque lundi, et vous saurez exactement qui recontacter dans la semaine.",
        ],
      },
      {
        h2: "Trois erreurs qui font échouer un suivi de devis",
        steps: [
          { title: "Ne mettre à jour qu'une fois par mois", text: "Les relances partent alors trop tard. Le suivi se fait chaque semaine, dix minutes suffisent." },
          { title: "Oublier de marquer les devis perdus", text: "Le tableau se remplit de devis « en attente » qui ne le sont plus, et le taux de signature devient faux." },
          { title: "Suivre les devis sans programmer les relances", text: "Savoir qu'un devis attend ne suffit pas : il faut une date d'action. Les repères sont dans [quand relancer un devis](/guides/quand-relancer-un-devis)." },
        ],
      },
      {
        h2: "Suivre ses devis quand on travaille à plusieurs",
        paragraphs: [
          "Dans une petite entreprise, les devis sont souvent faits par le dirigeant, envoyés par la personne qui gère l'administratif et relancés par celui qui a le temps. Sans règle commune, deux personnes rappellent le même client, ou personne ne le fait. Désignez un seul responsable du suivi par devis, et notez dans le dossier chaque contact avec le client, même un simple appel.",
          "Le suivi devient aussi un outil de pilotage : le montant des devis en attente donne une idée du chiffre d'affaires possible des prochains mois, et le taux de signature montre si l'effort commercial paie. La façon de lire ces chiffres est détaillée dans [augmenter son taux de signature de devis](/guides/augmenter-taux-signature-devis).",
        ],
      },
    ],
    faq: [
      { q: "Quelles colonnes mettre dans un tableau de suivi des devis ?", a: "Date d'envoi, client, objet, montant, statut, date de la prochaine relance et raison du refus. La date de prochaine relance est la plus importante." },
    ],
    related: [{ href: "/guides/quand-relancer-un-devis", label: "Quand relancer un devis ?" }],
  },

  // -------------------------------------------------------------------------- RÉNOVATION ÉNERGÉTIQUE
  "relance-devis-renovation-energetique": {
    updated: UPDATED,
    before: "Programmer des relances longues sans y penser",
    sections: [
      {
        h2: "Les étapes du dossier d'aide et la relance qui correspond",
        paragraphs: [
          "Un client qui sollicite une aide à la rénovation passe par plusieurs étapes. Votre relance sera bien accueillie si elle colle à l'étape où il se trouve, plutôt que de lui demander une signature qu'il ne peut pas encore donner.",
        ],
        steps: [
          { title: "Le client vient de recevoir les devis", text: "Relance à J+7 : proposez d'expliquer la solution technique et vérifiez qu'il a toutes les informations demandées pour le dossier (puissance, performances, références)." },
          { title: "Le dossier est déposé", text: "Relance toutes les deux à trois semaines : demandez où en est l'instruction et proposez les pièces techniques qui pourraient manquer." },
          { title: "L'aide est accordée", text: "C'est le moment décisif : le client va choisir son installateur dans les jours qui suivent. Une relance avec une date d'installation précise fait souvent la différence." },
          { title: "Le dossier est refusé ou réduit", text: "Proposez une variante ou un phasage plutôt que d'abandonner : le projet reste souvent pertinent avec un budget revu." },
        ],
      },
      {
        h2: "Exemple : une pompe à chaleur relancée pendant dix semaines",
        paragraphs: [
          "Un chauffagiste remet un devis de pompe à chaleur air-eau début février. Le client attend une réponse à sa demande d'aide. Relance à J+7 : explication du niveau sonore de l'unité extérieure, sujet qui inquiétait les voisins. Relance à J+21 : envoi de la fiche technique demandée par le conseiller. Relance à J+42 : simple point d'étape. À J+63, le client annonce l'accord de son aide et signe dans la semaine.",
          "Sans ces relances, le client aurait très bien pu signer avec un autre installateur qui l'aurait appelé ce jour-là. La page [relance de devis pour chauffagiste](/relance-devis/chauffagiste) donne les délais propres aux chaudières, pompes à chaleur et climatisations.",
        ],
      },
      {
        h2: "Isolation, menuiseries, rénovation globale : qui relance quoi",
        paragraphs: [
          "Dans une rénovation énergétique, plusieurs entreprises interviennent souvent sur le même dossier. Le client attend parfois tous les devis avant de décider : celui du [couvreur](/relance-devis/couvreur) pour l'isolation de la toiture, celui du [menuisier](/relance-devis/menuisier) pour les fenêtres, celui de l'entreprise de [rénovation](/relance-devis/renovation) pour le reste. Votre relance peut proposer de vous coordonner avec les autres intervenants : c'est un vrai service pour un client perdu entre plusieurs devis.",
          "Restez prudent sur les montants d'aide et les économies d'énergie : ne promettez rien que vous ne pouvez garantir, et renvoyez vers les simulateurs officiels et l'accompagnateur du client. Vous gagnez la confiance en aidant sur ce que vous maîtrisez : la technique, les documents et le planning.",
        ],
      },
    ],
    faq: [
      { q: "Quand relancer un client dont l'aide vient d'être accordée ?", a: "Immédiatement, avec une date d'installation précise : c'est le moment où il choisit son entreprise, souvent dans les jours qui suivent l'accord." },
    ],
    related: [{ href: "/relance-devis/renovation", label: "Relance de devis de rénovation" }],
  },
};

// ============================================================================ MÉTIERS

export const METIER_ENRICHMENTS: Record<string, Enrichment> = {
  // -------------------------------------------------------------------------- PLOMBIER
  plombier: {
    updated: UPDATED,
    before: "Relancer sans y penser avec Artisan Relance",
    sections: [
      {
        h2: "Adaptation de salle de bain pour une personne âgée : une relance à part",
        paragraphs: [
          "Remplacer une baignoire par une douche de plain-pied, poser des barres d'appui, rehausser un WC : ces devis concernent souvent des clients âgés, accompagnés par un enfant qui participe à la décision. La relance doit donc parfois s'adresser à deux personnes, avec l'accord du client, et laisser le temps d'en parler en famille.",
          "Privilégiez l'appel à la deuxième relance plutôt qu'un troisième e-mail, et proposez de repasser sur place pour montrer un échantillon de receveur antidérapant. Pour la forme des messages, les [modèles de mail de relance](/guides/modele-mail-relance-devis) donnent une base à adapter, et le guide [relance de devis : e-mail ou téléphone](/guides/relance-devis-email-ou-telephone) aide à choisir le bon canal.",
        ],
      },
    ],
    faq: [
      { q: "Comment relancer un devis de douche pour une personne âgée ?", a: "Par un appel à la deuxième relance plutôt qu'un nouvel e-mail, en proposant de repasser montrer les équipements. Si le client le souhaite, ajoutez un proche qui participe à la décision." },
    ],
  },

  // -------------------------------------------------------------------------- ÉLECTRICIEN
  electricien: {
    updated: UPDATED,
    before: "Automatiser les relances de vos devis d'électricité",
    sections: [
      {
        h2: "Borne de recharge : un devis qui se décide avec la voiture",
        paragraphs: [
          "Le devis de borne de recharge suit presque toujours l'achat d'un véhicule électrique. Le client a une date en tête : la livraison de sa voiture. Avant cette date, il compare ; après, il est pressé. Votre relance doit donc se caler sur la date de livraison qu'il vous a donnée lors de la visite, et proposer une installation juste avant.",
          "Les questions qui bloquent sont souvent les mêmes : faut-il augmenter la puissance de l'abonnement, la borne fonctionnera-t-elle avec le tableau existant, faut-il l'accord de la copropriété pour un parking collectif. Répondez à l'une d'elles dans chaque relance plutôt que de demander une décision. Si le client hésite entre une prise renforcée et une borne murale, expliquez la différence de temps de charge en une phrase.",
        ],
      },
      {
        h2: "Exemple de séquence pour une rénovation électrique complète",
        steps: [
          { title: "J+5 : la vérification", text: "« Avez-vous pu parcourir le devis ? Je peux vous expliquer le schéma des circuits en cinq minutes. »" },
          { title: "J+14 : l'information utile", text: "Le planning coordonné avec le plaquiste et le peintre, et le nombre de jours sans électricité dans chaque pièce." },
          { title: "J+21 : l'appel", text: "Pour lever le doute qui reste : le budget, le choix des appareillages ou l'ordre des travaux." },
          { title: "J+30 : la clôture", text: "Un message court qui rappelle la durée de validité du devis et laisse la porte ouverte." },
        ],
        outro: [
          "Le rythme général et les raisons de ces écarts sont expliqués dans [quand relancer un devis](/guides/quand-relancer-un-devis). Si les devis restent malgré tout sans réponse, la grille du guide [pourquoi un devis n'est pas signé](/guides/pourquoi-devis-pas-signe) aide à trouver la cause.",
        ],
      },
    ],
    faq: [
      { q: "Quand relancer un devis de borne de recharge ?", a: "Juste avant la date de livraison du véhicule que le client vous a indiquée, en proposant un créneau d'installation précis." },
    ],
  },

  // -------------------------------------------------------------------------- COUVREUR
  couvreur: {
    updated: UPDATED,
    before: "Des relances automatiques adaptées aux longs délais de décision",
    sections: [
      {
        h2: "Les documents qui font avancer un devis de toiture",
        list: [
          "Les photos prises sur le toit, légendées : tuiles cassées, faîtage, solins, état des liteaux.",
          "La fiche du modèle de tuile ou d'ardoise proposé, avec sa couleur réelle.",
          "Votre attestation d'assurance décennale en cours de validité.",
          "Pour un sinistre, un récapitulatif des dégâts que le client peut transmettre à son assureur.",
        ],
      },
      {
        h2: "Relancer au rythme des saisons",
        paragraphs: [
          "La couverture est le métier du bâtiment le plus dépendant de la météo, et vos relances doivent en tenir compte. À l'automne, les clients qui ont constaté une fuite veulent une intervention avant les pluies : relancez vite, en proposant une date. En hiver, les réfections complètes se préparent pour le printemps : relancez moins souvent, mais rappelez que les créneaux de mars et avril partent les premiers. Au printemps et en été, la demande est forte et les clients comparent beaucoup : mettez en avant votre date de démarrage et la durée du chantier.",
          "Après un épisode de grêle ou de tempête, la situation change encore. Les demandes affluent, les clients attendent l'expert de leur assurance et choisissent souvent l'entreprise qui les aide dans leurs démarches. Une relance qui propose d'envoyer les photos de la toiture et le détail des dégâts directement à l'expert est un vrai service, bien plus convaincant qu'une simple demande de signature.",
        ],
      },
      {
        h2: "Démoussage, zinguerie, fenêtres de toit : des petits devis à ne pas négliger",
        paragraphs: [
          "Les petits devis de couverture (démoussage et traitement, remplacement d'une gouttière, pose d'une fenêtre de toit, réparation d'un faîtage) se relancent comme des devis de dépannage programmé : deux relances en une semaine, puis un appel. Ils rapportent moins, mais ils créent une relation : un client satisfait d'un démoussage pensera à vous le jour où il refera sa toiture.",
          "Pour ces devis, une seule information fait souvent signer : la date. « Je peux passer le 18, la météo annoncée est sèche » vaut toutes les relances génériques. Les formulations courtes adaptées aux petits travaux sont rassemblées dans les [exemples de SMS de relance](/guides/exemple-sms-relance-devis).",
        ],
      },
      {
        h2: "Exemple : un devis de réfection relancé sur six semaines",
        paragraphs: [
          "Un couvreur visite une maison des années 1970 en janvier : tuiles poreuses, liteaux fatigués, pas d'écran sous-toiture. Il envoie un devis de réfection complète de 16 500 € avec photos. Relance à J+7 : il propose de comparer les tuiles en terre cuite et en béton lors d'un passage. Relance à J+21 : il annonce que deux semaines d'avril sont encore libres. À J+30, il appelle : le client a reçu un devis plus bas, sans dépose des liteaux. Le couvreur explique la différence et envoie une liste ligne à ligne. Signature à J+38.",
          "La clé : chaque relance a apporté un élément nouveau, et la troisième a pris la forme d'un appel, au moment où le client avait besoin d'une explication. Pour le choix du canal, voyez [relance de devis : e-mail ou téléphone](/guides/relance-devis-email-ou-telephone).",
        ],
      },
      {
        h2: "Isolation de toiture et aides : coordonner les relances",
        paragraphs: [
          "Quand le devis comprend une isolation de la toiture ou des combles, le client vérifie souvent son éligibilité à une aide avant de signer. Espacez alors les relances de deux à trois semaines et demandez où en est le dossier, comme l'explique le guide [relance de devis de rénovation énergétique](/guides/relance-devis-renovation-energetique). Si un autre artisan intervient sur le même projet, proposez de vous coordonner : le client apprécie de ne pas jouer les intermédiaires.",
        ],
      },
    ],
    faq: [
      { q: "Comment relancer un devis de couverture en hiver ?", a: "Moins souvent qu'au printemps, mais en rappelant que les premiers créneaux de la saison partent vite. Proposez de réserver une période de chantier sans engagement ferme de date." },
      { q: "Comment relancer un petit devis de démoussage ou de gouttière ?", a: "Comme un dépannage programmé : deux relances en une semaine, avec une date de passage précise, puis un appel." },
    ],
    related: [{ href: "/guides/relance-devis-email-ou-telephone", label: "Relance de devis : e-mail ou téléphone ?" }],
  },

  // -------------------------------------------------------------------------- CHAUFFAGISTE
  chauffagiste: {
    updated: UPDATED,
    before: "Des relances qui suivent le rythme des dossiers d'aides",
    sections: [
      {
        h2: "Pompe à chaleur ou chaudière : répondre à l'hésitation du client",
        paragraphs: [
          "Beaucoup de devis de chauffage restent en attente parce que le client hésite entre deux solutions, souvent après avoir lu des avis contradictoires. La relance peut l'aider à trancher sans le pousser : rappelez en deux phrases les conditions dans lesquelles chaque solution est adaptée (isolation du logement, type d'émetteurs, place disponible), puis proposez un appel pour en parler. Un client qui comprend pourquoi vous recommandez une solution vous fait davantage confiance pour l'installer.",
        ],
      },
      {
        h2: "Relancer selon la saison de chauffe",
        paragraphs: [
          "Les décisions de chauffage suivent le calendrier. En septembre et octobre, les clients se souviennent des factures de l'hiver précédent et veulent changer d'installation avant les premiers froids : relancez vite et proposez une date d'installation avant novembre. En plein hiver, les remplacements se font souvent dans l'urgence, après une panne : la disponibilité prime sur tout le reste. Au printemps, les projets de pompe à chaleur se préparent plus calmement ; c'est la période où les relances espacées et pédagogiques fonctionnent le mieux.",
          "Pour la climatisation, le calendrier est inversé : les demandes explosent aux premières chaleurs, et les clients choisissent l'installateur qui peut poser le plus tôt. Une relance rapide, avec une date, vaut mieux qu'un long argumentaire.",
        ],
      },
      {
        h2: "Exemple : remplacement d'une chaudière fioul",
        paragraphs: [
          "Un chauffagiste remet en avril un devis de remplacement d'une chaudière fioul par une pompe à chaleur air-eau, avec une option de ballon thermodynamique. Le client veut solliciter une aide et comparer deux installateurs. Relance à J+7 : explication de la puissance retenue, calculée à partir de la surface et de l'isolation de la maison. Relance à J+21 : envoi de la fiche technique de l'unité extérieure, avec son niveau sonore. Relance à J+35 : point sur le dossier d'aide. Le client répond à J+40 : il a obtenu son accord et souhaite une installation fin juin.",
          "À aucun moment le chauffagiste n'a demandé « avez-vous pris une décision ? ». Chaque message répondait à une question que le client se posait. Le déroulé complet d'un dossier d'aide est détaillé dans le guide [relance de devis de rénovation énergétique](/guides/relance-devis-renovation-energetique).",
        ],
      },
      {
        h2: "Les erreurs propres aux devis de chauffage",
        list: [
          "Promettre un montant d'aide ou un pourcentage d'économie : si la réalité est différente, la confiance est perdue.",
          "Relancer pendant l'instruction du dossier en demandant une signature : le client ne peut pas encore s'engager.",
          "Oublier de rappeler la durée de validité du devis : les prix des équipements évoluent, et un devis trop ancien doit être mis à jour.",
          "Ne pas relancer les devis remis lors d'un entretien : ce sont pourtant les clients qui vous connaissent le mieux.",
          "Envoyer la même relance à un client en panne et à un client en projet : leurs attentes n'ont rien à voir.",
        ],
        outro: [
          "Pour le nombre de relances à prévoir selon le montant et l'urgence, voyez [combien de relances envoyer pour un devis](/guides/combien-de-relances-devis). Pour les autres métiers de l'installation, la page [relance de devis pour plombier](/relance-devis/plombier) traite des chauffe-eau et salles de bain.",
        ],
      },
      {
        h2: "Les documents à proposer dans vos relances",
        list: [
          "La fiche technique de l'équipement proposé, avec ses performances et son niveau sonore.",
          "Votre qualification RGE, quand le client sollicite une aide qui l'exige.",
          "Une estimation de l'emplacement de l'unité extérieure et du ballon, sur photo ou sur plan.",
          "Les conditions d'entretien et de garantie de l'appareil.",
        ],
      },
    ],
    faq: [
      { q: "Comment relancer un client qui hésite entre pompe à chaleur et chaudière ?", a: "Rappelez en deux phrases dans quels cas chaque solution est adaptée à son logement, puis proposez un appel. Un client qui comprend votre recommandation vous fait confiance pour l'installation." },
      { q: "Quand relancer un devis de climatisation ?", a: "Vite : à J+4 puis J+10, avec une date d'installation. Aux premières chaleurs, les clients choisissent l'installateur qui peut poser le plus tôt." },
      { q: "Faut-il annoncer un montant d'aide dans une relance de pompe à chaleur ?", a: "Non. Renvoyez vers les simulateurs officiels et l'accompagnateur du client, et proposez plutôt les documents techniques dont son dossier a besoin." },
    ],
    related: [{ href: "/guides/relance-devis-renovation-energetique", label: "Relance de devis de rénovation énergétique" }, { href: "/guides/combien-de-relances-devis", label: "Combien de relances envoyer ?" }],
  },

  // -------------------------------------------------------------------------- PEINTRE
  peintre: {
    updated: UPDATED,
    before: "Automatiser les relances de vos devis de peinture",
    sections: [
      {
        h2: "Les documents qui rassurent avant un chantier de peinture",
        list: [
          "La fiche technique de la peinture proposée : finition, lessivabilité, classe d'émission.",
          "Le nuancier ou la référence exacte de la teinte choisie.",
          "Le planning pièce par pièce, pour les clients qui restent dans le logement pendant les travaux.",
          "Des photos de réalisations comparables, avec l'accord des clients concernés.",
        ],
        outro: [
          "Proposer l'un de ces documents dans chaque relance donne une raison concrète de vous recontacter, sans jamais demander directement une décision.",
        ],
      },
      {
        h2: "Ravalement de façade : une relance en plusieurs étapes",
        paragraphs: [
          "Le ravalement n'a rien à voir avec la peinture intérieure. Les montants sont plus élevés, la décision peut dépendre d'une copropriété, d'une déclaration préalable en mairie ou de contraintes de couleur dans certaines communes, et la météo fixe la période possible des travaux. Le client a besoin d'être accompagné, pas d'être pressé.",
          "Relancez à J+7 en proposant de l'aider sur les démarches (nuancier autorisé, pièces pour la déclaration), puis toutes les deux semaines. Dans une copropriété, mettez le syndic et un membre du conseil syndical en destinataires et calez une relance juste avant l'assemblée générale, en proposant une version synthétique du devis à joindre à la convocation. La méthode générale des projets longs est décrite dans [combien de relances envoyer pour un devis](/guides/combien-de-relances-devis).",
        ],
      },
      {
        h2: "Le client qui hésite à peindre lui-même",
        paragraphs: [
          "C'est la concurrence la plus fréquente du peintre : le client lui-même. Il compare votre devis au prix de quelques pots de peinture et se demande s'il ne peut pas faire le travail un week-end. La relance ne doit pas le contredire, mais lui donner les éléments pour comparer honnêtement : le temps réel de préparation des murs, le matériel nécessaire, le rendu des angles et des plafonds, la protection du mobilier et le nettoyage.",
          "Une phrase suffit souvent : « Pour une pièce de cette taille, la préparation représente plus de la moitié du temps de travail ; c'est elle qui fait tenir la peinture dans le temps. » Proposez aussi une solution intermédiaire : vous prenez en charge les plafonds et les pièces difficiles, le client fait le reste. Vous gardez une partie du chantier plutôt que de le perdre entièrement.",
        ],
      },
      {
        h2: "Exemple : un appartement à repeindre avant une mise en location",
        paragraphs: [
          "Un propriétaire demande un devis pour repeindre un T3 entre deux locataires. Le peintre envoie le devis le lundi (3 400 €). Relance à J+3 : il rappelle que le chantier dure six jours et propose de démarrer le lendemain du départ du locataire. Le propriétaire répond qu'il attend un autre devis. Relance à J+7 : le peintre détaille ce que comprend son prix (rebouchage, ponçage, sous-couche, deux couches lessivables, protection des sols). Signature le lendemain : le propriétaire avait compris que le devis concurrent ne comptait qu'une couche.",
          "Sur ces chantiers liés à une date (location, vente, emménagement), la relance la plus forte est toujours celle qui sécurise le calendrier du client. Le guide [quand relancer un devis](/guides/quand-relancer-un-devis) explique comment caler les relances sur ces échéances.",
        ],
      },
      {
        h2: "Papier peint, enduits décoratifs, sols : relancer avec des échantillons",
        paragraphs: [
          "Pour les revêtements décoratifs, le blocage vient rarement du prix : le client hésite sur un motif, une couleur ou une texture. Proposez d'apporter des échantillons ou d'envoyer des photos de réalisations comparables. Une relance qui aide à choisir avance plus vite qu'une relance qui demande de choisir. Pour formuler ce message, inspirez-vous des [exemples de mail de relance de devis](/guides/modele-mail-relance-devis).",
        ],
      },
    ],
    faq: [
      { q: "Faut-il joindre un nuancier à une relance de devis de peinture ?", a: "Oui quand le client hésite sur une teinte : envoyez la référence exacte ou proposez d'apporter le nuancier. Une relance qui aide à choisir avance plus vite qu'une relance qui demande de choisir." },
      { q: "Comment relancer un devis de ravalement de façade ?", a: "À J+7 en proposant votre aide pour les démarches, puis toutes les deux semaines. En copropriété, ajoutez le syndic en destinataire et relancez avant l'assemblée générale." },
      { q: "Que répondre à un client qui veut peindre lui-même ?", a: "Ne le contredisez pas : expliquez le temps de préparation réel et proposez une solution partagée, par exemple les plafonds et les pièces difficiles réalisés par vous." },
    ],
    related: [{ href: "/guides/exemple-sms-relance-devis", label: "Exemples de SMS de relance" }],
  },

  // -------------------------------------------------------------------------- MENUISIER
  menuisier: {
    updated: UPDATED,
    before: "Des relances automatiques pour vos devis de menuiserie",
    sections: [
      {
        h2: "Les documents à joindre à vos relances de menuiserie",
        list: [
          "La fiche technique des menuiseries proposées : matériau, vitrage, performances thermiques et acoustiques annoncées par le fabricant.",
          "Un schéma ou un plan coté pour l'agencement sur mesure.",
          "Le nuancier des coloris et des finitions disponibles.",
          "Des photos de poses comparables, intérieur et extérieur.",
          "Votre attestation d'assurance décennale.",
        ],
        outro: [
          "Un client qui reçoit ces éléments au fil des relances dispose de tout ce qu'il faut pour décider, et pour expliquer son choix à son conjoint. Avec un outil de relance, vous pouvez joindre ces fichiers dès l'envoi du devis : ils restent disponibles dans chaque message suivant.",
        ],
      },
      {
        h2: "Face à une grande enseigne : relancer sur la pose, pas sur le prix",
        paragraphs: [
          "Le client qui compare votre devis de fenêtres à celui d'une grande enseigne compare souvent un prix de produit à un prix de chantier. La relance est l'occasion de rendre la comparaison honnête : type de pose (dépose totale ou pose en rénovation sur l'ancien dormant), traitement des finitions intérieures, évacuation des anciennes menuiseries, réglages après la pose, interlocuteur unique en cas de problème.",
          "Ne critiquez jamais l'autre offre. Proposez plutôt une comparaison ligne à ligne au téléphone, ou envoyez une courte liste de questions à poser à chaque entreprise. Le client qui découvre lui-même ce que comprend chaque devis prend une décision mieux informée, souvent en votre faveur. Les autres causes fréquentes de devis non signés sont réunies dans [pourquoi un devis n'est pas signé](/guides/pourquoi-devis-pas-signe).",
        ],
      },
      {
        h2: "Escalier, cuisine, dressing : le sur-mesure demande une relance par étape",
        steps: [
          { title: "Après le premier devis", text: "Relance à J+7 qui propose un rendez-vous d'ajustement : finitions, poignées, éclairage, rangements intérieurs. Le client qui se projette avance." },
          { title: "Après le devis ajusté", text: "Relance à J+10 qui rappelle le délai de fabrication en atelier et propose une date de métré définitif." },
          { title: "Avant la clôture", text: "Message à J+30 qui annonce la fin de validité du devis, car le prix des panneaux et de la quincaillerie peut évoluer." },
        ],
        outro: [
          "Sur ces projets, chaque version du devis relance le compteur : programmez une nouvelle série de relances à chaque envoi d'une version modifiée, plutôt que de poursuivre l'ancienne.",
        ],
      },
      {
        h2: "Exemple : une porte d'entrée et quatre fenêtres",
        paragraphs: [
          "Un menuisier envoie en septembre un devis de 8 900 € pour une porte d'entrée et quatre fenêtres. Relance à J+5 : il propose de passer avec deux échantillons de couleur pour la porte. Relance à J+15 : il rappelle que la fabrication prend six semaines et qu'une commande avant la fin du mois permet une pose avant les premiers froids. La cliente répond qu'elle hésite sur le vitrage. Appel à J+17 : explication de la différence entre double vitrage standard et vitrage renforcé côté rue. Signature à J+20, avec le vitrage renforcé sur une seule fenêtre.",
          "Le menuisier a vendu une option sans la pousser, simplement en répondant à une question au bon moment. Le moment de chaque relance est détaillé dans [quand relancer un devis](/guides/quand-relancer-un-devis).",
        ],
      },
      {
        h2: "Les erreurs qui font perdre un devis de menuiserie",
        list: [
          "Ne pas indiquer le délai de fabrication : le client croit pouvoir décider plus tard sans conséquence.",
          "Laisser une question technique sans réponse écrite (vitrage, coloris, sens d'ouverture).",
          "Relancer avec l'ancien devis alors qu'une version modifiée a été envoyée.",
          "Oublier les contraintes de copropriété ou d'urbanisme pour les menuiseries visibles depuis la rue.",
          "Promettre une économie d'énergie chiffrée que vous ne pouvez pas garantir.",
        ],
      },
    ],
    faq: [
      { q: "Comment relancer un devis de fenêtres moins compétitif qu'une grande enseigne ?", a: "Comparez honnêtement les deux offres sur la pose, les finitions et le service après-pose, sans critiquer l'autre entreprise. Proposez une comparaison ligne à ligne au téléphone." },
      { q: "Quels documents envoyer avec une relance de menuiserie ?", a: "La fiche technique des menuiseries, le nuancier des coloris, un plan coté pour le sur-mesure, des photos de poses comparables et votre attestation décennale." },
      { q: "Faut-il relancer chaque nouvelle version d'un devis de menuiserie ?", a: "Oui. Chaque version modifiée relance la réflexion du client : programmez une nouvelle série de relances à partir de son envoi." },
      { q: "Comment relancer un devis d'escalier sur mesure ?", a: "En proposant un rendez-vous d'ajustement à J+7, puis en rappelant le délai de fabrication en atelier à la relance suivante." },
    ],
    related: [{ href: "/guides/pourquoi-devis-pas-signe", label: "Pourquoi un devis n'est pas signé" }, { href: "/guides/quand-relancer-un-devis", label: "Quand relancer un devis ?" }],
  },

  // -------------------------------------------------------------------------- RÉNOVATION
  renovation: {
    updated: UPDATED,
    before: "Relancer sans y penser avec Artisan Relance",
    sections: [
      {
        h2: "Coordonner les corps d'état dans la relance",
        paragraphs: [
          "Le client qui rénove craint surtout le désordre : des artisans qui ne se parlent pas, des retards en cascade, un chantier qui s'éternise. Votre relance peut répondre à cette peur en montrant que vous coordonnez tout : ordre d'intervention (démolition, réseaux, cloisons, sols, peinture, cuisine), durée de chaque étape et interlocuteur unique pendant le chantier. Un planning simple, même approximatif, rassure davantage qu'un argument commercial.",
        ],
      },
      {
        h2: "Proposer un phasage plutôt qu'une remise",
        paragraphs: [
          "Quand le montant total bloque, la remise est rarement la bonne réponse : elle entame votre marge et laisse penser que le premier prix était gonflé. Le phasage, lui, garde le chantier entier à son juste prix tout en le rendant accessible. Proposez de réaliser d'abord ce qui est prioritaire (mise en sécurité électrique, plomberie, isolation), puis les finitions quelques mois plus tard.",
          "Présentez le phasage dans une relance dédiée, avec deux devis séparés et une date pour chaque tranche. Le client garde la maîtrise de son budget, et vous gardez un chantier qui, sinon, serait parti chez un concurrent ou aurait été abandonné. Les causes de devis non signés liées au prix sont développées dans [pourquoi un devis n'est pas signé](/guides/pourquoi-devis-pas-signe).",
        ],
      },
      {
        h2: "Rénover un logement acheté : relancer au rythme de la vente",
        paragraphs: [
          "Beaucoup de devis de rénovation sont demandés avant ou juste après l'achat d'un logement. Le client attend la signature de l'acte de vente, le déblocage de son prêt ou la libération des lieux. Relancer avant ces dates ne sert à rien : il ne peut pas s'engager. Demandez-lui le calendrier de la vente lors de la visite, et programmez la première vraie relance juste après la date de signature chez le notaire.",
          "Entre-temps, une relance utile peut proposer de l'aider à préparer son dossier de prêt travaux avec un devis clair, ou d'ajuster le planning pour que le chantier démarre dès la remise des clés. Le guide [quand relancer un devis](/guides/quand-relancer-un-devis) détaille comment caler une relance sur une échéance du client.",
        ],
      },
      {
        h2: "Exemple : rénovation complète d'un appartement de 70 m²",
        paragraphs: [
          "Une entreprise de rénovation remet un devis de 46 000 € pour un appartement : électricité, plomberie, cloisons, sols, peinture et cuisine. Relance à J+5 : proposition de parcourir le devis ensemble. Le rendez-vous a lieu à J+9 et révèle deux inquiétudes : le budget et la durée pendant laquelle le logement sera inhabitable. Relance à J+16 : un planning semaine par semaine et un phasage qui reporte la cuisine de trois mois. Relance à J+30 : point d'étape pendant que la banque étudie le prêt. Signature à J+41.",
          "Ce chantier aurait pu se perdre à chaque étape. Ce qui l'a gardé ouvert, c'est une relance utile à chaque fois, jamais une demande de décision. Pour le nombre de relances à prévoir sur un projet de cette taille, voyez [combien de relances envoyer pour un devis](/guides/combien-de-relances-devis).",
        ],
      },
    ],
    faq: [
      { q: "Comment rassurer un client qui craint un chantier de rénovation interminable ?", a: "Envoyez un planning simple avec l'ordre d'intervention des corps d'état et la durée de chaque étape, et indiquez qui sera son interlocuteur unique pendant les travaux." },
      { q: "Faut-il proposer une remise sur un gros devis de rénovation ?", a: "Rarement. Un phasage des travaux, avec deux devis et deux dates, rend le projet accessible sans baisser votre prix ni votre marge." },
    ],
    related: [{ href: "/guides/pourquoi-devis-pas-signe", label: "Pourquoi un devis n'est pas signé" }, { href: "/relance-devis/electricien", label: "Relance de devis pour électricien" }],
  },
};
