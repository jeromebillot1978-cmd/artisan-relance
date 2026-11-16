"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUser } from "@/lib/supabase/server";
import { requestInitialSend } from "@/lib/mailer";
import { emailIssue } from "@/lib/email-check";
import { ATTACHMENT_RULES } from "@/lib/campaigns/constants";
import { campaignSchema, strategySchema, type CampaignInput, type StrategyFormInput } from "@/lib/campaigns/schema";
import type { CampaignListItem } from "@/types/database";

export type CampaignActionState = {
  ok?: boolean;
  campaign?: CampaignListItem;
  error?: string;
  message?: string;
  id?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

function revalidateAll(id?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/devis");
  if (id) revalidatePath(`/devis/${id}`);
}

function dbMessage(message?: string) {
  if (message && /Relances impossibles|adresse technique|Limite|invalide|futur|introuvable|clôturée|suspendue|pas encore|Aucun envoi|maximum|déjà|requis/i.test(message)) {
    return message.replace(/^.*?: /, "");
  }
  return "Une erreur est survenue. Réessayez.";
}

export async function createCampaign(input: CampaignInput): Promise<CampaignActionState> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Session expirée. Reconnectez-vous." };

  const parsed = campaignSchema.safeParse(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return { error: flat.formErrors[0] ?? "Vérifiez les champs.", fieldErrors: flat.fieldErrors };
  }
  const v = parsed.data;
  if (v.expectedUserId && v.expectedUserId !== user.id) {
    return { error: "Vous avez changé de compte dans un autre onglet. Rechargez la page avant d'envoyer ce devis." };
  }

  // Double clic / double soumission : on renvoie la campagne déjà créée
  const { data: existing } = await supabase
    .from("campaigns")
    .select("id")
    .eq("idempotency_key", v.idempotencyKey)
    .maybeSingle();
  if (existing) return { ok: true, id: existing.id, message: "Ce devis a déjà été enregistré." };

  // Garde-fou de coût : vérifie le budget d'envoi du jour avant d'accepter
  if (v.sendInitial) {
    const { data: budget } = await supabase.rpc("my_send_budget").single<{
      user_remaining: number;
      global_remaining: number;
      user_limit: number;
      paused: boolean;
    }>();
    const needed = v.recipients.length + 1; // + la copie envoyée à l'artisan
    if (budget?.paused) {
      return { error: "Les envois sont momentanément suspendus suite à des erreurs. Réessayez dans une heure." };
    }
    if (budget && (budget.user_remaining < needed || budget.global_remaining < needed)) {
      return {
        error: `Limite d'envoi du jour atteinte (${budget.user_limit} e-mails par jour). Réessayez demain, ou choisissez « Je l'ai déjà envoyé ».`,
      };
    }
  }

  // Pièces jointes : elles doivent exister dans le dossier de cet envoi
  const folder = `${user.id}/${v.idempotencyKey}`;
  const files: { path: string; name: string; size: number; mime: string }[] = [];
  if (v.attachments.length) {
    const { data: listed, error } = await supabase.storage.from("devis").list(folder, { limit: 100 });
    if (error) return { error: "Impossible de vérifier les pièces jointes." };
    for (const a of v.attachments) {
      if (!a.path.startsWith(`${folder}/`)) return { error: "Pièce jointe invalide." };
      const meta = listed?.find((o) => `${folder}/${o.name}` === a.path);
      if (!meta) return { error: `Fichier introuvable : ${a.name}. Ajoutez-le à nouveau.` };
      const size = Number(meta.metadata?.size ?? 0);
      const mime = String(meta.metadata?.mimetype ?? "");
      if (!ATTACHMENT_RULES.accept[mime]) return { error: `Format non accepté : ${a.name}` };
      if (size <= 0 || size > ATTACHMENT_RULES.maxFileBytes) return { error: `Fichier trop lourd : ${a.name} (10 Mo max).` };
      files.push({ path: a.path, name: a.name, size, mime });
    }
    const total = files.reduce((s, f) => s + f.size, 0);
    if (total > ATTACHMENT_RULES.maxTotalBytes) return { error: "Pièces jointes trop lourdes : 20 Mo au total maximum." };
  }

  const s = v.strategy;
  const { data: created, error: insertError } = await supabase
    .from("campaigns")
    .insert({
      user_id: user.id,
      idempotency_key: v.idempotencyKey,
      reference: v.reference,
      prospect_name: v.prospectName,
      recipients: v.recipients,
      subject: v.subject,
      message: v.message,
      followup_message: v.followupMessage,
      amount: v.amount,
      client_phone: v.clientPhone,
      notes: v.notes,
      send_initial: v.sendInitial,
      initial_sent_at: v.sendInitial ? null : v.initialSentAt,
      followup_enabled: s.followupEnabled,
      interval_days: s.intervalDays,
      max_followups: s.maxFollowups,
      end_date: s.endMode === "date" ? s.endDate : null,
      max_days: s.endMode === "days" ? s.maxDays : null,
      attach_on_followups: s.attachOnFollowups,
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: again } = await supabase.from("campaigns").select("id").eq("idempotency_key", v.idempotencyKey).maybeSingle();
      if (again) return { ok: true, id: again.id, message: "Ce devis a déjà été enregistré." };
    }
    return { error: dbMessage(insertError.message) };
  }

  if (files.length) {
    const { error } = await supabase.from("campaign_attachments").insert(
      files.map((f) => ({
        campaign_id: created.id,
        user_id: user.id,
        storage_path: f.path,
        file_name: f.name,
        mime_type: f.mime,
        size_bytes: f.size,
      })),
    );
    if (error) {
      await supabase.from("campaigns").delete().eq("id", created.id);
      return { error: "Impossible d'enregistrer les pièces jointes." };
    }
  }

  revalidateAll(created.id);

  if (!v.sendInitial) {
    return { ok: true, id: created.id, message: "Devis enregistré, relances programmées." };
  }

  const outcome = await requestInitialSend(supabase, created.id);
  revalidateAll(created.id);
  if (outcome === "sent") return { ok: true, id: created.id, message: "Devis envoyé ! Les relances sont programmées." };
  if (outcome === "failed") {
    return { ok: true, id: created.id, message: "L'envoi a échoué. Un nouvel essai sera fait automatiquement." };
  }
  return { ok: true, id: created.id, message: "Envoi en cours : il sera confirmé dans quelques minutes." };
}

