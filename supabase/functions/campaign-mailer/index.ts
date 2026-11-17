// =====================================================================
// Edge Function « campaign-mailer »
//  - mode "initial" : envoie le devis d'une campagne (appelé par l'appli)
//  - mode "due"     : envoie toutes les relances arrivées à échéance
//                     (appelé toutes les 15 min par pg_cron, + Vercel Cron)
//  - mode "reviews"  : envoie les demandes d'avis Google arrivées à échéance
//                     (appelé par la base au clic sur « Demander un avis » ;
//                     le mode "due" les traite aussi toutes les 15 min)
//  - mode "message" : envoie une réponse écrite par l'artisan dans le site
//                     (appelé par la base ; les envois manqués sont repris
//                     par le mode "due")
//  - mode "maintenance" : purge des pièces jointes expirées et orphelines,
//                     et de l'historique des avis au-delà de la durée de
//                     conservation (appelé chaque nuit par pg_cron)
// Garde-fous de coût : plafonds quotidiens global et par artisan, et
// disjoncteur sur les échecs, appliqués en base au moment de la réservation.
// Sécurité : en-tête x-cron-secret obligatoire.
// Anti-doublon : réservation SQL (FOR UPDATE SKIP LOCKED + clé unique
// campagne/numéro) + clé d'idempotence Resend par envoi.
// =====================================================================
import { admin, json, log } from "../_shared/admin.ts";
import { getSentMessageId, senderName, sendEmail, type OutgoingAttachment } from "../_shared/resend.ts";
import { fillVariables, followupSubject, renderProspectEmail, renderReviewEmail, replySubject } from "../_shared/templates.ts";

const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") ?? "";
const INBOUND_DOMAIN = Deno.env.get("INBOUND_DOMAIN") ?? ""; // ex. reponses.jercat.fr (optionnel)
const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://artisan-relance.jercat.fr").replace(/\/$/, "");
const PAUSE_MS = 150; // limite Resend : 10 requêtes / seconde

