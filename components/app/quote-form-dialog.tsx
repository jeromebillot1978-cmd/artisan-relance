"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { createQuote, updateQuote } from "@/lib/actions/quotes";
import type { ActionState } from "@/lib/actions/types";
import type { Quote } from "@/types/database";
import { todayParis } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";
import { FieldError, FormMessage } from "@/components/field-error";

interface QuoteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote?: Quote | null;
}

export function QuoteFormDialog({ open, onOpenChange, quote }: QuoteFormDialogProps) {
  // La clé remonte le formulaire à chaque ouverture -> état remis à zéro
  const [formKey, setFormKey] = useState(0);
  useEffect(() => {
    if (open) setFormKey((k) => k + 1);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{quote ? "Modifier le devis" : "Nouveau devis"}</DialogTitle>
          <DialogDescription>
            {quote
              ? "Modifier la date reprogramme les relances non encore envoyées."
              : "Les relances J+4 et J+10 seront programmées automatiquement."}
          </DialogDescription>
        </DialogHeader>
        <QuoteForm key={formKey} quote={quote} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function QuoteForm({ quote, onDone }: { quote?: Quote | null; onDone: () => void }) {
  const [state, action] = useActionState<ActionState, FormData>(quote ? updateQuote : createQuote, {});

  const handled = useRef<ActionState | null>(null);

  useEffect(() => {
    if (state.ok && handled.current !== state) {
      handled.current = state;
      toast.success(state.message ?? "Enregistré");
      onDone();
    }
  }, [state, onDone]);

  return (
    <form action={action} className="grid gap-4">
      {quote && <input type="hidden" name="id" value={quote.id} />}
      <FormMessage error={state.error} />

      <div className="grid gap-2">
        <Label htmlFor="client_name">Client *</Label>
        <Input
          id="client_name"
          name="client_name"
          placeholder="M. Dupont"
          defaultValue={quote?.client_name}
          autoComplete="off"
          required
        />
        <FieldError errors={state.fieldErrors?.client_name} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="client_email">E-mail du client *</Label>
          <Input
            id="client_email"
            name="client_email"
            type="email"
            inputMode="email"
            placeholder="client@email.fr"
            defaultValue={quote?.client_email}
            autoComplete="off"
            required
          />
          <FieldError errors={state.fieldErrors?.client_email} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="client_phone">Téléphone</Label>
          <Input
            id="client_phone"
            name="client_phone"
            type="tel"
            inputMode="tel"
            placeholder="06 12 34 56 78"
            defaultValue={quote?.client_phone ?? ""}
            autoComplete="off"
          />
          <FieldError errors={state.fieldErrors?.client_phone} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="amount">Montant TTC (€) *</Label>
          <Input
            id="amount"
            name="amount"
            inputMode="decimal"
            placeholder="2 500"
            defaultValue={quote ? String(quote.amount) : ""}
            required
          />
          <FieldError errors={state.fieldErrors?.amount} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="quote_date">Date d'envoi *</Label>
          <Input
            id="quote_date"
            name="quote_date"
            type="date"
            defaultValue={quote?.quote_date ?? todayParis()}
            required
          />
          <FieldError errors={state.fieldErrors?.quote_date} />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="reference">N° de devis</Label>
        <Input id="reference" name="reference" placeholder="D-2026-001" defaultValue={quote?.reference ?? ""} />
        <FieldError errors={state.fieldErrors?.reference} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">Notes internes</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Salle de bain complète, client pressé…"
          defaultValue={quote?.notes ?? ""}
          rows={2}
        />
        <p className="text-xs text-muted-foreground">Visible uniquement par vous.</p>
      </div>

      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Annuler
        </Button>
        <SubmitButton variant="brand" pendingText="Enregistrement…">
          {quote ? "Enregistrer" : "Ajouter le devis"}
        </SubmitButton>
      </DialogFooter>
    </form>
  );
}
