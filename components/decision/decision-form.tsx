"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { submitDecision } from "@/lib/actions/decision";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const REASONS = ["Trop cher", "J'ai choisi une autre entreprise", "Projet reporté", "Projet abandonné"];

export function DecisionForm({
  token,
  initialChoice,
  decided,
}: {
  token: string;
  initialChoice: "accept" | "refuse";
  decided: "won" | "lost" | null;
}) {
  const [choice, setChoice] = useState<"accept" | "refuse">(initialChoice);
  const [reason, setReason] = useState("");
  const [result, setResult] = useState<"won" | "lost" | null>(decided);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (result) {
    return result === "won" ? (
      <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-sm">
        <p className="flex items-center gap-2 font-medium text-success">
          <CheckCircle2 className="h-4 w-4" /> Devis accepté
        </p>
        <p className="mt-1 text-muted-foreground">Merci ! L'entreprise a été prévenue et va vous recontacter pour la suite.</p>
      </div>
    ) : (
      <div className="rounded-lg border p-4 text-sm">
        <p className="flex items-center gap-2 font-medium">
          <XCircle className="h-4 w-4" /> Réponse enregistrée
        </p>
        <p className="mt-1 text-muted-foreground">Merci de votre retour. Vous ne recevrez plus de relance pour ce devis.</p>
      </div>
    );
  }

  function send() {
    setError(null);
    startTransition(async () => {
      const res = await submitDecision({ token, decision: choice, reason: choice === "refuse" ? reason : undefined });
      if (res.error) setError(res.error);
      else if (res.status) setResult(res.status);
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setChoice("accept")}
          className={`rounded-lg border p-3 text-left text-sm transition-colors ${choice === "accept" ? "border-success bg-success/5" : "hover:bg-muted"}`}
        >
          <CheckCircle2 className="mb-1 h-4 w-4 text-success" />
          J'accepte le devis
        </button>
        <button
          type="button"
          onClick={() => setChoice("refuse")}
          className={`rounded-lg border p-3 text-left text-sm transition-colors ${choice === "refuse" ? "border-foreground/40 bg-muted" : "hover:bg-muted"}`}
        >
          <XCircle className="mb-1 h-4 w-4 text-muted-foreground" />
          Je ne donne pas suite
        </button>
      </div>

      {choice === "refuse" && (
        <div className="grid gap-2">
          <Label htmlFor="reason">Pouvez-vous nous dire pourquoi ? (facultatif)</Label>
          <div className="flex flex-wrap gap-1.5">
            {REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`rounded-full border px-2.5 py-1 text-xs ${reason === r ? "border-foreground/50 bg-muted" : "hover:bg-muted"}`}
              >
                {r}
              </button>
            ))}
          </div>
          <Textarea id="reason" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        className="w-full"
        variant={choice === "accept" ? "brand" : "outline"}
        disabled={pending}
        onClick={send}
      >
        {pending ? "Envoi…" : choice === "accept" ? "Confirmer l'acceptation du devis" : "Confirmer mon refus"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">Votre réponse est transmise immédiatement à l'entreprise.</p>
    </div>
  );
}
