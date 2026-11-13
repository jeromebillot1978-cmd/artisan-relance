import { Badge } from "@/components/ui/badge";
import type { QuoteStatus } from "@/types/database";

export const STATUS_LABELS: Record<QuoteStatus, string> = {
  pending: "En attente",
  signed: "Signé",
  lost: "Perdu",
};

export function StatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <Badge variant={status}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </Badge>
  );
}
