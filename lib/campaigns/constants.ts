import type { Campaign, CampaignStatus } from "@/types/database";

export const ATTACHMENT_RULES = {
  maxFiles: 5,
  maxFileBytes: 10 * 1024 * 1024,
  maxTotalBytes: 20 * 1024 * 1024,
  accept: {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  } as Record<string, string>,
};

export const MAX_RECIPIENTS = 5;

export const INTERVAL_PRESETS = [
  { days: 3, label: "Tous les 3 jours" },
  { days: 7, label: "Tous les 7 jours" },
  { days: 14, label: "Tous les 14 jours" },
  { days: 30, label: "Tous les 30 jours" },
] as const;

export type FilterKey = "all" | "waiting" | "scheduled" | "replied" | "won" | "lost" | "finished";

export const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "waiting", label: "En attente" },
  { key: "scheduled", label: "Relance prévue" },
  { key: "replied", label: "Répondu" },
  { key: "won", label: "Gagné" },
  { key: "lost", label: "Perdu" },
  { key: "finished", label: "Terminé" },
];

export function filterOf(c: Pick<Campaign, "status" | "next_followup_at">): Exclude<FilterKey, "all"> {
  switch (c.status) {
    case "active":
      return c.next_followup_at ? "scheduled" : "waiting";
    case "draft":
    case "paused":
      return "waiting";
    case "replied":
      return "replied";
    case "won":
      return "won";
    case "lost":
      return "lost";
    default:
      return "finished";
  }
}

export type BadgeTone = "pending" | "signed" | "lost" | "secondary" | "outline" | "info" | "neutral" | "violet";

export function statusDisplay(
  c: Pick<Campaign, "status" | "next_followup_at" | "initial_send_status" | "pause_reason" | "followup_enabled">,
  /** Nombre de réponses réellement reçues par e-mail, si connu. 0 = « Répondu » marqué à la main, sans réponse reçue. */
  receivedReplies?: number,
): { label: string; tone: BadgeTone } {
  // Couleurs : En attente gris · Relance prévue orange · Répondu bleu · Gagné vert · Perdu rouge · Terminé violet
  const map: Record<CampaignStatus, { label: string; tone: BadgeTone }> = {
    draft: { label: "Envoi en cours", tone: "neutral" },
    active: { label: "Relance prévue", tone: "pending" },
    paused: { label: "Suspendu", tone: "neutral" },
    replied: { label: "Répondu", tone: "info" },
    won: { label: "Gagné", tone: "signed" },
    lost: { label: "Perdu", tone: "lost" },
    completed: { label: "Terminé", tone: "violet" },
    stopped: { label: "Arrêté", tone: "violet" },
  };
  if (c.status === "draft" && c.initial_send_status === "failed") return { label: "Échec d'envoi", tone: "lost" };
  if (c.status === "active" && !c.next_followup_at) return { label: "En attente", tone: "neutral" };
  if (c.status === "paused" && c.pause_reason === "send_failed") return { label: "Suspendu (échec)", tone: "lost" };
  if (c.status === "paused" && c.pause_reason === "bounce") return { label: "Adresse invalide", tone: "lost" };
  if (c.status === "stopped" && c.pause_reason === "opt_out") return { label: "Désinscrit (STOP)", tone: "neutral" };
  if (c.status === "stopped" && c.pause_reason === "complaint") return { label: "Signalé comme spam", tone: "lost" };
  // Une réponse marquée à la main n'est pas une réponse reçue : le libellé le dit (audit, même famille que la Prospection)
  if (c.status === "replied" && receivedReplies === 0) return { label: "Marqué répondu", tone: "info" };
  return map[c.status];
}

/** Badge « Relances arrêtées » : relances désactivées sur un dossier encore ouvert. */
export function followupsStopped(c: Pick<Campaign, "status" | "followup_enabled" | "initial_sent_at">) {
  return !c.followup_enabled && Boolean(c.initial_sent_at) && ["active", "paused", "replied"].includes(c.status);
}

