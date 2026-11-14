import Link from "next/link";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FaqList, FAQ_ITEMS } from "@/components/marketing/faq-list";
import { SoftwareJsonLd } from "@/components/seo/json-ld";

const steps = [
  {
    icon: FileText,
    title: "Envoyez votre devis",
    text: "Joignez votre PDF, choisissez le client : le devis part depuis l'application, à votre nom.",
  },
  {
    icon: CalendarClock,
    title: "Les relances partent seules",
    text: "Tous les 3, 7, 14 ou 30 jours : vous choisissez le rythme, le nombre de relances et la date de fin.",
  },
  {
    icon: MousePointerClick,
    title: "Le client répond : tout s'arrête",
    text: "Dès que le client répond, les relances s'arrêtent et sa réponse arrive dans votre boîte mail.",
  },
];

const features = [
  { icon: BellRing, title: "Relances automatiques", text: "Au rythme que vous choisissez, du lundi au samedi en journée." },
  { icon: MailCheck, title: "Réponses dans votre boîte", text: "Le client répond à l'e-mail : la réponse arrive directement chez vous." },
  { icon: TrendingUp, title: "Tableau de bord clair", text: "Devis en attente, signés, perdus, taux de conversion et chiffre gagné." },
  { icon: Smartphone, title: "Pensé pour le mobile", text: "Une interface simple, utilisable d'une main entre deux chantiers." },
  { icon: Clock, title: "Zéro temps perdu", text: "Plus besoin de vous souvenir qui relancer, ni quand." },
  { icon: ShieldCheck, title: "Données protégées", text: "Chaque compte est isolé. Vos clients restent vos clients." },
];

function DashboardPreview() {
  const rows = [
    { name: "M. Leroy", amount: "4 850 €", status: "pending", label: "Relance 1/3 · demain" },
    { name: "SCI Les Tilleuls", amount: "12 300 €", status: "signed", label: "Signé" },
    { name: "Mme Petit", amount: "1 920 €", status: "pending", label: "Relance 2/3 · 3 déc." },
    { name: "M. Garnier", amount: "760 €", status: "lost", label: "Perdu" },
  ] as const;

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <div className="absolute -inset-x-10 -top-10 -bottom-10 -z-10 bg-[radial-gradient(ellipse_at_center,hsl(var(--brand)/0.18),transparent_65%)]" />
      <div className="overflow-hidden rounded-xl border bg-card shadow-2xl shadow-black/20">
        <div className="flex items-center gap-1.5 border-b px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="ml-3 text-xs text-muted-foreground">artisan-relance · Tableau de bord</span>
        </div>
        <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
          {[
            ["En attente", "7"],
            ["Signés", "12"],
            ["Conversion", "63 %"],
            ["Gagné", "48 920 €"],
          ].map(([k, v]) => (
            <div key={k} className="bg-card p-4">
              <p className="text-xs text-muted-foreground">{k}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{v}</p>
            </div>
          ))}
        </div>
        <div className="divide-y border-t">
          {rows.map((r) => (
            <div key={r.name} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.label}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="tabular-nums">{r.amount}</span>
                <Badge variant={r.status}>
                  {r.status === "pending" ? "En attente" : r.status === "signed" ? "Signé" : "Perdu"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <SoftwareJsonLd />
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="container flex flex-col items-center gap-8 pb-16 pt-14 text-center md:pb-24 md:pt-24">
          <Badge variant="outline" className="gap-2 px-3 py-1 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Gratuit pendant le lancement
          </Badge>
          <h1 className="text-balance max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            Vos devis se relancent <span className="text-brand">tout seuls</span>.
          </h1>
          <p className="text-balance max-w-xl text-base text-muted-foreground sm:text-lg">
            Envoyez votre devis depuis Artisan Relance : les relances partent toutes seules, au rythme que vous
            choisissez, et s'arrêtent dès que le client répond.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild size="lg" variant="brand">
              <Link href="/inscription">
                Créer mon compte gratuit <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#fonctionnement">Voir comment ça marche</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Sans carte bancaire · Prêt en 2 minutes</p>
          <div className="mt-6 w-full">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* PROBLÈME */}
      <section className="border-y bg-muted/30">
        <div className="container grid gap-10 py-16 md:grid-cols-2 md:items-center md:py-20">
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold tracking-tight">Un devis sans relance, c'est souvent un chantier perdu.</h2>
            <p className="text-muted-foreground">
              Le client compare, hésite, oublie… et signe souvent avec l'artisan qui l'a recontacté en premier.
              Entre les chantiers, les urgences et la paperasse, relancer chaque devis au bon moment est presque
              impossible.
            </p>
          </div>
          <ul className="space-y-3">
            {[
              "Vous n'avez plus à noter qui relancer, ni quand.",
              "Chaque devis reçoit ses relances, même en pleine saison.",
              "Vos clients sentent que leur projet compte pour vous.",
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
          <h2 className="text-3xl font-semibold tracking-tight">Simple comme un coup de fil.</h2>
          <p className="mt-3 text-muted-foreground">Trois étapes, aucune formation nécessaire.</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="relative rounded-xl border bg-card p-6">
              <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
              <s.icon className="mt-4 h-6 w-6 text-brand" />
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FONCTIONNALITÉS */}
      <section className="border-y bg-muted/30">
        <div className="container py-16 md:py-24">
          <h2 className="text-center text-3xl font-semibold tracking-tight">Tout ce qu'il faut, rien de plus.</h2>
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

      {/* ROI */}
      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-8 md:p-12">
          <p className="text-sm font-medium text-brand">Le calcul est vite fait</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
            Un seul chantier récupéré peut représenter des milliers d'euros.
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ["8", "devis envoyés par mois (exemple)"],
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
              Toutes les questions <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <FaqList items={FAQ_ITEMS.slice(0, 4)} />
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-20">
        <div className="relative overflow-hidden rounded-2xl border bg-card px-6 py-14 text-center">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom,hsl(var(--brand)/0.15),transparent_60%)]" />
          <h2 className="text-balance text-3xl font-semibold tracking-tight">Arrêtez de perdre des devis par manque de temps.</h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">Créez votre compte et ajoutez votre premier devis en 2 minutes.</p>
          <Button asChild size="lg" variant="brand" className="mt-8">
            <Link href="/inscription">
              Commencer gratuitement <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
