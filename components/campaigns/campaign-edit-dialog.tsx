"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateCampaignDetails } from "@/lib/actions/campaigns";
import type { CampaignListItem } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  campaign: CampaignListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (c: CampaignListItem) => void;
}

/** « Modifier le devis » : client, destinataires, n° de devis, montant, téléphone, notes. */
export function CampaignEditDialog({ campaign: c, open, onOpenChange, onSaved }: Props) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(() => initial(c));

  useEffect(() => {
    if (open) setForm(initial(c));
  }, [open, c]);

  const set = (k: keyof ReturnType<typeof initial>) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function save() {
    startTransition(async () => {
      const res = await updateCampaignDetails(c.id, {
        prospectName: form.prospectName,
        recipients: form.recipients.split(/[,;\s]+/).filter(Boolean),
        reference: form.reference,
        amount: Number(form.amount.replace(/\s/g, "").replace(",", ".")) || 0,
        clientPhone: form.clientPhone,
        notes: form.notes,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message);
      if (res.campaign) onSaved(res.campaign);
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier le devis</DialogTitle>
          <DialogDescription>Les relances à venir utiliseront ces informations.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="ed-name">Nom du client</Label>
            <Input id="ed-name" value={form.prospectName} onChange={set("prospectName")} required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ed-recipients">Destinataire(s)</Label>
            <Input id="ed-recipients" value={form.recipients} onChange={set("recipients")} placeholder="client@exemple.fr, autre@exemple.fr" />
            <p className="text-xs text-muted-foreground">Séparez les adresses par une virgule. 5 maximum.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="ed-ref">N° de devis</Label>
              <Input id="ed-ref" value={form.reference} onChange={set("reference")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ed-amount">Montant TTC (€)</Label>
              <Input id="ed-amount" inputMode="decimal" value={form.amount} onChange={set("amount")} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ed-phone">Téléphone du client</Label>
            <Input id="ed-phone" type="tel" value={form.clientPhone} onChange={set("clientPhone")} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ed-notes">Notes internes</Label>
            <Textarea id="ed-notes" rows={3} value={form.notes} onChange={set("notes")} />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="brand" disabled={pending}>
              {pending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function initial(c: CampaignListItem) {
  return {
    prospectName: c.prospect_name,
    recipients: c.recipients.join(", "),
    reference: c.reference ?? "",
    amount: String(c.amount ?? "").replace(".", ","),
    clientPhone: c.client_phone ?? "",
    notes: c.notes ?? "",
  };
}
