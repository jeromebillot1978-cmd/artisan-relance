"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, MailCheck } from "lucide-react";
import { signUp } from "@/lib/actions/auth";
import type { ActionState } from "@/lib/actions/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { FieldError, FormMessage } from "@/components/field-error";

/** Inscription en 2 champs : le reste (nom d'entreprise, signature) se règle après. */
export function SignUpForm() {
  const [state, action] = useActionState<ActionState, FormData>(signUp, {});
  const [visible, setVisible] = useState(false);

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
        <Label htmlFor="email">E-mail professionnel</Label>
        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" autoFocus required />
        <FieldError errors={state.fieldErrors?.email} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <div className="relative">
          <Input id="password" name="password" type={visible ? "text" : "password"} autoComplete="new-password" minLength={8} required className="pr-11" />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            aria-pressed={visible}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">8 caractères minimum.</p>
        <FieldError errors={state.fieldErrors?.password} />
      </div>
      <SubmitButton className="w-full" variant="brand" pendingText="Création…">
        Créer mon compte gratuit
      </SubmitButton>
      <p className="text-center text-xs text-muted-foreground">
        Sans carte bancaire. Vous renseignerez le nom de votre entreprise ensuite.
      </p>
    </form>
  );
}
