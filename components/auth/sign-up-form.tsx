"use client";

import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { signUp } from "@/lib/actions/auth";
import type { ActionState } from "@/lib/actions/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { FieldError, FormMessage } from "@/components/field-error";

export function SignUpForm() {
  const [state, action] = useActionState<ActionState, FormData>(signUp, {});

  if (state.ok) {
    return (
      <div className="space-y-3 py-4 text-center">
        <MailCheck className="mx-auto h-10 w-10 text-success" />
        <p className="font-medium">Vérifiez votre boîte mail</p>
        <p className="text-sm text-muted-foreground">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <FormMessage error={state.error} />
      <div className="space-y-2">
        <Label htmlFor="company_name">Nom de l'entreprise</Label>
        <Input id="company_name" name="company_name" autoComplete="organization" placeholder="Dupont Plomberie" required />
        <FieldError errors={state.fieldErrors?.company_name} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail professionnel</Label>
        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" required />
        <FieldError errors={state.fieldErrors?.email} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        <p className="text-xs text-muted-foreground">8 caractères minimum.</p>
        <FieldError errors={state.fieldErrors?.password} />
      </div>
      <SubmitButton className="w-full" variant="brand" pendingText="Création…">
        Créer mon compte
      </SubmitButton>
    </form>
  );
}
