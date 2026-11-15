import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BellRing,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  MailCheck,
  MousePointerClick,
  ShieldCheck,
  Smartphone,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FaqList } from "@/components/marketing/faq-list";
import { CtaBlock, CtaButtons } from "@/components/marketing/cta-block";
import { FaqJsonLd, SoftwareJsonLd } from "@/components/seo/json-ld";
import { FAQ_HOME } from "@/lib/content/faq";
import { METIERS } from "@/lib/content/metiers";
import { GUIDES } from "@/lib/content/guides";
import { pageMetadata } from "@/lib/seo";
import dashboardImg from "@/public/captures/tableau-de-bord.png";
import formImg from "@/public/captures/nouveau-devis.png";
import listImg from "@/public/captures/suivi-relances.png";
import emailImg from "@/public/captures/email-client.png";

export const metadata = pageMetadata({
  title: "Logiciel de relance de devis pour artisans | Artisan Relance",
  ogTitle: "Artisan Relance — vos devis se relancent tout seuls",
  description:
    "Logiciel gratuit de relance de devis pour artisans du bâtiment : envoi du devis PDF, relances automatiques par e-mail à votre nom, suivi des réponses.",
  path: "/",
});

const steps = [
  {
    icon: FileText,
    title: "Envoyez votre devis",
    text: "Joignez le PDF de votre devis, fait avec votre logiciel habituel, et l'adresse du client : il part à votre nom, avec votre signature.",
  },
  {
    icon: CalendarClock,
    title: "Les relances partent seules",
    text: "Tous les 3, 7, 14 ou 30 jours : vous choisissez le rythme, le nombre de relances et la date de fin. Envois du lundi au samedi, en journée.",
  },
  {
    icon: MousePointerClick,
    title: "Le client répond, vous arrêtez en un clic",
    text: "Sa réponse arrive directement dans votre boîte mail. Un clic sur « Répondu », « Gagné » ou « Perdu » et les relances s'arrêtent.",
  },
];

const features = [
  { icon: BellRing, title: "Relances automatiques", text: "Au rythme que vous choisissez, du lundi au samedi entre 8 h et 19 h, jamais la nuit ni le dimanche." },
  { icon: MailCheck, title: "Réponses dans votre boîte", text: "Le client vous répond directement, sur votre adresse habituelle." },
  { icon: TrendingUp, title: "Tableau de bord clair", text: "Devis en attente, gagnés, perdus, taux de signature et montant signé." },
  { icon: Smartphone, title: "Pensé pour le mobile", text: "Envoyez un devis depuis le chantier, d'une main, en moins d'une minute." },
  { icon: Clock, title: "Zéro oubli", text: "Plus de carnet ni de rappels dans le téléphone : chaque devis a ses relances programmées." },
  { icon: ShieldCheck, title: "Données en Europe", text: "Hébergement à Zurich, chaque compte isolé, aucune donnée revendue." },
];

const shots = [
  { img: formImg, alt: "Formulaire d'envoi d'un devis avec choix du rythme des relances", caption: "Création d'un devis et de ses relances" },
  { img: listImg, alt: "Liste des devis avec statut, nombre de relances et prochaine date", caption: "Suivi des relances devis par devis" },
  { img: emailImg, alt: "E-mail de relance reçu par le client, au nom de l'artisan", caption: "L'e-mail reçu par votre client" },
];

