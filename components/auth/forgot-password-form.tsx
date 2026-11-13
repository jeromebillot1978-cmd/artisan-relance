"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/lib/actions/auth";
import type { ActionState } from "@/lib/actions/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { FieldError, FormMessage } from "@/components/field-error";

export function ForgotPasswordForm() {
  const [state, action] = useActionState<ActionState, FormData>(requestPasswordReset, {});

  return (
    <form action={action} className="space-y-4">
      <FormMessage error={state.error} message={state.message} />
      {!state.ok && (
        <>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail du compte</Label>
            <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" required />
            <FieldError errors={state.fieldErrors?.email} />
          </div>
          <SubmitButton className="w-full" pendingText="Envoi…">Recevoir le lien</SubmitButton>
        </>
      )}
    </form>
  );
}
