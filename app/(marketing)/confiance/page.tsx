import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { productFacts } from "@/lib/content/product-facts";
import { FAQ_IDENTITY } from "@/lib/content/faq";
import { BreadcrumbJsonLd, FaqJsonLd, TrustPageJsonLd, type QA } from "@/components/seo/json-ld";
import { FaqList } from "@/components/marketing/faq-list";
import { CtaBlock } from "@/components/marketing/cta-block";
import { TrustBadges } from "@/components/marketing/trust-badges";
import { Testimonials } from "@/components/marketing/testimonials";

const DESCRIPTION =
  "Qui édite Artisan Relance, où sont vos données, comment elles sont protégées, RGPD, engagements et contact : tout pour confier vos devis en confiance.";

export const metadata = pageMetadata({
  title: "Confiance et sécurité des données | Artisan Relance",
  description: DESCRIPTION,
  path: "/confiance",
});

/** Objections fréquentes d'un artisan qui découvre le logiciel, avec une réponse courte. */
const OBJECTIONS: QA[] = [
  {
    q: "Mes clients vont-ils recevoir de la publicité ?",
    a: "Non. Artisan Relance n'envoie à vos clients que vos propres e-mails : le devis, vos relances, vos réponses et, si vous l'activez, une demande d'avis. Aucune publicité, aucune revente de leurs adresses.",
  },
  {
    q: "Mes clients vont-ils voir que c'est automatique ?",
    a: "Non. Les e-mails partent au nom de votre entreprise, avec votre signature et le texte que vous avez choisi. Les relances sont polies, espacées et s'arrêtent dès que le client répond.",
  },
  {
    q: "Que se passe-t-il si un client ne veut plus être relancé ?",
    a: "Il lui suffit de répondre « STOP » : le devis est arrêté et ce client n'est plus jamais relancé ni sollicité pour un avis. S'il signale un e-mail comme indésirable, les relances s'arrêtent aussi automatiquement.",
  },
  {
    q: "Qui peut voir mes devis et mes clients ?",
    a: "Vous seul. Chaque compte est isolé en base de données. L'éditeur n'y accède que pour la maintenance ou la sécurité du service, et ne les utilise jamais à d'autres fins.",
  },
  {
    q: "Mes e-mails vont-ils arriver en courrier indésirable ?",
    a: "Le domaine d'envoi est authentifié (SPF, DKIM, DMARC) et les envois sont limités par jour pour garder une bonne réputation. Si une adresse est invalide, le devis est suspendu et vous êtes prévenu.",
  },
  {
    q: "Et si le logiciel devient payant ?",
    a: "Le tarif payant prévu est de 9,99 € par mois, TVA non applicable, article 293 B du CGI. Vous serez prévenu au moins 30 jours avant, et vous pourrez exporter vos données ou supprimer votre compte avant tout paiement. Aucune carte bancaire n'est demandée aujourd'hui.",
  },
  {
    q: "Puis-je partir quand je veux ?",
    a: "Oui. Sans engagement : export CSV de vos devis à tout moment depuis la liste des devis, et suppression du compte et de ses données sur simple demande par e-mail.",
  },
];

const COMMITMENTS = [
  "Aucune donnée revendue, aucune publicité envoyée à vos clients.",
  "Des e-mails à votre nom, polis, jamais la nuit ni le dimanche.",
  "Un client qui répond « STOP » n'est plus jamais relancé.",
  "Aucun faux avis : seuls de vrais témoignages d'artisans, avec leur accord écrit, sont publiés.",
  "Tarif payant annoncé au moins 30 jours à l'avance, export et suppression des données à tout moment.",
  "Mises à jour continues : corrections et nouvelles fonctions publiées au fil des retours des artisans.",
];

const RETENTION = [
  "Pièces jointes de vos devis : 12 mois après la clôture du dossier.",
  "Pièces jointes reçues de vos clients : 6 mois.",
  "Texte des échanges avec vos clients : 24 mois.",
  "Historique des demandes d'avis : 24 mois.",
  "Compte et devis : tant que le compte est actif, puis suppression sous 30 jours.",
];