interface Job {
  send_id: string;
  sequence: number;
  kind: "initial" | "followup";
  attempts: number;
  campaign_id: string;
  user_id: string;
  reference: string | null;
  prospect_name: string;
  recipients: string[];
  subject: string;
  message: string;
  followup_message: string;
  amount: number;
  initial_sent_at: string | null;
  max_followups: number;
  attach_on_followups: boolean;
  reply_token: string;
  company_name: string;
  contact_name: string | null;
  phone: string | null;
  user_email: string;
  reply_to_email: string | null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function attachmentsFor(job: Job): Promise<{ files: OutgoingAttachment[]; names: string[] }> {
  if (job.kind === "followup" && !job.attach_on_followups) return { files: [], names: [] };
  const { data, error } = await admin
    .from("campaign_attachments")
    .select("storage_path, file_name")
    .eq("campaign_id", job.campaign_id)
    .order("created_at");
  if (error) throw new Error(`Pièces jointes : ${error.message}`);

  const files: OutgoingAttachment[] = [];
  for (const a of data ?? []) {
    const { data: signed, error: signError } = await admin.storage
      .from("devis")
      .createSignedUrl(a.storage_path, 60 * 60);
    if (signError || !signed) throw new Error(`Pièce jointe introuvable : ${a.file_name}`);
    files.push({ filename: a.file_name, path: signed.signedUrl });
  }
  return { files, names: files.map((f) => f.filename) };
}

/**
 * En-têtes de fil de discussion : chaque relance « répond » au devis initial,
 * pour qu'Outlook, Apple Mail et Gmail l'affichent dans la même conversation.
 * Le Message-ID réel est lu une fois chez Resend puis mémorisé.
 */
async function threadHeaders(job: Job): Promise<Record<string, string>> {
  if (job.kind !== "followup") return {};
  try {
    const { data } = await admin
      .from("campaign_sends")
      .select("id, provider_id, message_id")
      .eq("campaign_id", job.campaign_id)
      .eq("sequence", 0)
      .eq("status", "sent")
      .maybeSingle();
    if (!data?.provider_id) return {};
    let messageId = data.message_id as string | null;
    if (!messageId) {
      messageId = await getSentMessageId(data.provider_id);
      if (messageId) await admin.from("campaign_sends").update({ message_id: messageId }).eq("id", data.id);
    }
    return messageId ? { "In-Reply-To": messageId, References: messageId } : {};
  } catch (e) {
    log("thread_headers_failed", { campaign_id: job.campaign_id, error: e instanceof Error ? e.message : String(e) });
    return {}; // jamais bloquant : l'objet « Re: » regroupe déjà la conversation dans Gmail
  }
}

async function deliver(job: Job): Promise<string> {
  if (!FROM_EMAIL) throw new Error("RESEND_FROM_EMAIL manquant");
  const artisanEmail = job.reply_to_email || job.user_email;
  const replyTo = INBOUND_DOMAIN ? `devis-${job.reply_token}@${INBOUND_DOMAIN}` : artisanEmail;

  const vars = {
    client: job.prospect_name,
    entreprise: job.company_name,
    dateEnvoi: job.initial_sent_at ?? new Date().toISOString(),
    reference: job.reference,
    montant: job.amount,
    numeroRelance: job.kind === "followup" ? job.sequence : null,
  };
  // objet sur une seule ligne (aucun saut de ligne venant d'un champ saisi)
  const oneLine = fillVariables(job.subject, vars).replace(/[\r\n]+/g, " ").trim();
  const subject = job.kind === "initial" ? oneLine : followupSubject(oneLine);
  const body = fillVariables(job.kind === "initial" ? job.message : job.followup_message, vars);
  const { files, names } = await attachmentsFor(job);
  const thread = await threadHeaders(job);
  // Copie cachée à l'artisan : seulement s'il l'a demandée (Paramètres), et seulement pour le devis initial
  let bcc: string[] | undefined;
  if (job.kind === "initial") {
    const { data: prefs } = await admin.from("profiles").select("send_copy_to_self").eq("id", job.user_id).maybeSingle();
    if (prefs?.send_copy_to_self) bcc = [artisanEmail];
  }

  const rendered = renderProspectEmail({
    subject,
    body,
    sender: {
      companyName: job.company_name,
      contactName: job.contact_name,
      phone: job.phone,
      replyEmail: artisanEmail,
    },
    attachmentNames: names,
  });

  return await sendEmail(
    {
      from: `${senderName(job.company_name)} <${FROM_EMAIL}>`,
      to: job.recipients,
      bcc,
      reply_to: replyTo,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      attachments: files.length ? files : undefined,
      headers: { "List-Unsubscribe": `<mailto:${replyTo}?subject=STOP>`, ...thread },
      tags: [
        { name: "campaign", value: job.campaign_id },
        { name: "kind", value: job.kind },
      ],
    },
    `send-${job.send_id}`,
  );
}

// ---------------------------------------------------------------------
// Réponses de l'artisan écrites dans le site
// ---------------------------------------------------------------------
interface MessageJob {
  message_id: string;
  body: string;
  to: string[];
  attempts: number;
  campaign_id: string;
  reference: string | null;
  prospect_name: string;
  subject: string;
  amount: number;
  initial_sent_at: string | null;
  reply_token: string;
  company_name: string;
  contact_name: string | null;
  phone: string | null;
  user_email: string;
  reply_to_email: string | null;
  initial_message_id: string | null;
  initial_provider_id: string | null;
  thread: string[];
}

const validMessageId = (v: unknown): v is string => typeof v === "string" && /^<[^<>\s]+@[^<>\s]+>$/.test(v.trim());

async function deliverMessage(job: MessageJob): Promise<string> {
  if (!FROM_EMAIL) throw new Error("RESEND_FROM_EMAIL manquant");
  const artisanEmail = job.reply_to_email || job.user_email;
  const replyTo = INBOUND_DOMAIN ? `devis-${job.reply_token}@${INBOUND_DOMAIN}` : artisanEmail;
  const vars = {
    client: job.prospect_name,
    entreprise: job.company_name,
    dateEnvoi: job.initial_sent_at ?? new Date().toISOString(),
    reference: job.reference,
    montant: job.amount,
    numeroRelance: null,
  };
  const subject = replySubject(fillVariables(job.subject, vars).replace(/[\r\n]+/g, " ").trim());

  // Fil de discussion : réponse au dernier message du client, rattachée au devis d'origine
  let initial = validMessageId(job.initial_message_id) ? job.initial_message_id.trim() : null;
  if (!initial && job.initial_provider_id) initial = await getSentMessageId(job.initial_provider_id).catch(() => null);
  const refs = [...new Set([initial, ...job.thread.filter(validMessageId).map((v) => v.trim())].filter(Boolean) as string[])].slice(-10);
  const headers: Record<string, string> = { "List-Unsubscribe": `<mailto:${replyTo}?subject=STOP>` };
  if (refs.length) {
    headers["In-Reply-To"] = refs[refs.length - 1];
    headers.References = refs.join(" ");
  }

  const rendered = renderProspectEmail({
    subject,
    body: job.body,
    sender: { companyName: job.company_name, contactName: job.contact_name, phone: job.phone, replyEmail: artisanEmail },
  });
  return await sendEmail(
    {
      from: `${senderName(job.company_name)} <${FROM_EMAIL}>`,
      to: job.to,
      reply_to: replyTo,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      headers,
      tags: [
        { name: "campaign", value: job.campaign_id },
        { name: "kind", value: "artisan_message" },
      ],
    },
    `message-${job.message_id}`,
  );
}

async function sendMessage(id: string): Promise<{ id: string; ok: boolean; skipped?: boolean; error?: string }> {
  const { data, error } = await admin.rpc("claim_campaign_message", { p_id: id });
  if (error) return { id, ok: false, error: error.message };
  const job = data as MessageJob | null;
  if (!job) return { id, ok: true, skipped: true }; // déjà envoyé ou en cours
  try {
    const providerId = await deliverMessage(job);
    const { error: doneError } = await admin.rpc("complete_campaign_message", { p_id: id, p_provider_id: providerId });
    if (doneError) throw new Error(`complete_campaign_message : ${doneError.message}`);
    log("message_sent", { campaign_id: job.campaign_id, message_id: id, provider_id: providerId });
    return { id, ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await admin.rpc("fail_campaign_message", { p_id: id, p_error: message });
    log("message_failed", { campaign_id: job.campaign_id, message_id: id, attempt: job.attempts, error: message });
    return { id, ok: false, error: message };
  }
}

async function processPendingMessages() {
  const { data } = await admin.rpc("pending_campaign_messages", { p_limit: 20 });
  const out = [];
  for (const id of (data ?? []) as string[]) {
    out.push(await sendMessage(id));
    await sleep(PAUSE_MS);
  }
  return out;
}

interface ReviewJob {
  request_id: string;
  attempts: number;
  user_id: string;
  campaign_id: string | null;
  client_name: string;
  recipients: string[];
  click_token: string;
  google_review_url: string;
  company_name: string;
  subject: string;
  body: string;
  contact_name: string | null;
  phone: string | null;
  user_email: string;
  reply_to_email: string | null;
}

async function deliverReview(job: ReviewJob): Promise<{ providerId: string; subject: string; text: string }> {
  if (!FROM_EMAIL) throw new Error("RESEND_FROM_EMAIL manquant");
  const artisanEmail = job.reply_to_email || job.user_email;
  const reviewUrl = `${SITE_URL}/r/${job.click_token}`;
  const unsubscribeUrl = `${SITE_URL}/r/${job.click_token}/stop`;
  const rendered = renderReviewEmail({
    subject: job.subject,
    body: job.body,
    companyName: job.company_name,
    clientName: job.client_name,
    reviewUrl,
    unsubscribeUrl,
  });
  const providerId = await sendEmail(
    {
      from: `${senderName(job.company_name)} <${FROM_EMAIL}>`,
      to: job.recipients,
      reply_to: artisanEmail,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      tags: [
        { name: "kind", value: "review" },
        { name: "review", value: job.request_id },
      ],
    },
    `review-${job.request_id}`,
  );
  return { providerId, subject: rendered.subject, text: rendered.text };
}

/** Envoie les demandes d'avis dues. Chaque échec est journalisé et reprogrammé (3 essais). */
async function processReviews(limit: number) {
  const { data, error } = await admin.rpc("claim_due_review_requests", { p_limit: limit });
  if (error) {
    log("review_claim_error", { error: error.message });
    return { processed: 0, sent: 0, failed: 0, error: error.message };
  }
  const jobs = (data ?? []) as ReviewJob[];
  let sent = 0;
  let failed = 0;
  for (const [index, job] of jobs.entries()) {
    if (index > 0) await sleep(PAUSE_MS);
    try {
      const { providerId, subject, text } = await deliverReview(job);
      const { error: doneError } = await admin.rpc("complete_review_send", {
        p_id: job.request_id,
        p_provider_id: providerId,
        p_subject: subject,
        p_body: text,
      });
      if (doneError) throw new Error(`complete_review_send : ${doneError.message}`);
      sent++;
      log("review_sent", { request_id: job.request_id, user_id: job.user_id, attempt: job.attempts, provider_id: providerId });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      failed++;
      await admin.rpc("fail_review_send", { p_id: job.request_id, p_error: message });
      log("review_failed", { request_id: job.request_id, user_id: job.user_id, attempt: job.attempts, error: message });
    }
  }
  return { processed: jobs.length, sent, failed };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  if (!CRON_SECRET || req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return json({ error: "Non autorisé" }, 401);
  }

  const started = Date.now();
  const input = await req.json().catch(() => ({}));
  if (input?.mode === "maintenance") return await maintenance(started);
  if (input?.mode === "message") {
    if (typeof input.message_id !== "string") return json({ error: "message_id requis" }, 400);
    const result = await sendMessage(input.message_id);
    log("mailer_run", { mode: "message", ...result, duration_ms: Date.now() - started });
    return json(result, result.ok ? 200 : 500);
  }
  if (input?.mode === "reviews") {
    const reviews = await processReviews(20);
    const summary = { ok: !("error" in reviews), mode: "reviews", reviews, duration_ms: Date.now() - started };
    log("mailer_run", summary);
    return json(summary);
  }
  if (input?.mode === "health") {
    // Vérification avant mise en production : secrets présents (jamais leurs valeurs)
    const names = ["CRON_SECRET", "RESEND_API_KEY", "RESEND_FROM_EMAIL", "SITE_URL", "INBOUND_DOMAIN", "RESEND_WEBHOOK_SECRET", "RESEND_RECEIVING_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
    const secrets = Object.fromEntries(names.map((n) => [n, Boolean(Deno.env.get(n))]));
    const { data: status, error } = await admin.rpc("mailer_status");
    return json({ ok: !error && secrets.RESEND_API_KEY && secrets.RESEND_FROM_EMAIL, secrets, database: error ? error.message : "ok", budget: status });
  }
  const mode = input?.mode === "initial" ? "initial" : "due";
  const jobs: Job[] = [];

  if (mode === "initial") {
    if (typeof input.campaign_id !== "string") return json({ error: "campaign_id requis" }, 400);
    const { data, error } = await admin.rpc("claim_initial_send", { p_campaign_id: input.campaign_id });
    if (error) {
      log("claim_initial_error", { campaign_id: input.campaign_id, error: error.message });
      return json({ error: error.message }, 500);
    }
    jobs.push(...((data ?? []) as Job[]));
  } else {
    // 1) envois initiaux restés bloqués (timeout, crash)
    const { data: stuck } = await admin.rpc("pending_initial_campaigns", { p_limit: 10 });
    for (const id of (stuck ?? []) as string[]) {
      const { data } = await admin.rpc("claim_initial_send", { p_campaign_id: id });
      jobs.push(...((data ?? []) as Job[]));
    }
    // 2) relances arrivées à échéance
    const { data, error } = await admin.rpc("claim_due_followups", { p_limit: 40 });
    if (error) {
      log("claim_due_error", { error: error.message });
      return json({ error: error.message }, 500);
    }
    jobs.push(...((data ?? []) as Job[]));
  }

  const results: { send_id: string; campaign_id: string; kind: string; ok: boolean; error?: string }[] = [];
  for (const [index, job] of jobs.entries()) {
    if (index > 0) await sleep(PAUSE_MS);
    try {
      const providerId = await deliver(job);
      const { error } = await admin.rpc("complete_send", { p_send_id: job.send_id, p_provider_id: providerId });
      if (error) throw new Error(`complete_send : ${error.message}`);
      results.push({ send_id: job.send_id, campaign_id: job.campaign_id, kind: job.kind, ok: true });
      log("send_ok", { campaign_id: job.campaign_id, kind: job.kind, sequence: job.sequence, provider_id: providerId });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await admin.rpc("fail_send", { p_send_id: job.send_id, p_error: message });
      results.push({ send_id: job.send_id, campaign_id: job.campaign_id, kind: job.kind, ok: false, error: message });
      log("send_failed", { campaign_id: job.campaign_id, kind: job.kind, sequence: job.sequence, attempt: job.attempts, error: message });
    }
  }

  // Demandes d'avis Google arrivées à échéance (même cron, même budget)
  const reviews = mode === "due" ? await processReviews(20) : null;
  // Réponses de l'artisan restées en attente (appel manqué, échec temporaire)
  const messages = mode === "due" ? await processPendingMessages() : null;

  const { data: status } = await admin.rpc("mailer_status");
  const summary = {
    ok: true,
    mode,
    budget: status,
    reviews,
    messages: messages ? { processed: messages.length, failed: messages.filter((m) => !m.ok).length } : null,
    processed: results.length,
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    duration_ms: Date.now() - started,
  };
  log("mailer_run", summary);
  return json({ ...summary, results });
});

/** Purge nocturne : fichiers des dossiers clôturés depuis plus de N mois + téléversements abandonnés. */
async function maintenance(started: number) {
  let purged = 0;
  let orphans = 0;
  const errors: string[] = [];

  for (let round = 0; round < 10; round++) {
    const { data, error } = await admin.rpc("attachments_to_purge", { p_limit: 100 });
    if (error) {
      errors.push(error.message);
      break;
    }
    const rows = (data ?? []) as { id: string; storage_path: string }[];
    if (!rows.length) break;
    const { error: removeError } = await admin.storage.from("devis").remove(rows.map((r) => r.storage_path));
    if (removeError) {
      errors.push(removeError.message);
      break;
    }
    const { data: n } = await admin.rpc("forget_attachments", { p_ids: rows.map((r) => r.id) });
    purged += Number(n ?? 0);
  }

  for (let round = 0; round < 10; round++) {
    const { data, error } = await admin.rpc("orphan_uploads", { p_limit: 100 });
    if (error) {
      errors.push(error.message);
      break;
    }
    const paths = (data ?? []) as string[];
    if (!paths.length) break;
    const { error: removeError } = await admin.storage.from("devis").remove(paths);
    if (removeError) {
      errors.push(removeError.message);
      break;
    }
    orphans += paths.length;
  }

  // Pièces jointes reçues des clients : 6 mois, + fichiers sans dossier
  let messageFiles = 0;
  for (let round = 0; round < 10; round++) {
    const { data, error } = await admin.rpc("message_files_to_purge", { p_limit: 100 });
    if (error) {
      errors.push(error.message);
      break;
    }
    const rows = (data ?? []) as { id: string | null; storage_path: string }[];
    if (!rows.length) break;
    const { error: removeError } = await admin.storage.from("messages").remove(rows.map((r) => r.storage_path));
    if (removeError) {
      errors.push(removeError.message);
      break;
    }
    const ids = rows.map((r) => r.id).filter(Boolean) as string[];
    if (ids.length) await admin.rpc("forget_message_files", { p_ids: ids });
    messageFiles += rows.length;
  }

  const { data: reviewsPurged, error: reviewPurgeError } = await admin.rpc("purge_review_history");
  if (reviewPurgeError) errors.push(reviewPurgeError.message);

  const summary = {
    ok: errors.length === 0,
    mode: "maintenance",
    purged,
    orphans,
    message_files: messageFiles,
    reviews_purged: Number(reviewsPurged ?? 0),
    errors,
    duration_ms: Date.now() - started,
  };
  log("maintenance_run", summary);
  return json(summary, errors.length ? 500 : 200);
}
