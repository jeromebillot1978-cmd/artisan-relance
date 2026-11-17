// =====================================================================
// Edge Function « resend-inbound » — webhooks Resend
//
// email.received : le client répond à « devis-<jeton>@<INBOUND_DOMAIN> »
//   1. signature Svix vérifiée ;
//   2. message lu chez Resend puis classé : vraie réponse, réponse automatique,
//      « STOP », copie renvoyée par l'artisan lui-même, expéditeur usurpé ;
//   3. seule une vraie réponse passe le devis en « Répondu » (« STOP » l'arrête) ;
//   4. le message est enregistré dans le dossier (conversation visible dans le site),
//      pièces jointes filtrées, photos réduites (une sous-requête par fichier pour
//      rester sous la limite de calcul des Edge Functions) ;
//   5. l'artisan est prévenu selon son réglage : alerte courte (défaut), transfert
//      complet (client en « Répondre à », objet « Re: <objet du devis> ») ou rien.
//
// email.bounced / complained / suppressed / failed : adresse du client invalide,
//   bloquée ou plainte pour spam → devis suspendu (ou arrêté) et artisan prévenu.
//
// Idempotent : un même événement n'est traité qu'une fois (clés uniques en base
// + clé d'idempotence Resend sur chaque e-mail envoyé).
// =====================================================================
import { admin, json, log } from "../_shared/admin.ts";
import { getReceivedEmail, listReceivedAttachmentMeta, senderName, sendEmail, type ReceivedEmail } from "../_shared/resend.ts";
import { verifySvix } from "../_shared/svix.ts";
import { renderArtisanNotice, renderReplyAlert, renderReplyForward } from "../_shared/templates.ts";
import { addressOnly, classifyInbound, extractToken, htmlToText, stripQuoted } from "../_shared/inbound.ts";
import { MAX_FILE_BYTES, planAttachments, safeFileName, withExtension, type PlannedAttachment } from "../_shared/files.ts";
import { compressImage, IMAGE_KEEP_BELOW, IMAGE_MAX_PIXELS, imageSize } from "../_shared/images.ts";

const WEBHOOK_SECRET = Deno.env.get("RESEND_WEBHOOK_SECRET") ?? "";
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") ?? "";
const INBOUND_DOMAIN = (Deno.env.get("INBOUND_DOMAIN") ?? "").toLowerCase();
const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://artisan-relance.jercat.fr").replace(/\/$/, "");
const INTERNAL_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SELF_URL = `${(Deno.env.get("SUPABASE_URL") ?? "").replace(/\/$/, "")}/functions/v1/resend-inbound`;
const BUCKET = "messages";
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
// Pièces jointes reçues : une sous-requête par fichier (limite de 2 s de calcul)
// ---------------------------------------------------------------------
interface StoredFile {
  storage_path: string;
  file_name: string;
  size_bytes: number;
}

