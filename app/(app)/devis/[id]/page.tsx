import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, Download, FileText, Mail, MousePointerClick, Paperclip, Star } from "lucide-react";
import { getCampaignDetail, getCampaignReviews } from "@/lib/data";
import { CANCEL_REASONS, REVIEW_TRIGGER } from "@/lib/reviews";
import { ReviewStatusBadge } from "@/components/reviews/review-status-badge";
import { RequestReviewButton } from "@/components/reviews/request-review-dialog";
import { formatBytes, formatDateTime } from "@/lib/campaigns/constants";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import { CampaignActions } from "@/components/campaigns/campaign-actions";
import { StrategyDialog } from "@/components/campaigns/strategy-dialog";
import { CampaignTimeline } from "@/components/campaigns/campaign-timeline";
import { Conversation } from "@/components/campaigns/conversation";

export const metadata: Metadata = { title: "Dossier devis" };

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [detail, reviews] = await Promise.all([getCampaignDetail(id), getCampaignReviews(id)]);
  if (!detail) notFound();
  const { campaign: c, attachments, events, messages } = detail;
  const blockedReason = events.some((e) => e.type === "opt_out")
    ? "Ce client a demandé à ne plus recevoir d'e-mails (STOP). Contactez-le par téléphone si besoin."
    : events.some((e) => e.type === "delivery_complained")
      ? "Ce client a signalé vos e-mails comme indésirables : plus aucun e-mail ne peut lui être envoyé."
      : !c.initial_sent_at && !messages.some((m) => m.direction === "in")
        ? "Vous pourrez écrire au client ici une fois le devis envoyé."
        : null;

  const strategyText = !c.followup_enabled
    ? "Relances désactivées"
    : `Tous les ${c.interval_days} jours · ${c.max_followups} relance${c.max_followups > 1 ? "s" : ""} max${
        c.max_days ? ` · arrêt après ${c.max_days} jours` : ""
      }${c.end_date ? ` · jusqu'au ${new Date(c.end_date).toLocaleDateString("fr-FR")}` : ""}`;

  return (
    <>
      <Link href="/devis" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Devis
      </Link>

      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{c.prospect_name}</h1>
          <CampaignStatusBadge campaign={c} />
        </div>
        <p className="text-sm text-muted-foreground">
          {c.reference ? `Devis ${c.reference} · ` : ""}
          {formatCurrency(c.amount)} · {c.recipients.join(", ")}
        </p>
        <CampaignActions campaign={c} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Suivi</CardTitle>
              <StrategyDialog campaign={c} />
            </CardHeader>
            <CardContent className="divide-y">
              <Row label="Devis envoyé le">
                {c.initial_sent_at ? formatDateTime(c.initial_sent_at) : c.initial_send_status === "failed" ? "Échec d'envoi" : "En cours…"}
                {c.initial_send_status === "skipped" && <span className="block text-xs text-muted-foreground">envoyé hors application</span>}
              </Row>
              <Row label="Relances envoyées">
                {c.followups_sent} / {c.max_followups}
              </Row>
              <Row label="Prochaine relance">
                {c.next_followup_at ? (
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="h-3.5 w-3.5 text-brand" />
                    {formatDateTime(c.next_followup_at)}
                  </span>
                ) : (
                  "—"
                )}
              </Row>
              <Row label="Stratégie">{strategyText}</Row>
              {c.ends_at && <Row label="Fin de campagne">{formatDateTime(c.ends_at)}</Row>}
              {c.replied_at && <Row label="Réponse du client">{formatDateTime(c.replied_at)}</Row>}
              {c.client_phone && (
                <Row label="Téléphone">
                  <a href={`tel:${c.client_phone.replace(/\s/g, "")}`} className="underline-offset-4 hover:underline">
                    {c.client_phone}
                  </a>
                </Row>
              )}
              {c.notes && (
                <Row label="Notes">
                  <span className="whitespace-pre-line">{c.notes}</span>
                </Row>
              )}
            </CardContent>
          </Card>

          {(c.status === "won" || c.status === "completed" || reviews.length > 0) && (
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Star className="h-4 w-4 text-amber-500" /> Avis Google
                </CardTitle>
                {reviews[0] && <ReviewStatusBadge request={reviews[0]} />}
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {reviews[0] ? (
                  <div className="divide-y">
                    <Row label="Origine">{REVIEW_TRIGGER[reviews[0].trigger]}</Row>
                    <Row label={reviews[0].status === "sent" ? "Envoyée le" : "Prévue le"}>
                      {formatDateTime(reviews[0].status === "sent" ? reviews[0].sent_at : reviews[0].scheduled_at)}
                    </Row>
                    {reviews[0].status === "sent" && (
                      <Row label="Clics sur le lien">
                        <span className="inline-flex items-center gap-1">
                          <MousePointerClick className="h-3.5 w-3.5" /> {reviews[0].clicks}
                        </span>
                      </Row>
                    )}
                    {reviews[0].review_status === "received" && <Row label="Avis">⭐ Reçu</Row>}
                    {reviews[0].status === "failed" && reviews[0].last_error && (
                      <Row label="Erreur"><span className="text-destructive">{reviews[0].last_error}</span></Row>
                    )}
                    {reviews[0].status === "cancelled" && (
                      <Row label="Motif">{CANCEL_REASONS[reviews[0].cancel_reason ?? ""] ?? "Annulée"}</Row>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucune demande d'avis pour ce client.</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {(c.status === "won" || c.status === "completed") &&
                    !reviews.some((r) => r.status === "sent" || r.status === "processing") && (
                      <RequestReviewButton campaign={c} />
                    )}
                  <Link href="/avis-google" className="inline-flex items-center text-xs text-muted-foreground underline-offset-4 hover:underline">
                    Suivi des avis
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Paperclip className="h-4 w-4" /> Pièces jointes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {events.some((e) => e.type === "attachments_purged")
                    ? "Pièces jointes supprimées automatiquement (durée de conservation dépassée)."
                    : "Aucune pièce jointe."}
                </p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {attachments.map((a) => (
                    <li key={a.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                      <FileText className="h-4 w-4 shrink-0 text-brand" />
                      <span className="min-w-0 flex-1 truncate">{a.file_name}</span>
                      <span className="text-xs text-muted-foreground">{formatBytes(a.size_bytes)}</span>
                      {a.url && (
                        <a href={a.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground" aria-label={`Ouvrir ${a.file_name}`}>
                          <Download className="h-4 w-4" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {c.attach_on_followups && <p className="mt-2 text-xs text-muted-foreground">Jointes aussi à chaque relance.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-4 w-4" /> Messages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Objet</p>
                <p>{c.subject}</p>
              </div>
              {c.send_initial && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Message du devis</p>
                  <p className="whitespace-pre-line text-muted-foreground">{c.message}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Message de relance</p>
                <p className="whitespace-pre-line text-muted-foreground">{c.followup_message}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Conversation
            campaignId={c.id}
            prospectName={c.prospect_name}
            recipients={c.recipients}
            messages={messages}
            blockedReason={blockedReason}
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historique</CardTitle>
            </CardHeader>
            <CardContent>
              <CampaignTimeline events={events} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
