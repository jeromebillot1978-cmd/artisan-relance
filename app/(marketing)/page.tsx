import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BellRing,
  CalendarClock,
  CheckCircle2,
  FileText,
  Gauge,
  Lock,
  MailCheck,
  MousePointerClick,
  ShieldCheck,
  Smartphone,
  Star,
  TrendingUp,
  X,
} from "lucide-react";
import { FaqList } from "@/components/marketing/faq-list";
import { CtaBlock, CtaButtons } from "@/components/marketing/cta-block";
import { SpeedChart } from "@/components/marketing/speed-chart";
import { PriceCompare } from "@/components/marketing/price-compare";
import { RoiSimulator } from "@/components/marketing/roi-simulator";
import { AnimatedNumber } from "@/components/marketing/animated-number";
import { FaqJsonLd, SoftwareJsonLd } from "@/components/seo/json-ld";
import { FAQ_ALL, FAQ_HOME } from "@/lib/content/faq";
import { METIERS } from "@/lib/content/metiers";
import { GUIDES } from "@/lib/content/guides";
import { Testimonials } from "@/components/marketing/testimonials";
import { TrustBadges } from "@/components/marketing/trust-badges";
import { BENCH_DATE, SPEED, speedSelf, weightRatio } from "@/lib/content/benchmarks";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import dashboardImg from "@/public/captures/tableau-de-bord.png";
import formImg from "@/public/captures/nouveau-devis.png";
import listImg from "@/public/captures/suivi-relances.png";
import emailImg from "@/public/captures/email-client.png";

export const metadata = pageMetadata({
  title: "Logiciel de relance de devis pour artisans | Artisan Relance",
  ogTitle: "Artisan Relance — vos devis deviennent des chantiers signés",
  description:
    "Gardez votre logiciel de devis : Artisan Relance envoie vos devis, relance vos clients automatiquement et s'arrête dès qu'ils répondent. Gratuit, rapide en 4G.",
  path: "/",
});

const TOOLS = ["Obat", "Batappli", "Tolteck", "EBP", "Excel", "Word", "Google Docs", "Tout devis en PDF"];

const steps = [
  {
    icon: FileText,
    title: "Joignez votre devis",
    text: "Le PDF fait avec votre logiciel habituel, et l'adresse du client. Il part à votre nom, avec votre signature.",
  },
  {
    icon: CalendarClock,
    title: "Les relances partent seules",
    text: "Tous les 3, 7, 14 ou 30 jours, le nombre de relances que vous voulez. Du lundi au samedi, en journée.",
  },
  {
    icon: MousePointerClick,
    title: "Le client répond, les relances s'arrêtent",
    text: "Sa réponse arrête automatiquement les relances. Vous la lisez dans le dossier du devis, avec ses photos, et vous lui répondez depuis le site.",
  },
  {
    icon: Star,
    title: "Chantier fini, avis Google demandé",
    text: "Quelques jours après « Terminé », votre client reçoit le lien vers votre fiche Google. Vous suivez les clics.",
  },
];

const features = [
  { icon: BellRing, title: "Relances automatiques", text: "Au rythme choisi, jamais la nuit ni le dimanche, arrêtées en un clic." },
  { icon: MailCheck, title: "À votre nom", text: "Votre signature, votre adresse de réponse : le client ne voit pas d'outil." },
  { icon: Star, title: "Avis Google", text: "Demande d'avis après le chantier, 3 modèles d'e-mail, suivi des clics." },
  { icon: TrendingUp, title: "Tableau de bord", text: "Devis en attente, gagnés, perdus, taux de signature, montant signé." },
  { icon: Smartphone, title: "Fait pour le chantier", text: "Une application légère : un devis envoyé d'une main, même en 4G." },
  { icon: ShieldCheck, title: "Données en Europe", text: "Hébergement à Zurich, comptes isolés, aucune donnée revendue." },
];

