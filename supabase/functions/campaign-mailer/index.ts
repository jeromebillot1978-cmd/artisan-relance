// =====================================================================
// Edge Function « campaign-mailer »
//  - mode "initial" : envoie le devis d'une campagne (appelé par l'appli)
//  - mode "due"     : envoie toutes les relances arrivées à échéance
//                     (appelé toutes les 15 min par pg_cron, + Vercel Cron)
//  - mode "maintenance" : purge des pièces jointes expirées et orphelines
//                     (appelé chaque nuit par pg_cron)
// Garde-fous de coût : plafonds quotidiens global et par artisan, et
// disjoncteur sur les échecs, appliqués en base au moment de la réservation.
// Sécurité : en-tête x-cron-secret obligatoire.
// Anti-doublon : réservation SQL (FOR UPDATE SKIP LOCKED + clé unique
// campagne/numéro) + clé d'idempotence Resend par envoi.
// =====================================================================
import { admin, json, log } from "../_shared/admin.ts";
import { senderName, sendEmail, type OutgoingAttachment } from "../_shared/resend.ts";
import { fillVariables, followupSubject, renderDecisionNotice, renderProspectEmail } from "../_shared/templates.ts";

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
  const subject =
    job.kind === "initial" ? fillVariables(job.subject, vars) : followupSubject(fillVariables(job.subject, vars));
  const body = fillVariables(job.kind === "initial" ? job.message : job.followup_message, vars);
  const { files, names } = await attachmentsFor(job);

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
    decisionUrl: `${SITE_URL}/d/${job.reply_token}`,
  });

  return await sendEmail(
    {
      from: `${senderName(job.company_name)} <${FROM_EMAIL}>`,
      to: job.recipients,
      // copie du devis initial à l'artisan, pour son classement
      bcc: job.kind === "initial" ? [artisanEmail] : undefined,
      reply_to: replyTo,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      attachments: files.length ? files : undefined,
      headers: { "List-Unsubscribe": `<mailto:${replyTo}?subject=STOP>` },
      tags: [
        { name: "campaign", value: job.campaign_id },
        { name: "kind", value: job.kind },
      ],
    },
    `send-${job.send_id}`,
  );
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  if (!CRON_SECRET || req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return json({ error: "Non autorisé" }, 401);
  }

  const started = Date.now();
  const input = await req.json().catch(() => ({}));
  if (input?.mode === "maintenance") return await maintenance(started);
  if (input?.mode === "notify_decision") return await notifyDecision(String(input.campaign_id ?? ""));
  if (input?.mode === "health") {
    // Vérification avant mise en production : secrets présents (jamais leurs valeurs)
    const names = ["CRON_SECRET", "RESEND_API_KEY", "RESEND_FROM_EMAIL", "SITE_URL", "INBOUND_DOMAIN", "RESEND_WEBHOOK_SECRET", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
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

  const { data: status } = await admin.rpc("mailer_status");
  const summary = {
    ok: true,
    mode,
    budget: status,
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

  const summary = { ok: errors.length === 0, mode: "maintenance", purged, orphans, errors, duration_ms: Date.now() - started };
  log("maintenance_run", summary);
  return json(summary, errors.length ? 500 : 200);
}

/** Prévient l'artisan que son client a accepté ou refusé le devis en ligne. */
async function notifyDecision(campaignId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(campaignId)) return json({ error: "campaign_id invalide" }, 400);
  const { data: c, error } = await admin
    .from("campaigns")
    .select("id, user_id, prospect_name, reference, amount, status, lost_reason, decided_by")
    .eq("id", campaignId)
    .maybeSingle();
  if (error || !c) return json({ error: error?.message ?? "introuvable" }, 404);
  if (c.decided_by !== "client" || !["won", "lost"].includes(c.status)) return json({ ignored: true });
  const { data: p } = await admin.from("profiles").select("email, reply_to_email, company_name").eq("id", c.user_id).single();
  if (!p) return json({ error: "profil introuvable" }, 404);

  const rendered = renderDecisionNotice({
    accepted: c.status === "won",
    prospectName: c.prospect_name,
    reference: c.reference,
    amount: c.amount,
    reason: c.lost_reason,
    companyName: p.company_name,
    dashboardUrl: `${SITE_URL}/devis/${c.id}`,
  });
  try {
    const id = await sendEmail(
      {
        from: `Artisan Relance <${FROM_EMAIL}>`,
        to: [p.reply_to_email || p.email],
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        tags: [{ name: "kind", value: "decision_notice" }],
      },
      `decision-${c.id}-${c.status}`,
    );
    log("decision_notice_sent", { campaign_id: c.id, status: c.status, provider_id: id });
    return json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    log("decision_notice_failed", { campaign_id: c.id, error: message });
    return json({ error: message }, 500);
  }
}
