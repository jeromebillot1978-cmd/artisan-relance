import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, CheckCircle2, Clock, Euro, Percent, Send, XCircle } from "lucide-react";
import { computeStats, getQuotes, nextReminder, requireUser } from "@/lib/data";
import { reminderLabel } from "@/lib/automations/registry";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { NewQuoteButton } from "@/components/app/new-quote-button";
import { PasswordUpdatedToast } from "@/components/app/password-updated-toast";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function DashboardPage() {
  const [{ profile }, quotes] = await Promise.all([requireUser(), getQuotes()]);
  const stats = computeStats(quotes);

  const upcoming = quotes
    .map((q) => ({ quote: q, reminder: nextReminder(q) }))
    .filter((x): x is { quote: typeof x.quote; reminder: NonNullable<typeof x.reminder> } => !!x.reminder)
    .sort((a, b) => a.reminder.send_date.localeCompare(b.reminder.send_date))
    .slice(0, 5);

  const recent = quotes.slice(0, 5);
  const firstName = profile.contact_name?.split(" ")[0];

  return (
    <>
      <Suspense>
        <PasswordUpdatedToast />
      </Suspense>

      <PageHeader
        title={firstName ? `Bonjour ${firstName}` : "Tableau de bord"}
        description="Vos devis et vos relances en un coup d'œil."
        actions={<NewQuoteButton />}
      />

      {!profile.company_name && (
        <Card className="mb-6 border-brand/40 bg-brand/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              Renseignez le nom de votre entreprise : il apparaît dans les e-mails envoyés à vos clients.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/parametres">Compléter mon profil</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard
          label="En attente"
          value={stats.pending}
          hint={formatCurrency(stats.amountPending)}
          icon={Clock}
          tone="pending"
        />
        <StatCard label="Signés" value={stats.signed} icon={CheckCircle2} tone="signed" />
        <StatCard label="Perdus" value={stats.lost} icon={XCircle} tone="lost" />
        <StatCard
          label="Taux de conversion"
          value={stats.conversionRate === null ? "—" : `${stats.conversionRate} %`}
          hint="Signés / devis clôturés"
          icon={Percent}
        />
        <StatCard
          label="Montant gagné"
          value={formatCurrency(stats.amountWon)}
          icon={Euro}
          tone="brand"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base">Prochaines relances</CardTitle>
              <CardDescription>
                <span className="inline-flex items-center gap-1">
                  <Send className="h-3 w-3" /> {stats.remindersSent} relance{stats.remindersSent > 1 ? "s" : ""} envoyée
                  {stats.remindersSent > 1 ? "s" : ""} au total
                </span>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {upcoming.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Aucune relance programmée.</p>
            ) : (
              upcoming.map(({ quote, reminder }) => (
                <div key={reminder.id} className="flex items-center justify-between gap-3 rounded-md px-2 py-2.5 hover:bg-muted/50">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{quote.client_name}</p>
                    <p className="text-xs text-muted-foreground">{reminderLabel(reminder.email_type)}</p>
                  </div>
                  <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs tabular-nums">
                    {formatDate(reminder.send_date, { year: undefined })}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base">Derniers devis</CardTitle>
              <CardDescription>{stats.total} devis au total</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/devis">
                Tout voir <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {recent.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <p className="text-sm text-muted-foreground">Ajoutez votre premier devis pour démarrer.</p>
                <NewQuoteButton size="sm">Ajouter un devis</NewQuoteButton>
              </div>
            ) : (
              recent.map((quote) => (
                <Link
                  key={quote.id}
                  href="/devis"
                  className="flex items-center justify-between gap-3 rounded-md px-2 py-2.5 hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{quote.client_name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(quote.quote_date)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="hidden text-sm tabular-nums sm:inline">{formatCurrency(quote.amount)}</span>
                    <StatusBadge status={quote.status} />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
