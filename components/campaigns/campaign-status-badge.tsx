import { Badge } from "@/components/ui/badge";
import { followupsStopped, statusDisplay } from "@/lib/campaigns/constants";
import type { Campaign } from "@/types/database";

export function CampaignStatusBadge({
  campaign,
}: {
  campaign: Pick<Campaign, "status" | "next_followup_at" | "initial_send_status" | "pause_reason" | "followup_enabled"> &
    Partial<Pick<Campaign, "initial_sent_at">>;
}) {
  const { label, tone } = statusDisplay(campaign);
  const stopped = followupsStopped({ ...campaign, initial_sent_at: campaign.initial_sent_at ?? null });
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <Badge variant={tone} className="whitespace-nowrap">
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {label}
      </Badge>
      {stopped && <Badge variant="outline" className="whitespace-nowrap text-muted-foreground">Relances arrêtées</Badge>}
    </span>
  );
}
