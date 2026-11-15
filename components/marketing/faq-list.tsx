import { ChevronDown } from "lucide-react";
import type { QA } from "@/components/seo/json-ld";

/**
 * FAQ en HTML natif (<details>/<summary>) : les réponses sont dans le HTML
 * (lisibles par Google et les assistants IA), sans JavaScript côté client.
 */
export function FaqList({ items, headingLevel = 3 }: { items: QA[]; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <div className="divide-y rounded-xl border">
      {items.map((item) => (
        <details key={item.q} className="group px-4 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4">
            <H className="text-base font-medium">{item.q}</H>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <p className="pb-4 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
