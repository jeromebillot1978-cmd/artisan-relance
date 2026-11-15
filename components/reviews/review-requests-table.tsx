"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreVertical, MousePointerClick, Search, Star } from "lucide-react";
import { toast } from "sonner";
import { reviewRequestAction, type ReviewRowAction } from "@/lib/actions/reviews";
import { CANCEL_REASONS, REVIEW_TRIGGER, reviewFilterOf, type ReviewFilter } from "@/lib/reviews";
import { formatDateTime } from "@/lib/campaigns/constants";
import type { ReviewRequest } from "@/types/database";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReviewStatusBadge } from "@/components/reviews/review-status-badge";

const FILTERS: { key: ReviewFilter; label: string }[] = [
  { key: "all", label: "Toutes" },
  { key: "scheduled", label: "En attente" },
  { key: "sent", label: "Envoyées" },
  { key: "failed", label: "Échecs" },
  { key: "cancelled", label: "Annulées" },
];

function dateOf(r: ReviewRequest) {
  if (r.status === "sent") return { label: "Envoyée", value: r.sent_at };
  if (r.status === "scheduled" || r.status === "processing") return { label: "Prévue", value: r.scheduled_at };
  return { label: "Créée", value: r.created_at };
}

function detailOf(r: ReviewRequest) {
  if (r.status === "failed") return r.last_error ? `Erreur : ${r.last_error}` : "Échec de l'envoi";
  if (r.status === "cancelled") return CANCEL_REASONS[r.cancel_reason ?? ""] ?? "Annulée";
  if (r.status === "scheduled" && r.attempts > 0) return `Nouvel essai (${r.attempts}/3)`;
  return REVIEW_TRIGGER[r.trigger];
}

