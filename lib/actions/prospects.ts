"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUser } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/actions/types";

/**
 * Mise à jour d'un prospect (statut, notes). N'envoie jamais rien :
 * l'envoi se fait à la main, depuis la boîte e-mail de l'administrateur.
 * La sécurité repose sur la politique RLS (administrateur uniquement).
 */
const schema = z.object({
  id: z.string().uuid(),
  status: z.enum(["a_valider", "valide", "envoye", "repondu", "pas_interesse"]).optional(),
  notes: z.string().max(2000).optional(),
});

export async function updateProspect(input: { id: string; status?: string; notes?: string }): Promise<ActionState> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: "Données invalides." };

  const { supabase, user } = await getUser();
  if (!user) return { error: "Session expirée. Reconnectez-vous." };

  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (isAdmin !== true) return { error: "Accès réservé à l'administrateur." };

  const { id, ...changes } = parsed.data;
  if (Object.keys(changes).length === 0) return { ok: true };

  const { error } = await supabase.from("prospects").update(changes).eq("id", id);
  if (error) return { error: "Enregistrement impossible. Réessayez." };

  revalidatePath("/prospection");
  return { ok: true, message: "Enregistré" };
}
