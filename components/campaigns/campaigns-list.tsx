"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, FileText, Paperclip, Plus, Search } from "lucide-react";
import type { CampaignListItem } from "@/types/database";
import { FILTERS, filterOf, formatDateTime, type FilterKey } from "@/lib/campaigns/constants";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";

export function CampaignsList({ campaigns, initialFilter = "all" }: { campaigns: CampaignListItem[]; initialFilter?: FilterKey }) {
  const [filter, setFilter] = useState<FilterKey>(initialFilter);
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: campaigns.length, waiting: 0, scheduled: 0, replied: 0, won: 0, lost: 0, finished: 0 };
    campaigns.forEach((x) => (c[filterOf(x)] += 1));
    return c;
  }, [campaigns]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return campaigns.filter(
      (c) =>
        (filter === "all" || filterOf(c) === filter) &&
        (!q ||
          c.prospect_name.toLowerCase().includes(q) ||
          c.recipients.some((r) => r.includes(q)) ||
          (c.reference ?? "").toLowerCase().includes(q)),
    );
  }, [campaigns, filter, query]);

  const attachmentsOf = (c: CampaignListItem) => c.campaign_attachments?.[0]?.count ?? 0;

  return (
    <div className="space-y-4">
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
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher…" className="pl-9" aria-label="Rechercher" />
        </div>
      </div>

      {visible.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="rounded-full bg-muted p-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </span>
          <div>
            <p className="font-medium">{campaigns.length === 0 ? "Aucun devis pour l'instant" : "Aucun résultat"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {campaigns.length === 0
                ? "Envoyez votre premier devis : les relances partiront toutes seules."
                : "Essayez un autre filtre ou une autre recherche."}
            </p>
          </div>
          {campaigns.length === 0 && (
            <Button asChild variant="brand">
              <Link href="/devis/nouveau">
                <Plus /> Envoyer un devis
              </Link>
            </Button>
          )}
        </Card>
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {visible.map((c) => (
              <Link key={c.id} href={`/devis/${c.id}`} className="block">
                <Card className="p-4 transition-colors hover:bg-muted/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{c.prospect_name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.reference ? `${c.reference} · ` : ""}
                        {c.initial_sent_at ? `Envoyé ${formatDateTime(c.initial_sent_at)}` : "Pas encore envoyé"}
                      </p>
                    </div>
                    <CampaignStatusBadge campaign={c} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="font-semibold tabular-nums">{formatCurrency(c.amount)}</span>
                    <span className="flex items-center gap-3 text-xs text-muted-foreground">
                      {attachmentsOf(c) > 0 && (
                        <span className="flex items-center gap-1">
                          <Paperclip className="h-3 w-3" />
                          {attachmentsOf(c)}
                        </span>
                      )}
                      <span>
                        {c.followups_sent}/{c.max_followups} relances
                      </span>
                    </span>
                  </div>
                  {c.next_followup_at && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarClock className="h-3 w-3" /> Prochaine : {formatDateTime(c.next_followup_at)}
                    </p>
                  )}
                </Card>
              </Link>
            ))}
          </div>

          <Card className="hidden overflow-hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Client</TableHead>
                  <TableHead>Envoyé le</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-center">Relances</TableHead>
                  <TableHead>Prochaine relance</TableHead>
                  <TableHead className="text-center">PJ</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer">
                    <TableCell className="max-w-[240px]">
                      <Link href={`/devis/${c.id}`} className="block">
                        <span className="block truncate font-medium hover:underline">{c.prospect_name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {c.reference ? `${c.reference} · ` : ""}
                          {c.recipients.join(", ")}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(c.initial_sent_at)}</TableCell>
                    <TableCell>
                      <CampaignStatusBadge campaign={c} />
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {c.followups_sent}/{c.max_followups}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(c.next_followup_at)}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{attachmentsOf(c) || "—"}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatCurrency(c.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      <Button asChild variant="brand" size="icon" aria-label="Envoyer un devis" className="fixed bottom-20 right-4 z-30 h-14 w-14 rounded-full shadow-lg shadow-brand/30 md:hidden [&_svg]:size-6">
        <Link href="/devis/nouveau">
          <Plus />
        </Link>
      </Button>
    </div>
  );
}
