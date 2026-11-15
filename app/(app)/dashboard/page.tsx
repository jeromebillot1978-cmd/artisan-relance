import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, Euro, FolderOpen, MessageCircleReply, MousePointerClick, Plus, Send, Star } from "lucide-react";
import { computeStats, getCampaigns, getReviewData, requireUser } from "@/lib/data";
import { computeReviewStats } from "@/lib/reviews";
import { ReviewHistory } from "@/components/reviews/review-history";
import { formatDateTime } from "@/lib/campaigns/constants";
import { formatCurrencyRounded } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { PasswordUpdatedToast } from "@/components/app/password-updated-toast";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function DashboardPage() {
  const [{ profile }, campaigns, reviewData] = await Promise.all([requireUser(), getCampaigns(), getReviewData({ eventsLimit: 30 })]);
  const reviewStats = computeReviewStats(reviewData.requests);
  // Notifications : événements marquants des 14 derniers jours
  const since = Date.now() - 14 * 86_400_000;
  const notifications = reviewData.events
    .filter((e) => ["sent", "clicked", "send_failed", "opted_out", "mark_received"].includes(e.type) && new Date(e.created_at).getTime() >= since)
    .slice(0, 6);
  const stats = computeStats(campaigns);
  const upcoming = campaigns
    .filter((c) => c.status === "active" && c.next_followup_at)
    .sort((a, b) => (a.next_followup_at ?? "").localeCompare(b.next_followup_at ?? ""))
    .slice(0, 6);
  const replies = campaigns
    .filter((c) => c.replied_at)
    .sort((a, b) => (b.replied_at ?? "").localeCompare(a.replied_at ?? ""))
    .slice(0, 5);
  const firstName = profile.contact_name?.split(" ")[0];

  return (
    <>
      <Suspense>
        <PasswordUpdatedToast />
      </Suspense>
      <PageHeader
        title={firstName ? `Bonjour ${firstName}` : "Tableau de bord"}
        description="Vos devis et vos relances en un coup d'œil."
        actions={
          <Button asChild variant="brand">
            <Link href="/devis/nouveau">
              <Plus /> Envoyer un devis
            </Link>
          </Button>
        }
      />

      {!profile.company_name && (
        <Card className="mb-6 border-brand/40 bg-brand/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">Renseignez le nom de votre entreprise : il apparaît dans les e-mails envoyés à vos clients.</p>
            <Button asChild size="sm" variant="outline">
              <Link href="/parametres">Compléter mon profil</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Devis en cours" value={stats.open} hint={formatCurrencyRounded(stats.openAmount)} icon={FolderOpen} tone="pending" />
        <StatCard label="Relances prévues" value={stats.scheduled} hint={`${stats.followupsSent} envoyée(s)`} icon={Send} />
        <StatCard
          label="Taux de réponse"
          value={stats.replyRate === null ? "—" : `${stats.replyRate} %`}
          hint="Clients ayant répondu"
          icon={MessageCircleReply}
        />
        <StatCard
          label="Taux de signature"
          value={stats.winRate === null ? "—" : `${stats.winRate} %`}
          hint="Gagnés / clôturés"
          icon={CheckCircle2}
          tone="signed"
        />
        <StatCard label="Montant gagné" value={formatCurrencyRounded(stats.amountWon)} icon={Euro} tone="brand" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base">Prochaines relances</CardTitle>
              <CardDescription>Envoyées automatiquement, du lundi au samedi entre 8 h et 19 h.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/devis?filtre=scheduled">
                Tout voir <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {upcoming.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Aucune relance programmée.</p>
            ) : (
              upcoming.map((c) => (
                <Link key={c.id} href={`/devis/${c.id}`} className="flex items-center justify-between gap-3 rounded-md px-2 py-2.5 hover:bg-muted/50">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.prospect_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Relance {c.followups_sent + 1}/{c.max_followups}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs tabular-nums">
                    <CalendarClock className="h-3 w-3" />
                    {formatDateTime(c.next_followup_at)}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base">Dernières réponses</CardTitle>
              <CardDescription>Pensez à arrêter les relances d'un client qui vous a répondu.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/devis?filtre=replied">
                Tout voir <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {replies.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Pas encore de réponse.</p>
            ) : (
              replies.map((c) => (
                <Link key={c.id} href={`/devis/${c.id}`} className="flex items-center justify-between gap-3 rounded-md px-2 py-2.5 hover:bg-muted/50">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.prospect_name}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(c.replied_at)}</p>
                  </div>
                  <CampaignStatusBadge campaign={c} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-4 w-4 text-amber-500" /> Avis Google
            </CardTitle>
            <CardDescription>
              {reviewData.settings?.google_review_url
                ? "Demandes envoyées après les chantiers, clics et avis obtenus."
                : "Pas encore configuré : ajoutez le lien de votre fiche Google."}
            </CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href={reviewData.settings?.google_review_url ? "/avis-google" : "/parametres#avis-google"}>
              {reviewData.settings?.google_review_url ? "Tout voir" : "Configurer"} <ArrowRight />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="grid grid-cols-3 gap-2 self-start">
            <MiniStat icon={Send} label="Envoyées" value={String(reviewStats.sent)} hint={`${reviewStats.pending} en attente`} />
            <MiniStat icon={MousePointerClick} label="Taux de clic" value={reviewStats.clickRate === null ? "—" : `${reviewStats.clickRate} %`} />
            <MiniStat icon={Star} label="Avis obtenus" value={String(reviewStats.reviews)} />
          </div>
          <div>
            <p className="mb-3 flex items-center gap-2 text-sm font-medium">
              Notifications
              {reviewStats.failed > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                  <AlertTriangle className="h-3 w-3" /> {reviewStats.failed} échec{reviewStats.failed > 1 ? "s" : ""}
                </span>
              )}
            </p>
            <ReviewHistory events={notifications} requests={reviewData.requests} empty="Rien de nouveau ces 14 derniers jours." />
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function MiniStat({ icon: Icon, label, value, hint }: { icon: typeof Send; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border p-3">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <p className="mt-2 text-xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