const actionSchema = z.enum([
  "pause", "resume", "stop", "won", "lost", "replied", "reopen", "retry_initial",
  "complete", "stop_followups", "resume_followups",
]);

const ACTION_MESSAGES: Record<z.infer<typeof actionSchema>, string> = {
  pause: "Campagne suspendue.",
  resume: "Campagne reprise, relances reprogrammées.",
  stop: "Campagne arrêtée définitivement.",
  won: "Bravo ! Dossier gagné, relances arrêtées.",
  lost: "Dossier marqué perdu, relances arrêtées.",
  replied: "Réponse enregistrée, relances arrêtées.",
  reopen: "Dossier rouvert (en pause). Reprenez la campagne quand vous voulez.",
  retry_initial: "Nouvel essai d'envoi lancé.",
  complete: "Devis marqué terminé : plus aucune relance.",
  stop_followups: "Relances arrêtées.",
  resume_followups: "Relances reprises : prochaine date recalculée.",
};

export async function campaignAction(id: string, action: string): Promise<CampaignActionState> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Session expirée. Reconnectez-vous." };
  const a = actionSchema.safeParse(action);
  if (!a.success || !z.string().uuid().safeParse(id).success) return { error: "Action invalide." };

  const { error } = await supabase.rpc("campaign_action", { p_id: id, p_action: a.data });
  if (error) return { error: dbMessage(error.message) };

  if (a.data === "retry_initial") {
    const outcome = await requestInitialSend(supabase, id);
    revalidateAll(id);
    return outcome === "sent"
      ? { ok: true, message: "Devis envoyé !" }
      : { ok: true, message: "Nouvel essai programmé." };
  }

  revalidateAll(id);
  return { ok: true, message: ACTION_MESSAGES[a.data], campaign: await freshCampaign(supabase, id) };
}

