"use client";

import { useState } from "react";
import { MoreVertical } from "lucide-react";
import type { CampaignListItem } from "@/types/database";
import { Button } from "@/components/ui/button";
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
import { CampaignEditDialog } from "@/components/campaigns/campaign-edit-dialog";
import { RequestReviewDialog } from "@/components/reviews/request-review-dialog";

export type RowAction = "won" | "lost" | "replied" | "complete" | "stop_followups" | "resume_followups";

interface Props {
  campaign: CampaignListItem;
  disabled?: boolean;
  onAction: (action: RowAction) => void;
  onDelete: () => void;
  onEdited: (c: CampaignListItem) => void;
}

/** Menu « ⋮ » d'une ligne du tableau des devis. */
export function CampaignRowMenu({ campaign: c, disabled, onAction, onDelete, onEdited }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const canReview = c.status === "won" || c.status === "completed";
  const sent = Boolean(c.initial_sent_at);
  const followupsRunning = c.status === "active" && c.followup_enabled && Boolean(c.next_followup_at);

  const items: { action: RowAction; emoji: string; label: string; enabled: boolean }[] = [
    { action: "won", emoji: "✅", label: "Marquer comme Gagné", enabled: sent && c.status !== "won" },
    { action: "lost", emoji: "❌", label: "Marquer comme Perdu", enabled: sent && c.status !== "lost" },
    { action: "replied", emoji: "💬", label: "Marquer comme Répondu", enabled: sent && c.status !== "replied" },
    { action: "complete", emoji: "📦", label: "Marquer comme Terminé", enabled: sent && c.status !== "completed" },
    { action: "stop_followups", emoji: "⏹️", label: "Arrêter les relances", enabled: sent && c.followup_enabled && ["active", "paused", "replied"].includes(c.status) },
    { action: "resume_followups", emoji: "▶️", label: "Reprendre les relances", enabled: sent && !followupsRunning },
  ];

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground"
            aria-label={`Actions pour ${c.prospect_name}`}
            disabled={disabled}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60" onClick={(e) => e.stopPropagation()}>
          {items.map((it) => (
            <DropdownMenuItem key={it.action} disabled={!it.enabled} onSelect={() => onAction(it.action)} className="gap-2.5 py-2">
              <span aria-hidden className="w-5 text-center">{it.emoji}</span>
              {it.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={!canReview} onSelect={() => setReviewing(true)} className="gap-2.5 py-2">
            <span aria-hidden className="w-5 text-center">⭐</span>
            Demander un avis Google
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setEditing(true)} className="gap-2.5 py-2">
            <span aria-hidden className="w-5 text-center">✏️</span>
            Modifier le devis
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setConfirmDelete(true)} className="gap-2.5 py-2 text-destructive focus:text-destructive">
            <span aria-hidden className="w-5 text-center">🗑️</span>
            Supprimer le devis
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CampaignEditDialog campaign={c} open={editing} onOpenChange={setEditing} onSaved={onEdited} />
      <RequestReviewDialog campaign={c} open={reviewing} onOpenChange={setReviewing} />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le devis de {c.prospect_name} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le dossier, son historique, ses relances programmées et ses pièces jointes seront définitivement supprimés.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setConfirmDelete(false);
                onDelete();
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
