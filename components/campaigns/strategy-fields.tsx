"use client";

import { CalendarClock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { INTERVAL_PRESETS, formatDateTime, previewSchedule } from "@/lib/campaigns/constants";
import type { StrategyFormInput } from "@/lib/campaigns/schema";
import { cn } from "@/lib/utils";

export const DEFAULT_STRATEGY: StrategyFormInput = {
  followupEnabled: true,
  intervalDays: 7,
  maxFollowups: 3,
  endMode: "none",
  maxDays: null,
  endDate: null,
  attachOnFollowups: false,
};

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
        active ? "border-brand bg-brand/10 font-medium text-foreground" : "text-muted-foreground hover:bg-muted/50",
      )}
    >
      {children}
    </button>
  );
}

export function StrategyFields({
  value,
  onChange,
  startFrom,
  alreadySent = 0,
}: {
  value: StrategyFormInput;
  onChange: (v: StrategyFormInput) => void;
  startFrom: Date; // date de l'envoi initial (réelle ou prévue)
  alreadySent?: number;
}) {
  const set = (patch: Partial<StrategyFormInput>) => onChange({ ...value, ...patch });
  const isPreset = INTERVAL_PRESETS.some((p) => p.days === value.intervalDays);
  const preview = previewSchedule(startFrom, {
    followupEnabled: value.followupEnabled,
    intervalDays: value.intervalDays || 1,
    maxFollowups: value.maxFollowups || 1,
    endDate: value.endMode === "date" ? value.endDate : null,
    maxDays: value.endMode === "days" ? value.maxDays : null,
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">Relances automatiques</p>
          <p className="text-xs text-muted-foreground">Désactivez-les pour seulement envoyer le devis.</p>
        </div>
        <Switch
          checked={value.followupEnabled}
          onCheckedChange={(v) => set({ followupEnabled: v })}
          aria-label="Activer les relances automatiques"
        />
      </div>

      {value.followupEnabled && (
        <>
          <div className="space-y-2">
            <Label>Fréquence</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {INTERVAL_PRESETS.map((p) => (
                <Choice key={p.days} active={value.intervalDays === p.days} onClick={() => set({ intervalDays: p.days })}>
                  {p.label}
                </Choice>
              ))}
              <Choice active={!isPreset} onClick={() => set({ intervalDays: isPreset ? 10 : value.intervalDays })}>
                Personnalisé
              </Choice>
            </div>
            {!isPreset && (
              <div className="flex items-center gap-2 text-sm">
                Tous les
                <Input
                  type="number"
                  min={1}
                  max={90}
                  className="w-20"
                  value={value.intervalDays || ""}
                  onChange={(e) => set({ intervalDays: Number(e.target.value) })}
                />
                jours
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="maxFollowups">Nombre maximum de relances</Label>
              <Input
                id="maxFollowups"
                type="number"
                min={Math.max(1, alreadySent)}
                max={20}
                value={value.maxFollowups || ""}
                onChange={(e) => set({ maxFollowups: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fin de la campagne</Label>
              <div className="grid grid-cols-3 gap-2">
                <Choice active={value.endMode === "none"} onClick={() => set({ endMode: "none" })}>Aucun</Choice>
                <Choice active={value.endMode === "days"} onClick={() => set({ endMode: "days", maxDays: value.maxDays ?? 35 })}>Après…</Choice>
                <Choice active={value.endMode === "date"} onClick={() => set({ endMode: "date" })}>Le…</Choice>
              </div>
            </div>
          </div>

          {value.endMode === "days" && (
            <div className="flex items-center gap-2 text-sm">
              Arrêter après
              <Input
                type="number"
                min={1}
                max={365}
                className="w-24"
                value={value.maxDays ?? ""}
                onChange={(e) => set({ maxDays: Number(e.target.value) || null })}
              />
              jours
            </div>
          )}
          {value.endMode === "date" && (
            <div className="flex items-center gap-2 text-sm">
              Arrêter le
              <Input
                type="date"
                className="w-44"
                value={value.endDate ?? ""}
                onChange={(e) => set({ endDate: e.target.value || null })}
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[hsl(var(--brand))]"
              checked={value.attachOnFollowups}
              onChange={(e) => set({ attachOnFollowups: e.target.checked })}
            />
            Joindre à nouveau les fichiers à chaque relance
          </label>

          <div className="rounded-lg bg-muted/40 p-3">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" /> Calendrier prévu
            </p>
            {preview.dates.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Aucune relance ne tombe avant la fin de campagne.</p>
            ) : (
              <ol className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                {preview.dates.map((d, i) => (
                  <li key={d.toISOString()} className="flex gap-2">
                    <span className="w-16 shrink-0 text-muted-foreground">Relance {i + 1}</span>
                    <span className="tabular-nums">{formatDateTime(d)}</span>
                  </li>
                ))}
              </ol>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Envois du lundi au samedi, entre 8 h et 19 h. Elles s'arrêtent dès que vous marquez le dossier répondu, gagné, perdu ou terminé.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