function sameSecret(a: string, b: string) {
  if (!a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Sous-requête : télécharge, filtre, réduit et range UN fichier. */
async function handleAttachmentTask(task: { message_id: string; user_id: string; item: PlannedAttachment }) {
  const { message_id, user_id, item } = task;
  const label = `« ${item.filename} »`;
  try {
    const res = await fetch(item.url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) return json({ note: `${label} n'a pas pu être récupéré.` });
    let bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.byteLength === 0) return json({ note: `${label} est vide.` });
    if (bytes.byteLength > MAX_FILE_BYTES) return json({ note: `${label} écarté (plus de 10 Mo).` });
    const original = bytes.byteLength;
    let mime = item.mime;
    let name = safeFileName(item.filename);

    if ((mime === "image/jpeg" || mime === "image/png") && original > IMAGE_KEEP_BELOW) {
      const dims = imageSize(bytes);
      if (dims && dims.width * dims.height <= IMAGE_MAX_PIXELS) {
        const small = await compressImage(bytes, mime);
        if (small) {
          bytes = small;
          if (mime === "image/png") {
            mime = "image/jpeg";
            name = withExtension(name, "jpg");
          }
        }
      }
      // image trop grande ou illisible par le réducteur : gardée telle quelle (≤ 10 Mo)
    }

    const path = `${user_id}/${message_id}/${item.index}-${name}`;
    const up = await admin.storage.from(BUCKET).upload(path, bytes, { contentType: mime, upsert: true });
    if (up.error) throw new Error(up.error.message);
    const { error } = await admin.rpc("add_message_file", {
      p_message_id: message_id,
      p_path: path,
      p_name: item.filename.slice(0, 200),
      p_mime: mime,
      p_size: bytes.byteLength,
      p_original_size: original,
    });
    if (error) throw new Error(error.message);
    log("inbound_file_stored", { message_id, index: item.index, mime, original, stored: bytes.byteLength });
    return json({ ok: true });
  } catch (e) {
    log("inbound_file_failed", { message_id, index: item.index, error: e instanceof Error ? e.message : String(e) });
    return json({ note: `${label} n'a pas pu être enregistré.` });
  }
}

/** Range les pièces jointes du message (en parallèle) ; idempotent en cas de nouvel essai. */
async function storeAttachments(emailId: string, messageId: string, userId: string): Promise<{ files: StoredFile[]; note: string }> {
  const loadFiles = async () =>
    ((await admin.from("campaign_message_files").select("storage_path, file_name, size_bytes").eq("message_id", messageId).order("storage_path"))
      .data ?? []) as StoredFile[];

  let meta;
  try {
    meta = await listReceivedAttachmentMeta(emailId);
  } catch (e) {
    log("inbound_attachments_list_failed", { email_id: emailId, error: e instanceof Error ? e.message : String(e) });
    const note = "Les pièces jointes de ce message n'ont pas pu être récupérées.";
    await admin.rpc("set_message_files_note", { p_message_id: messageId, p_note: note });
    return { files: await loadFiles(), note };
  }
  if (!meta.length) return { files: [], note: "" };

  const { accepted, notes } = planAttachments(meta);
  const done = new Set((await loadFiles()).map((f) => Number(f.storage_path.split("/")[2]?.split("-")[0])));
  const results = await Promise.all(
    accepted.map(async (item) => {
      if (done.has(item.index)) return "";
      try {
        const res = await fetch(SELF_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-internal-key": INTERNAL_KEY },
          body: JSON.stringify({ task: "attachment", message_id: messageId, user_id: userId, item }),
          signal: AbortSignal.timeout(90000),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) return `« ${item.filename} » n'a pas pu être enregistré.`;
        return typeof body?.note === "string" ? body.note : "";
      } catch {
        return `« ${item.filename} » n'a pas pu être enregistré.`;
      }
    }),
  );
  const failures = results.filter(Boolean);
  const all = [...failures, ...notes.filter((n) => !n.startsWith("Demandez"))];
  if (all.length) all.push("Demandez au client de vous les renvoyer autrement si besoin.");
  const note = all.join(" ");
  await admin.rpc("set_message_files_note", { p_message_id: messageId, p_note: note });
  return { files: await loadFiles(), note };
}

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

  const receivedText = email.text?.trim() ? email.text : email.html ? htmlToText(email.html) : "";
  const artisanTo = row.reply_to_email || row.user_email;
  const dashboardUrl = `${SITE_URL}/devis/${row.campaign_id}`;

  // Conversation dans le site : texte (sans l'historique recopié) + pièces jointes
  let stored: { files: StoredFile[]; note: string } = { files: [], note: "" };
  let userId = "";
  let mode: "alert" | "full" | "none" = "alert";
  if (row.kind !== "artisan_copy") {
    const { data: msgRows, error: msgError } = await admin.rpc("register_inbound_message", {
      p_campaign_id: row.campaign_id,
      p_provider_email_id: id,
      p_from: from,
      p_to: [...(event.data.to ?? []), ...(event.data.cc ?? [])],
      p_subject: event.data.subject ?? email.subject ?? "",
      p_body: stripQuoted(receivedText),
      p_kind: row.kind,
      p_message_id: email.message_id ?? null,
    });
    if (msgError) {
      log("inbound_message_error", { email_id: id, error: msgError.message });
      return json({ error: msgError.message }, 500);
    }
    const msg = (msgRows as { message_id: string; already: boolean }[] | null)?.[0];
    if (msg) {
      const { data: c } = await admin.from("campaigns").select("user_id").eq("id", row.campaign_id).single();
      userId = c?.user_id ?? "";
      const { data: p } = await admin.from("profiles").select("reply_notification").eq("id", userId).single();
      if (p?.reply_notification === "full" || p?.reply_notification === "none") mode = p.reply_notification;
      stored = await storeAttachments(id, msg.message_id, userId);
    }
  }

  if (row.already_processed) {
    const { data: existing } = await admin.from("inbound_replies").select("forwarded, forward_error").eq("provider_email_id", id).single();
    if (existing?.forwarded || existing?.forward_error === "notification désactivée") return json({ ok: true, duplicate: true });
  }
  if (row.kind !== "artisan_copy" && (mode === "none" || (mode === "alert" && row.kind === "auto_reply"))) {
    await admin.rpc("mark_reply_forwarded", { p_provider_email_id: id, p_error: "notification désactivée" });
    log("inbound_stored_only", { campaign_id: row.campaign_id, email_id: id, kind: row.kind, mode, files: stored.files.length });
    return json({ ok: true, kind: row.kind, notified: false });
  }
  if (!row.can_forward) {
    await admin.rpc("mark_reply_forwarded", { p_provider_email_id: id, p_error: "limite de transferts atteinte" });
    log("inbound_forward_quota", { campaign_id: row.campaign_id, email_id: id });
    return json({ ok: true, forwarded: false, reason: "quota" });
  }

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
    } else if (mode === "alert") {
      const rendered = renderReplyAlert({
        prospectName: row.prospect_name,
        originalSubject: row.subject,
        from,
        excerpt: stripQuoted(receivedText),
        fileCount: stored.files.length,
        companyName: row.company_name,
        dashboardUrl,
        kind: row.kind === "opt_out" || row.kind === "suspicious" ? row.kind : "reply",
        unexpectedSender: !row.sender_is_recipient,
      });
      await sendEmail(
        {
          from: fromHeader("Artisan Relance"),
          to: [artisanTo],
          reply_to: row.kind === "suspicious" ? undefined : from,
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
          tags: [{ name: "kind", value: `reply_alert_${row.kind}` }],
        },
        `alert-${id}`,
      );
    } else {
      // Transfert complet : pièces jointes déjà filtrées et réduites (liens signés 1 h)
      const attachments: { filename: string; path: string }[] = [];
      for (const f of stored.files) {
        const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(f.storage_path, 3600);
        if (signed?.signedUrl) attachments.push({ filename: f.file_name, path: signed.signedUrl });
      }
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
        filesNote: stored.note,
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
    log("inbound_forwarded", { campaign_id: row.campaign_id, email_id: id, kind: row.kind, mode, files: stored.files.length, ambiguous, unexpected_sender: !row.sender_is_recipient });
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

  // Sous-requête interne (une pièce jointe), authentifiée par la clé de service
  const internal = req.headers.get("x-internal-key");
  if (internal !== null) {
    if (!sameSecret(internal, INTERNAL_KEY)) return json({ error: "Non autorisé" }, 401);
    const task = await req.json().catch(() => null);
    if (task?.task !== "attachment" || !task.message_id || !task.user_id || !task.item?.url) return json({ error: "Tâche invalide" }, 400);
    return await handleAttachmentTask(task);
  }
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
