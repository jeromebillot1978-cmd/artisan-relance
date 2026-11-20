"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUser } from "@/lib/supabase/server";

/**
 * Actions de prospection. Chaque action appelle UNE fonction de base de données,
 * qui vérifie les règles métier et écrit le journal. L'application n'écrit plus
 * jamais directement dans les tables (la base le refuse).
 * Aucune de ces actions n'envoie quoi que ce soit.
 */

export type ProspectActionResult = { ok: true; data?: unknown } | { ok: false; error: string; conflict?: boolean };

const uuid = z.string().uuid();
const version = z.number().int().positive();

async function call(fn: string, args: Record<string, unknown>): Promise<ProspectActionResult> {
  const { supabase, user } = await getUser();
  if (!user) return { ok: false, error: "Session expirée. Reconnectez-vous." };
  const { data, error } = await supabase.rpc(fn, args);
  if (error) {
    // Les fonctions renvoient des messages clairs en français (code P0001) : on les affiche tels quels.
    console.error(`prospect action ${fn}`, error.code, error.message);
    const readable = error.code === "P0001" || error.code === "40001" || error.code === "42501" || error.code === "P0002";
    return {
      ok: false,
      conflict: error.code === "40001",
      error: readable ? error.message : "Action impossible pour le moment. Rien n'a été enregistré.",
    };
  }
  revalidatePath("/prospection");
  return { ok: true, data };
}

export async function approveMessage(id: string, v: number) {
  return call("prospect_approve", { p_id: uuid.parse(id), p_version: version.parse(v) });
}

export async function startAttempt(id: string, channel: "email" | "formulaire" | "telephone", v: number) {
  return call("prospect_start_attempt", {
    p_id: uuid.parse(id),
    p_channel: z.enum(["email", "formulaire", "telephone"]).parse(channel),
    p_version: version.parse(v),
  });
}

export async function declareAttempt(attemptId: string, confirmations: string[], callOutcome?: string) {
  return call("prospect_declare_attempt", {
    p_attempt_id: uuid.parse(attemptId),
    p_confirmations: z.array(z.string().max(40)).max(10).parse(confirmations),
    p_call_outcome: callOutcome ? z.enum(["joint", "messagerie", "pas_de_reponse", "faux_numero", "a_rappeler"]).parse(callOutcome) : null,
  });
}

export async function cancelAttempt(attemptId: string, reason: string) {
  return call("prospect_cancel_attempt", { p_attempt_id: uuid.parse(attemptId), p_reason: z.string().trim().min(3).max(500).parse(reason) });
}

export async function failAttempt(attemptId: string, reason: string) {
  return call("prospect_fail_attempt", { p_attempt_id: uuid.parse(attemptId), p_reason: z.string().trim().min(3).max(500).parse(reason) });
}

export async function recordReply(id: string, kind: "positive" | "question" | "negative" | "stop", note: string, v: number) {
  return call("prospect_record_reply", {
    p_id: uuid.parse(id),
    p_kind: z.enum(["positive", "question", "negative", "stop"]).parse(kind),
    p_note: z.string().max(1000).parse(note),
    p_version: version.parse(v),
  });
}

export async function doNotContact(id: string, reason: string, v: number) {
  return call("prospect_do_not_contact", { p_id: uuid.parse(id), p_reason: z.string().trim().min(3).max(500).parse(reason), p_version: version.parse(v) });
}

export async function updateNotes(id: string, notes: string, v: number) {
  return call("prospect_update_notes", { p_id: uuid.parse(id), p_notes: z.string().max(2000).parse(notes), p_version: version.parse(v) });
}

export async function archiveProspect(id: string, archive: boolean, v: number) {
  return call("prospect_archive", { p_id: uuid.parse(id), p_archive: archive, p_version: version.parse(v) });
}

/** Niveau 2 : le brouillon (ou le site, ou le numéro) a été ouvert depuis la page. Ne déclare RIEN. */
export async function markDraftOpened(
  attemptId: string,
  method: "gmail_web" | "gmail_app_android" | "gmail_app_ios" | "mailto" | "copie" | "site_ouvert" | "numero_compose" | "manuel",
) {
  return call("prospect_mark_draft_opened", {
    p_attempt_id: uuid.parse(attemptId),
    p_method: z.enum(["gmail_web", "gmail_app_android", "gmail_app_ios", "mailto", "copie", "site_ouvert", "numero_compose", "manuel"]).parse(method),
  });
}

const optText = (max: number) => z.string().trim().max(max).optional().default("");
const optDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable()
  .optional()
  .transform((v) => v ?? null);

const contentSchema = z.object({
  website: optText(300).refine((v) => !v || /^https?:\/\//i.test(v), "Le site doit commencer par http:// ou https://"),
  email: optText(200).refine((v) => !v || z.string().email().safeParse(v).success, "Adresse e-mail invalide"),
  phone: optText(100),
  subject: optText(200),
  message: z.string().trim().min(1, "Le message est vide").max(5000),
  caution: optText(500),
  source_label: optText(200),
  source_url: optText(500).refine((v) => !v || /^https?:\/\//i.test(v), "Le lien de la source doit commencer par http:// ou https://"),
  source_checked_at: optDate,
});
const createSchema = contentSchema.extend({
  company: z.string().trim().min(1, "Entreprise obligatoire").max(200),
  city: z.string().trim().min(1, "Ville obligatoire").max(200),
  trade: z.string().trim().min(1, "Métier obligatoire").max(200),
  channel: z.enum(["email", "formulaire", "telephone"]),
  why: optText(2000),
  findings: optText(2000),
});
export type ProspectContentInput = z.input<typeof contentSchema>;
export type ProspectCreateInput = z.input<typeof createSchema>;

function invalid(e: z.ZodError): ProspectActionResult {
  return { ok: false, error: e.issues[0]?.message ?? "Saisie invalide." };
}

export async function createProspect(input: ProspectCreateInput) {
  const r = createSchema.safeParse(input);
  if (!r.success) return invalid(r.error);
  const v = r.data;
  return call("prospect_create", {
    p_company: v.company, p_city: v.city, p_trade: v.trade, p_website: v.website, p_email: v.email, p_phone: v.phone,
    p_channel: v.channel, p_why: v.why, p_findings: v.findings, p_subject: v.subject, p_message: v.message, p_caution: v.caution,
    p_source_label: v.source_label, p_source_url: v.source_url, p_source_checked_at: v.source_checked_at,
  });
}

/** Modifier la fiche. Si le texte change, la base retire la validation : il faudra relire (M9). */
export async function updateProspectContent(id: string, v0: number, input: ProspectContentInput) {
  const r = contentSchema.safeParse(input);
  if (!r.success) return invalid(r.error);
  const v = r.data;
  return call("prospect_update_content", {
    p_id: uuid.parse(id), p_version: version.parse(v0), p_website: v.website, p_email: v.email, p_phone: v.phone,
    p_subject: v.subject, p_message: v.message, p_caution: v.caution,
    p_source_label: v.source_label, p_source_url: v.source_url, p_source_checked_at: v.source_checked_at,
  });
}

export async function setNextAction(id: string, date: string | null, v: number) {
  return call("prospect_set_next_action", { p_id: uuid.parse(id), p_date: optDate.parse(date), p_version: version.parse(v) });
}

/** Effacement définitif (demande RGPD). Il faut retaper le nom exact de l'entreprise. */
export async function eraseProspect(id: string, confirmCompany: string) {
  return call("prospect_erase", { p_id: uuid.parse(id), p_confirm_company: z.string().max(200).parse(confirmCompany) });
}
