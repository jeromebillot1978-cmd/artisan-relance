import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, Download, FileText, Mail, Paperclip } from "lucide-react";
import { getCampaignDetail } from "@/lib/data";
import { formatBytes, formatDateTime } from "@/lib/campaigns/constants";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import { CampaignActions } from "@/components/campaigns/campaign-actions";
import { StrategyDialog } from "@/components/campaigns/strategy-dialog";
import { CampaignTimeline } from "@/components/campaigns/campaign-timeline";

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
  const detail = await getCampaignDetail(id);
  if (!detail) notFound();
  const { campaign: c, attachments, events, replies } = detail;

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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Paperclip className="h-4 w-4" /> Pièces jointes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune pièce jointe.</p>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historique</CardTitle>
          </CardHeader>
          <CardContent>
            {replies.length > 0 && (
              <div className="mb-5 rounded-lg border border-sky-500/30 bg-sky-500/5 p-3 text-sm">
                <p className="font-medium">
                  {replies.length} réponse{replies.length > 1 ? "s" : ""} reçue{replies.length > 1 ? "s" : ""}
                </p>
                <p className="text-xs text-muted-foreground">Transférée(s) dans votre boîte mail — répondez-y directement.</p>
              </div>
            )}
            <CampaignTimeline events={events} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
