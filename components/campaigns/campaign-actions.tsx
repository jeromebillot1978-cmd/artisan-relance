"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  CircleCheckBig,
  MessageCircleReply,
  Pause,
  RefreshCw,
  Send,
  Square,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { campaignAction, deleteCampaign } from "@/lib/actions/campaigns";
import type { Campaign } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

type Confirm = { action: string; title: string; text: string; danger?: boolean; reason?: boolean } | null;

const LOST_REASONS = ["Trop cher", "A choisi un concurrent", "Projet reporté", "Projet abandonné", "Pas de réponse"];

export function CampaignActions({ campaign }: { campaign: Campaign }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [reason, setReason] = useState("");
  const s = campaign.status;
  const sent = Boolean(campaign.initial_sent_at);
  const followupsRunning = s === "active" && Boolean(campaign.next_followup_at);
  const decided = s === "won" || s === "lost";

  function run(action: string, withReason?: string) {
    startTransition(async () => {
      const res =
        action === "delete" ? await deleteCampaign(campaign.id) : await campaignAction(campaign.id, action, withReason);
      if (res.error) toast.error(res.error);
      else toast.success(res.message);
      setConfirm(null);
      setReason("");
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

      {sent && s !== "replied" && !decided && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run("replied")}>
          <MessageCircleReply /> Marquer comme Répondu
        </Button>
      )}
      {sent && s !== "won" && (
        <Button
          size="sm"
          variant="outline"
          className="border-success/40 text-success hover:bg-success/10 hover:text-success"
          disabled={pending}
          onClick={() => run("won")}
        >
          <CheckCircle2 /> Marquer comme Gagné
        </Button>
      )}
      {sent && s !== "lost" && (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() =>
            setConfirm({
              action: "lost",
              title: "Marquer ce devis comme perdu ?",
              text: "Les relances s'arrêtent. Le motif (facultatif) apparaîtra dans le dossier et dans l'export CSV.",
              reason: true,
            })
          }
        >
          <XCircle /> Marquer comme Perdu
        </Button>
      )}
      {sent && !decided && s !== "completed" && (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() =>
            setConfirm({
              action: "complete",
              title: "Marquer ce dossier comme terminé ?",
              text: "Les relances s'arrêtent, sans décision gagné ou perdu. Vous pourrez les réactiver plus tard.",
            })
          }
        >
          <CircleCheckBig /> Marquer comme Terminé
        </Button>
      )}
      {sent && !followupsRunning && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run("reactivate")}>
          <RefreshCw /> Réactiver les relances
        </Button>
      )}
      {followupsRunning && (
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => run("pause")}>
          <Pause /> Suspendre
        </Button>
      )}
      {["draft", "active", "paused", "replied"].includes(s) && (
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() =>
            setConfirm({
              action: "stop",
              title: "Arrêter définitivement ?",
              text: "Plus aucune relance ne sera envoyée pour ce devis. Vous pourrez les réactiver plus tard.",
            })
          }
        >
          <Square /> Arrêter
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

      <AlertDialog
        open={!!confirm}
        onOpenChange={(o) => {
          if (!o) {
            setConfirm(null);
            setReason("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirm?.text}</AlertDialogDescription>
          </AlertDialogHeader>
          {confirm?.reason && (
            <div className="grid gap-2">
              <Label htmlFor="lost-reason">Motif (facultatif)</Label>
              <div className="flex flex-wrap gap-1.5">
                {LOST_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className={`rounded-full border px-2.5 py-1 text-xs ${reason === r ? "border-brand bg-brand/10" : "hover:bg-muted"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <Textarea
                id="lost-reason"
                value={reason}
                maxLength={500}
                rows={2}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex. : le client a choisi une autre entreprise"
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              className={confirm?.danger ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
              onClick={(e) => {
                e.preventDefault();
                if (confirm) run(confirm.action, confirm.reason ? reason : undefined);
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
