"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { requestReview } from "@/lib/actions/reviews";
import { Button, type ButtonProps } from "@/components/ui/button";
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

interface CampaignLike {
  id: string;
  prospect_name: string;
  recipients: string[];
}

/** Confirmation puis envoi immédiat de la demande d'avis (contrôlée par le parent). */
export function RequestReviewDialog({
  campaign,
  open,
  onOpenChange,
}: {
  campaign: CampaignLike;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function send() {
    startTransition(async () => {
      const res = await requestReview(campaign.id);
      onOpenChange(false);
      if (res.error) {
        if (/Paramètres/.test(res.error)) {
          toast.error(res.error, {
            action: { label: "Configurer", onClick: () => router.push("/parametres#avis-google") },
          });
        } else {
          toast.error(res.error);
        }
      } else {
        toast.success(res.message);
      }
      router.refresh();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Demander un avis Google à {campaign.prospect_name} ?</AlertDialogTitle>
          <AlertDialogDescription>
            Un e-mail avec le lien vers votre fiche Google part tout de suite à {campaign.recipients.join(", ")}, avec
            le modèle choisi dans vos réglages. Une seule demande est envoyée par dossier.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              send();
            }}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
            {pending ? "Envoi…" : "Envoyer la demande"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function RequestReviewButton({
  campaign,
  ...props
}: { campaign: CampaignLike } & Omit<ButtonProps, "onClick">) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} {...props}>
        <Star /> Demander un avis Google
      </Button>
      <RequestReviewDialog campaign={campaign} open={open} onOpenChange={setOpen} />
    </>
  );
}
