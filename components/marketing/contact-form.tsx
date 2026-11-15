"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { sendContact } from "@/lib/actions/contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function ContactForm() {
  const initialKind = useSearchParams().get("sujet") === "demo" ? "demo" : "question";
  const [kind, setKind] = useState<"question" | "demo">(initialKind);
  const [startedAt] = useState(() => Date.now());
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string[] | undefined>>({});

  if (done) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/5 p-6">
        <p className="flex items-center gap-2 font-medium">
          <CheckCircle2 className="h-5 w-5 text-success" /> Message envoyé
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Merci ! Nous vous répondons sous 24 heures ouvrées
          {kind === "demo" ? " pour fixer un créneau de démonstration." : "."}
        </p>
      </div>
    );
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setError(null);
        startTransition(async () => {
          const res = await sendContact({
            kind,
            name: String(f.get("name") ?? ""),
            email: String(f.get("email") ?? ""),
            phone: String(f.get("phone") ?? ""),
            trade: String(f.get("trade") ?? ""),
            message: String(f.get("message") ?? ""),
            website: String(f.get("website") ?? ""),
            startedAt,
          });
          if (res.ok) setDone(true);
          else {
            setError(res.error ?? "Une erreur est survenue.");
            setFields(res.fieldErrors ?? {});
          }
        });
      }}
    >
      <fieldset className="grid grid-cols-2 gap-2">
        <legend className="mb-2 text-sm font-medium">Votre demande</legend>
        {(
          [
            ["question", "Poser une question"],
            ["demo", "Demander une démonstration"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            aria-pressed={kind === k}
            className={cn(
              "rounded-lg border px-3 py-2.5 text-sm transition-colors",
              kind === k ? "border-brand bg-brand/10 font-medium" : "hover:bg-muted",
            )}
          >
            {label}
          </button>
        ))}
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="name">Nom *</Label>
          <Input id="name" name="name" autoComplete="name" required />
          {fields.name && <p className="text-xs text-destructive">{fields.name[0]}</p>}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="trade">Métier</Label>
          <Input id="trade" name="trade" placeholder="Plombier, électricien…" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="email">E-mail *</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
          {fields.email && <p className="text-xs text-destructive">{fields.email[0]}</p>}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="phone">Téléphone</Label>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="message">Message *</Label>
        <Textarea
          id="message"
          name="message"
          rows={5}
          required
          placeholder={kind === "demo" ? "Vos disponibilités pour une démonstration de 10 minutes (visio ou téléphone)." : "Votre question"}
        />
        {fields.message && <p className="text-xs text-destructive">{fields.message[0]}</p>}
      </div>
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Ne pas remplir</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" variant="brand" size="lg" disabled={pending}>
        {pending ? "Envoi…" : kind === "demo" ? "Demander ma démonstration" : "Envoyer mon message"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Vos coordonnées servent uniquement à vous répondre. Voir la <a href="/confidentialite" className="underline underline-offset-4">politique de confidentialité</a>.
      </p>
    </form>
  );
}
