"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { emailIssue } from "@/lib/email-check";
import { getUser } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/actions/types";
import { notifyProfileCompleted } from "@/lib/notify-admin";

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null);

const profileSchema = z.object({
  company_name: z.string().trim().min(2, "Nom d'entreprise requis.").max(120),
  contact_name: optional(120),
  phone: optional(30),
  reply_to_email: z
    .string()
    .trim()
    .toLowerCase()
    .optional()
    .transform((v) => v || null)
    .pipe(
      z
        .string()
        .email("E-mail invalide.")
        .superRefine((value, ctx) => {
          const issue = emailIssue(value);
          if (issue) ctx.addIssue({ code: "custom", message: issue });
        })
        .nullable(),
    ),
});

export async function updateProfile(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Session expirée. Reconnectez-vous." };

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Vérifiez les champs.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Nom d'entreprise renseigné pour la première fois → alerte à l'administrateur
  const { data: before } = await supabase.from("profiles").select("company_name").eq("id", user.id).single();
  const firstCompletion = !before?.company_name?.trim();

  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", user.id);
  if (error) return { error: "Impossible d'enregistrer le profil." };

  if (firstCompletion && user.email) {
    const email = user.email;
    after(() =>
      notifyProfileCompleted({
        id: user.id,
        email,
        company: parsed.data.company_name,
        contact: parsed.data.contact_name,
        phone: parsed.data.phone,
      }),
    );
  }

  revalidatePath("/", "layout");
  return { ok: true, message: "Profil enregistré." };
}
