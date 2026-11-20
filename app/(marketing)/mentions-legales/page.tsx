import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Mentions légales — Artisan Relance",
  description: "Éditeur, contact, hébergement et propriété intellectuelle du site Artisan Relance, logiciel de relance de devis pour artisans.",
  path: "/mentions-legales",
});

export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Mentions légales" path="/mentions-legales">
      <section>
        <h2>Éditeur du site</h2>
        <p>
          Le site <strong>artisan-relance.jercat.fr</strong> et l'application Artisan Relance sont édités par{" "}
          <strong>{SITE.editor}</strong>, éditeur personne physique agissant à titre non professionnel pendant la
          phase de lancement gratuite du service.
        </p>
        <p>
          Conformément à l'article 6, III, 2 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans
          l'économie numérique, l'éditeur a choisi de ne pas rendre publics ses nom et adresse personnels. Ses
          éléments d'identification ont été communiqués à l'hébergeur du site, désigné ci-dessous.
        </p>
        <ul>
          <li>Directeur de la publication : {SITE.editor}</li>
          <li>
            Contact : <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> ou via la{" "}
            <Link href="/contact">page contact</Link>
          </li>
          <li>Site de l'éditeur : <a href={SITE.editorUrl}>dev.jercat.fr</a></li>
          <li>Pays : {SITE.country}</li>
        </ul>
      </section>

      <section>
        <h2>Le service</h2>
        <p>
          Artisan Relance est un logiciel en ligne (SaaS) de relance automatique de devis destiné aux artisans et TPE du
          bâtiment, en ligne depuis {SITE.launched}. Il est gratuit pendant sa phase de lancement ; une offre payante est
          prévue à 9,99 € HT par mois, annoncée au moins 30 jours à l'avance (voir les <Link href="/tarifs">tarifs</Link>).
        </p>
        <p>{SITE.support} : <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.</p>
      </section>

      <section>
        <h2>Hébergement</h2>
        <p>
          Site et application : <strong>Vercel Inc.</strong>, 440 N Barranca Ave #4133, Covina, CA 91723,
          États-Unis — <a href="https://vercel.com">vercel.com</a>. Les traitements côté serveur s'exécutent
          en Europe (Francfort).
        </p>
        <p>
          Prestataires techniques intervenant pour le service : Supabase (base de données et stockage des
          fichiers, région Zurich, Suisse) et Resend (envoi des e-mails, région Irlande). Leur rôle est détaillé
          dans la <Link href="/confidentialite">politique de confidentialité</Link>.
        </p>
      </section>

      <section>
        <h2>Propriété intellectuelle</h2>
        <p>
          Les textes, l'interface, le logo et le code de l'application Artisan Relance sont la propriété de
          l'éditeur. Toute reproduction, totale ou partielle, sans autorisation écrite est interdite. Les devis,
          fichiers et messages importés par les utilisateurs restent leur propriété.
        </p>
      </section>

      <section>
        <h2>Signaler un abus ou un contenu</h2>
        <p>
          Pour signaler un e-mail reçu via Artisan Relance que vous n'avez pas sollicité, ou tout contenu illicite,
          écrivez à <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> en joignant le message concerné.
          Vous pouvez aussi répondre « STOP » à l'e-mail reçu : l'expéditeur ne pourra plus vous relancer.
        </p>
      </section>

      <section>
        <h2>Conditions d'utilisation et données personnelles</h2>
        <p>
          L'utilisation de l'application est régie par les{" "}
          <Link href="/cgu">conditions générales d'utilisation</Link>. Le traitement des données personnelles est
          décrit dans la <Link href="/confidentialite">politique de confidentialité</Link>. Les engagements de sécurité sont
          résumés sur la page <Link href="/confiance">confiance et sécurité</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
