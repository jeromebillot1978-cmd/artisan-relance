import { Suspense } from "react";
import Link from "next/link";
import { Clock, Mail, MonitorPlay } from "lucide-react";
import { ContactForm } from "@/components/marketing/contact-form";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { BreadcrumbJsonLd, ContactPageJsonLd } from "@/components/seo/json-ld";

const DESCRIPTION =
  "Une question sur la relance automatique de vos devis ? Écrivez-nous ou demandez une démonstration gratuite de 10 minutes d'Artisan Relance.";

export const metadata = pageMetadata({
  title: "Contact et démonstration — Artisan Relance",
  description: DESCRIPTION,
  path: "/contact",
});

const TOPICS = [
  { title: "Avant d'essayer", text: "Savoir si l'outil convient à votre métier, à votre logiciel de devis ou à votre façon de travailler." },
  { title: "Pendant la prise en main", text: "Régler le rythme des relances, rédiger vos messages, ajouter un devis déjà envoyé ou plusieurs destinataires." },
  { title: "Sur vos données", text: "Hébergement, durée de conservation, export ou suppression de votre compte et des données de vos clients." },
  { title: "Pour proposer une idée", text: "Une fonction qui vous manque, un métier mal couvert, un modèle de relance à ajouter : vos retours orientent les prochaines versions." },
];

export default function ContactPage() {
  return (
    <section className="container grid gap-12 py-14 md:grid-cols-[1fr_1.3fr] md:py-20">
      <BreadcrumbJsonLd items={[{ name: "Accueil", path: "/" }, { name: "Contact", path: "/contact" }]} />
      <ContactPageJsonLd path="/contact" description={DESCRIPTION} />
      <div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Contact et démonstration</h1>
        <p className="mt-4 text-muted-foreground">
          Une question avant d'essayer, un doute sur vos devis ou envie de voir l'outil en action ? Écrivez-nous :
          une personne vous répond, pas un robot.
        </p>
        <ul className="mt-8 space-y-5 text-sm">
          <li className="flex gap-3">
            <MonitorPlay className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <span>
              <strong className="block text-foreground">Démonstration de 10 minutes</strong>
              <span className="text-muted-foreground">En visio ou au téléphone, sur un de vos vrais devis si vous le souhaitez.</span>
            </span>
          </li>
          <li className="flex gap-3">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <span>
              <strong className="block text-foreground">Réponse sous 24 heures ouvrées</strong>
              <span className="text-muted-foreground">Du lundi au vendredi.</span>
            </span>
          </li>
          <li className="flex gap-3">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <span>
              <strong className="block text-foreground">Par e-mail</strong>
              <a href={`mailto:${SITE.contactEmail}`} className="text-muted-foreground underline underline-offset-4">
                {SITE.contactEmail}
              </a>
            </span>
          </li>
        </ul>
        <p className="mt-8 text-sm text-muted-foreground">
          Vous préférez tester tout de suite ?{" "}
          <Link href={SITE.ctaHref} className="font-medium text-foreground underline underline-offset-4">
            {SITE.cta}
          </Link>
          , sans carte bancaire.
        </p>
      </div>
      <div className="rounded-2xl border bg-card p-6 md:p-8">
        <Suspense>
          <ContactForm />
        </Suspense>
      </div>

      <div className="space-y-12 md:col-span-2">
        <section>
          <h2 className="text-2xl font-semibold tracking-tight">Ce que vous pouvez nous demander</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {TOPICS.map((t) => (
              <li key={t.title} className="rounded-xl border bg-card p-5">
                <p className="font-medium">{t.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t.text}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight">Comment se déroule la démonstration</h2>
          <p className="mt-3 text-muted-foreground">
            La démonstration dure une dizaine de minutes, en visio ou au téléphone. Nous ajoutons ensemble un devis (un des
            vôtres si vous le souhaitez, sinon un exemple), nous réglons le rythme des relances et vous voyez l'e-mail tel que
            votre client le recevra. Vous repartez avec un compte prêt à l'emploi, sans engagement ni carte bancaire.
          </p>
          <p className="mt-3 text-muted-foreground">
            Pour en profiter au mieux, préparez un devis récent au format PDF et l'adresse e-mail que vous voulez voir
            apparaître comme expéditeur des relances.
          </p>
        </section>
        <section className="max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight">La réponse est peut-être déjà en ligne</h2>
          <p className="mt-3 text-muted-foreground">
            Les questions les plus fréquentes ont leur réponse dans la{" "}
            <Link href="/faq" className="underline underline-offset-4">FAQ</Link>. Les prix sont détaillés sur la page{" "}
            <Link href="/tarifs" className="underline underline-offset-4">tarifs</Link>, la sécurité des données sur la page{" "}
            <Link href="/confiance" className="underline underline-offset-4">confiance</Link>, et les méthodes de relance dans les{" "}
            <Link href="/guides" className="underline underline-offset-4">guides</Link> et les{" "}
            <Link href="/relance-devis" className="underline underline-offset-4">pages par métier</Link>.
          </p>
        </section>
      </div>
    </section>
  );
}
