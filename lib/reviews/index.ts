import type { ReviewEvent, ReviewRequest, ReviewRequestStatus, ReviewSettings, ReviewTrigger } from "@/types/database";
import { DEFAULT_REVIEW_SUBJECT, REVIEW_TEMPLATES } from "@/supabase/functions/_shared/templates";

/** Réglages par défaut (avant le premier enregistrement). */
export function defaultReviewSettings(userId: string, companyName: string): ReviewSettings {
  const now = new Date().toISOString();
  return {
    user_id: userId,
    google_review_url: null,
    company_name: companyName || null,
    template_key: "professionnel",
    subject: DEFAULT_REVIEW_SUBJECT,
    body: REVIEW_TEMPLATES[0].body,
    auto_on_won: false,
    won_delay_days: 7,
    auto_on_completed: true,
    completed_delay_days: 2,
    google_place_id: null,
    created_at: now,
    updated_at: now,
  };
}

/** Domaines acceptés pour le lien d'avis (fiche Google, lien court g.page, maps.app.goo.gl…). */
export function isGoogleReviewUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && /(^|\.)(google\.[a-z.]{2,6}|g\.page|goo\.gl)$/i.test(url.hostname);
  } catch {
    return false;
  }
}

export const REVIEW_STATUS: Record<ReviewRequestStatus, { label: string; variant: "pending" | "info" | "signed" | "lost" | "neutral" }> = {
  scheduled: { label: "En attente", variant: "pending" },
  processing: { label: "Envoi en cours", variant: "info" },
  sent: { label: "Envoyée", variant: "signed" },
  failed: { label: "Échec", variant: "lost" },
  cancelled: { label: "Annulée", variant: "neutral" },
};

export const REVIEW_TRIGGER: Record<ReviewTrigger, string> = {
  manual: "Manuel",
  won: "Après « Gagné »",
  completed: "Après « Terminé »",
};

export const CANCEL_REASONS: Record<string, string> = {
  manual: "annulée par vous",
  status_changed: "statut du dossier modifié",
  opt_out: "client désinscrit",
  no_google_link: "lien Google retiré",
};

export type ReviewFilter = "all" | "scheduled" | "sent" | "failed" | "cancelled";

export function reviewFilterOf(r: Pick<ReviewRequest, "status">): Exclude<ReviewFilter, "all"> {
  if (r.status === "processing") return "scheduled";
  return r.status;
}

export function computeReviewStats(requests: ReviewRequest[]) {
  const sent = requests.filter((r) => r.status === "sent");
  const clicked = sent.filter((r) => r.clicks > 0);
  return {
    sent: sent.length,
    pending: requests.filter((r) => r.status === "scheduled" || r.status === "processing").length,
    failed: requests.filter((r) => r.status === "failed").length,
    clicked: clicked.length,
    clickRate: sent.length ? Math.round((clicked.length / sent.length) * 100) : null,
    reviews: requests.filter((r) => r.review_status === "received").length,
  };
}

/** Phrase lisible pour une ligne de l'historique. */
export function describeReviewEvent(e: ReviewEvent, clientName?: string) {
  const who = clientName ?? (typeof e.detail.client === "string" ? e.detail.client : "un client");
  const d = e.detail as Record<string, unknown>;
  switch (e.type) {
    case "scheduled":
      return `Demande programmée pour ${who}${d.trigger === "manual" ? " (envoi immédiat)" : ""}`;
    case "rescheduled":
      return `Envoi avancé à maintenant pour ${who}`;
    case "sent":
      return `Demande envoyée à ${who}`;
    case "send_failed":
      return d.final
        ? `Échec définitif de l'envoi à ${who}`
        : `Échec d'envoi à ${who} (essai ${String(d.attempt ?? "?")}/3), nouvel essai programmé`;
    case "clicked":
      return `${who} a cliqué sur le lien Google`;
    case "cancelled":
      return `Demande annulée pour ${who} (${CANCEL_REASONS[String(d.reason ?? "")] ?? "annulée"})`;
    case "cancel":
      return `Demande annulée pour ${who}`;
    case "send_now":
      return `Envoi immédiat demandé pour ${who}`;
    case "retry":
      return `Nouvel essai d'envoi pour ${who}`;
    case "mark_received":
      return `Avis de ${who} marqué comme reçu`;
    case "unmark_received":
      return `Avis de ${who} remis « non confirmé »`;
    case "opted_out":
      return `${who} s'est désinscrit des demandes d'avis`;
    case "skipped_opt_out":
      return `Demande non programmée : ${who} s'était désinscrit`;
    default:
      return `${e.type} — ${who}`;
  }
}

export function reviewEventTone(type: string): "success" | "danger" | "info" | "muted" {
  if (type === "sent" || type === "clicked" || type === "mark_received") return "success";
  if (type === "send_failed") return "danger";
  if (type === "scheduled" || type === "rescheduled" || type === "send_now" || type === "retry") return "info";
  return "muted";
}