/** Ligne à jour (statut, prochaine relance…) renvoyée au tableau après une action. */
async function freshCampaign(supabase: Awaited<ReturnType<typeof getUser>>["supabase"], id: string) {
  const { data } = await supabase
    .from("campaigns")
    .select("*, campaign_attachments(count)")
    .eq("id", id)
    .maybeSingle<CampaignListItem>();
  return data ?? undefined;
}

const detailsSchema = z.object({
  prospectName: z.string().trim().min(2, "Nom du client requis.").max(120),
  recipients: z
    .array(
      z
        .string()
        .trim()
        .toLowerCase()
        .email("Adresse e-mail invalide.")
        .superRefine((value, ctx) => {
          const issue = emailIssue(value);
          if (issue) ctx.addIssue({ code: "custom", message: issue });
        }),
    )
    .min(1, "Au moins un destinataire.")
    .max(5),
  reference: z.string().trim().max(50),
  amount: z.number().min(0).max(10_000_000),
  clientPhone: z.string().trim().max(30),
  notes: z.string().trim().max(1000),
});

export async function updateCampaignDetails(id: string, input: z.input<typeof detailsSchema>): Promise<CampaignActionState> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Session expirée. Reconnectez-vous." };
  if (!z.string().uuid().safeParse(id).success) return { error: "Devis invalide." };
  const parsed = detailsSchema.safeParse(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return { error: Object.values(flat.fieldErrors).flat()[0] ?? "Vérifiez les champs.", fieldErrors: flat.fieldErrors };
  }
  const v = parsed.data;
  const { error } = await supabase.rpc("campaign_update_details", {
    p_id: id,
    p_prospect_name: v.prospectName,
    p_recipients: v.recipients,
    p_reference: v.reference,
    p_amount: v.amount,
    p_client_phone: v.clientPhone,
    p_notes: v.notes,
  });
  if (error) return { error: dbMessage(error.message) };
  revalidateAll(id);
  return { ok: true, message: "Devis modifié.", campaign: await freshCampaign(supabase, id) };
}

export async function updateStrategy(id: string, input: StrategyFormInput): Promise<CampaignActionState> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Session expirée. Reconnectez-vous." };
  const parsed = strategySchema.safeParse(input);
  if (!parsed.success) return { error: "Vérifiez la stratégie.", fieldErrors: parsed.error.flatten().fieldErrors };
  const s = parsed.data;

  const { error } = await supabase.rpc("campaign_update_strategy", {
    p_id: id,
    p_followup_enabled: s.followupEnabled,
    p_interval_days: s.intervalDays,
    p_max_followups: s.maxFollowups,
    p_end_date: s.endMode === "date" ? s.endDate : null,
    p_max_days: s.endMode === "days" ? s.maxDays : null,
    p_attach_on_followups: s.attachOnFollowups,
  });
  if (error) return { error: dbMessage(error.message) };
  revalidateAll(id);
  return { ok: true, message: "Stratégie mise à jour." };
}

export async function deleteCampaign(id: string): Promise<CampaignActionState> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Session expirée. Reconnectez-vous." };

  const { data: files } = await supabase.from("campaign_attachments").select("storage_path").eq("campaign_id", id);
  const { error } = await supabase.from("campaigns").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: "Impossible de supprimer ce dossier." };
  if (files?.length) await supabase.storage.from("devis").remove(files.map((f) => f.storage_path));

  revalidateAll();
  return { ok: true, message: "Dossier supprimé." };
}

/** Supprime un fichier téléversé mais pas encore rattaché à un devis. */
export async function discardUpload(path: string): Promise<CampaignActionState> {
  const { supabase, user } = await getUser();
  if (!user || !path.startsWith(`${user.id}/`)) return { error: "Non autorisé." };
  await supabase.storage.from("devis").remove([path]);
  return { ok: true };
}