const shots = [
  { img: formImg, alt: "Formulaire d'envoi d'un devis avec choix du rythme des relances", caption: "Un devis et ses relances, en une minute" },
  { img: listImg, alt: "Liste des devis avec statut, nombre de relances et prochaine date", caption: "Le suivi de chaque devis" },
  { img: emailImg, alt: "E-mail de relance reçu par le client, au nom de l'artisan", caption: "L'e-mail que reçoit votre client" },
];

export default function HomePage() {
  const self = speedSelf();
  const ratio = weightRatio();
  const slowest = Math.max(...SPEED.filter((r) => !r.self).map((r) => r.lcp));

  return (
    <>
      <SoftwareJsonLd />
      <FaqJsonLd items={FAQ_HOME} />

      {/* HERO : texte seul au-dessus de la ligne de flottaison (affichage immédiat sur mobile) */}
      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="container flex flex-col items-center gap-6 pb-10 pt-10 text-center md:pb-14 md:pt-20">
          {/* H1 = catégorie (mot-clé principal) + promesse, présentés comme avant */}
          <h1 className="flex flex-col items-center gap-6">
            <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium tracking-normal">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
              Logiciel de relance automatique de devis pour artisans du bâtiment
            </span>
            <span className="text-balance block max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
              Vous faites les devis. <span className="text-brand">Nous les transformons en chantiers signés.</span>
            </span>
          </h1>
          <p className="text-balance max-w-2xl text-base text-muted-foreground sm:text-lg">
            Gardez Obat, Batappli, Tolteck ou Excel pour faire vos devis. Artisan Relance s'occupe uniquement de les
            envoyer et de relancer vos clients, jusqu'à 3 fois ou plus selon votre réglage, et s'arrête dès qu'ils répondent.
          </p>
          <CtaButtons />
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <li className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> Gratuit, sans carte bancaire</li>
            <li className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> Prêt en 2 minutes</li>
            <li className="inline-flex items-center gap-1.5"><Gauge className="h-4 w-4 text-success" /> Rapide même en 4G sur le chantier</li>
          </ul>
        </div>
      </section>

      {/* COMPATIBLE AVEC VOS OUTILS */}
      <section aria-labelledby="outils" className="border-y bg-muted/30">
        <div className="container py-8">
          <h2 id="outils" className="text-center text-sm font-medium text-muted-foreground">
            Compatible avec vos outils actuels : vous joignez le PDF, rien à changer
          </h2>
          <ul className="mt-4 flex flex-wrap justify-center gap-2">
            {TOOLS.map((t) => (
              <li key={t} className="rounded-full border bg-background px-3.5 py-1.5 text-sm font-medium">{t}</li>
            ))}
          </ul>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Aucun partenariat ni intégration requise : Artisan Relance fonctionne avec le PDF exporté par n'importe quel logiciel.
          </p>
        </div>
      </section>

      {/* CAPTURE */}
      <section className="container pt-12 md:pt-16">
        <figure className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-xl border shadow-2xl shadow-black/10">
            <Image
              src={dashboardImg}
              alt="Tableau de bord d'Artisan Relance : devis en cours, relances prévues, taux de signature"
              sizes="(min-width: 1024px) 1024px, 100vw"
              className="h-auto w-full"
              placeholder="blur"
            />
          </div>
          <figcaption className="mt-3 text-center text-xs text-muted-foreground">Interface réelle d'Artisan Relance, avec des données d'exemple.</figcaption>
        </figure>
      </section>

      {/* POSITIONNEMENT */}
      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Un logiciel de relance de devis, pas un logiciel de devis de plus</h2>
          <p className="mt-3 text-muted-foreground">
            Votre logiciel chiffre et édite. Mais une fois le devis envoyé, personne ne relance : c'est là que les chantiers se perdent.
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
          <div className="rounded-xl border bg-card p-6">
            <p className="text-sm font-medium text-muted-foreground">Votre logiciel de devis</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {["Chiffrer les travaux", "Éditer le devis et la facture", "Gérer la TVA et les acomptes"].map((t) => (
                <li key={t} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /> {t}</li>
              ))}
              <li className="flex gap-2 text-muted-foreground"><X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" /> Relancer chaque client au bon moment</li>
              <li className="flex gap-2 text-muted-foreground"><X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" /> Demander un avis après le chantier</li>
            </ul>
          </div>
          <div className="rounded-xl border-2 border-brand bg-brand/5 p-6">
            <p className="text-sm font-semibold text-brand">Artisan Relance</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                "Envoyer le devis à votre nom",
                "Relancer automatiquement jusqu'à la réponse",
                "Arrêter en un clic quand le client répond",
                "Suivre les devis gagnés, perdus, en attente",
                "Demander l'avis Google une fois le chantier fini",
              ].map((t) => (
                <li key={t} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {t}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FONCTIONNEMENT */}
      <section id="fonctionnement" className="scroll-mt-20 border-y bg-muted/30">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Comment fonctionne la relance automatique de devis</h2>
            <p className="mt-3 text-muted-foreground">Quatre étapes, aucune formation.</p>
          </div>
          <ol className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="rounded-xl border bg-card p-6">
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
                <div className="overflow-hidden rounded-lg border bg-background">
                  <Image src={s.img} alt={s.alt} sizes="(min-width: 768px) 33vw, 100vw" className="h-auto w-full" />
                </div>
                <figcaption className="mt-2 text-sm text-muted-foreground">{s.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* VITESSE */}
      <section id="vitesse" className="container scroll-mt-20 py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-center">
          <div>
            <p className="text-sm font-medium text-brand">Pas d'attente, pas d'écran blanc</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Conçu pour s'ouvrir vite, même en 4G sur un chantier</h2>
            <p className="mt-3 text-muted-foreground">
              Un logiciel complet charge des centaines de fonctions dont vous n'avez pas besoin pour relancer un devis.
              Artisan Relance n'en garde que l'essentiel : la page commence à s'afficher en moins d'une seconde, même en
              4G. Pas d'attente, pas d'écran blanc, vos relances tout de suite.
            </p>
            <dl className="mt-8 grid grid-cols-3 gap-3">
              <div className="rounded-lg border bg-card p-4">
                <dt className="text-xs text-muted-foreground">Premier affichage</dt>
                <dd className="mt-1 text-2xl font-semibold"><AnimatedNumber value={self.fcp} decimals={1} suffix=" s" /></dd>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <dt className="text-xs text-muted-foreground">Page plus légère</dt>
                <dd className="mt-1 text-2xl font-semibold"><AnimatedNumber value={ratio} prefix="×" /></dd>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <dt className="text-xs text-muted-foreground">Contenu affiché</dt>
                <dd className="mt-1 text-2xl font-semibold"><AnimatedNumber value={self.lcp} decimals={1} suffix=" s" /></dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              Sur mobile en 4G simulée, mesure du {BENCH_DATE}. « Page plus légère » : face au site de logiciel de devis le plus lourd mesuré.
              Le plus lent affichait son contenu en {slowest.toLocaleString("fr-FR")} s.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-5 md:p-6">
            <SpeedChart metric="lcp" />
          </div>
        </div>
      </section>

      {/* PRIX */}
      <section className="border-y bg-muted/30">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight">
              Ne payez pas un logiciel complet si votre problème est seulement de relancer vos devis
            </h2>
            <p className="mt-3 text-muted-foreground">
              Gratuit aujourd'hui. Demain, une offre unique prévue à 9,99 € HT par mois, annoncée 30 jours à l'avance.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-4xl">
            <PriceCompare compact />
          </div>
          <div className="mt-8 flex justify-center">
            <CtaButtons />
          </div>
        </div>
      </section>

      {/* FONCTIONNALITÉS */}
      <section className="container py-16 md:py-24">
        <h2 className="text-center text-3xl font-semibold tracking-tight">Fonctionnalités : tout pour faire signer vos devis</h2>
        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="bg-card p-6">
              <f.icon className="h-5 w-5 text-brand" />
              <h3 className="mt-4 font-medium">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SIMULATEUR */}
      <section className="border-y bg-muted/30">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-brand">Cas pratique, avec vos chiffres</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Combien vous coûtent les devis jamais relancés ?</h2>
            <p className="mt-3 text-muted-foreground">Un seul chantier récupéré rembourse des années d'abonnement. Faites le calcul.</p>
          </div>
          <div className="mx-auto mt-10 max-w-4xl">
            <RoiSimulator />
          </div>
        </div>
      </section>

      {/* CONFIANCE (preuves vérifiables ; témoignages affichés seulement s'ils existent) */}
      <section className="container py-16 md:py-24">
        <h2 className="text-center text-3xl font-semibold tracking-tight">Pourquoi vous pouvez nous confier vos clients</h2>
        <div className="mt-10">
          <Testimonials limit={3} />
        </div>
        <ul className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Lock, title: "Vos clients restent les vôtres", text: "Aucune donnée revendue ni utilisée pour de la publicité." },
            { icon: ShieldCheck, title: "RGPD et désinscription", text: "Hébergement en Europe, lien de désinscription dans les demandes d'avis." },
            { icon: CheckCircle2, title: "Sans engagement", text: "Export CSV et suppression du compte à tout moment." },
            { icon: MailCheck, title: "Un vrai interlocuteur", text: "Une question ? Réponse directe de l'éditeur, par e-mail." },
          ].map((c) => (
            <li key={c.title} className="rounded-xl border bg-card p-5">
              <c.icon className="h-5 w-5 text-brand" />
              <p className="mt-3 font-medium">{c.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{c.text}</p>
            </li>
          ))}
        </ul>
        <TrustBadges compact className="mx-auto mt-8 max-w-4xl" />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Édité par {SITE.editor}, développeur web indépendant en France ·{" "}
          <Link href="/confiance" className="underline underline-offset-4">sécurité et engagements</Link> ·{" "}
          <Link href="/a-propos" className="underline underline-offset-4">à propos</Link> ·{" "}
          <a href={`mailto:${SITE.contactEmail}`} className="underline underline-offset-4">{SITE.contactEmail}</a>
        </p>
      </section>

      {/* MÉTIERS */}
      <section className="border-t">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Comment relancer un devis dans votre métier</h2>
            <p className="mt-3 text-muted-foreground">
              Délais idéaux, modèles d'e-mail et de SMS, erreurs à éviter et générateur gratuit pour chaque métier.
            </p>
          </div>
          <ul className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {METIERS.map((m) => (
              <li key={m.slug}>
                <Link href={`/relance-devis/${m.slug}`} className="flex items-center justify-between rounded-lg border bg-card p-4 text-sm font-medium hover:bg-muted/50">
                  Relance de devis : {m.short.toLowerCase()}
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t">
        <div className="container grid gap-10 py-16 md:grid-cols-[1fr_2fr] md:py-24">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Questions fréquentes</h2>
            <Link href="/faq" className="mt-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              Les {FAQ_ALL.length} questions et réponses <ArrowRight className="h-4 w-4" />
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
            <li>
              <Link href="/comparatif" className="block h-full rounded-lg border bg-card p-4 hover:bg-muted/50">
                <span className="font-medium">Comparatif des outils de relance</span>
                <span className="mt-1 block text-sm text-muted-foreground">Prix, vitesse et fonctions face à Obat, Tolteck, Batappli, Abby et Sellsy.</span>
              </Link>
            </li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <CtaBlock
          title="Vos prochains devis méritent une relance"
          text="Créez votre compte et envoyez votre premier devis en 2 minutes, depuis votre téléphone. Une question avant ? Demandez une démonstration de 10 minutes."
        />
      </section>
    </>
  );
}
