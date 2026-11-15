"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/utils";
import type { ActionState } from "@/lib/actions/types";

const emailSchema = z.string().trim().toLowerCase().email("Adresse e-mail invalide.");
const passwordSchema = z.string().min(8, "8 caractères minimum.");

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

function translateAuthError(message: string) {
  if (/invalid login credentials/i.test(message)) return "E-mail ou mot de passe incorrect.";
  if (/email not confirmed/i.test(message)) return "Confirmez d'abord votre adresse via l'e-mail reçu.";
  if (/already registered|already exists/i.test(message)) return "Un compte existe déjà avec cet e-mail.";
  if (/rate limit|too many/i.test(message)) return "Trop de tentatives. Réessayez dans quelques minutes.";
  if (/should be different/i.test(message)) return "Le nouveau mot de passe doit être différent de l'ancien.";
  if (/weak|pwned/i.test(message)) return "Mot de passe trop faible. Choisissez-en un plus robuste.";
  return "Une erreur est survenue. Réessayez.";
}

export async function signUp(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({
      email: emailSchema,
      password: passwordSchema,
    })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: "Vérifiez les champs.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Le nom de l'entreprise se renseigne ensuite dans Paramètres (rappel au tableau de bord).
      emailRedirectTo: `${siteUrl()}/auth/callback?next=/dashboard`,
    },
  });

  if (error) return { error: translateAuthError(error.message) };

  // Si la confirmation d'e-mail est désactivée dans Supabase, la session existe déjà
  if (data.session) redirect("/dashboard");

  return {
    ok: true,
    message: "Compte créé ! Cliquez sur le lien envoyé par e-mail pour activer votre compte.",
  };
}

export async function signIn(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({ email: emailSchema, password: z.string().min(1, "Mot de passe requis.") })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: "Vérifiez les champs.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: translateAuthError(error.message) };

  redirect(safeNext(formData.get("next")));
}

export async function requestPasswordReset(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { fieldErrors: { email: ["Adresse e-mail invalide."] } };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${siteUrl()}/auth/callback?next=/reinitialiser-mot-de-passe`,
  });

  // Message identique que le compte existe ou non (pas de fuite d'information)
  return {
    ok: true,
    message: "Si un compte existe pour cette adresse, vous allez recevoir un lien de réinitialisation.",
  };
}

export async function updatePassword(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({ password: passwordSchema, confirm: z.string() })
    .refine((v) => v.password === v.confirm, {
      message: "Les mots de passe ne correspondent pas.",
      path: ["confirm"],
    })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: "Vérifiez les champs.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Lien expiré. Refaites une demande de réinitialisation." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: translateAuthError(error.message) };

  redirect("/dashboard?motdepasse=ok");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}
