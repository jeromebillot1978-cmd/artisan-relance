"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUser } from "@/lib/supabase/server";
import { isGoogleReviewUrl } from "@/lib/reviews";
import { REVIEW_LINK_TOKEN } from "@/supabase/functions/_shared/templates";

export type ReviewActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

function revalidateReviews(campaignId?: string | null) {
  revalidatePath("/avis-google");
  revalidatePath("/dashboard");
  revalidatePath("/parametres");
  if (campaignId) revalidatePath(`/devis/${campaignId}`);
}

/** Messages de la base affichables tels quels ; le reste est générique. */
function dbMessage(message?: string) {
  if (
    message &&
    /introuvable|Ajoutez|déjà|Marquez|en cours|désinscrit|attente|échec|Action inconnue|pas encore|autre demande/i.test(message)
  ) {
    return message.replace(/^.*?: /, "");
  }
  return "Une erreur est survenue. Réessayez.";
}

const settingsSchema = z.object({
  googleReviewUrl: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || isGoogleReviewUrl(v), "Collez le lien d'avis fourni par Google (https://g.page/… ou https://search.google.com/…)."),
  companyName: z.string().trim().max(120),
  templateKey: z.enum(["professionnel", "court", "chaleureux", "personnalise"]),
  subject: z.string().trim().min(1, "Objet requis.").max(200),
  body: z
    .string()
    .trim()
    .min(20, "Message trop court.")
    .max(3000)
    .refine((v) => v.includes(REVIEW_LINK_TOKEN), `Le message doit contenir ${REVIEW_LINK_TOKEN}.`),
  autoOnWon: z.boolean(),
  wonDelayDays: z.number().int().min(0, "0 à 90 jours.").max(90, "0 à 90 jours."),
  autoOnCompleted: z.boolean(),
  completedDelayDays: z.number().int().min(0, "0 à 90 jours.").max(90, "0 à 90 jours."),
});

export type ReviewSettingsInput = z.input<typeof settingsSchema>;

export async function saveReviewSettings(input: ReviewSettingsInput): Promise<ReviewActionState> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Session expirée. Reconnectez-vous." };

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Vérifiez les champs.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const v = parsed.data;
  if ((v.autoOnWon || v.autoOnCompleted) && !v.googleReviewUrl) {
    return {
      error: "Ajoutez votre lien Google Avis pour activer l'envoi automatique.",
      fieldErrors: { googleReviewUrl: ["Requis pour l'envoi automatique."] },
    };
  }

  const row = {
    google_review_url: v.googleReviewUrl || null,
    company_name: v.companyName || null,
    template_key: v.templateKey,
    subject: v.subject,
    body: v.body,
    auto_on_won: v.autoOnWon,
    won_delay_days: v.wonDelayDays,
    auto_on_completed: v.autoOnCompleted,
    completed_delay_days: v.completedDelayDays,
  };

  const { data: existing } = await supabase.from("review_settings").select("user_id").eq("user_id", user.id).maybeSingle();
  const { error } = existing
    ? await supabase.from("review_settings").update(row).eq("user_id", user.id)
    : await supabase.from("review_settings").insert({ user_id: user.id, ...row });
  if (error) {
    console.error("review_settings", error.message);
    return { error: "Impossible d'enregistrer les réglages." };
  }

  revalidateReviews();
  return { ok: true, message: "Réglages Avis Google enregistrés." };
}

/** Bouton « Demander un avis Google » : envoi immédiat pour un dossier Gagné ou Terminé. */
export async function requestReview(campaignId: string): Promise<ReviewActionState> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Session expirée. Reconnectez-vous." };
  if (!z.string().uuid().safeParse(campaignId).success) return { error: "Devis invalide." };

  const { data: id, error } = await supabase.rpc("review_request_now", { p_campaign_id: campaignId });
  if (error) return { error: dbMessage(error.message) };

  // L'Edge Function est réveillée par la base ; on attend brièvement le résultat.
  let status = "scheduled";
  for (let i = 0; i < 8 && (status === "scheduled" || status === "processing"); i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const { data } = await supabase.from("review_requests").select("status").eq("id", id).maybeSingle<{ status: string }>();
    status = data?.status ?? status;
  }

  revalidateReviews(campaignId);
  if (status === "sent") return { ok: true, message: "Demande d'avis envoyée !" };
  if (status === "failed") return { error: "L'envoi a échoué. Détail dans Avis Google." };
  return { ok: true, message: "Demande d'avis en cours d'envoi (quelques minutes au plus)." };
}

const ACTIONS = {
  send_now: "Envoi lancé.",
  cancel: "Demande annulée.",
  retry: "Nouvel essai lancé.",
  mark_received: "Avis marqué comme reçu. Merci !",
  unmark_received: "Avis remis en « non confirmé ».",
} as const;

export type ReviewRowAction = keyof typeof ACTIONS;

export async function reviewRequestAction(id: string, action: ReviewRowAction): Promise<ReviewActionState> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Session expirée. Reconnectez-vous." };
  if (!z.string().uuid().safeParse(id).success || !(action in ACTIONS)) return { error: "Action invalide." };

  const { error } = await supabase.rpc("review_request_action", { p_id: id, p_action: action });
  if (error) return { error: dbMessage(error.message) };

  const { data } = await supabase.from("review_requests").select("campaign_id").eq("id", id).maybeSingle<{ campaign_id: string | null }>();
  revalidateReviews(data?.campaign_id);
  return { ok: true, message: ACTIONS[action] };
}