export function ReviewRequestsTable({ requests }: { requests: ReviewRequest[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const counts = useMemo(() => {
    const c: Record<ReviewFilter, number> = { all: requests.length, scheduled: 0, sent: 0, failed: 0, cancelled: 0 };
    requests.forEach((r) => (c[reviewFilterOf(r)] += 1));
    return c;
  }, [requests]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter(
      (r) =>
        (filter === "all" || reviewFilterOf(r) === filter) &&
        (!q || r.client_name.toLowerCase().includes(q) || r.recipients.some((e) => e.includes(q))),
    );
  }, [requests, filter, query]);

  function run(r: ReviewRequest, action: ReviewRowAction) {
    setBusy(r.id);
    startTransition(async () => {
      const res = await reviewRequestAction(r.id, action);
      setBusy(null);
      if (res.error) toast.error(res.error);
      else toast.success(res.message);
      router.refresh();
    });
  }

  const menu = (r: ReviewRequest) => {
    const items: { action: ReviewRowAction; label: string; enabled: boolean }[] = [
      { action: "send_now", label: "📤 Envoyer maintenant", enabled: r.status === "scheduled" },
      { action: "cancel", label: "🚫 Annuler la demande", enabled: r.status === "scheduled" },
      { action: "retry", label: "🔁 Réessayer l'envoi", enabled: r.status === "failed" },
      { action: "mark_received", label: "⭐ Marquer l'avis comme reçu", enabled: r.status === "sent" && r.review_status !== "received" },
      { action: "unmark_received", label: "↩️ Avis non confirmé", enabled: r.review_status === "received" },
    ];
    if (!items.some((i) => i.enabled) && !r.campaign_id) return null;
    return (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative z-10 h-8 w-8 shrink-0 text-muted-foreground"
            aria-label={`Actions pour la demande de ${r.client_name}`}
            disabled={busy === r.id}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {items
            .filter((i) => i.enabled)
            .map((i) => (
              <DropdownMenuItem key={i.action} onSelect={() => run(r, i.action)} className="py-2">
                {i.label}
              </DropdownMenuItem>
            ))}
          {r.campaign_id && (
            <DropdownMenuItem asChild className="py-2">
              <Link href={`/devis/${r.campaign_id}`}>📁 Voir le dossier</Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const clicks = (r: ReviewRequest) =>
    r.status !== "sent" ? (
      <span className="text-muted-foreground">—</span>
    ) : r.clicks > 0 ? (
      <span className="inline-flex items-center gap-1 text-success" title={`Premier clic : ${formatDateTime(r.first_clicked_at)}`}>
        <MousePointerClick className="h-3.5 w-3.5" /> {r.clicks}
      </span>
    ) : (
      <span className="text-muted-foreground">0</span>
    );

  const review = (r: ReviewRequest) =>
    r.review_status === "received" ? (
      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
        <Star className="h-3.5 w-3.5 fill-current" /> Reçu
      </span>
    ) : (
      <span className="text-muted-foreground">—</span>
    );

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                filter === f.key
                  ? "border-foreground/20 bg-accent font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
              <span className="text-xs tabular-nums text-muted-foreground">{counts[f.key]}</span>
            </button>
          ))}
        </div>
        <div className="relative lg:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un client…" className="pl-9" aria-label="Rechercher un client" />
        </div>
      </div>

      {visible.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <span className="rounded-full bg-muted p-3">
            <Star className="h-5 w-5 text-muted-foreground" />
          </span>
          <p className="font-medium">{requests.length === 0 ? "Aucune demande d'avis pour l'instant" : "Aucun résultat"}</p>
          <p className="max-w-md text-sm text-muted-foreground">
            {requests.length === 0
              ? "Marquez un devis comme Gagné ou Terminé : la demande part automatiquement selon vos réglages, ou depuis le menu ⋮ du devis."
              : "Essayez un autre filtre ou une autre recherche."}
          </p>
        </Card>
      ) : (
        <>
          {/* Mobile : cartes */}
          <div className="space-y-2 md:hidden">
            {visible.map((r) => {
              const d = dateOf(r);
              return (
                <Card key={r.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{r.client_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{r.recipients.join(", ")}</p>
                    </div>
                    <div className="flex items-start gap-1">
                      <ReviewStatusBadge request={r} />
                      {menu(r)}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">{d.label}</p>
                      <p className="tabular-nums">{formatDateTime(d.value)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Clics</p>
                      <p>{clicks(r)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avis</p>
                      <p>{review(r)}</p>
                    </div>
                  </div>
                  <p className={cn("mt-2 text-xs", r.status === "failed" ? "text-destructive" : "text-muted-foreground")}>{detailOf(r)}</p>
                </Card>
              );
            })}
          </div>

          {/* Bureau : tableau */}
          <Card className="hidden overflow-hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Origine</TableHead>
                  <TableHead className="text-center">Clics</TableHead>
                  <TableHead>Avis</TableHead>
                  <TableHead className="w-10"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((r) => {
                  const d = dateOf(r);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="max-w-[220px]">
                        {r.campaign_id ? (
                          <Link href={`/devis/${r.campaign_id}`} className="block truncate font-medium hover:underline">
                            {r.client_name}
                          </Link>
                        ) : (
                          <span className="block truncate font-medium">{r.client_name}</span>
                        )}
                        <span className="block truncate text-xs text-muted-foreground">{r.recipients.join(", ")}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        <span className="block text-xs text-muted-foreground">{d.label}</span>
                        <span className="tabular-nums">{formatDateTime(d.value)}</span>
                      </TableCell>
                      <TableCell>
                        <ReviewStatusBadge request={r} />
                      </TableCell>
                      <TableCell className={cn("max-w-[220px] text-xs", r.status === "failed" ? "text-destructive" : "text-muted-foreground")}>
                        <span className="line-clamp-2">{detailOf(r)}</span>
                      </TableCell>
                      <TableCell className="text-center text-sm tabular-nums">{clicks(r)}</TableCell>
                      <TableCell className="text-sm">{review(r)}</TableCell>
                      <TableCell>{menu(r)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
