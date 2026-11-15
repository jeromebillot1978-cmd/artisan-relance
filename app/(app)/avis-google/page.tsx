import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Clock, MousePointerClick, Send, Settings, Star } from "lucide-react";
import { getReviewData } from "@/lib/data";
import { computeReviewStats } from "@/lib/reviews";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { ReviewRequestsTable } from "@/components/reviews/review-requests-table";
import { ReviewHistory } from "@/components/reviews/review-history";

export const metadata: Metadata = { title: "Avis Google" };

export default async function ReviewsPage() {
  const { settings, requests, events } = await getReviewData({ eventsLimit: 40 });
  const stats = computeReviewStats(requests);
  const configured = Boolean(settings?.google_review_url);
  const autos = [
    settings?.auto_on_won ? `${settings.won_delay_days} j après « Gagné »` : null,
    settings?.auto_on_completed ? `${settings.completed_delay_days} j après « Terminé »` : null,
  ].filter(Boolean);

  return (
    <>
      <PageHeader
        title="Avis Google"
        description="Demandez un avis à vos clients satisfaits, automatiquement après le chantier."
        actions={
          <Button asChild variant="outline">
            <Link href="/parametres#avis-google">
              <Settings /> Réglages
            </Link>
          </Button>
        }
      />

      {!configured ? (
        <Card className="mb-6 border-brand/40 bg-brand/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              Ajoutez le lien de votre fiche Google et choisissez votre modèle d'e-mail pour commencer à recevoir des avis.
            </p>
            <Button asChild size="sm" variant="brand">
              <Link href="/parametres#avis-google">Configurer</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <p className="mb-6 text-sm text-muted-foreground">
          {autos.length ? `Envoi automatique : ${autos.join(" · ")}.` : "Envoi automatique désactivé : utilisez le menu ⋮ d'un devis gagné ou terminé."}
        </p>
      )}

      {stats.failed > 0 && (
        <Card className="mb-6 border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p>
              {stats.failed} demande{stats.failed > 1 ? "s n'ont" : " n'a"} pas pu être envoyée{stats.failed > 1 ? "s" : ""} après 3 essais.
              Vérifiez l'adresse du client, puis utilisez « Réessayer l'envoi » dans le menu ⋮ de la ligne.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Demandes envoyées" value={stats.sent} hint={`${stats.pending} en attente`} icon={Send} />
        <StatCard
          label="Taux de clic"
          value={stats.clickRate === null ? "—" : `${stats.clickRate} %`}
          hint={`${stats.clicked} client(s) ont cliqué`}
          icon={MousePointerClick}
          tone="brand"
        />
        <StatCard label="Avis obtenus" value={stats.reviews} hint="Confirmés par vous" icon={Star} tone="signed" />
        <StatCard label="En attente" value={stats.pending} hint="Programmées" icon={Clock} tone="pending" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-3">
          <h2 className="text-base font-semibold">Suivi des demandes</h2>
          <ReviewRequestsTable requests={requests} />
        </div>
        <Card className="self-start">
          <CardHeader>
            <CardTitle className="text-base">Historique</CardTitle>
            <CardDescription>Envois, clics, échecs et désinscriptions.</CardDescription>
          </CardHeader>
          <CardContent>
            <ReviewHistory events={events} requests={requests} />
          </CardContent>
        </Card>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Le taux de clic compte les clients ayant ouvert le lien vers votre fiche ; certains logiciels de sécurité peuvent
        ouvrir les liens automatiquement. Google ne signale pas qui a laissé un avis : marquez-le « reçu » depuis le menu ⋮
        quand vous le voyez sur votre fiche.
      </p>
    </>
  );
}
