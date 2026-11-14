"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Settings2 } from "lucide-react";
import { toast } from "sonner";
import { updateStrategy } from "@/lib/actions/campaigns";
import type { StrategyFormInput } from "@/lib/campaigns/schema";
import type { Campaign } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StrategyFields } from "@/components/campaigns/strategy-fields";

export function StrategyDialog({ campaign }: { campaign: Campaign }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState<StrategyFormInput>({
    followupEnabled: campaign.followup_enabled,
    intervalDays: campaign.interval_days,
    maxFollowups: campaign.max_followups,
    endMode: campaign.end_date ? "date" : campaign.max_days ? "days" : "none",
    maxDays: campaign.max_days,
    endDate: campaign.end_date,
    attachOnFollowups: campaign.attach_on_followups,
  });
  const editable = ["draft", "active", "paused", "completed"].includes(campaign.status);

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} disabled={!editable}>
        <Settings2 /> Modifier la stratégie
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Stratégie de relance</DialogTitle>
            <DialogDescription>
              {campaign.followups_sent} relance(s) déjà envoyée(s). Le calendrier est recalculé depuis la date d'envoi du devis.
            </DialogDescription>
          </DialogHeader>
          <StrategyFields
            value={value}
            onChange={setValue}
            startFrom={new Date(campaign.initial_sent_at ?? Date.now())}
            alreadySent={campaign.followups_sent}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="brand"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await updateStrategy(campaign.id, value);
                  if (res.error) return void toast.error(res.error);
                  toast.success(res.message);
                  setOpen(false);
                  router.refresh();
                })
              }
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