export const EVENT_LABELS: Record<string, string> = {
  created: "Dossier créé",
  initial_sent: "Devis envoyé",
  initial_failed: "Échec de l'envoi du devis",
  followup_sent: "Relance envoyée",
  followup_failed: "Échec d'une relance",
  reply_received: "Réponse reçue du client",
  message_sent: "Votre réponse envoyée au client",
  auto_reply_received: "Réponse automatique reçue (relances maintenues)",
  opt_out: "Le client a demandé l'arrêt (STOP)",
  artisan_copy_reply: "Réponse à votre propre copie (non envoyée au client)",
  suspicious_reply: "Message non authentifié reçu (relances maintenues)",
  delivery_bounced: "Adresse e-mail invalide : relances suspendues",
  delivery_suppressed: "Adresse bloquée : relances suspendues",
  delivery_failed: "Échec de distribution : relances suspendues",
  delivery_complained: "Signalé comme indésirable : devis arrêté",
  completed: "Campagne terminée",
  complete: "Marqué terminé",
  stop_followups: "Relances arrêtées",
  resume_followups: "Relances reprises",
  details_updated: "Devis modifié",
  pause: "Campagne suspendue",
  resume: "Campagne reprise",
  stop: "Campagne arrêtée",
  won: "Marqué gagné",
  lost: "Marqué perdu",
  replied: "Marqué « a répondu »",
  reopen: "Dossier rouvert",
  retry_initial: "Nouvel essai d'envoi",
  strategy_updated: "Stratégie de relance modifiée",
  attachments_purged: "Pièces jointes supprimées (conservation)",
};

/** Ramène une date dans la plage d'envoi (lun.-sam., 8 h-19 h, heure de Paris) — même règle qu'en base. */
export function parisSendWindow(date: Date): Date {
  const parts = (d: Date) => {
    const f = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Paris",
      hour: "2-digit",
      hourCycle: "h23",
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(d);
    const get = (t: string) => f.find((p) => p.type === t)?.value ?? "";
    return { hour: Number(get("hour")), weekday: get("weekday"), y: get("year"), m: get("month"), d: get("day") };
  };
  const at9 = (d: Date, addDays: number) => {
    const p = parts(new Date(d.getTime() + addDays * 86400000));
    // 9 h à Paris = 8 h UTC (hiver) ou 7 h UTC (été) : on ajuste par itération
    let guess = new Date(`${p.y}-${p.m}-${p.d}T08:00:00Z`);
    if (parts(guess).hour !== 9) guess = new Date(guess.getTime() + (9 - parts(guess).hour) * 3600000);
    return guess;
  };
  let result = date;
  const p = parts(date);
  if (p.hour >= 19) result = at9(date, 1);
  else if (p.hour < 8) result = at9(date, 0);
  if (parts(result).weekday === "Sun") result = at9(result, 1);
  return result;
}

export interface StrategyInput {
  followupEnabled: boolean;
  intervalDays: number;
  maxFollowups: number;
  endDate?: string | null;
  maxDays?: number | null;
}

/** Aperçu des dates de relance pour un envoi initial donné. */
export function previewSchedule(initial: Date, s: StrategyInput) {
  if (!s.followupEnabled) return { dates: [] as Date[], endsAt: null as Date | null, stopReason: "disabled" as const };
  const candidates: (Date | null)[] = [
    s.maxDays ? new Date(initial.getTime() + s.maxDays * 86400000) : null,
    s.endDate ? new Date(`${s.endDate}T23:59:59`) : null,
  ];
  const endsAt = candidates.filter((d): d is Date => !!d).sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
  const dates: Date[] = [];
  let previous = initial;
  for (let n = 1; n <= s.maxFollowups; n++) {
    const base = Math.max(initial.getTime() + s.intervalDays * n * 86400000, previous.getTime() + s.intervalDays * 86400000);
    const next = parisSendWindow(new Date(base));
    if (endsAt && next > endsAt) return { dates, endsAt, stopReason: "duration" as const };
    dates.push(next);
    previous = next;
  }
  return { dates, endsAt, stopReason: "max" as const };
}

export function formatDateTime(iso: string | Date | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(typeof iso === "string" ? new Date(iso) : iso);
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} Ko`;
  return `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`;
}
