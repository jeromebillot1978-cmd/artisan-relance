// =====================================================================
// Edge Function « resend-inbound » — webhooks Resend
//
// email.received : le client répond à « devis-<jeton>@<INBOUND_DOMAIN> »
//   1. signature Svix vérifiée ;
//   2. message lu chez Resend puis classé : vraie réponse, réponse automatique,
//      « STOP », copie renvoyée par l'artisan lui-même, expéditeur usurpé ;
//   3. seule une vraie réponse passe le devis en « Répondu » (« STOP » l'arrête) ;
//   4. le message est transféré à l'artisan, client en « Répondre à »,
//      objet « Re: <objet du devis> » pour garder la conversation du client.
//
// email.bounced / complained / suppressed / failed : adresse du client invalide,
//   bloquée ou plainte pour spam → devis suspendu (ou arrêté) et artisan prévenu.
//
// Idempotent : un même événement n'est traité qu'une fois (clés uniques en base
// + clé d'idempotence Resend sur chaque e-mail envoyé).
// =====================================================================
import { admin, json, log } from "../_shared/admin.ts";
import { getReceivedEmail, listReceivedAttachments, senderName, sendEmail, type ReceivedEmail } from "../_shared/resend.ts";
import { verifySvix } from "../_shared/svix.ts";
import { renderArtisanNotice, renderReplyForward } from "../_shared/templates.ts";
import { addressOnly, classifyInbound, extractToken, htmlToText } from "../_shared/inbound.ts";

const WEBHOOK_SECRET = Deno.env.get("RESEND_WEBHOOK_SECRET") ?? "";
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") ?? "";
const INBOUND_DOMAIN = (Deno.env.get("INBOUND_DOMAIN") ?? "").toLowerCase();
const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://artisan-relance.jercat.fr").replace(/\/$/, "");
const DELIVERY_EVENTS: Record<string, "bounced" | "complained" | "suppressed" | "failed"> = {
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.suppressed": "suppressed",
  "email.failed": "failed",
};

