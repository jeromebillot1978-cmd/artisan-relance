import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, CalendarClock, CheckCircle2, Euro, FolderOpen, MessageCircleReply, Plus, Send } from "lucide-react";
import { computeStats, getCampaigns, requireUser } from "@/lib/data";
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
  const [{ profile }, campaigns] = await Promise.all([requireUser(), getCampaigns()]);
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
    </>
  );
}
