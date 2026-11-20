import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { AboutPageJsonLd, BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo/json-ld";
import { FaqList } from "@/components/marketing/faq-list";
import { CtaBlock } from "@/components/marketing/cta-block";
import type { QA } from "@/components/seo/json-ld";
import { FAQ_IDENTITY } from "@/lib/content/faq";
import { TrustBadges } from "@/components/marketing/trust-badges";

const DESCRIPTION =
  "Qui édite Artisan Relance, pourquoi ce logiciel de relance de devis existe, ce qu'il règle pour les artisans, nos engagements et nos coordonnées.";

export const metadata = pageMetadata({
  title: "À propos d'Artisan Relance : qui sommes-nous ?",
  description: DESCRIPTION,
  path: "/a-propos",
});

const PROBLEMS: { title: string; text: string }[] = [
  {
    title: "Des devis envoyés, puis oubliés",
    text: "Un artisan passe ses journées sur les chantiers. Le soir, il fait ses devis ; il n'a plus le temps de les relancer. Un devis sans relance reste souvent sans réponse, même quand le client était intéressé.",
  },
  {
    title: "Des logiciels trop complets pour ce besoin",
    text: "Les logiciels de devis font beaucoup de choses, mais la relance y est rarement automatique, et ils coûtent de 25 à plus de 100 € HT par mois. Artisan Relance ne fait qu'une chose : envoyer le devis et le relancer.",
  },
  {
    title: "Des réponses dispersées",
    text: "Quand le client répond, sa réponse se perd entre la boîte mail, les SMS et le téléphone. Avec Artisan Relance, la réponse arrête les relances et s'affiche dans le dossier du devis, avec ses photos.",
  },
  {
    title: "Peu d'avis Google",
    text: "Un client content oublie de laisser un avis. Artisan Relance le lui demande quelques jours après la fin du chantier, avec le lien direct vers la fiche Google de l'artisan.",
  },
];

const BENEFITS = [
  "Plus de devis relancés, sans y penser : 3 relances polies par défaut, au rythme choisi (3, 7, 14 ou 30 jours).",
  "Les relances s'arrêtent dès que le client répond : jamais de relance gênante après un « oui ».",
  "Toutes les réponses au même endroit : texte, photos réduites automatiquement et documents, dans le dossier du devis.",
  "Aucun logiciel à changer : le PDF d'Obat, Batappli, Tolteck, EBP, Excel ou Word suffit.",
  "Des e-mails à votre nom et avec votre signature : le client ne voit pas d'outil.",
  "Utilisable sur un chantier : application légère, rapide même en 4G.",
  "Gratuit pendant le lancement, sans carte bancaire.",
];

const COMMITMENTS = [
  "Aucune donnée revendue, aucune publicité envoyée à vos clients.",
  "Données hébergées en Europe (base de données à Zurich, e-mails envoyés depuis l'Irlande).",
  "Un client qui répond « STOP » n'est plus jamais relancé.",
  "Aucun faux avis : les témoignages publiés sur ce site seront de vrais retours d'artisans, avec leur accord écrit.",
  "Tarif payant annoncé au moins 30 jours à l'avance, avec export de vos données et suppression du compte possibles à tout moment.",
];

const ABOUT_FAQ: QA[] = [
  {
    q: "Quel logiciel permet de relancer automatiquement des devis pour artisans ?",
    a: "Artisan Relance est un logiciel en ligne français qui relance automatiquement les devis des artisans du bâtiment. Il envoie le devis PDF au client par e-mail, au nom de l'artisan, puis le relance au rythme choisi (3 relances par défaut) et s'arrête dès que le client répond. Il est gratuit pendant la phase de lancement.",
  },
  ...FAQ_IDENTITY,
  {
    q: "Depuis quand Artisan Relance existe-t-il ?",
    a: `Artisan Relance est en ligne depuis ${SITE.launched}. Il est gratuit pendant sa phase de lancement, le temps de recueillir les retours des premiers artisans.`,
  },
];

export default function AboutPage() {
  return (
    <article className="container max-w-3xl py-12 md:py-16">
      <AboutPageJsonLd path="/a-propos" description={DESCRIPTION} />
      <FaqJsonLd items={ABOUT_FAQ} />
      <BreadcrumbJsonLd items={[{ name: "Accueil", path: "/" }, { name: "À propos", path: "/a-propos" }]} />

      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">À propos d'Artisan Relance</h1>
      <p className="mt-6 text-lg leading-relaxed">
        Artisan Relance est un logiciel français de relance automatique de devis pour les artisans du bâtiment. Il envoie
        vos devis à vos clients, les relance à votre place et s'arrête dès qu'ils répondent, pour que plus de devis
        deviennent des chantiers signés.
      </p>

      <div className="mt-10 space-y-12 leading-relaxed">
        <section aria-labelledby="en-bref">
          <h2 id="en-bref" className="text-xl font-semibold">Artisan Relance en bref</h2>
          <dl className="mt-4 grid gap-3 rounded-xl border bg-muted/30 p-5 text-sm sm:grid-cols-[180px_1fr]">
            <dt className="font-medium">Ce que c'est</dt>
            <dd className="text-muted-foreground">Un logiciel SaaS (en ligne) de relance automatique de devis</dd>
            <dt className="font-medium">Pour qui</dt>
            <dd className="text-muted-foreground">Artisans et TPE du bâtiment : plombiers, électriciens, couvreurs, chauffagistes, peintres, menuisiers, entreprises de rénovation</dd>
            <dt className="font-medium">Ce qu'il fait</dt>
            <dd className="text-muted-foreground">Envoi du devis PDF, relances automatiques, réponses du client dans le dossier, réponse depuis le site, demande d'avis Google</dd>
            <dt className="font-medium">Ce qu'il ne fait pas</dt>
            <dd className="text-muted-foreground">Il ne fait ni devis ni factures : il complète votre logiciel habituel</dd>
            <dt className="font-medium">Prix</dt>
            <dd className="text-muted-foreground">Gratuit pendant le lancement, puis 9,99 € par mois prévus, TVA non applicable, article 293 B du CGI (<Link href="/tarifs" className="underline underline-offset-4">tarifs</Link>)</dd>
            <dt className="font-medium">Éditeur</dt>
            <dd className="text-muted-foreground">{SITE.editor}, développeur web indépendant, France</dd>
            <dt className="font-medium">En ligne depuis</dt>
            <dd className="text-muted-foreground">Novembre 2026</dd>
          </dl>
        </section>

        <section aria-labelledby="pourquoi">
          <h2 id="pourquoi" className="text-xl font-semibold">Pourquoi Artisan Relance existe</h2>
          <p className="mt-3 text-muted-foreground">
            Artisan Relance est né d'un constat simple, fait en travaillant avec des artisans : le devis est prêt, envoyé,
            puis le client ne répond pas. Pas forcément parce qu'il a dit non, mais parce qu'il compare, qu'il attend une
            aide, ou qu'il a simplement oublié. L'artisan, lui, n'a pas le temps de relancer chaque devis au bon moment.
          </p>
          <p className="mt-3 text-muted-foreground">
            Plutôt que de proposer un logiciel de devis de plus, nous avons construit le chaînon qui manquait : un outil qui
            prend le devis que vous avez déjà fait, l'envoie et s'occupe du suivi jusqu'à la réponse du client.
          </p>
        </section>

        <section aria-labelledby="problemes">
          <h2 id="problemes" className="text-xl font-semibold">Les problèmes que nous réglons</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {PROBLEMS.map((p) => (
              <div key={p.title} className="rounded-xl border p-4">
                <h3 className="font-medium">{p.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="benefices">
          <h2 id="benefices" className="text-xl font-semibold">Ce que vous y gagnez</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted-foreground">
            {BENEFITS.map((b) => <li key={b}>{b}</li>)}
          </ul>
          <p className="mt-3 text-sm">
            <Link href="/#fonctionnement" className="underline underline-offset-4">Voir comment fonctionne la relance automatique</Link>
          </p>
        </section>

        <section aria-labelledby="qui">
          <h2 id="qui" className="text-xl font-semibold">Qui fabrique Artisan Relance</h2>
          <p className="mt-3 text-muted-foreground">
            Artisan Relance est conçu, développé et maintenu par <strong className="text-foreground">{SITE.editor}</strong>,
            développeur web indépendant qui crée des sites et des outils pour les artisans, les indépendants et les petites
            entreprises. Chaque fonction est testée sur de vrais envois avant sa mise en ligne, et les guides du site sont
            écrits à partir des questions posées par les artisans.
          </p>
          <p className="mt-3 text-muted-foreground">
            Découvrir ses autres réalisations :{" "}
            <a href={SITE.editorUrl} className="underline underline-offset-4" rel="noopener">{SITE.editorUrl.replace(/^https?:\/\//, "")}</a>
          </p>
        </section>

        <TrustBadges compact />

        <section aria-labelledby="engagements">
          <h2 id="engagements" className="text-xl font-semibold">Nos engagements</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted-foreground">
            {COMMITMENTS.map((c) => <li key={c}>{c}</li>)}
          </ul>
          <p className="mt-3 text-sm">
            <Link href="/confiance" className="underline underline-offset-4">Confiance et sécurité des données</Link> ·{" "}
            <Link href="/confidentialite" className="underline underline-offset-4">Politique de confidentialité</Link> ·{" "}
            <Link href="/mentions-legales" className="underline underline-offset-4">Mentions légales</Link>
          </p>
        </section>

        <section aria-labelledby="contact">
          <h2 id="contact" className="text-xl font-semibold">Nous contacter</h2>
          <ul className="mt-3 space-y-1.5 text-muted-foreground">
            <li>
              E-mail : <a href={`mailto:${SITE.contactEmail}`} className="underline underline-offset-4">{SITE.contactEmail}</a>
            </li>
            <li>
              Formulaire : <Link href="/contact" className="underline underline-offset-4">page Contact</Link>
            </li>
            <li>
              Démonstration gratuite de 10 minutes : <Link href={SITE.demoHref} className="underline underline-offset-4">la demander</Link>
            </li>
          </ul>
        </section>

        <section aria-labelledby="questions">
          <h2 id="questions" className="mb-4 text-xl font-semibold">Questions fréquentes</h2>
          <FaqList items={ABOUT_FAQ} />
        </section>
      </div>

      <div className="mt-14">
        <CtaBlock title="Essayez sur votre prochain devis" text="Gratuit, sans carte bancaire, prêt en 2 minutes." />
      </div>
    </article>
  );
}
