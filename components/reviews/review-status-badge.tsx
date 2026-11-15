import { Badge } from "@/components/ui/badge";
import { REVIEW_STATUS } from "@/lib/reviews";
import type { ReviewRequest } from "@/types/database";

export function ReviewStatusBadge({ request }: { request: Pick<ReviewRequest, "status"> }) {
  const s = REVIEW_STATUS[request.status];
  return (
    <Badge variant={s.variant} className="whitespace-nowrap">
      {s.label}
    </Badge>
  );
}
