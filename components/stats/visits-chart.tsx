"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { DailyPoint } from "@/lib/stats";

const RANGES = [
  { days: 7, label: "7 j" },
  { days: 30, label: "30 j" },
  { days: 90, label: "90 j" },
] as const;
const MEASURES = [
  { key: "visitors", label: "Visiteurs uniques" },
  { key: "views", label: "Pages vues" },
] as const;

type Measure = (typeof MEASURES)[number]["key"];

const dayFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });
const longFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const fmt = (d: string, f: Intl.DateTimeFormat) => f.format(new Date(`${d}T00:00:00Z`));
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Échelle « ronde » : 1, 2, 5, 10, 20, 50… pour des repères lisibles. */
function niceMax(v: number) {
  if (v <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(v));
  return ([1, 2, 5, 10].map((m) => m * pow).find((n) => n >= v) ?? 10 * pow);
}

function Toggle<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-md border p-0.5 text-xs">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded px-2.5 py-1 font-medium transition-colors",
            o.value === value ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function VisitsChart({ daily }: { daily: DailyPoint[] }) {
  const [days, setDays] = useState<number>(30);
  const [measure, setMeasure] = useState<Measure>("visitors");
  const [active, setActive] = useState<number | null>(null);

  const points = useMemo(() => daily.slice(-days), [daily, days]);
  const values = points.map((p) => p[measure]);
  const total = values.reduce((a, b) => a + b, 0);
  const max = niceMax(Math.max(0, ...values));
  const measureLabel = MEASURES.find((m) => m.key === measure)!.label;
  const shown = active !== null ? points[active] : null;

  return (
    <div>
      {/* Filtres : une seule ligne au-dessus du graphique */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Toggle label="Mesure" options={MEASURES.map((m) => ({ value: m.key, label: m.label }))} value={measure} onChange={setMeasure} />
        <Toggle label="Période" options={RANGES.map((r) => ({ value: r.days, label: r.label }))} value={days} onChange={setDays} />
        <p className="ml-auto text-xs text-muted-foreground tabular-nums">
          {measure === "views" ? "Total" : "Somme des visiteurs quotidiens"} : <span className="font-medium text-foreground">{total}</span>
        </p>
      </div>

      <div className="relative">
        {/* Info-bulle */}
        <div aria-live="polite" className="pointer-events-none mb-2 h-5 text-xs text-muted-foreground">
          {shown ? (
            <span>
              <span>{cap(fmt(shown.day, longFmt))}</span> —{" "}
              <span className="font-medium text-foreground tabular-nums">{shown.visitors}</span> visiteur{shown.visitors > 1 ? "s" : ""} ·{" "}
              <span className="font-medium text-foreground tabular-nums">{shown.views}</span> page{shown.views > 1 ? "s" : ""} vue{shown.views > 1 ? "s" : ""}
            </span>
          ) : (
            <span>Survolez ou touchez une barre pour le détail du jour.</span>
          )}
        </div>

        <div className="flex gap-2">
          {/* Axe vertical : repères discrets */}
          <div className="flex h-48 w-7 flex-col justify-between text-right text-[10px] leading-none text-muted-foreground tabular-nums">
            <span>{max}</span>
            <span>{max / 2}</span>
            <span>0</span>
          </div>
          <div className="relative h-48 flex-1">
            <div className="absolute inset-x-0 top-0 border-t border-dashed border-border/70" />
            <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-border/70" />
            <div className="absolute inset-x-0 bottom-0 border-t border-border" />
            <div
              className="absolute inset-0 flex items-end gap-[2px]"
              role="img"
              aria-label={`${measureLabel} par jour sur ${days} jours, total ${total}`}
              onMouseLeave={() => setActive(null)}
            >
              {points.map((p, i) => {
                const v = p[measure];
                const h = max ? (v / max) * 100 : 0;
                return (
                  <button
                    key={p.day}
                    type="button"
                    className="group flex h-full min-w-0 flex-1 items-end focus:outline-none"
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onClick={() => setActive(i)}
                    aria-label={`${fmt(p.day, longFmt)} : ${v} ${measureLabel.toLowerCase()}`}
                  >
                    <span
                      className={cn(
                        "block w-full rounded-t-[4px] bg-brand transition-opacity",
                        active !== null && active !== i ? "opacity-40" : "opacity-100",
                        v === 0 && "bg-border",
                      )}
                      style={{ height: v === 0 ? "2px" : `${Math.max(h, 2)}%` }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="ml-9 mt-1.5 flex justify-between text-[10px] text-muted-foreground">
          <span>{points[0] && fmt(points[0].day, dayFmt)}</span>
          {points.length > 2 && <span>{fmt(points[Math.floor(points.length / 2)].day, dayFmt)}</span>}
          <span>{points.at(-1) && fmt(points.at(-1)!.day, dayFmt)}</span>
        </div>
      </div>

      {/* Vue tableau (accessibilité, lecture précise) */}
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">Voir les chiffres jour par jour</summary>
        <div className="mt-2 max-h-64 overflow-auto rounded-md border">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Jour</th>
                <th className="px-3 py-2 text-right font-medium">Visiteurs uniques</th>
                <th className="px-3 py-2 text-right font-medium">Pages vues</th>
              </tr>
            </thead>
            <tbody>
              {[...points].reverse().map((p) => (
                <tr key={p.day} className="border-t">
                  <td className="px-3 py-1.5">{cap(fmt(p.day, longFmt))}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{p.visitors}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{p.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
