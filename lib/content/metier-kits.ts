/**
 * « Kit de relance » par métier : ce que les pages /relance-devis/[metier] affichent
 * en plus de l'article — délais idéaux, modèles d'e-mails et de SMS, erreurs à
 * éviter, et les réglages du générateur intégré.
 *
 * Aucun chiffre de conversion inventé : le simulateur fait calculer l'artisan
 * avec SES chiffres. Les SMS sont des modèles à envoyer depuis son téléphone
 * (Artisan Relance relance par e-mail).
 */

export interface KitDelay {
  moment: string;
  action: string;
  channel: "E-mail" | "SMS" | "Appel" | "E-mail ou appel";
}

export interface KitMessage {
  label: string;
  subject?: string;
  body: string;
}

export interface MetierKit {
  /** Question longue traîne en H1 et en title */
  question: string;
  title: string;
  description: string;
  /** Exemple de travaux pour le générateur (1er = défaut) */
  works: string[];
  delays: KitDelay[];
  emails: KitMessage[];
  sms: KitMessage[];
  mistakes: string[];
}

export const METIER_KITS: Record<string, MetierKit> = {
  plombier: {
    question: "Comment relancer un devis de plomberie ?",
    title: "Relancer un devis de plomberie : modèles mail et SMS",
    description:
      "Relancer un devis de plomberie : délais idéaux, 3 modèles d'e-mail, 3 SMS prêts à copier, erreurs à éviter et générateur de relance gratuit.",
    works: ["la rénovation de votre salle de bain", "le remplacement de votre chauffe-eau", "la création d'une douche à l'italienne", "la reprise du réseau d'eau", "l'adaptation PMR de votre salle d'eau"],
    delays: [
      { moment: "J+3", action: "Chauffe-eau ou petite intervention : premier rappel court", channel: "E-mail" },
      { moment: "J+5", action: "Salle de bain : relance avec une question ouverte sur le projet", channel: "E-mail" },
      { moment: "J+12", action: "Deuxième relance avec une info utile (délai de démarrage, choix du mitigeur)", channel: "E-mail" },
      { moment: "J+15", action: "Message court si aucune nouvelle", channel: "SMS" },
      { moment: "J+25", action: "Message de clôture poli, la porte reste ouverte", channel: "E-mail ou appel" },
    ],
    emails: [
      {
        label: "Relance 1 — question ouverte",
        subject: "Votre projet de salle de bain — devis du {date_envoi}",
        body: "Bonjour {client},\n\nAvez-vous pu regarder le devis de rénovation de votre salle de bain envoyé le {date_envoi} ?\n\nSi un poste vous semble flou (receveur, mitigeur thermostatique, évacuation), je vous l'explique volontiers en deux minutes.\n\nBonne journée,",
      },
      {
        label: "Relance 2 — information utile",
        subject: "Re: votre devis de salle de bain",
        body: "Bonjour {client},\n\nPetite information pour vous aider à décider : à ce jour, je peux démarrer le chantier sous trois semaines, pour une durée d'environ cinq jours.\n\nJe peux aussi proposer une variante si le budget doit être ajusté.\n\nBien cordialement,",
      },
      {
        label: "Relance 3 — clôture",
        subject: "Re: votre devis de salle de bain",
        body: "Bonjour {client},\n\nSans nouvelles de votre part, je suppose que le projet est reporté ou confié à un autre professionnel, ce que je comprends tout à fait.\n\nLe devis reste valable jusqu'à sa date d'échéance si vous souhaitez y revenir.\n\nBien cordialement,",
      },
    ],
    sms: [
      { label: "SMS après le premier e-mail", body: "Bonjour {client}, c'est {entreprise}. Je vous ai renvoyé le devis de votre salle de bain par mail. Une question ? Je reste dispo. Bonne journée" },
      { label: "SMS disponibilité", body: "Bonjour {client}, une place s'est libérée dans mon planning dans 3 semaines pour votre salle de bain. Voulez-vous que je la bloque ? {entreprise}" },
      { label: "SMS clôture", body: "Bonjour {client}, je clôture votre dossier salle de bain sauf avis contraire. Le devis reste valable, n'hésitez pas à me recontacter. {entreprise}" },
    ],
    mistakes: [
      "Relancer un dépannage déjà fait au lieu des devis de projet, ceux qui se perdent vraiment.",
      "Envoyer « Avez-vous reçu mon devis ? » : la question n'apporte rien et appelle un simple oui.",
      "Mettre la pression dès la première relance (« sans réponse, je considère le dossier clos »).",
      "Relancer pendant que le client attend un rendez-vous en magasin pour choisir son carrelage : demandez-lui plutôt quand il y va.",
      "Laisser le devis sans date de validité : le client n'a aucune raison de décider maintenant.",
    ],
  },

  electricien: {
    question: "Comment relancer un devis d'électricité ?",
    title: "Relancer un devis d'électricité : modèles mail et SMS",
    description:
      "Relancer un devis d'électricien : mise aux normes, rénovation, borne de recharge. Délais, modèles d'e-mail et SMS, erreurs à éviter, générateur gratuit.",
    works: ["la mise aux normes de votre tableau électrique", "la rénovation électrique complète", "l'installation d'une borne de recharge", "le remplacement de vos radiateurs électriques", "l'installation d'une VMC"],
    delays: [
      { moment: "J+4", action: "Première relance : rappeler l'enjeu de sécurité ou de confort, sans dramatiser", channel: "E-mail" },
      { moment: "J+10", action: "Deuxième relance avec une info concrète (aide, délai, matériel disponible)", channel: "E-mail" },
      { moment: "J+12", action: "Rappel bref pour proposer un appel", channel: "SMS" },
      { moment: "J+21", action: "Clôture polie", channel: "E-mail ou appel" },
    ],
    emails: [
      {
        label: "Relance 1 — mise aux normes",
        subject: "Votre devis de mise aux normes électrique",
        body: "Bonjour {client},\n\nJe reviens vers vous au sujet du devis envoyé le {date_envoi} pour la mise aux normes de votre installation.\n\nSi vous le souhaitez, je vous explique poste par poste ce qui est prioritaire et ce qui peut attendre : on peut aussi phaser les travaux.\n\nBonne journée,",
      },
      {
        label: "Relance 2 — borne de recharge",
        subject: "Re: votre devis de borne de recharge",
        body: "Bonjour {client},\n\nPour compléter mon devis : le matériel prévu est disponible et je peux intervenir sous deux semaines. L'installation se fait en une journée.\n\nVoulez-vous que je vous réserve un créneau ?\n\nBien cordialement,",
      },
      {
        label: "Relance 3 — clôture",
        subject: "Re: votre devis d'électricité",
        body: "Bonjour {client},\n\nJe n'ai pas eu de retour sur mon devis, je suppose que le projet est en pause. Je reste disponible si vous souhaitez en reparler.\n\nBien cordialement,",
      },
    ],
    sms: [
      { label: "SMS après envoi", body: "Bonjour {client}, {entreprise} ici. Je vous ai envoyé le devis électricité par mail. Si vous voulez qu'on le passe en revue ensemble, appelez-moi. Bonne journée" },
      { label: "SMS phasage", body: "Bonjour {client}, si le budget bloque, on peut faire la mise en sécurité d'abord et le reste plus tard. On en parle ? {entreprise}" },
      { label: "SMS clôture", body: "Bonjour {client}, je clôture votre dossier électricité sauf avis contraire. Le devis reste valable. {entreprise}" },
    ],
    mistakes: [
      "Faire peur (« risque d'incendie ») au lieu d'expliquer calmement ce qui est prioritaire.",
      "Envoyer un devis trop technique sans résumé : le client ne sait pas ce qu'il achète.",
      "Oublier de proposer un phasage quand le montant fait hésiter.",
      "Relancer une seule fois puis abandonner un devis de rénovation complète, qui se décide lentement.",
      "Ne pas préciser la durée de coupure de courant : c'est une question que tous les clients se posent.",
    ],
  },

  couvreur: {
    question: "Comment relancer un devis de toiture ?",
    title: "Relancer un devis de toiture : modèles mail et SMS",
    description:
      "Relancer un devis de couvreur : réfection de toiture, réparation, gouttières. Délais idéaux, modèles d'e-mail et SMS, erreurs à éviter, générateur gratuit.",
    works: ["la réfection de votre toiture", "la réparation de la fuite en toiture", "le remplacement des gouttières", "le démoussage et le traitement de la toiture", "l'isolation des combles"],
    delays: [
      { moment: "J+3", action: "Réparation de fuite : relance rapide, le client ne doit pas attendre la prochaine pluie", channel: "E-mail" },
      { moment: "J+7", action: "Réfection complète : première relance avec une question sur le choix des matériaux", channel: "E-mail" },
      { moment: "J+14", action: "Deuxième relance : météo, planning et délai d'approvisionnement", channel: "E-mail" },
      { moment: "J+16", action: "Message court pour proposer un passage", channel: "SMS" },
      { moment: "J+30", action: "Clôture, avec rappel de la saison favorable", channel: "E-mail ou appel" },
    ],
    emails: [
      {
        label: "Relance 1 — réfection",
        subject: "Votre devis de toiture du {date_envoi}",
        body: "Bonjour {client},\n\nAvez-vous pu étudier le devis de réfection de votre toiture ?\n\nSi vous hésitez entre deux matériaux ou deux options d'isolation, je peux repasser vous montrer des échantillons.\n\nBonne journée,",
      },
      {
        label: "Relance 2 — planning",
        subject: "Re: votre devis de toiture",
        body: "Bonjour {client},\n\nPour information, mon planning se remplit pour les prochains mois et les tuiles prévues demandent environ trois semaines de délai. Si vous souhaitez des travaux avant la mauvaise saison, c'est le bon moment pour valider.\n\nBien cordialement,",
      },
      {
        label: "Relance 3 — clôture",
        subject: "Re: votre devis de toiture",
        body: "Bonjour {client},\n\nSans retour de votre part, je considère le projet reporté. Je reste disponible si une fuite ou une question apparaît.\n\nBien cordialement,",
      },
    ],
    sms: [
      { label: "SMS après envoi", body: "Bonjour {client}, {entreprise}. Le devis pour votre toiture est dans votre boîte mail. Je peux repasser si besoin. Bonne journée" },
      { label: "SMS météo", body: "Bonjour {client}, une fenêtre météo favorable se dessine pour votre toit. Je peux vous réserver des dates ? {entreprise}" },
      { label: "SMS clôture", body: "Bonjour {client}, je classe votre dossier toiture sauf avis contraire. Le devis reste valable. {entreprise}" },
    ],
    mistakes: [
      "Attendre des semaines pour relancer une réparation de fuite : le client appelle le premier disponible.",
      "Ne pas expliquer la différence entre deux devis de toiture aux prix très différents.",
      "Oublier les délais d'approvisionnement des matériaux dans la relance.",
      "Relancer en plein hiver sans parler de planning : le client reporte tout au printemps.",
      "Envoyer des photos de la toiture uniquement au premier devis : elles sont un excellent argument de relance.",
    ],
  },

  chauffagiste: {
    question: "Comment relancer un devis de chauffage ?",
    title: "Relancer un devis de chauffage : modèles mail et SMS",
    description:
      "Relancer un devis de chauffagiste : chaudière, pompe à chaleur, entretien. Délais idéaux, modèles d'e-mail et SMS, erreurs à éviter, générateur gratuit.",
    works: ["l'installation d'une pompe à chaleur", "le remplacement de votre chaudière", "l'installation d'un poêle à granulés", "le contrat d'entretien de votre chaudière", "le désembouage du circuit de chauffage"],
    delays: [
      { moment: "J+4", action: "Première relance : proposer de répondre aux questions sur les aides", channel: "E-mail" },
      { moment: "J+10", action: "Deuxième relance : délai d'installation avant l'hiver", channel: "E-mail" },
      { moment: "J+12", action: "Proposition d'appel", channel: "SMS" },
      { moment: "J+25", action: "Clôture, en rappelant la date de validité du devis", channel: "E-mail ou appel" },
    ],
    emails: [
      {
        label: "Relance 1 — pompe à chaleur",
        subject: "Votre devis de pompe à chaleur",
        body: "Bonjour {client},\n\nJe reviens vers vous au sujet du devis envoyé le {date_envoi}.\n\nLe dossier d'aides peut sembler compliqué : je peux vous indiquer les étapes et les documents à préparer avant la signature.\n\nBonne journée,",
      },
      {
        label: "Relance 2 — avant l'hiver",
        subject: "Re: votre devis de chauffage",
        body: "Bonjour {client},\n\nPour une installation avant les grands froids, il faudrait valider dans les prochaines semaines : le matériel demande un délai de commande.\n\nJe reste à votre disposition pour en parler.\n\nBien cordialement,",
      },
      {
        label: "Relance 3 — clôture",
        subject: "Re: votre devis de chauffage",
        body: "Bonjour {client},\n\nJe n'ai pas eu de retour, je suppose que le projet est en attente. Le devis reste valable jusqu'à sa date d'échéance.\n\nBien cordialement,",
      },
    ],
    sms: [
      { label: "SMS après envoi", body: "Bonjour {client}, {entreprise}. Votre devis chauffage est parti par mail. Des questions sur les aides ? Appelez-moi. Bonne journée" },
      { label: "SMS saison", body: "Bonjour {client}, pour être chauffé avant l'hiver, il faudrait commander le matériel bientôt. On fait le point ? {entreprise}" },
      { label: "SMS clôture", body: "Bonjour {client}, je classe votre dossier chauffage sauf avis contraire. Le devis reste valable. {entreprise}" },
    ],
    mistakes: [
      "Promettre un montant d'aide précis : il dépend de la situation du client, renvoyez vers les simulateurs officiels.",
      "Relancer sans parler de la saison : un devis de chauffage reçu en mai se décide souvent en septembre.",
      "Oublier de mentionner l'entretien annuel, qui rassure sur la durée de vie de l'équipement.",
      "Envoyer un devis sans comparaison de consommation : c'est l'argument qui fait décider.",
      "Laisser plusieurs semaines entre deux relances en octobre, au plus fort de la demande.",
    ],
  },

  peintre: {
    question: "Comment relancer un devis de peinture ?",
    title: "Relancer un devis de peinture : modèles mail et SMS",
    description:
      "Relancer un devis de peintre en bâtiment : intérieur, façade, ravalement. Délais idéaux, modèles d'e-mail et SMS, erreurs à éviter, générateur gratuit.",
    works: ["la peinture de vos pièces de vie", "le ravalement de votre façade", "la pose de papier peint", "la peinture des boiseries et des volets", "la rénovation de l'appartement avant location"],
    delays: [
      { moment: "J+3", action: "Intérieur : première relance, le client compare vite", channel: "E-mail" },
      { moment: "J+7", action: "Façade : première relance avec une question sur les teintes", channel: "E-mail" },
      { moment: "J+10", action: "Rappel bref avec une disponibilité", channel: "SMS" },
      { moment: "J+20", action: "Clôture", channel: "E-mail ou appel" },
    ],
    emails: [
      {
        label: "Relance 1 — intérieur",
        subject: "Votre devis de peinture du {date_envoi}",
        body: "Bonjour {client},\n\nAvez-vous pu regarder mon devis pour la peinture de vos pièces ?\n\nSi vous hésitez sur les teintes ou la finition (mat, velours, satin), je peux vous déposer un nuancier.\n\nBonne journée,",
      },
      {
        label: "Relance 2 — disponibilité",
        subject: "Re: votre devis de peinture",
        body: "Bonjour {client},\n\nUn créneau vient de se libérer dans deux semaines : le chantier durerait environ quatre jours. Voulez-vous que je vous le réserve ?\n\nBien cordialement,",
      },
      {
        label: "Relance 3 — clôture",
        subject: "Re: votre devis de peinture",
        body: "Bonjour {client},\n\nJe n'ai pas eu de retour, je suppose que le projet est reporté. N'hésitez pas à revenir vers moi le moment venu.\n\nBien cordialement,",
      },
    ],
    sms: [
      { label: "SMS après envoi", body: "Bonjour {client}, {entreprise}. Le devis peinture est dans votre boîte mail. Besoin d'un nuancier ? Je passe quand vous voulez." },
      { label: "SMS créneau", body: "Bonjour {client}, j'ai un créneau dans 2 semaines pour votre peinture. Je vous le garde ? {entreprise}" },
      { label: "SMS clôture", body: "Bonjour {client}, je clôture votre dossier peinture sauf avis contraire. {entreprise}" },
    ],
    mistakes: [
      "Ne pas détailler la préparation des supports : le client compare alors uniquement le prix au m².",
      "Relancer trop tard : en peinture intérieure, le client signe souvent dans la semaine.",
      "Oublier de proposer une date de chantier, l'argument qui déclenche la décision.",
      "Ne pas relancer les devis de façade en hiver pour le printemps suivant.",
      "Envoyer le même message de relance trois fois.",
    ],
  },

  menuisier: {
    question: "Comment relancer un devis de menuiserie ?",
    title: "Relancer un devis de menuiserie : modèles mail et SMS",
    description:
      "Relancer un devis de menuisier : fenêtres, portes, cuisine, agencement. Délais idéaux, modèles d'e-mail et SMS, erreurs à éviter, générateur gratuit.",
    works: ["le remplacement de vos fenêtres", "la pose de votre porte d'entrée", "l'agencement de placards sur mesure", "la pose de votre cuisine", "la création d'un escalier"],
    delays: [
      { moment: "J+5", action: "Première relance : question sur les options (vitrage, coloris)", channel: "E-mail" },
      { moment: "J+12", action: "Deuxième relance : délai de fabrication", channel: "E-mail" },
      { moment: "J+14", action: "Proposition de repasser avec des échantillons", channel: "SMS" },
      { moment: "J+30", action: "Clôture", channel: "E-mail ou appel" },
    ],
    emails: [
      {
        label: "Relance 1 — options",
        subject: "Votre devis de menuiserie du {date_envoi}",
        body: "Bonjour {client},\n\nAvez-vous pu étudier le devis de remplacement de vos fenêtres ?\n\nSi vous hésitez sur le vitrage ou le coloris, je peux vous apporter des échantillons.\n\nBonne journée,",
      },
      {
        label: "Relance 2 — fabrication",
        subject: "Re: votre devis de menuiserie",
        body: "Bonjour {client},\n\nPour information, le délai de fabrication est actuellement de six semaines. Pour une pose avant la date que vous souhaitiez, il faudrait valider prochainement.\n\nBien cordialement,",
      },
      {
        label: "Relance 3 — clôture",
        subject: "Re: votre devis de menuiserie",
        body: "Bonjour {client},\n\nSans nouvelles, je suppose que le projet est reporté. Le devis reste valable jusqu'à sa date d'échéance.\n\nBien cordialement,",
      },
    ],
    sms: [
      { label: "SMS après envoi", body: "Bonjour {client}, {entreprise}. Votre devis menuiserie est parti par mail. Je peux passer avec des échantillons si besoin." },
      { label: "SMS fabrication", body: "Bonjour {client}, le délai de fabrication est de 6 semaines en ce moment. Pour une pose à la date voulue, on valide ? {entreprise}" },
      { label: "SMS clôture", body: "Bonjour {client}, je classe votre dossier menuiserie sauf avis contraire. {entreprise}" },
    ],
    mistakes: [
      "Ne pas rappeler le délai de fabrication : le client découvre trop tard que la pose est repoussée.",
      "Relancer sans proposer de voir ou toucher le produit (échantillon, showroom).",
      "Envoyer un devis sans plan ni schéma pour un agencement sur mesure.",
      "Abandonner après une relance : les projets de menuiserie se décident en plusieurs semaines.",
      "Ne pas préciser ce qui est inclus (dépose, évacuation, finitions).",
    ],
  },

  renovation: {
    question: "Comment relancer un devis de rénovation ?",
    title: "Relancer un devis de rénovation : modèles mail et SMS",
    description:
      "Relancer un devis de rénovation (maison, appartement, cuisine) : délais idéaux, modèles d'e-mail et SMS, erreurs à éviter et générateur gratuit.",
    works: ["la rénovation complète de votre appartement", "la rénovation de votre cuisine", "la rénovation énergétique de votre maison", "l'aménagement des combles", "la rénovation de la maison avant emménagement"],
    delays: [
      { moment: "J+5", action: "Première relance : proposer de revoir le devis ensemble", channel: "E-mail" },
      { moment: "J+14", action: "Deuxième relance : planning, ordre des corps d'état, financement", channel: "E-mail" },
      { moment: "J+16", action: "Proposition de rendez-vous sur place", channel: "SMS" },
      { moment: "J+30", action: "Troisième relance avec une variante ou un phasage", channel: "E-mail" },
      { moment: "J+45", action: "Clôture, la porte reste ouverte", channel: "E-mail ou appel" },
    ],
    emails: [
      {
        label: "Relance 1 — revoir le devis ensemble",
        subject: "Votre projet de rénovation — devis du {date_envoi}",
        body: "Bonjour {client},\n\nUn devis de rénovation comporte beaucoup de lignes : si vous le souhaitez, je vous propose un rendez-vous de vingt minutes pour le parcourir ensemble et répondre à vos questions.\n\nBonne journée,",
      },
      {
        label: "Relance 2 — planning et financement",
        subject: "Re: votre projet de rénovation",
        body: "Bonjour {client},\n\nPour vous aider à vous projeter : le chantier pourrait démarrer dans six semaines, pour une durée d'environ deux mois. Si votre financement n'est pas encore bouclé, je peux vous fournir les documents dont votre banque aura besoin.\n\nBien cordialement,",
      },
      {
        label: "Relance 3 — variante",
        subject: "Re: votre projet de rénovation",
        body: "Bonjour {client},\n\nSi le montant global vous fait hésiter, nous pouvons découper le projet en deux phases, en commençant par les travaux prioritaires.\n\nDites-moi si vous souhaitez une version phasée du devis.\n\nBien cordialement,",
      },
    ],
    sms: [
      { label: "SMS après envoi", body: "Bonjour {client}, {entreprise}. Le devis de votre rénovation est dans votre boîte mail. On le parcourt ensemble ? Je m'adapte à vos horaires." },
      { label: "SMS rendez-vous", body: "Bonjour {client}, je passe dans votre secteur jeudi. 20 minutes sur place pour répondre à vos questions sur le devis ? {entreprise}" },
      { label: "SMS clôture", body: "Bonjour {client}, je mets votre dossier rénovation en pause sauf avis contraire. Le devis reste valable. {entreprise}" },
    ],
    mistakes: [
      "Relancer par un simple « avez-vous des nouvelles ? » alors que le client a besoin d'aide pour comprendre un devis long.",
      "Ne jamais proposer de phasage quand le montant global bloque.",
      "Oublier que la décision dépend souvent d'un prêt : proposez les documents utiles à la banque.",
      "Arrêter de relancer au bout de dix jours : une rénovation se décide en semaines, parfois en mois.",
      "Ne pas expliquer l'ordre des travaux et la coordination des corps d'état, ce qui inquiète le client.",
    ],
  },
};

export function getKit(slug: string) {
  return METIER_KITS[slug];
}