interface WebhookEvent {
  type: string;
  data: {
    email_id: string;
    from?: string;
    to?: string[];
    cc?: string[];
    received_for?: string[];
    subject?: string | null;
    bounce?: Record<string, unknown>;
    failed?: Record<string, unknown>;
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
  can_forward: boolean;
  kind: "reply" | "auto_reply" | "opt_out" | "artisan_copy" | "suspicious";
  sender_is_recipient: boolean;
  recipients: string[];
}

const fromHeader = (label: string) => `${senderName(label)} <${FROM_EMAIL}>`;

// ---------------------------------------------------------------------
// Réponses reçues
// ---------------------------------------------------------------------
async function handleReceived(event: WebhookEvent) {
  const id = event.data.email_id;
  const from = event.data.from ?? "";

  // Anti-boucle : jamais de traitement d'un e-mail envoyé par nos propres adresses
  const fromAddress = addressOnly(from);
  const ownDomains = [FROM_EMAIL.split("@")[1], INBOUND_DOMAIN].filter(Boolean).map((d) => `@${d!.toLowerCase()}`);
  if (!fromAddress || ownDomains.some((d) => fromAddress.endsWith(d))) {
    log("inbound_loop_ignored", { email_id: id });
    return json({ ignored: "own_address" });
  }

  const { token, ambiguous } = extractToken(event.data, INBOUND_DOMAIN);
  if (!token) {
    log("inbound_no_token", { email_id: id, to: event.data.to });
    return json({ ignored: "no_token" });
  }
  if (ambiguous) log("inbound_multiple_tokens", { email_id: id, to: event.data.to, cc: event.data.cc });

  // Lecture du message (en-têtes, authentification, texte) AVANT de toucher au devis
  let email: ReceivedEmail;
  try {
    email = await getReceivedEmail(id);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    log("inbound_read_failed", { email_id: id, error: message });
    return json({ error: message }, 500); // Resend réessaiera
  }
  const kind = classifyInbound({ ...email, from: email.from || from });

  const { data, error } = await admin.rpc("register_reply", {
    p_token: token,
    p_provider_email_id: id,
    p_from: from,
    p_subject: event.data.subject ?? email.subject ?? "",
    p_kind: kind,
  });
  if (error) {
    log("inbound_register_error", { email_id: id, error: error.message });
    return json({ error: error.message }, 500);
  }
  const row = (data as ReplyRow[] | null)?.[0];
  if (!row) {
    log("inbound_unknown_campaign", { email_id: id });
    return json({ ignored: "unknown_campaign" });
  }

  if (row.already_processed) {
    const { data: existing } = await admin.from("inbound_replies").select("forwarded").eq("provider_email_id", id).single();
    if (existing?.forwarded) return json({ ok: true, duplicate: true });
  }
  if (!row.can_forward) {
    await admin.rpc("mark_reply_forwarded", { p_provider_email_id: id, p_error: "limite de transferts atteinte" });
    log("inbound_forward_quota", { campaign_id: row.campaign_id, email_id: id });
    return json({ ok: true, forwarded: false, reason: "quota" });
  }

  const receivedText = email.text?.trim() ? email.text : email.html ? htmlToText(email.html) : "";
  const artisanTo = row.reply_to_email || row.user_email;
  const dashboardUrl = `${SITE_URL}/devis/${row.campaign_id}`;

  try {
    if (row.kind === "artisan_copy") {
      // L'artisan a cliqué « Répondre » sur sa copie du devis : son message n'est PAS parti au client.
      const rendered = renderArtisanNotice({
        subject: `Votre message n'a pas été envoyé à ${row.prospect_name}`,
        tone: "warning",
        paragraphs: [
          `Vous avez répondu à votre copie du devis « ${row.subject} ». Ce message est revenu chez Artisan Relance : il n'a pas été envoyé à ${row.prospect_name}.`,
          `Pour lui écrire, répondez simplement à cet e-mail : votre réponse partira directement vers ${row.recipients.join(", ")}. Les relances automatiques ne sont pas modifiées.`,
        ],
        quote: receivedText,
        dashboardUrl,
        companyName: row.company_name,
      });
      await sendEmail(
        {
          from: fromHeader("Artisan Relance"),
          to: [artisanTo],
          reply_to: row.recipients,
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
          tags: [{ name: "kind", value: "artisan_copy_notice" }],
        },
        `copy-${id}`,
      );
    } else {
      const attachments = await listReceivedAttachments(id);
      const rendered = renderReplyForward({
        prospectName: row.prospect_name,
        originalSubject: row.subject,
        from,
        receivedText,
        companyName: row.company_name,
        dashboardUrl,
        kind: row.kind,
        unexpectedSender: !row.sender_is_recipient,
        recipients: row.recipients,
      });
      await sendEmail(
        {
          from: fromHeader(`${row.prospect_name} via Artisan Relance`),
          to: [artisanTo],
          // Message suspect : pas de « Répondre à » vers une adresse non vérifiée
          reply_to: row.kind === "suspicious" ? undefined : from,
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
          attachments: attachments.length ? attachments : undefined,
          tags: [{ name: "kind", value: `reply_forward_${row.kind}` }],
        },
        `forward-${id}`,
      );
    }
    await admin.rpc("mark_reply_forwarded", { p_provider_email_id: id, p_error: null });
    log("inbound_forwarded", { campaign_id: row.campaign_id, email_id: id, kind: row.kind, ambiguous, unexpected_sender: !row.sender_is_recipient });
    return json({ ok: true, kind: row.kind });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await admin.rpc("mark_reply_forwarded", { p_provider_email_id: id, p_error: message });
    log("inbound_forward_failed", { campaign_id: row.campaign_id, email_id: id, error: message });
    return json({ error: message }, 500); // enregistré ; Resend réessaiera le transfert
  }
}

// ---------------------------------------------------------------------
// Rebonds, plaintes, adresses bloquées
// ---------------------------------------------------------------------
interface IssueRow {
  source: "campaign" | "review";
  campaign_id: string | null;
  review_id: string | null;
  prospect_name: string;
  recipients: string[];
  user_email: string;
  reply_to_email: string | null;
  company_name: string;
  first_time: boolean;
}

async function handleDelivery(event: WebhookEvent, type: "bounced" | "complained" | "suppressed" | "failed") {
  const id = event.data.email_id;
  const detail = { bounce: event.data.bounce ?? null, failed: event.data.failed ?? null, to: event.data.to ?? [] };
  const { data, error } = await admin.rpc("register_delivery_issue", { p_provider_id: id, p_type: type, p_detail: detail });
  if (error) {
    log("delivery_issue_error", { email_id: id, type, error: error.message });
    return json({ error: error.message }, 500);
  }
  const row = (data as IssueRow[] | null)?.[0];
  if (!row) {
    // e-mail hors devis/avis (notification, transfert…) : simple trace
    log("delivery_issue_untracked", { email_id: id, type });
    return json({ ignored: "untracked" });
  }
  log("delivery_issue", { email_id: id, type, source: row.source, campaign_id: row.campaign_id, first_time: row.first_time });
  if (!row.first_time) return json({ ok: true, duplicate: true });

  const who = row.recipients.join(", ");
  const isReview = row.source === "review";
  const what = isReview ? "la demande d'avis" : "le devis";
  const paragraphs =
    type === "complained"
      ? [
          `${row.prospect_name} (${who}) a signalé ${what} comme courrier indésirable.`,
          isReview
            ? "Aucune autre demande d'avis ne lui sera envoyée."
            : "Le devis est arrêté : plus aucune relance ni demande d'avis ne lui sera envoyée. Contactez-le plutôt par téléphone si besoin.",
        ]
      : [
          `${what[0].toUpperCase()}${what.slice(1)} envoyé à ${row.prospect_name} n'a pas pu être distribué : l'adresse ${who} semble invalide, inexistante ou bloquée.`,
          isReview
            ? "Corrigez l'adresse du client puis renvoyez la demande d'avis."
            : "Les relances sont suspendues pour ne pas écrire dans le vide. Corrigez l'adresse dans le dossier (Modifier), puis reprenez la campagne.",
        ];
  const dashboardUrl = isReview ? `${SITE_URL}/avis-google` : `${SITE_URL}/devis/${row.campaign_id}`;
  const rendered = renderArtisanNotice({
    subject: type === "complained" ? `${row.prospect_name} a signalé votre e-mail comme indésirable` : `Adresse e-mail invalide : ${row.prospect_name}`,
    tone: type === "complained" ? "danger" : "warning",
    paragraphs,
    dashboardUrl,
    companyName: row.company_name,
  });
  try {
    await sendEmail(
      {
        from: fromHeader("Artisan Relance"),
        to: [row.reply_to_email || row.user_email],
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        tags: [{ name: "kind", value: `delivery_${type}_notice` }],
      },
      `issue-${type}-${id}`,
    );
    await admin.rpc("mark_delivery_issue_notified", { p_provider_id: id, p_type: type });
  } catch (e) {
    // le devis est déjà suspendu : l'alerte ratée est seulement journalisée
    log("delivery_notice_failed", { email_id: id, type, error: e instanceof Error ? e.message : String(e) });
  }
  return json({ ok: true });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  if (!WEBHOOK_SECRET) return json({ error: "RESEND_WEBHOOK_SECRET manquant" }, 500);

  const payload = await req.text();
  if (!(await verifySvix(WEBHOOK_SECRET, req.headers, payload))) {
    log("inbound_bad_signature");
    return json({ error: "Signature invalide" }, 401);
  }

  let event: WebhookEvent;
  try {
    event = JSON.parse(payload) as WebhookEvent;
  } catch {
    return json({ error: "JSON invalide" }, 400);
  }
  if (!event?.data?.email_id) return json({ ignored: "no_email_id" });

  if (event.type === "email.received") return await handleReceived(event);
  const deliveryType = DELIVERY_EVENTS[event.type];
  if (deliveryType) return await handleDelivery(event, deliveryType);
  return json({ ignored: event.type });
});
