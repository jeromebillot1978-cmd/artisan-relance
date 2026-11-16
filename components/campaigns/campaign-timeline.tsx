import { AlertTriangle, CheckCircle2, CircleDot, Mail, MessageCircleReply, Send, Settings2 } from "lucide-react";
import { EVENT_LABELS, formatDateTime } from "@/lib/campaigns/constants";
import type { CampaignEvent } from "@/types/database";
import { cn } from "@/lib/utils";

function iconFor(type: string) {
  if (type === "initial_sent") return { Icon: Send, tone: "text-brand" };
  if (type === "followup_sent") return { Icon: Mail, tone: "text-foreground" };
  if (type.endsWith("_failed") || type.startsWith("delivery_") || type === "suspicious_reply")
    return { Icon: AlertTriangle, tone: "text-destructive" };
  if (type === "auto_reply_received" || type === "artisan_copy_reply" || type === "opt_out")
    return { Icon: MessageCircleReply, tone: "text-muted-foreground" };
  if (type === "reply_received" || type === "replied") return { Icon: MessageCircleReply, tone: "text-sky-500" };
  if (type === "won") return { Icon: CheckCircle2, tone: "text-success" };
  if (type === "strategy_updated") return { Icon: Settings2, tone: "text-muted-foreground" };
  return { Icon: CircleDot, tone: "text-muted-foreground" };
}

function describe(e: CampaignEvent) {
  const d = e.detail as Record<string, unknown>;
  switch (e.type) {
    case "initial_sent":
    case "followup_sent":
      return Array.isArray(d.recipients) ? `À ${(d.recipients as string[]).join(", ")}` : null;
    case "initial_failed":
    case "followup_failed":
      return `Tentative ${d.attempt}/3${d.final ? " — abandon" : ", nouvel essai automatique"} · ${String(d.error ?? "")}`;
    case "reply_received":
    case "auto_reply_received":
    case "opt_out":
    case "artisan_copy_reply":
    case "suspicious_reply":
      return `De ${String(d.from ?? "")}${d.subject ? ` — « ${String(d.subject)} »` : ""}${
        d.unexpected_sender ? " · expéditeur différent de l'adresse du devis" : ""
      }`;
    case "delivery_bounced":
    case "delivery_suppressed":
    case "delivery_failed":
    case "delivery_complained":
      return Array.isArray(d.recipients) ? `Adresse : ${(d.recipients as string[]).join(", ")}` : null;
    case "completed":
      return d.reason === "max_followups" ? "Nombre maximum de relances atteint" : "Durée maximale atteinte";
    case "strategy_updated":
      return d.followup_enabled === false
        ? "Relances désactivées"
        : `Tous les ${d.interval_days} j, ${d.max_followups} relance(s) max${d.max_days ? `, ${d.max_days} j max` : ""}${d.end_date ? `, jusqu'au ${d.end_date}` : ""}`;
    default:
      return null;
  }
}

export function CampaignTimeline({ events }: { events: CampaignEvent[] }) {
  return (
    <ol className="relative space-y-4 border-l pl-6">
      {[...events].reverse().map((e) => {
        const { Icon, tone } = iconFor(e.type);
        const label =
          e.type === "followup_sent" || e.type === "followup_failed"
            ? `${EVENT_LABELS[e.type]} n° ${String((e.detail as Record<string, unknown>).number ?? "")}`
            : EVENT_LABELS[e.type] ?? e.type;
        const text = describe(e);
        return (
          <li key={e.id} className="relative">
            <span className="absolute -left-[34px] flex h-6 w-6 items-center justify-center rounded-full border bg-background">
              <Icon className={cn("h-3.5 w-3.5", tone)} />
            </span>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(e.created_at)}</p>
            {text && <p className="mt-0.5 break-words text-xs text-muted-foreground">{text}</p>}
          </li>
        );
      })}
    </ol>
  );
}