export default function TrustPage() {
  const f = productFacts();
  const faq = [...FAQ_IDENTITY, ...OBJECTIONS];
  const h2 = "text-xl font-semibold scroll-mt-24";
  return (
    <article className="container max-w-3xl py-12 md:py-16">
      <TrustPageJsonLd path="/confiance" description={DESCRIPTION} />
      <FaqJsonLd items={faq} />
      <BreadcrumbJsonLd items={[{ name: "Accueil", path: "/" }, { name: "Confiance", path: "/confiance" }]} />

      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Confiance et sécurité : ce que vous confiez à Artisan Relance</h1>
      <p className="mt-6 text-lg leading-relaxed">
        Vous nous confiez vos devis et les coordonnées de vos clients. Voici, en clair, qui édite Artisan Relance, où sont
        vos données, comment elles sont protégées et comment nous joindre.
      </p>

      <TrustBadges className="mt-8 lg:grid-cols-3 xl:grid-cols-3" />

      <div className="mt-12 space-y-12 leading-relaxed">
        <section aria-labelledby="editeur">
          <h2 id="editeur" className={h2}>Qui édite Artisan Relance</h2>
          <dl className="mt-4 grid gap-3 rounded-xl border bg-muted/30 p-5 text-sm sm:grid-cols-[170px_1fr]">
            <dt className="font-medium">Produit</dt>
            <dd className="text-muted-foreground">{f.identity.product}</dd>
            <dt className="font-medium">Éditeur et fondateur</dt>
            <dd className="text-muted-foreground">{f.identity.editor}</dd>
            <dt className="font-medium">Responsable</dt>
            <dd className="text-muted-foreground">{SITE.editor}, directeur de la publication et responsable de traitement des données des comptes</dd>
            <dt className="font-medium">Depuis</dt>
            <dd className="text-muted-foreground">{f.identity.since}</dd>
            <dt className="font-medium">Contact</dt>
            <dd className="text-muted-foreground">
              <a href={`mailto:${SITE.contactEmail}`} className="underline underline-offset-4">{SITE.contactEmail}</a>
            </dd>
          </dl>
          <p className="mt-3 text-sm text-muted-foreground">
            En savoir plus : <Link href="/a-propos" className="underline underline-offset-4">à propos d'Artisan Relance</Link> ·{" "}
            <Link href="/mentions-legales" className="underline underline-offset-4">mentions légales</Link>
          </p>
        </section>

        <section aria-labelledby="engagements">
          <h2 id="engagements" className={h2}>Nos engagements</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted-foreground">
            {COMMITMENTS.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </section>

        <section aria-labelledby="securite">
          <h2 id="securite" className={h2}>Sécurité des données et hébergement</h2>
          <p className="mt-3 text-muted-foreground">{f.data}</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted-foreground">
            {f.security.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </section>

        <section aria-labelledby="donnees">
          <h2 id="donnees" className={h2}>Confidentialité et RGPD</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted-foreground">
            <li>Pour les données de votre compte, l'éditeur est responsable de traitement.</li>
            <li>Pour les données de vos clients, vous êtes responsable de traitement et Artisan Relance agit comme sous-traitant (article 28 du RGPD), uniquement pour envoyer vos devis, relances et réponses.</li>
            <li>Vous pouvez exercer vos droits d'accès, de rectification, d'effacement et de portabilité en écrivant à {SITE.contactEmail}, avec une réponse sous un mois.</li>
            <li>Mesure d'audience anonyme et sans cookie ; seuls des cookies strictement nécessaires (connexion, thème) sont déposés.</li>
          </ul>
          <h3 className="mt-5 font-medium">Durées de conservation</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted-foreground">
            {RETENTION.map((r) => <li key={r}>{r}</li>)}
          </ul>
          <p className="mt-3 text-sm text-muted-foreground">
            Détail complet : <Link href="/confidentialite" className="underline underline-offset-4">politique de confidentialité</Link> ·{" "}
            <Link href="/cgu" className="underline underline-offset-4">conditions générales d'utilisation</Link>
          </p>
        </section>

        <section aria-labelledby="temoignages">
          <h2 id="temoignages" className={h2}>Avis des artisans</h2>
          <div className="mt-4">
            <Testimonials title="Ils utilisent Artisan Relance" showInvite />
          </div>
        </section>

        <section aria-labelledby="contact">
          <h2 id="contact" className={h2}>Nous contacter</h2>
          <p className="mt-3 text-muted-foreground">{SITE.support}.</p>
          <ul className="mt-3 space-y-1.5 text-muted-foreground">
            <li>E-mail : <a href={`mailto:${SITE.contactEmail}`} className="underline underline-offset-4">{SITE.contactEmail}</a></li>
            <li>Formulaire : <Link href="/contact" className="underline underline-offset-4">page Contact</Link></li>
            <li>Démonstration gratuite de 10 minutes : <Link href={SITE.demoHref} className="underline underline-offset-4">la demander</Link></li>
          </ul>
        </section>

        <section aria-labelledby="faq-confiance">
          <h2 id="faq-confiance" className={`mb-4 ${h2}`}>Questions fréquentes sur la confiance</h2>
          <FaqList items={faq} />
          <p className="mt-4 text-sm text-muted-foreground">
            Toutes les questions : <Link href="/faq" className="underline underline-offset-4">FAQ</Link> ·{" "}
            <Link href="/presentation" className="underline underline-offset-4">fiche de présentation</Link> ·{" "}
            <Link href="/tarifs" className="underline underline-offset-4">tarifs</Link>
          </p>
        </section>
      </div>

      <div className="mt-14">
        <CtaBlock title="Essayez sur votre prochain devis" text="Gratuit, sans carte bancaire, prêt en 2 minutes." />
      </div>
    </article>
  );
}
