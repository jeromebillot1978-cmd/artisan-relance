import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Politique de confidentialité (RGPD) — Artisan Relance",
  description: "Données collectées, finalités, durées de conservation, hébergement en Europe et droits RGPD des utilisateurs d'Artisan Relance et de leurs clients.",
  path: "/confidentialite",
});

export default function ConfidentialitePage() {
  const mail = <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>;
  return (
    <LegalPage title="Politique de confidentialité" path="/confidentialite">
      <section>
        <h2>Qui est responsable de vos données ?</h2>
        <p>
          <strong>Pour les données de votre compte</strong> (artisan utilisateur) et pour les messages envoyés via
          la page contact, le responsable de traitement est {SITE.editor}, éditeur d'Artisan Relance, joignable à{" "}
          {mail}.
        </p>
        <p>
          <strong>Pour les données de vos clients</strong> (les personnes à qui vous envoyez vos devis), c'est vous,
          artisan, qui êtes responsable de traitement. Artisan Relance agit en tant que sous-traitant au sens de
          l'article 28 du RGPD, uniquement selon vos instructions, dans les conditions prévues par les{" "}
          <Link href="/cgu">CGU</Link>.
        </p>
      </section>

      <section>
        <h2>Données collectées</h2>
        <ul>
          <li>Compte : adresse e-mail, nom de l'entreprise, et si vous les renseignez, nom du contact, téléphone et adresse de réponse.</li>
          <li>Devis : nom du client, adresses e-mail des destinataires, téléphone (facultatif), montant, référence, notes internes, messages, pièces jointes, dates et statut des envois.</li>
          <li>Réponses et événements : date d'envoi, de relance, de réponse, de décision (gagné, perdu).</li>
          <li>Échanges avec le client : texte des réponses reçues (sans l'historique recopié), pièces jointes acceptées (PDF, photos réduites, documents bureautiques, 5 fichiers et 15 Mo au plus par message) et réponses écrites par l'artisan depuis le site.</li>
          <li>
            Demandes d'avis Google : nom et e-mail du client, date d'envoi, nombre de clics sur le lien de l'e-mail (sans
            pixel de suivi ni cookie), avis signalé comme reçu par l'artisan, et désinscriptions.
          </li>
          <li>Page contact : nom, e-mail, téléphone (facultatif), métier, message.</li>
          <li>Données techniques : journaux de connexion et d'envoi conservés par nos prestataires pour la sécurité.</li>
          <li>Mesure d'audience du site public : pages vues, provenance et type d'appareil, de façon anonyme et sans cookie (aucune adresse IP conservée ; un identifiant de visite non réversible, renouvelé chaque mois).</li>
        </ul>
        <p>Aucune donnée de paiement n'est collectée. Aucune donnée n'est revendue ni utilisée à des fins publicitaires.</p>
      </section>

      <section>
        <h2>Finalités et bases légales</h2>
        <ul>
          <li>Fournir le service (compte, envoi des devis et des relances, tableau de bord) : exécution du contrat (CGU).</li>
          <li>Sécurité, prévention des abus et limitation des envois : intérêt légitime.</li>
          <li>
            Demande d'avis envoyée par l'artisan à son client après une prestation : intérêt légitime de l'artisan. Une seule
            demande par dossier ; chaque e-mail contient un lien de désinscription, respecté pour toutes les demandes
            suivantes de cet artisan.
          </li>
          <li>Répondre à une demande de contact ou de démonstration : mesures précontractuelles à votre demande.</li>
          <li>Vous informer d'un changement important du service ou des tarifs : exécution du contrat.</li>
        </ul>
      </section>

      <section>
        <h2>Durées de conservation</h2>
        <ul>
          <li>Compte et devis : tant que le compte est actif ; suppression sous 30 jours après la suppression du compte.</li>
          <li>Pièces jointes : supprimées automatiquement 12 mois après la clôture du dossier (gagné, perdu, terminé, arrêté ou répondu).</li>
          <li>Fichiers téléversés mais jamais rattachés à un devis : supprimés après 2 jours.</li>
          <li>Pièces jointes reçues des clients : supprimées automatiquement après 6 mois.</li>
          <li>Texte des échanges avec le client : supprimé automatiquement après 24 mois.</li>
          <li>Messages de la page contact : 12 mois après le dernier échange.</li>
          <li>Journal technique des réponses reçues et des incidents de distribution (adresse invalide, signalement) : 13 mois.</li>
          <li>Statistiques de visite anonymes : 13 mois.</li>
          <li>Historique des demandes d'avis : 24 mois, ou plus tôt si le devis concerné est supprimé.</li>
          <li>Vous pouvez supprimer un devis, ses fichiers et son historique à tout moment, et exporter vos données au format CSV.</li>
        </ul>
      </section>

      <section>
        <h2>Destinataires et hébergement</h2>
        <ul>
          <li>Supabase : base de données, authentification et stockage des fichiers, hébergés à Zurich (Suisse), pays reconnu par la Commission européenne comme offrant une protection adéquate.</li>
          <li>Resend : envoi des e-mails et réception des réponses de vos clients (adresse de réponse dédiée à chaque devis), région Irlande (Union européenne).</li>
          <li>Vercel Inc. : hébergement de l'application, exécution en Europe (Francfort). Les transferts éventuels vers les États-Unis sont encadrés par les clauses contractuelles types de la Commission européenne.</li>
        </ul>
        <p>Les données ne sont accessibles qu'à vous et, pour la maintenance et la sécurité, à l'éditeur.</p>
      </section>

      <section>
        <h2>Cookies et mesure d'audience</h2>
        <p>
          Le site n'utilise ni cookie publicitaire ni traceur à des fins de publicité. Seuls des cookies strictement
          nécessaires sont déposés : la session de connexion à votre compte et la mémorisation du thème clair ou
          sombre. Ils ne nécessitent pas de consentement.
        </p>
        <p>
          La fréquentation des pages publiques est mesurée sans cookie et de façon anonyme (Vercel Web Analytics et un
          compteur interne) : aucune adresse IP n'est conservée et aucune donnée ne permet de vous identifier. Les
          pages de l'application connectée ne sont pas mesurées.
        </p>
      </section>

      <section>
        <h2>Sécurité</h2>
        <ul>
          <li>Connexion chiffrée (HTTPS) sur l'ensemble du site et de l'application.</li>
          <li>Isolement strict des comptes en base de données : chaque utilisateur n'accède qu'à ses propres devis, clients et messages.</li>
          <li>Mots de passe jamais stockés en clair.</li>
          <li>Fichiers stockés dans un espace privé, accessibles uniquement par des liens temporaires.</li>
          <li>Pièces jointes reçues filtrées (types autorisés, taille limitée) et photos réduites avant stockage.</li>
          <li>Domaine d'envoi authentifié (SPF, DKIM, DMARC) ; messages dont l'expéditeur ne peut pas être vérifié signalés à l'utilisateur.</li>
          <li>Limitation du nombre d'envois par compte et par jour.</li>
        </ul>
        <p>
          Résumé et engagements : <Link href="/confiance">confiance et sécurité des données</Link>.
        </p>
      </section>

      <section>
        <h2>Vos droits</h2>
        <p>
          Vous disposez des droits d'accès, de rectification, d'effacement, de limitation, d'opposition et de
          portabilité de vos données. Pour les exercer, écrivez à {mail}. Une réponse vous est apportée sous un
          mois. Si un de vos clients nous contacte au sujet de ses données, nous vous transmettons sa demande.
        </p>
        <p>
          Vous pouvez introduire une réclamation auprès de la CNIL, 3 place de Fontenoy, TSA 80715, 75334 Paris
          Cedex 07 — <a href="https://www.cnil.fr">cnil.fr</a>.
        </p>
      </section>
    </LegalPage>
  );
}
