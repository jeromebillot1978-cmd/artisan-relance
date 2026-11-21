"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUser } from "@/lib/supabase/server";
import { cleanLinks } from "@/lib/prospect-links";

/**
 * Actions de prospection. Chaque action appelle UNE fonction de base de données,
 * qui vérifie les règles métier et écrit le journal. L'application n'écrit plus
 * jamais directement dans les tables (la base le refuse).
 * Seule sendProspectEmail envoie un e-mail (Gmail SMTP, côté serveur).
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

/** Journal structuré (Vercel > Logs), un objet JSON par étape de l'envoi. */
function sendLog(event: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ scope: "prospection_envoi", event, ...data, at: new Date().toISOString() }));
}

/**
 * « Valider et envoyer » : UN clic, tout le reste côté serveur.
 *   1. la base valide le texte et réserve l'envoi (tentative « ouverte », jeton de copie cachée) ;
 *   2. le HTML est construit avec des liens directs, puis contrôlé (aucune redirection) ;
 *   3. Gmail SMTP envoie l'e-mail (copie cachée vers l'adresse de preuve) ;
 *   4. la base enregistre le résultat réel : « envoyée » (Message-ID, réponse SMTP, href) ou « échec » ;
 *   5. la copie cachée, en arrivant, fait passer la tentative à « prouvée ».
 */
export async function sendProspectEmail(id: string, v: number): Promise<ProspectActionResult> {
  const { smtpConfigured, sendProspectSmtp, explainSmtpError, prospectReplyAddress } = await import("@/lib/prospect-smtp");
  const { buildProspectEmail, assertDirectLinks } = await import("@/lib/prospect-email");
  const { proofAddress } = await import("@/lib/prospects");
  if (!smtpConfigured()) {
    sendLog("config_manquante", { prospect_id: id });
    return {
      ok: false,
      error: "Envoi automatique pas encore configuré : ajoutez PROSPECTION_SMTP_PASSWORD (mot de passe d'application Gmail) dans Vercel. Rien n'a été envoyé.",
    };
  }
  const { supabase, user } = await getUser();
  if (!user) return { ok: false, error: "Session expirée. Reconnectez-vous." };

  // 1. Réservation (la base vérifie STOP, archivage, doublon 24 h, plafond quotidien, double clic)
  const begin = await supabase.rpc("prospect_server_send_begin", { p_id: uuid.parse(id), p_version: version.parse(v) });
  if (begin.error) {
    sendLog("reservation_refusee", { prospect_id: id, code: begin.error.code, erreur: begin.error.message });
    const readable = ["P0001", "40001", "42501", "P0002"].includes(begin.error.code ?? "");
    return { ok: false, conflict: begin.error.code === "40001", error: readable ? begin.error.message : "Envoi impossible pour le moment. Rien n'a été envoyé." };
  }
  const row = (begin.data as { attempt_id: string; bcc_token: string; to_address: string; subject: string; message: string }[] | null)?.[0];
  if (!row) return { ok: false, error: "Réservation de l'envoi non confirmée. Rien n'a été envoyé." };

  const report = (ok: boolean, extra: { messageId?: string | null; response?: string | null; error?: string | null; hrefs?: string[] | null; ms?: number | null }) =>
    supabase.rpc("prospect_server_send_result", {
      p_attempt_id: row.attempt_id, p_ok: ok, p_message_id: extra.messageId ?? null, p_response: extra.response ?? null,
      p_error: extra.error ?? null, p_sent_hrefs: extra.hrefs ?? null, p_duration_ms: extra.ms ?? null,
    });

  // 2. HTML à liens directs, contrôlé AVANT l'envoi
  let mail: ReturnType<typeof buildProspectEmail>;
  let hrefs: string[];
  try {
    mail = buildProspectEmail(row.subject, row.message);
    hrefs = assertDirectLinks(mail.html);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    sendLog("controle_liens_echec", { attempt_id: row.attempt_id, erreur: msg });
    await report(false, { error: msg });
    revalidatePath("/prospection");
    return { ok: false, error: `Envoi bloqué : ${msg}` };
  }
  const bcc = proofAddress(row.bcc_token);
  const { data: tok } = await supabase.from("prospects").select("reply_token").eq("id", id).maybeSingle();
  if (!tok?.reply_token) {
    await report(false, { error: "Adresse de réponse introuvable" });
    revalidatePath("/prospection");
    return { ok: false, error: "Adresse de réponse introuvable. Rien n'a été envoyé." };
  }
  const replyTo = prospectReplyAddress(tok.reply_token);
  sendLog("envoi_debut", { attempt_id: row.attempt_id, prospect_id: id, destinataire: row.to_address, liens_html: hrefs, taille_html: mail.html.length });

  // 3. Envoi SMTP
  try {
    const r = await sendProspectSmtp({ to: row.to_address, bcc, replyTo, subject: mail.subject, html: mail.html, text: mail.text, ref: row.attempt_id });
    if (r.rejected.length && !r.accepted.includes(row.to_address)) throw Object.assign(new Error(`Destinataire refusé : ${r.rejected.join(", ")}`), { response: r.response });
    sendLog("envoi_accepte", { attempt_id: row.attempt_id, message_id: r.messageId, reponse_smtp: r.response, acceptes: r.accepted, refuses: r.rejected, duree_ms: r.durationMs, liens_html: hrefs });
    // 4. Résultat réel en base
    const res = await report(true, { messageId: r.messageId, response: r.response, hrefs, ms: r.durationMs });
    if (res.error) {
      // L'e-mail EST parti : on ne le cache pas. La copie cachée le prouvera de toute façon.
      sendLog("enregistrement_resultat_echec", { attempt_id: row.attempt_id, erreur: res.error.message });
      revalidatePath("/prospection");
      return { ok: true, data: { warning: "E-mail envoyé, mais l'enregistrement a échoué. La preuve par copie cachée le confirmera." } };
    }
    revalidatePath("/prospection");
    return { ok: true, data: { messageId: r.messageId } };
  } catch (e) {
    const { message, response } = explainSmtpError(e);
    sendLog("envoi_echec", { attempt_id: row.attempt_id, erreur: message, reponse_smtp: response, brut: e instanceof Error ? e.message : String(e) });
    await report(false, { error: message, response, hrefs });
    revalidatePath("/prospection");
    return { ok: false, error: message };
  }
}

