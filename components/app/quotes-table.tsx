"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CheckCircle2,
  Clock,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { QuoteStatus, QuoteWithEmails } from "@/types/database";
import { deleteQuote, setQuoteStatus } from "@/lib/actions/quotes";
import { reminderLabel } from "@/lib/automations/registry";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/app/status-badge";
import { QuoteFormDialog } from "@/components/app/quote-form-dialog";

type Filter = "all" | QuoteStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "pending", label: "En attente" },
  { value: "signed", label: "Signés" },
  { value: "lost", label: "Perdus" },
];

function nextReminderOf(quote: QuoteWithEmails) {
  if (quote.status !== "pending") return null;
  return (
    quote.scheduled_emails
      .filter((e) => ["pending", "failed", "processing"].includes(e.status))
      .sort((a, b) => a.send_date.localeCompare(b.send_date))[0] ?? null
  );
}

function ReminderInfo({ quote }: { quote: QuoteWithEmails }) {
  const next = nextReminderOf(quote);
  const sentCount = quote.scheduled_emails.filter((e) => e.status === "sent").length;

  if (next) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        {reminderLabel(next.email_type)} · {formatDate(next.send_date, { year: undefined })}
      </span>
    );
  }
  if (sentCount > 0) {
    return <span className="text-xs text-muted-foreground">{sentCount} relance{sentCount > 1 ? "s" : ""} envoyée{sentCount > 1 ? "s" : ""}</span>;
  }
  return <span className="text-xs text-muted-foreground">—</span>;
}

export function QuotesTable({ quotes, initialFilter = "all" }: { quotes: QuoteWithEmails[]; initialFilter?: Filter }) {
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<QuoteWithEmails | null>(null);
  const [deleting, setDeleting] = useState<QuoteWithEmails | null>(null);
  const [isPending, startTransition] = useTransition();

  const counts = useMemo(
    () => ({
      all: quotes.length,
      pending: quotes.filter((q) => q.status === "pending").length,
      signed: quotes.filter((q) => q.status === "signed").length,
      lost: quotes.filter((q) => q.status === "lost").length,
    }),
    [quotes],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return quotes.filter(
      (quote) =>
        (filter === "all" || quote.status === filter) &&
        (!q ||
          quote.client_name.toLowerCase().includes(q) ||
          quote.client_email.toLowerCase().includes(q) ||
          (quote.reference ?? "").toLowerCase().includes(q)),
    );
  }, [quotes, filter, query]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(quote: QuoteWithEmails) {
    setEditing(quote);
    setFormOpen(true);
  }

  function changeStatus(quote: QuoteWithEmails, status: QuoteStatus) {
    startTransition(async () => {
      const res = await setQuoteStatus(quote.id, status);
      if (res.error) toast.error(res.error);
      else toast.success(res.message);
    });
  }

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    startTransition(async () => {
      const res = await deleteQuote(target.id);
      if (res.error) toast.error(res.error);
      else toast.success(res.message);
      setDeleting(null);
    });
  }

  const actions = (quote: QuoteWithEmails) => (
    // modal={false} : évite le blocage du clic quand un Dialog s'ouvre depuis le menu
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Actions" disabled={isPending}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {quote.status !== "signed" && (
          <DropdownMenuItem onSelect={() => changeStatus(quote, "signed")}>
            <CheckCircle2 className="text-success" /> Marquer comme signé
          </DropdownMenuItem>
        )}
        {quote.status !== "lost" && (
          <DropdownMenuItem onSelect={() => changeStatus(quote, "lost")}>
            <XCircle className="text-destructive" /> Marquer comme perdu
          </DropdownMenuItem>
        )}
        {quote.status !== "pending" && (
          <DropdownMenuItem onSelect={() => changeStatus(quote, "pending")}>
            <RotateCcw /> Remettre en attente
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => openEdit(quote)}>
          <Pencil /> Modifier
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setDeleting(quote)} className="text-destructive focus:text-destructive">
          <Trash2 /> Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-4">
      {/* Barre d'outils */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                filter === f.value
                  ? "border-foreground/20 bg-accent font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
              <span className="text-xs tabular-nums text-muted-foreground">{counts[f.value]}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un client…"
              className="pl-9"
              aria-label="Rechercher"
            />
          </div>
          <Button variant="brand" onClick={openCreate} className="hidden sm:inline-flex">
            <Plus /> Nouveau devis
          </Button>
        </div>
      </div>

      {visible.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="rounded-full bg-muted p-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </span>
          <div>
            <p className="font-medium">{quotes.length === 0 ? "Aucun devis pour l'instant" : "Aucun résultat"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {quotes.length === 0
                ? "Ajoutez votre premier devis : les relances partiront toutes seules."
                : "Essayez un autre filtre ou une autre recherche."}
            </p>
          </div>
          {quotes.length === 0 && (
            <Button variant="brand" onClick={openCreate}>
              <Plus /> Ajouter un devis
            </Button>
          )}
        </Card>
      ) : (
        <>
          {/* Mobile : cartes */}
          <div className="space-y-2 md:hidden">
            {visible.map((quote) => (
              <Card key={quote.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openEdit(quote)}>
                    <p className="truncate font-medium">{quote.client_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {quote.reference ? `${quote.reference} · ` : ""}
                      {formatDate(quote.quote_date)}
                    </p>
                  </button>
                  {actions(quote)}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-lg font-semibold tabular-nums">{formatCurrency(quote.amount)}</span>
                  <StatusBadge status={quote.status} />
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <ReminderInfo quote={quote} />
                  {quote.status === "pending" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 border-success/40 text-success hover:bg-success/10 hover:text-success"
                      onClick={() => changeStatus(quote, "signed")}
                      disabled={isPending}
                    >
                      <CheckCircle2 /> Signé
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop : tableau */}
          <Card className="hidden overflow-hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Relance</TableHead>
                  <TableHead className="w-12 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="max-w-[260px]">
                      <button type="button" className="block w-full text-left" onClick={() => openEdit(quote)}>
                        <span className="block truncate font-medium hover:underline">{quote.client_name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {quote.reference ? `${quote.reference} · ` : ""}
                          {quote.client_email}
                        </span>
                      </button>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatCurrency(quote.amount)}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(quote.quote_date)}</TableCell>
                    <TableCell>
                      <StatusBadge status={quote.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <ReminderInfo quote={quote} />
                    </TableCell>
                    <TableCell className="text-right">{actions(quote)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      {/* Bouton flottant mobile */}
      <Button
        variant="brand"
        size="icon"
        onClick={openCreate}
        aria-label="Nouveau devis"
        className="fixed bottom-20 right-4 z-30 h-14 w-14 rounded-full shadow-lg shadow-brand/30 md:hidden [&_svg]:size-6"
      >
        <Plus />
      </Button>

      <QuoteFormDialog open={formOpen} onOpenChange={setFormOpen} quote={editing} />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce devis ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le devis de {deleting?.client_name} et ses relances programmées seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
