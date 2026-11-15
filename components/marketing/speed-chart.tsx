import { BENCH_DATE, BENCH_METHOD, SPEED } from "@/lib/content/benchmarks";
import { cn } from "@/lib/utils";

/**
 * Graphique de vitesse en HTML (lisible sur mobile, sans JavaScript).
 * Les barres « poussent » en CSS au défilement ; animation coupée si l'utilisateur réduit les animations.
 */
export function SpeedChart({ metric }: { metric: "lcp" | "kb" }) {
  const rows = [...SPEED].sort((a, b) => (metric === "lcp" ? a.lcp - b.lcp : a.kb - b.kb));
  const value = (r: (typeof rows)[number]) => (metric === "lcp" ? r.lcp : r.kb);
  const max = Math.max(...rows.map(value));
  const label = (r: (typeof rows)[number]) =>
    metric === "lcp"
      ? `${r.lcp.toLocaleString("fr-FR")} s`
      : r.kb >= 1000
        ? `${(r.kb / 1024).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`
        : `${r.kb} Ko`;
  const title =
    metric === "lcp"
      ? "Temps d'affichage du contenu principal sur mobile (plus court = mieux)"
      : "Poids de la page d'accueil (plus léger = mieux)";

  return (
    <figure>
      <p className="text-sm font-medium">{title}</p>
      <ul className="mt-4 space-y-3" aria-label={title}>
        {rows.map((r, i) => (
          <li key={r.slug} className="grid grid-cols-[6.5rem_1fr] items-center gap-3 text-sm sm:grid-cols-[8rem_1fr]">
            <span className={cn("truncate text-right", r.self ? "font-semibold" : "text-muted-foreground")}>{r.name}</span>
            <span className="flex items-center gap-2">
              <span
                className={cn("bar-grow block h-5 rounded", r.self ? "bg-brand" : "bg-muted-foreground opacity-30")}
                style={{ width: `${Math.max(3, (value(r) / max) * 82)}%`, animationDelay: `${i * 90}ms` }}
                aria-hidden
              />
              <span className={cn("shrink-0 tabular-nums", r.self ? "font-semibold" : "font-medium")}>{label(r)}</span>
            </span>
          </li>
        ))}
      </ul>
      <figcaption className="mt-4 text-xs text-muted-foreground">
        Mesure du {BENCH_DATE} : {BENCH_METHOD}. Les valeurs varient d'une mesure à l'autre.
      </figcaption>
    </figure>
  );
}