export default function HomePage() {
  return (
    <>
      <SoftwareJsonLd />
      <FaqJsonLd items={FAQ_HOME} />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="container flex flex-col items-center gap-7 pb-14 pt-12 text-center md:pb-20 md:pt-20">
          <Badge variant="outline" className="gap-2 px-3 py-1 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Logiciel gratuit pendant le lancement
          </Badge>
          <h1 className="text-balance max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            Relance automatique de vos devis : <span className="text-brand">plus de chantiers signés</span>, zéro oubli
          </h1>
          <p className="text-balance max-w-2xl text-base text-muted-foreground sm:text-lg">
            Artisan Relance envoie votre devis par e-mail à votre nom, puis relance votre client au rythme que vous
            choisissez. Ses réponses arrivent dans votre boîte mail ; un clic arrête les relances.
          </p>
          <CtaButtons />
          <p className="text-sm text-muted-foreground">
            Sans carte bancaire · Prêt en 2 minutes · Fonctionne avec vos devis Obat, Batappli, Excel ou Word (PDF)
          </p>
          <figure className="mt-6 w-full max-w-5xl">
            <div className="overflow-hidden rounded-xl border shadow-2xl shadow-black/10">
              <Image
                src={dashboardImg}
                alt="Tableau de bord d'Artisan Relance : devis en cours, relances prévues, taux de signature"
                priority
                sizes="(min-width: 1024px) 1024px, 100vw"
                className="h-auto w-full"
              />
            </div>
            <figcaption className="mt-3 text-xs text-muted-foreground">
              Interface réelle d'Artisan Relance, avec des données d'exemple.
            </figcaption>
          </figure>
        </div>
      </section>

      {/* PROBLÈME */}
      <section className="border-y bg-muted/30">
        <div className="container grid gap-10 py-16 md:grid-cols-2 md:items-center md:py-20">
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold tracking-tight">Un devis sans relance, c'est souvent un chantier perdu</h2>
            <p className="text-muted-foreground">
              Le client compare, hésite, oublie… et signe souvent avec l'artisan qui l'a recontacté en premier. Entre
              les chantiers, les urgences et la paperasse, relancer chaque devis au bon moment est presque impossible.
            </p>
            <p className="text-muted-foreground">
              Artisan Relance ne remplace pas votre logiciel de devis : il s'occupe seulement de ce que personne n'a le
              temps de faire, le suivi après l'envoi.
            </p>
          </div>
          <ul className="space-y-3">
            {[
              "Vous n'avez plus à noter qui relancer, ni quand.",
              "Chaque devis reçoit ses relances, même en pleine saison.",
              "Vos clients sentent que leur projet compte pour vous.",
              "Vous voyez en un coup d'œil le montant des devis qui attendent.",
            ].map((t) => (
              <li key={t} className="flex gap-3 rounded-lg border bg-card p-4 text-sm">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FONCTIONNEMENT */}
      <section id="fonctionnement" className="container scroll-mt-20 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Comment fonctionne la relance automatique de devis</h2>
          <p className="mt-3 text-muted-foreground">Trois étapes, aucune formation nécessaire.</p>
        </div>
        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="relative rounded-xl border bg-card p-6">
              <span className="font-mono text-xs text-muted-foreground">Étape {i + 1}</span>
              <s.icon className="mt-4 h-6 w-6 text-brand" />
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {shots.map((s) => (
            <figure key={s.caption}>
              <div className="overflow-hidden rounded-lg border">
                <Image src={s.img} alt={s.alt} sizes="(min-width: 768px) 33vw, 100vw" className="h-auto w-full" />
              </div>
              <figcaption className="mt-2 text-sm text-muted-foreground">{s.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* FONCTIONNALITÉS */}
      <section className="border-y bg-muted/30">
        <div className="container py-16 md:py-24">
          <h2 className="text-center text-3xl font-semibold tracking-tight">Tout ce qu'il faut pour relancer, rien de plus</h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="bg-card p-6">
                <f.icon className="h-5 w-5 text-brand" />
                <h3 className="mt-4 font-medium">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MÉTIERS */}
      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Un logiciel de relance pour tous les métiers du bâtiment</h2>
          <p className="mt-3 text-muted-foreground">
            Un devis de toiture ne se relance pas comme un devis de peinture. Retrouvez le calendrier et le modèle de
            mail adaptés à votre métier.
          </p>
        </div>
        <ul className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {METIERS.map((m) => (
            <li key={m.slug}>
              <Link href={`/relance-devis/${m.slug}`} className="flex items-center justify-between rounded-lg border bg-card p-4 text-sm font-medium hover:bg-muted/50">
                Relance de devis {m.metier}
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ROI */}
      <section className="container pb-16 md:pb-24">
        <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-8 md:p-12">
          <p className="text-sm font-medium text-brand">Le calcul est vite fait</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
            Un seul chantier récupéré peut représenter des milliers d'euros
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ["8", "devis envoyés par mois"],
              ["+1", "chantier signé grâce aux relances"],
              ["3 000 €", "de chiffre d'affaires en plus"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-lg bg-muted/50 p-4">
                <p className="text-2xl font-semibold tabular-nums">{v}</p>
                <p className="mt-1 text-xs text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Exemple illustratif : les résultats dépendent de votre activité et de vos devis.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t">
        <div className="container grid gap-10 py-16 md:grid-cols-[1fr_2fr] md:py-24">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Questions fréquentes</h2>
            <Link href="/faq" className="mt-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              Les 18 questions et réponses <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <FaqList items={FAQ_HOME} />
        </div>
      </section>

      {/* GUIDES */}
      <section className="border-t bg-muted/30">
        <div className="container py-16 md:py-20">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Guides pour relancer vos devis</h2>
          <ul className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {GUIDES.map((g) => (
              <li key={g.slug}>
                <Link href={`/guides/${g.slug}`} className="block h-full rounded-lg border bg-card p-4 hover:bg-muted/50">
                  <span className="font-medium">{g.short}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{g.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <CtaBlock
          title="Arrêtez de perdre des devis par manque de temps"
          text="Créez votre compte et ajoutez votre premier devis en 2 minutes. Une question avant ? Demandez une démonstration de 10 minutes."
        />
      </section>
    </>
  );
}
