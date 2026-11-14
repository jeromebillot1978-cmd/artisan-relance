// =====================================================================
// Edge Function « resend-inbound » — webhook Resend `email.received`
// Le prospect répond à « devis-<jeton>@<INBOUND_DOMAIN> » :
//   1. la signature Svix est vérifiée ;
//   2. la campagne passe en « Répondu » et ses relances s'arrêtent ;
//   3. la réponse (et ses pièces jointes) est transférée à l'artisan,
//      avec le prospect en « Répondre à ».
// Idempotent : un même e-mail reçu n'est traité qu'une fois.
// =====================================================================
import { admin, json, log } from "../_shared/admin.ts";
import { getReceivedEmail, listReceivedAttachments, senderName, sendEmail } from "../_shared/resend.ts";
import { verifySvix } from "../_shared/svix.ts";
import { renderReplyForward } from "../_shared/templates.ts";

const WEBHOOK_SECRET = Deno.env.get("RESEND_WEBHOOK_SECRET") ?? "";
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") ?? "";
const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://artisan-relance.jercat.fr").replace(/\/$/, "");
const TOKEN_RE = /devis-([a-f0-9]{24})@/i;

interface ReceivedEvent {
  type: string;
  data: {
    email_id: string;
    from: string;
    to?: string[];
    cc?: string[];
    received_for?: string[];
    subject?: string | null;
  };
}

interface ReplyRow {
  campaign_id: string;
  prospect_name: string;
  subject: string;
  user_email: string;
  reply_to_email: string | null;
  company_name: string;
  already_processed: boolean;
}

async function forward(event: ReceivedEvent, row: ReplyRow) {
  const email = await getReceivedEmail(event.data.email_id);
  const attachments = await listReceivedAttachments(event.data.email_id);
  const rendered = renderReplyForward({
    prospectName: row.prospect_name,
    originalSubject: row.subject,
    from: event.data.from,
    receivedText: email.text,
    receivedHtml: email.html,
    companyName: row.company_name,
    dashboardUrl: `${SITE_URL}/devis/${row.campaign_id}`,
  });
  await sendEmail(
    {
      from: `${senderName(`${row.prospect_name} via Artisan Relance`)} <${FROM_EMAIL}>`,
      to: [row.reply_to_email || row.user_email],
      reply_to: event.data.from,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      attachments: attachments.length ? attachments : undefined,
      tags: [{ name: "kind", value: "reply_forward" }],
    },
    `forward-${event.data.email_id}`,
  );
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  if (!WEBHOOK_SECRET) return json({ error: "RESEND_WEBHOOK_SECRET manquant" }, 500);

  const payload = await req.text();
  if (!(await verifySvix(WEBHOOK_SECRET, req.headers, payload))) {
    log("inbound_bad_signature");
    return json({ error: "Signature invalide" }, 401);
  }

  const event = JSON.parse(payload) as ReceivedEvent;
  if (event.type !== "email.received") return json({ ignored: event.type });

  const addresses = [...(event.data.to ?? []), ...(event.data.cc ?? []), ...(event.data.received_for ?? [])];
  const token = addresses.map((a) => TOKEN_RE.exec(a)?.[1]).find(Boolean)?.toLowerCase();
  if (!token) {
    log("inbound_no_token", { email_id: event.data.email_id, to: event.data.to });
    return json({ ignored: "no_token" });
  }

  const { data, error } = await admin.rpc("register_reply", {
    p_token: token,
    p_provider_email_id: event.data.email_id,
    p_from: event.data.from,
    p_subject: event.data.subject ?? "",
  });
  if (error) {
    log("inbound_register_error", { email_id: event.data.email_id, error: error.message });
    return json({ error: error.message }, 500); // Resend réessaiera
  }

  const row = (data as ReplyRow[] | null)?.[0];
  if (!row) {
    log("inbound_unknown_campaign", { email_id: event.data.email_id });
    return json({ ignored: "unknown_campaign" });
  }

  if (row.already_processed) {
    const { data: existing } = await admin
      .from("inbound_replies")
      .select("forwarded")
      .eq("provider_email_id", event.data.email_id)
      .single();
    if (existing?.forwarded) return json({ ok: true, duplicate: true });
  }

  try {
    await forward(event, row);
    await admin.rpc("mark_reply_forwarded", { p_provider_email_id: event.data.email_id, p_error: null });
    log("inbound_forwarded", { campaign_id: row.campaign_id, email_id: event.data.email_id });
    return json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await admin.rpc("mark_reply_forwarded", { p_provider_email_id: event.data.email_id, p_error: message });
    log("inbound_forward_failed", { campaign_id: row.campaign_id, error: message });
    return json({ error: message }, 500); // la réponse est enregistrée ; Resend réessaiera le transfert
  }
});
