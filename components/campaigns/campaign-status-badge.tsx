import { Badge } from "@/components/ui/badge";
import { statusDisplay } from "@/lib/campaigns/constants";
import type { Campaign } from "@/types/database";

export function CampaignStatusBadge({
  campaign,
}: {
  campaign: Pick<Campaign, "status" | "next_followup_at" | "initial_send_status" | "pause_reason" | "followup_enabled">;
}) {
  const { label, tone } = statusDisplay(campaign);
  return (
    <Badge variant={tone}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  );
}
