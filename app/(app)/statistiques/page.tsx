import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  ExternalLink,
  FileText,
  MailCheck,
  MessageSquareReply,
  MousePointerClick,
  Repeat,
  Star,
  Trophy,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { VisitsChart } from "@/components/stats/visits-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSiteStats, isPlatformAdmin, type Metric } from "@/lib/stats";

export const metadata: Metadata = { title: "Statistiques" };
export const dynamic = "force-dynamic";

/**
 * Statistiques de la plateforme. Pour en ajouter une : une clé dans admin_site_stats()
 * (SQL, objet « platform ») + une ligne ici. Rien d'autre à modifier.
 */
const PLATFORM_METRICS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "artisans", label: "Artisans inscrits", icon: UserPlus },
  { key: "quotes", label: "Devis créés", icon: FileText },
  { key: "quotes_sent", label: "Devis envoyés", icon: MailCheck },
  { key: "followups_sent", label: "Relances envoyées", icon: Repeat },
  { key: "replies", label: "Réponses de clients", icon: MessageSquareReply },
  { key: "quotes_won", label: "Devis acceptés", icon: Trophy },
  { key: "review_requests", label: "Demandes d'avis envoyées", icon: Star },
  { key: "review_clicks", label: "Clics vers la fiche Google", icon: MousePointerClick },
];

const n = (v: number) => new Intl.NumberFormat("fr-FR").format(v);
const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function StatistiquesPage() {
  if (!(await isPlatformAdmin())) notFound();
  const stats = await getSiteStats(90);

  if (!stats) {
    return (
      <>
        <PageHeader title="Statistiques" />
        <Card className="p-6 text-sm text-muted-foreground">Les statistiques sont momentanément indisponibles. Réessayez dans un instant.</Card>
      </>
    );
  }

  const since = stats.first_day ? dateFmt.format(new Date(`${stats.first_day}T00:00:00Z`)) : null;
  const empty = stats.views.total === 0;

  return (
    <>
      <PageHeader
        title="Statistiques"
        description="Visites du site public et activité de la plateforme. Visible uniquement par vous."
        actions={
          <a
            href="https://vercel.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            Vercel Analytics <ExternalLink className="h-3.5 w-3.5" />
          </a>
        }
      />

      <section aria-labelledby="visites" className="space-y-4">
        <h2 id="visites" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Visiteurs de artisan-relance.jercat.fr
        </h2>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Aujourd'hui" value={n(stats.visitors.today)} hint={`${n(stats.views.today)} pages vues`} icon={Users} tone="brand" />
          <StatCard label="7 derniers jours" value={n(stats.visitors.week)} hint={`${n(stats.views.week)} pages vues`} icon={CalendarDays} />
          <StatCard label="30 derniers jours" value={n(stats.visitors.month)} hint={`${n(stats.views.month)} pages vues`} icon={CalendarRange} />
          <StatCard
            label="Total"
            value={n(stats.visitors.total)}
            hint={since ? `${n(stats.views.total)} pages vues depuis le ${since}` : "Aucune visite pour l'instant"}
            icon={BarChart3}
          />
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Évolution des visites</CardTitle>
            <CardDescription>Visiteurs uniques et pages vues, jour par jour (heure de Paris).</CardDescription>
          </CardHeader>
          <CardContent>
            {empty ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Le comptage vient de démarrer : les premières visites apparaîtront ici dès demain.
              </p>
            ) : (
              <VisitsChart daily={stats.daily} />
            )}
          </CardContent>
        </Card>

        <div className="grid gap-3 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Pages les plus vues</CardTitle>
              <CardDescription>30 derniers jours, en visiteurs uniques.</CardDescription>
            </CardHeader>
            <CardContent>
              <RankList rows={stats.top_pages.map((p) => ({ label: p.path, value: p.visitors }))} empty="Pas encore de données." />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">D&apos;où viennent les visiteurs</CardTitle>
              <CardDescription>Sites qui envoient des visiteurs (30 jours). Les accès directs ne sont pas listés.</CardDescription>
            </CardHeader>
            <CardContent>
              <RankList rows={stats.top_referrers.map((r) => ({ label: r.host, value: r.visitors }))} empty="Aucun site référent pour l'instant." />
            </CardContent>
          </Card>
        </div>
      </section>

      <section aria-labelledby="plateforme" className="mt-10 space-y-4">
        <h2 id="plateforme" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Activité de la plateforme
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {PLATFORM_METRICS.map((m) => {
            const metric: Metric = stats.platform[m.key] ?? { total: 0, month: 0 };
            return <StatCard key={m.key} label={m.label} value={n(metric.total)} hint={`dont ${n(metric.month)} sur 30 jours`} icon={m.icon} />;
          })}
        </div>
      </section>

      <p className="mt-10 max-w-3xl text-xs leading-relaxed text-muted-foreground">
        Comptage anonyme, sans cookie et sans bandeau : aucune adresse IP n&apos;est conservée, seule une empreinte
        tronquée qui change chaque mois. Robots exclus, rechargements d&apos;une même page sous 30 minutes comptés une
        fois, données effacées après 13 mois. Les pages privées (tableau de bord, devis…) ne sont pas comptées. Pour les
        pays, appareils et navigateurs, ouvrez Vercel Analytics. Le « Total » additionne les visiteurs uniques de chaque
        mois : une personne revenue sur plusieurs mois compte une fois par mois.
      </p>
    </>
  );
}

function RankList({ rows, empty }: { rows: { label: string; value: number }[]; empty: string }) {
  if (!rows.length) return <p className="py-4 text-sm text-muted-foreground">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-1.5">
      {rows.map((r) => (
        <li key={r.label} className="relative overflow-hidden rounded-md px-2.5 py-1.5 text-sm">
          <span aria-hidden className="absolute inset-y-0 left-0 rounded-md bg-brand/10" style={{ width: `${(r.value / max) * 100}%` }} />
          <span className="relative flex items-center justify-between gap-3">
            <span className="truncate">{r.label}</span>
            <span className="tabular-nums text-muted-foreground">{n(r.value)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
