"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUser } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/actions/types";

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
    .pipe(z.string().email("E-mail invalide.").nullable()),
});

export async function updateProfile(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Session expirée. Reconnectez-vous." };

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Vérifiez les champs.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", user.id);
  if (error) return { error: "Impossible d'enregistrer le profil." };

  revalidatePath("/", "layout");
  return { ok: true, message: "Profil enregistré." };
}