/**
 * Répondre à un prospect depuis le site (comme « Répondre » dans un dossier de devis).
 * Même fil chez le destinataire (Re: + In-Reply-To), même adresse de réponse, envoi par Gmail SMTP.
 */
export async function replyToProspect(id: string, body: string): Promise<ProspectActionResult> {
  const { smtpConfigured, sendProspectSmtp, explainSmtpError, prospectReplyAddress } = await import("@/lib/prospect-smtp");
  const { buildProspectEmail, assertDirectLinks } = await import("@/lib/prospect-email");
  if (!smtpConfigured()) return { ok: false, error: "Envoi automatique pas encore configuré (PROSPECTION_SMTP_PASSWORD manquant). Rien n'a été envoyé." };
  const { supabase, user } = await getUser();
  if (!user) return { ok: false, error: "Session expirée. Reconnectez-vous." };
  const text = z.string().trim().min(2, "Écrivez votre message.").max(5000).parse(body);
  const begin = await supabase.rpc("prospect_reply_begin", { p_id: uuid.parse(id), p_body: text });
  if (begin.error) {
    sendLog("reponse_refusee", { prospect_id: id, code: begin.error.code, erreur: begin.error.message });
    return { ok: false, error: begin.error.code === "P0001" || begin.error.code === "P0002" ? begin.error.message : "Envoi impossible pour le moment." };
  }
  const row = (begin.data as { message_id: string; to_address: string; subject: string; in_reply_to: string | null; reply_token: string }[] | null)?.[0];
  if (!row) return { ok: false, error: "Envoi non confirmé. Rien n'a été envoyé." };
  const result = (ok: boolean, x: { mid?: string | null; resp?: string | null; err?: string | null }) =>
    supabase.rpc("prospect_reply_result", { p_message_id: row.message_id, p_ok: ok, p_smtp_message_id: x.mid ?? null, p_response: x.resp ?? null, p_error: x.err ?? null });
  try {
    const mail = buildProspectEmail(row.subject, text);
    const hrefs = assertDirectLinks(mail.html);
    sendLog("reponse_debut", { message_id: row.message_id, prospect_id: id, destinataire: row.to_address, liens_html: hrefs, en_reponse_a: row.in_reply_to });
    const r = await sendProspectSmtp({
      to: row.to_address, replyTo: prospectReplyAddress(row.reply_token), inReplyTo: row.in_reply_to,
      subject: mail.subject, html: mail.html, text: mail.text, ref: row.message_id,
    });
    sendLog("reponse_acceptee", { message_id: row.message_id, smtp_message_id: r.messageId, reponse_smtp: r.response, duree_ms: r.durationMs });
    await result(true, { mid: r.messageId, resp: r.response });
    revalidatePath("/prospection");
    return { ok: true };
  } catch (e) {
    const { message, response } = explainSmtpError(e);
    sendLog("reponse_echec", { message_id: row.message_id, erreur: message, reponse_smtp: response });
    await result(false, { err: message, resp: response });
    revalidatePath("/prospection");
    return { ok: false, error: message };
  }
}

/** Réponses du prospect marquées comme lues (ouverture de la conversation). */
export async function markProspectRead(id: string) {
  return call("prospect_mark_read", { p_id: uuid.parse(id) });
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
  // Liens propres dès l'enregistrement : jamais de redirection Google, adresses officielles exactes
  message: z.string().trim().min(1, "Le message est vide").max(5000).transform(cleanLinks),
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
