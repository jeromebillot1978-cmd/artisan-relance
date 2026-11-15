import Link from "next/link";
import { PRICE_DATE, PRICES } from "@/lib/content/benchmarks";
import { cn } from "@/lib/utils";

/** Tableau de prix comparés, sourcés et datés. `compact` : 3 lignes pour l'accueil. */
export function PriceCompare({ compact = false }: { compact?: boolean }) {
  const rows = compact ? PRICES.filter((p) => ["Artisan Relance", "Tolteck", "Obat"].includes(p.name)) : PRICES;
  return (
    <div>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className={cn("w-full text-left text-sm", !compact && "min-w-[640px]")}>
          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Outil</th>
              <th scope="col" className={cn("px-4 py-3 font-medium", compact && "hidden sm:table-cell")}>Ce que vous payez</th>
              <th scope="col" className="px-4 py-3 font-medium">Prix public (HT)</th>
              {!compact && <th scope="col" className="px-4 py-3 font-medium">Relance auto. des devis</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((p) => (
              <tr key={p.name} className={cn(p.self && "bg-brand/5")}>
                <th scope="row" className={cn("px-4 py-3 font-medium", p.self && "text-brand")}>{p.name}</th>
                <td className={cn("px-4 py-3 text-muted-foreground", compact && "hidden sm:table-cell")}>{p.what}</td>
                <td className={cn("px-4 py-3", p.self && "font-semibold")}>{p.price}</td>
                {!compact && <td className="px-4 py-3 text-muted-foreground">{p.quoteFollowUp}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Prix publics relevés le {PRICE_DATE}, hors promotions ({" "}
        {rows
          .filter((p) => !p.self)
          .map((p, i, a) => (
            <span key={p.name}>
              <a href={p.source.href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                {p.source.label}
              </a>
              {i < a.length - 1 ? ", " : ""}
            </span>
          ))}
        ). Ces logiciels font bien plus que relancer : la comparaison porte sur le prix à payer quand votre seul besoin est la relance.{" "}
        {compact && (
          <Link href="/comparatif" className="underline underline-offset-2">
            Comparatif détaillé
          </Link>
        )}
      </p>
    </div>
  );
}
