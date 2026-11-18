import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Conditions générales d'utilisation — Artisan Relance",
  description: "Règles d'utilisation du logiciel Artisan Relance : compte, envoi des devis et des relances, obligations, données, responsabilité, tarifs.",
  path: "/cgu",
});

export default function CguPage() {
  const mail = <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>;
  return (
    <LegalPage title="Conditions générales d'utilisation" path="/cgu">
      <section>
        <h2>1. Objet</h2>
        <p>
          Les présentes conditions encadrent l'utilisation d'Artisan Relance, application en ligne éditée par{" "}
          {SITE.editor} (voir les <Link href="/mentions-legales">mentions légales</Link>), qui permet à un
          professionnel d'envoyer ses devis par e-mail et de programmer des relances. La création d'un compte vaut
          acceptation de ces conditions.
        </p>
      </section>

      <section>
        <h2>2. Accès au service</h2>
        <ul>
          <li>Le service s'adresse aux professionnels (artisans, TPE, indépendants) pour leur activité.</li>
          <li>L'utilisateur crée un compte avec une adresse e-mail valide et garde ses identifiants confidentiels.</li>
          <li>Le service est gratuit pendant la phase de lancement. Toute évolution tarifaire sera annoncée par e-mail au moins 30 jours à l'avance ; l'utilisateur pourra alors exporter ses données et supprimer son compte sans frais.</li>
        </ul>
      </section>

      <section>
        <h2>3. Fonctionnement</h2>
        <ul>
          <li>Les e-mails sont envoyés au nom de l'entreprise de l'utilisateur, avec une adresse d'expédition du service. Les réponses des clients sont reçues par le service sur une adresse dédiée à chaque devis, affichées dans le dossier du devis et signalées à l'utilisateur par e-mail selon le réglage choisi (alerte courte, transfert complet ou aucun e-mail).</li>
          <li>L'utilisateur peut répondre à son client depuis le dossier du devis, avec des pièces jointes (5 fichiers et 15 Mo au plus par message, 20 réponses par jour).</li>
          <li>Les relances partent du lundi au samedi entre 8 h et 19 h (heure de Paris), selon la stratégie choisie.</li>
          <li>Les relances d'un devis s'arrêtent automatiquement lorsque le client répond (hors réponses automatiques d'absence) ou demande l'arrêt (« STOP »). L'utilisateur peut aussi les arrêter à tout moment en marquant le devis « Répondu », « Gagné », « Perdu » ou « Terminé ».</li>
          <li>Pour éviter les abus et maîtriser les coûts, le nombre d'e-mails est limité par compte et par jour (30 à ce jour), et les pièces jointes à 10 Mo par fichier et 20 Mo par devis.</li>
          <li>Les pièces jointes des devis sont supprimées automatiquement 12 mois après la clôture du dossier, celles reçues des clients après 6 mois, et le texte des échanges après 24 mois.</li>
          <li>Les pièces jointes reçues des clients sont filtrées : seuls les types de fichiers courants (PDF, photos, documents bureautiques, texte) sont conservés, et les photos sont réduites.</li>
        </ul>
      </section>

      <section>
        <h2>4. Obligations de l'utilisateur</h2>
        <ul>
          <li>N'envoyer des devis et des relances qu'à des personnes qui ont demandé un devis ou sont en relation d'affaires avec lui.</li>
          <li>Ne pas utiliser le service pour de la prospection non sollicitée, de la publicité ou l'envoi en masse.</li>
          <li>Respecter immédiatement toute demande d'arrêt formulée par un destinataire (réponse « STOP » ou autre).</li>
          <li>Ne pas importer de contenu illicite, de virus ou de fichiers portant atteinte aux droits de tiers.</li>
          <li>Renseigner des informations exactes sur son entreprise.</li>
        </ul>
        <p>En cas de manquement, l'éditeur peut suspendre l'envoi des e-mails ou le compte, après information de l'utilisateur sauf urgence.</p>
      </section>

      <section>
        <h2>5. Données personnelles et sous-traitance</h2>
        <p>
          Pour les données de ses clients, l'utilisateur est responsable de traitement et l'éditeur agit en tant
          que sous-traitant (article 28 du RGPD). L'éditeur s'engage à : traiter ces données uniquement pour
          l'envoi des devis et relances demandés par l'utilisateur ; en garantir la confidentialité et la
          sécurité ; ne faire appel qu'aux sous-traitants listés dans la{" "}
          <Link href="/confidentialite">politique de confidentialité</Link> ; aider l'utilisateur à répondre aux
          demandes d'exercice de droits ; notifier toute violation de données dans les meilleurs délais ;
          supprimer les données à la fin du service.
        </p>
      </section>

      <section>
        <h2>6. Disponibilité et responsabilité</h2>
        <p>
          L'éditeur met en œuvre les moyens raisonnables pour assurer la disponibilité du service, sans garantie
          d'absence d'interruption, notamment pour maintenance ou en cas de défaillance d'un prestataire. Le
          service est une aide à la relance : il ne garantit pas la signature des devis. L'utilisateur reste
          responsable du contenu de ses devis et messages, et de la conservation de ses propres documents.
        </p>
      </section>

      <section>
        <h2>7. Propriété intellectuelle</h2>
        <p>
          L'application reste la propriété de l'éditeur. L'utilisateur conserve la propriété de ses devis, fichiers
          et messages, et accorde à l'éditeur le seul droit de les traiter pour fournir le service.
        </p>
      </section>

      <section>
        <h2>8. Durée, résiliation et suppression</h2>
        <p>
          Le compte est ouvert pour une durée indéterminée. L'utilisateur peut le supprimer à tout moment en
          écrivant à {mail} ; ses données sont alors supprimées sous 30 jours. Il peut exporter ses campagnes et
          leur historique au format CSV avant la suppression.
        </p>
      </section>

      <section>
        <h2>9. Modification des conditions</h2>
        <p>
          L'éditeur peut faire évoluer ces conditions. Les utilisateurs sont informés par e-mail de toute
          modification importante au moins 30 jours avant son entrée en vigueur.
        </p>
      </section>

      <section>
        <h2>10. Droit applicable</h2>
        <p>
          Les présentes conditions sont soumises au droit français. En cas de litige, les parties recherchent
          d'abord une solution amiable ; à défaut, les tribunaux compétents sont ceux du ressort du domicile de
          l'éditeur. Contact : {mail}.
        </p>
      </section>
    </LegalPage>
  );
}
