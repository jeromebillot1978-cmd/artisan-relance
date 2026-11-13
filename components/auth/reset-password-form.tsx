"use client";

import { useActionState } from "react";
import { updatePassword } from "@/lib/actions/auth";
import type { ActionState } from "@/lib/actions/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { FieldError, FormMessage } from "@/components/field-error";

export function ResetPasswordForm() {
  const [state, action] = useActionState<ActionState, FormData>(updatePassword, {});

  return (
    <form action={action} className="space-y-4">
      <FormMessage error={state.error} />
      <div className="space-y-2">
        <Label htmlFor="password">Nouveau mot de passe</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        <FieldError errors={state.fieldErrors?.password} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirmer</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
        <FieldError errors={state.fieldErrors?.confirm} />
      </div>
      <SubmitButton className="w-full" pendingText="Enregistrement…">Enregistrer</SubmitButton>
    </form>
  );
}
