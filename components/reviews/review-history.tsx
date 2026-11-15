import { describeReviewEvent, reviewEventTone } from "@/lib/reviews";
import { formatDateTime } from "@/lib/campaigns/constants";
import type { ReviewEvent, ReviewRequest } from "@/types/database";
import { cn } from "@/lib/utils";

const DOT = {
  success: "bg-success",
  danger: "bg-destructive",
  info: "bg-sky-500",
  muted: "bg-muted-foreground/40",
} as const;

/** Journal lisible des demandes d'avis (historique / notifications). */
export function ReviewHistory({
  events,
  requests,
  empty = "Aucun événement pour l'instant.",
}: {
  events: ReviewEvent[];
  requests: Pick<ReviewRequest, "id" | "client_name">[];
  empty?: string;
}) {
  if (events.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>;
  }
  const names = new Map(requests.map((r) => [r.id, r.client_name]));
  return (
    <ol className="space-y-3">
      {events.map((e) => {
        const tone = reviewEventTone(e.type);
        const failedFinal = e.type === "send_failed" && Boolean((e.detail as { final?: boolean }).final);
        return (
          <li key={e.id} className="flex gap-3 text-sm">
            <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", DOT[tone])} aria-hidden />
            <div className="min-w-0">
              <p className={cn(failedFinal && "font-medium text-destructive")}>
                {describeReviewEvent(e, e.request_id ? names.get(e.request_id) : undefined)}
              </p>
              {e.type === "send_failed" && typeof e.detail.error === "string" && (
                <p className="truncate text-xs text-muted-foreground">{e.detail.error}</p>
              )}
              <p className="text-xs text-muted-foreground tabular-nums">{formatDateTime(e.created_at)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
