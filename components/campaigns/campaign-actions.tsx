"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, MessageCircleReply, Pause, Play, RotateCcw, Send, Square, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { campaignAction, deleteCampaign } from "@/lib/actions/campaigns";
import type { Campaign } from "@/types/database";
import { Button } from "@/components/ui/button";
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

type Confirm = { action: string; title: string; text: string; danger?: boolean } | null;

export function CampaignActions({ campaign }: { campaign: Campaign }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const s = campaign.status;
  const open = ["draft", "active", "paused", "replied"].includes(s);

  function run(action: string) {
    startTransition(async () => {
      const res = action === "delete" ? await deleteCampaign(campaign.id) : await campaignAction(campaign.id, action);
      if (res.error) toast.error(res.error);
      else toast.success(res.message);
      setConfirm(null);
      if (action === "delete" && !res.error) router.push("/devis");
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {s === "draft" && campaign.initial_send_status === "failed" && (
        <Button variant="brand" size="sm" disabled={pending} onClick={() => run("retry_initial")}>
          <Send /> Réessayer l'envoi
        </Button>
      )}
      {open && (
        <Button size="sm" variant="outline" className="border-success/40 text-success hover:bg-success/10 hover:text-success" disabled={pending} onClick={() => run("won")}>
          <CheckCircle2 /> Gagné
        </Button>
      )}
      {open && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run("lost")}>
          <XCircle /> Perdu
        </Button>
      )}
      {(s === "active" || s === "paused") && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run("replied")}>
          <MessageCircleReply /> Le client a répondu
        </Button>
      )}
      {s === "active" && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run("pause")}>
          <Pause /> Suspendre
        </Button>
      )}
      {s === "paused" && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run("resume")}>
          <Play /> Reprendre
        </Button>
      )}
      {open && (
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() =>
            setConfirm({
              action: "stop",
              title: "Arrêter définitivement ?",
              text: "Plus aucune relance ne sera envoyée pour ce devis. Vous pourrez le rouvrir plus tard.",
            })
          }
        >
          <Square /> Arrêter
        </Button>
      )}
      {!open && campaign.initial_sent_at && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run("reopen")}>
          <RotateCcw /> Rouvrir
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        className="text-destructive hover:text-destructive"
        disabled={pending}
        onClick={() =>
          setConfirm({
            action: "delete",
            title: "Supprimer ce dossier ?",
            text: "Le dossier, son historique et ses pièces jointes seront définitivement supprimés.",
            danger: true,
          })
        }
      >
        <Trash2 /> Supprimer
      </Button>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirm?.text}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              className={confirm?.danger ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
              onClick={(e) => {
                e.preventDefault();
                if (confirm) run(confirm.action);
              }}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
