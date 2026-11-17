"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUser } from "@/lib/supabase/server";

export type MessageActionState = { ok?: boolean; error?: string; id?: string };

const sendSchema = z.object({
  campaignId: z.string().uuid(),
  body: z
    .string()
    .trim()
    .min(2, "Écrivez votre message.")
    .max(5000, "Message trop long (5 000 caractères maximum)."),
});

/** Réponse de l'artisan écrite dans le dossier : mise en file, envoyée aussitôt par le mailer. */
export async function sendCampaignMessage(campaignId: string, body: string): Promise<MessageActionState> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Session expirée. Reconnectez-vous." };
  const parsed = sendSchema.safeParse({ campaignId, body });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Message invalide." };

  const { data, error } = await supabase.rpc("send_campaign_message", {
    p_campaign_id: parsed.data.campaignId,
    p_body: parsed.data.body,
  });
  if (error) {
    const known = /introuvable|requis|trop long|pas encore|STOP|indésirables|Limite/i.test(error.message);
    return { error: known ? error.message : "Envoi impossible pour le moment. Réessayez." };
  }
  revalidatePath(`/devis/${parsed.data.campaignId}`);
  return { ok: true, id: String(data) };
}

/** Marque les réponses du client comme lues (ouverture du dossier). */
export async function markCampaignMessagesRead(campaignId: string): Promise<MessageActionState> {
  const { supabase, user } = await getUser();
  if (!user || !z.string().uuid().safeParse(campaignId).success) return { ok: false };
  const { data } = await supabase.rpc("mark_campaign_messages_read", { p_campaign_id: campaignId });
  if (Number(data ?? 0) > 0) {
    revalidatePath("/devis");
    revalidatePath("/dashboard");
  }
  return { ok: true };
}
