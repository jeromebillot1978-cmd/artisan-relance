"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUser } from "@/lib/supabase/server";

export type MessageActionState = { ok?: boolean; error?: string; id?: string };

const sendSchema = z
  .object({
    campaignId: z.string().uuid(),
    body: z.string().trim().max(5000, "Message trop long (5 000 caractères maximum)."),
    files: z
      .array(z.object({ path: z.string().min(1).max(400), name: z.string().trim().min(1).max(200) }))
      .max(5, "5 pièces jointes maximum."),
  })
  .refine((v) => v.body.length >= 2 || v.files.length > 0, { message: "Écrivez votre message ou joignez un fichier." });

/** Réponse de l'artisan écrite dans le dossier : mise en file, envoyée aussitôt par le mailer. */
export async function sendCampaignMessage(
  campaignId: string,
  body: string,
  files: { path: string; name: string }[] = [],
): Promise<MessageActionState> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Session expirée. Reconnectez-vous." };
  const parsed = sendSchema.safeParse({ campaignId, body, files });
  if (parsed.success && parsed.data.files.some((f) => !f.path.startsWith(`${user.id}/out/`))) return { error: "Pièce jointe invalide." };
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Message invalide." };

  const { data, error } = await supabase.rpc("send_campaign_message", {
    p_campaign_id: parsed.data.campaignId,
    p_body: parsed.data.body,
    p_files: parsed.data.files,
  });
  if (error) {
    const known = /introuvable|requis|trop long|pas encore|STOP|indésirables|Limite|Pièce|maximum/i.test(error.message);
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
