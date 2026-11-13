"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { updateProfile } from "@/lib/actions/profile";
import type { ActionState } from "@/lib/actions/types";
import type { Profile } from "@/types/database";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { FieldError, FormMessage } from "@/components/field-error";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action] = useActionState<ActionState, FormData>(updateProfile, {});
  const handled = useRef<ActionState | null>(null);

  useEffect(() => {
    if (state.ok && handled.current !== state) {
      handled.current = state;
      toast.success(state.message ?? "Enregistré");
    }
  }, [state]);

  return (
    <form action={action} className="grid gap-4">
      <FormMessage error={state.error} />
      <div className="grid gap-2">
        <Label htmlFor="company_name">Nom de l'entreprise *</Label>
        <Input id="company_name" name="company_name" defaultValue={profile.company_name} required />
        <p className="text-xs text-muted-foreground">Nom d'expéditeur des e-mails de relance.</p>
        <FieldError errors={state.fieldErrors?.company_name} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="contact_name">Nom du signataire</Label>
          <Input id="contact_name" name="contact_name" placeholder="Jean Dupont" defaultValue={profile.contact_name ?? ""} />
          <FieldError errors={state.fieldErrors?.contact_name} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input id="phone" name="phone" type="tel" inputMode="tel" placeholder="06 12 34 56 78" defaultValue={profile.phone ?? ""} />
          <FieldError errors={state.fieldErrors?.phone} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="reply_to_email">E-mail de réponse</Label>
        <Input
          id="reply_to_email"
          name="reply_to_email"
          type="email"
          inputMode="email"
          placeholder={profile.email}
          defaultValue={profile.reply_to_email ?? ""}
        />
        <p className="text-xs text-muted-foreground">
          Les réponses de vos clients arrivent ici. Par défaut : {profile.email}
        </p>
        <FieldError errors={state.fieldErrors?.reply_to_email} />
      </div>
      <div>
        <SubmitButton pendingText="Enregistrement…">Enregistrer</SubmitButton>
      </div>
    </form>
  );
}
