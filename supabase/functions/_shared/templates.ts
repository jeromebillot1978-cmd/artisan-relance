/**
 * Modèles d'e-mails — source unique, partagée entre :
 *  - les Edge Functions Supabase (Deno) qui envoient réellement les e-mails ;
 *  - l'application Next.js (aperçus, valeurs par défaut du formulaire).
 * Aucune dépendance : TypeScript pur, compatible Deno et Node.
 */

export const DEFAULT_INITIAL_MESSAGE = `Bonjour {client},

Suite à notre échange, vous trouverez ci-joint notre devis{reference} pour vos travaux.

Je reste à votre disposition pour toute question, ou pour en ajuster le contenu si besoin.`;

export const DEFAULT_FOLLOWUP_MESSAGE = `Bonjour {client},

Je me permets de revenir vers vous au sujet de notre devis envoyé le {date_envoi}.

Avez-vous eu le temps d'en prendre connaissance ? Je reste disponible pour en discuter ou l'adapter à vos besoins.`;

export function defaultSubject(companyName: string, reference?: string | null) {
  const ref = reference ? ` n° ${reference}` : "";
  return `Votre devis${ref}${companyName ? ` — ${companyName}` : ""}`;
}

export const TEMPLATE_VARIABLES = [
  { key: "{client}", label: "Nom du client" },
  { key: "{entreprise}", label: "Votre entreprise" },
  { key: "{date_envoi}", label: "Date d'envoi du devis" },
  { key: "{reference}", label: "« n° … » du devis" },
  { key: "{montant}", label: "Montant" },
  { key: "{numero_relance}", label: "N° de la relance" },
] as const;

export interface TemplateVars {
  client: string;
  entreprise: string;
  dateEnvoi?: string | null; // ISO
  reference?: string | null;
  montant?: number | null;
  numeroRelance?: number | null;
}

export interface Sender {
  companyName: string;
  contactName?: string | null;
  phone?: string | null;
  replyEmail: string;
}

export function formatDateFr(iso?: string | null) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  }).format(new Date(iso));
}

export function formatEur(value?: number | null) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(value ?? 0));
}

export function fillVariables(text: string, v: TemplateVars) {
  return text
    .replaceAll("{client}", v.client)
    .replaceAll("{entreprise}", v.entreprise)
    .replaceAll("{date_envoi}", formatDateFr(v.dateEnvoi) || "récemment")
    .replaceAll("{reference}", v.reference ? ` n° ${v.reference}` : "")
    .replaceAll("{montant}", formatEur(v.montant))
    .replaceAll("{numero_relance}", String(v.numeroRelance ?? ""));
}

export function followupSubject(subject: string) {
  return /^re\s*:/i.test(subject) ? subject : `Re: ${subject}`;
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function textToHtml(text: string) {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px 0;">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

function signatureLines(s: Sender) {
  return [s.contactName, s.companyName, s.phone, s.replyEmail].filter(Boolean) as string[];
}

function layout(inner: string, footer: string, title: string, companyName: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;">
<tr><td style="padding:24px 28px 6px 28px;font-size:13px;font-weight:600;color:#71717a;">${escapeHtml(companyName)}</td></tr>
<tr><td style="padding:8px 28px 8px 28px;font-size:15px;line-height:1.65;">${inner}</td></tr>
<tr><td style="padding:16px 28px 24px 28px;border-top:1px solid #f4f4f5;font-size:12px;line-height:1.5;color:#a1a1aa;">${footer}</td></tr>
</table></td></tr></table>
</body></html>`;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/** E-mail envoyé au prospect (devis initial ou relance). */
export function renderProspectEmail(opts: {
  subject: string;
  body: string;
  sender: Sender;
  attachmentNames?: string[];
}): RenderedEmail {
  const { sender } = opts;
  const lines = signatureLines(sender);
  const attachments = opts.attachmentNames?.length
    ? `<p style="margin:18px 0 0 0;font-size:13px;color:#52525b;">Pièce(s) jointe(s) : ${opts.attachmentNames
        .map(escapeHtml)
        .join(", ")}</p>`
    : "";
  const inner = `${textToHtml(opts.body)}
<p style="margin:22px 0 4px 0;">Bien cordialement,</p>
${lines.map((l, i) => `<p style="margin:0;${i === 0 ? "font-weight:600;" : "color:#52525b;"}">${escapeHtml(l)}</p>`).join("\n")}
${attachments}`;
  const footer = `Vous recevez ce message suite à votre demande de devis auprès de ${escapeHtml(
    sender.companyName || "notre entreprise",
  )}. Pour ne plus être relancé, répondez simplement « STOP ».`;

  const text = [
    opts.body.trim(),
    "",
    "Bien cordialement,",
    ...lines,
    opts.attachmentNames?.length ? `\nPièce(s) jointe(s) : ${opts.attachmentNames.join(", ")}` : "",
    "",
    "—",
    `Pour ne plus être relancé, répondez « STOP ».`,
  ].join("\n");

  return { subject: opts.subject, html: layout(inner, footer, opts.subject, sender.companyName), text };
}

export type ForwardKind = "reply" | "auto_reply" | "opt_out" | "suspicious";

/** Objet « Re: … » sans empilement de préfixes (Re: Re: TR: …). */
export function replySubject(subject: string) {
  const clean = subject.replace(/^\s*((re|tr|fw|fwd)\s*:\s*)+/i, "").trim();
  return `Re: ${clean}`.slice(0, 200);
}

/**
 * Transfert à l'artisan d'un message reçu de son client.
 * L'objet reste « Re: <objet du devis> » : quand l'artisan répond, le client retrouve
 * sa conversation d'origine (et ne voit aucun libellé interne).
 * Le message reçu est toujours affiché en texte (jamais de HTML externe injecté).
 */
export function renderReplyForward(opts: {
  prospectName: string;
  originalSubject: string;
  from: string;
  receivedText?: string | null;
  companyName: string;
  dashboardUrl: string;
  kind?: ForwardKind;
  unexpectedSender?: boolean;
  recipients?: string[];
  filesNote?: string | null;
}): RenderedEmail {
  const kind = opts.kind ?? "reply";
  const base = replySubject(opts.originalSubject);
  const subject = (
    kind === "auto_reply" ? `[Réponse automatique] ${base}` : kind === "opt_out" ? `[STOP] ${base}` : kind === "suspicious" ? `[À vérifier] ${base}` : base
  ).slice(0, 200);

  const tone = {
    reply: { bg: "#ecfdf5", fg: "#065f46" },
    auto_reply: { bg: "#f4f4f5", fg: "#3f3f46" },
    opt_out: { bg: "#fef2f2", fg: "#991b1b" },
    suspicious: { bg: "#fffbeb", fg: "#92400e" },
  }[kind];
  const name = escapeHtml(opts.prospectName);
  const headline = {
    reply: `<strong>${name}</strong> a répondu à votre devis. Les relances automatiques sont arrêtées.`,
    auto_reply: `Réponse automatique reçue de la part de <strong>${name}</strong> (absence, accusé de réception…). <strong>Les relances continuent</strong> : ce n'est pas une vraie réponse.`,
    opt_out: `<strong>${name}</strong> a demandé à ne plus être relancé (« STOP »). Le devis est arrêté : plus aucune relance ni demande d'avis ne lui sera envoyée.`,
    suspicious: `Message reçu au nom de <strong>${name}</strong>, mais <strong>l'expéditeur n'a pas pu être authentifié</strong> (possible usurpation). Les relances continuent. Vérifiez avant de répondre.`,
  }[kind];
  const warning = opts.unexpectedSender
    ? `<br><strong>Attention :</strong> ce message vient de ${escapeHtml(opts.from)}, qui n'est pas l'adresse à laquelle le devis a été envoyé${
        opts.recipients?.length ? ` (${escapeHtml(opts.recipients.join(", "))})` : ""
      }.`
    : "";
  const action =
    kind === "reply" || kind === "opt_out"
      ? `<br>Répondez directement à cet e-mail : votre réponse partira vers ${escapeHtml(opts.from)}.`
      : "";
  const banner = `<div style="margin:0 0 18px 0;padding:12px 14px;border-radius:8px;background:${tone.bg};color:${tone.fg};font-size:14px;">
${headline}${warning}${action}
<br><a href="${escapeHtml(opts.dashboardUrl)}" style="color:${tone.fg};">Voir le dossier</a></div>`;
  const original = opts.receivedText?.trim()
    ? textToHtml(opts.receivedText)
    : `<p style="color:#71717a;">(message vide)</p>`;
  const note = opts.filesNote?.trim()
    ? `<p style="margin:14px 0 0 0;font-size:13px;color:#52525b;">${escapeHtml(opts.filesNote.trim())}</p>`
    : "";
  const inner = `${banner}<div style="border-left:3px solid #e4e4e7;padding-left:14px;">${original}</div>${note}`;
  const plainHeadline = {
    reply: `${opts.prospectName} a répondu à votre devis. Les relances automatiques sont arrêtées.`,
    auto_reply: `Réponse automatique de ${opts.prospectName} : les relances continuent.`,
    opt_out: `${opts.prospectName} a demandé à ne plus être relancé (STOP). Le devis est arrêté.`,
    suspicious: `Message au nom de ${opts.prospectName} dont l'expéditeur n'a pas pu être authentifié. Vérifiez avant de répondre.`,
  }[kind];
  const text = [
    plainHeadline,
    opts.unexpectedSender ? `Attention : ce message vient de ${opts.from}, qui n'est pas l'adresse du devis.` : "",
    kind === "reply" || kind === "opt_out" ? `Répondez directement à cet e-mail pour lui écrire (${opts.from}).` : "",
    `Dossier : ${opts.dashboardUrl}`,
    "",
    "----- Message reçu -----",
    opts.receivedText?.trim() || "(message vide)",
    opts.filesNote?.trim() ? `\n${opts.filesNote.trim()}` : "",
  ]
    .filter((l, i) => l !== "" || i > 3)
    .join("\n");
  return {
    subject,
    html: layout(inner, "Transféré automatiquement par Artisan Relance.", subject, opts.companyName),
    text,
  };
}

/**
 * Alerte courte à l'artisan : un client a répondu. Le message complet (et les pièces
 * jointes) se lit dans le dossier, où l'artisan peut répondre en gardant l'historique.
 */
export function renderReplyAlert(opts: {
  prospectName: string;
  originalSubject: string;
  from: string;
  excerpt: string;
  fileCount: number;
  companyName: string;
  dashboardUrl: string;
  kind: "reply" | "opt_out" | "suspicious";
  unexpectedSender?: boolean;
  /** « devis » (défaut) : réponse d'un client à un devis ; « prospection » : réponse d'un artisan démarché. */
  context?: "devis" | "prospection";
}): RenderedEmail {
  const name = opts.prospectName;
  const prospection = opts.context === "prospection";
  const subject = (
    opts.kind === "opt_out"
      ? prospection ? `[STOP] ${name} ne souhaite plus être contacté` : `[STOP] ${name} ne souhaite plus être relancé`
      : opts.kind === "suspicious"
        ? `[À vérifier] Message reçu au nom de ${name}`
        : prospection ? `${name} a répondu à votre e-mail de prospection` : `${name} a répondu à votre devis`
  ).slice(0, 200);
  const lead = prospection
    ? {
        reply: `${name} a répondu à votre e-mail « ${opts.originalSubject} ».`,
        opt_out: `${name} a demandé à ne plus être contacté (« STOP »). La fiche est passée en « Ne plus contacter » : aucun nouvel envoi ne sera possible.`,
        suspicious: `Un message a été reçu au nom de ${name}, mais l'expéditeur n'a pas pu être authentifié (possible usurpation). Vérifiez avant de répondre.`,
      }[opts.kind]
    : {
        reply: `${name} a répondu à votre devis « ${opts.originalSubject} ». Les relances automatiques sont arrêtées.`,
        opt_out: `${name} a demandé à ne plus être relancé (« STOP »). Le devis est arrêté.`,
        suspicious: `Un message a été reçu au nom de ${name}, mais l'expéditeur n'a pas pu être authentifié (possible usurpation). Les relances continuent.`,
      }[opts.kind];
  const extra = [
    opts.unexpectedSender
      ? `Attention : ce message vient de ${opts.from}, qui n'est pas l'adresse ${prospection ? "de la fiche prospect" : "à laquelle le devis a été envoyé"}.`
      : "",
    opts.fileCount > 0 ? `${opts.fileCount} pièce${opts.fileCount > 1 ? "s" : ""} jointe${opts.fileCount > 1 ? "s" : ""} disponible${opts.fileCount > 1 ? "s" : ""} dans le dossier.` : "",
  ].filter(Boolean);
  const excerpt = opts.excerpt.trim().replace(/\s+/g, " ");
  const short = excerpt.length > 300 ? `${excerpt.slice(0, 297).trimEnd()}…` : excerpt;
  const t = opts.kind === "reply" ? ["#ecfdf5", "#065f46"] : opts.kind === "opt_out" ? ["#fef2f2", "#991b1b"] : ["#fffbeb", "#92400e"];
  const url = escapeHtml(opts.dashboardUrl);
  const inner = `<div style="margin:0 0 16px 0;padding:12px 14px;border-radius:8px;background:${t[0]};color:${t[1]};font-size:14px;">
${escapeHtml(lead)}${extra.map((e) => `<br>${escapeHtml(e)}`).join("")}</div>
${short ? `<div style="border-left:3px solid #e4e4e7;padding-left:14px;color:#3f3f46;font-style:italic;">${escapeHtml(short)}</div>` : ""}
<p style="margin:22px 0 8px 0;"><a href="${url}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;font-weight:600;padding:11px 18px;border-radius:8px;">Lire et répondre</a></p>
<p style="margin:10px 0 0 0;font-size:13px;color:#71717a;">Répondez depuis ${prospection ? "la fiche" : "le dossier"} pour garder tout l'historique au même endroit${
    opts.kind === "suspicious" ? "" : " (vous pouvez aussi répondre directement à cet e-mail)"
  }.</p>`;
  const text = [
    lead,
    ...extra,
    "",
    short ? `« ${short} »` : "",
    "",
    `Lire et répondre : ${opts.dashboardUrl}`,
  ]
    .filter((l, i, a) => l !== "" || (a[i - 1] ?? "") !== "")
    .join("\n");
  return {
    subject,
    html: layout(
      inner,
      prospection ? "Alerte Prospection — Artisan Relance." : "Alerte Artisan Relance. Choisissez le type de notification dans Paramètres.",
      subject,
      opts.companyName,
    ),
    text,
  };
}

/** Message d'information à l'artisan (copie renvoyée, adresse invalide, signalement…). */
export function renderArtisanNotice(opts: {
  subject: string;
  paragraphs: string[];
  tone?: "info" | "warning" | "danger";
  quote?: string | null;
  dashboardUrl: string;
  companyName: string;
}): RenderedEmail {
  const t = { info: ["#eff6ff", "#1e3a8a"], warning: ["#fffbeb", "#92400e"], danger: ["#fef2f2", "#991b1b"] }[opts.tone ?? "info"];
  const body = opts.paragraphs.map((p) => `<p style="margin:0 0 10px 0;">${escapeHtml(p)}</p>`).join("");
  const banner = `<div style="margin:0 0 18px 0;padding:12px 14px;border-radius:8px;background:${t[0]};color:${t[1]};font-size:14px;">${body}<a href="${escapeHtml(opts.dashboardUrl)}" style="color:${t[1]};font-weight:600;">Ouvrir le dossier</a></div>`;
  const quote = opts.quote?.trim()
    ? `<div style="border-left:3px solid #e4e4e7;padding-left:14px;">${textToHtml(opts.quote)}</div>`
    : "";
  const text = [...opts.paragraphs, `Dossier : ${opts.dashboardUrl}`, ...(opts.quote?.trim() ? ["", "----- Votre message -----", opts.quote.trim()] : [])].join("\n");
  return { subject: opts.subject.slice(0, 200), html: layout(banner + quote, "Message automatique d'Artisan Relance.", opts.subject, opts.companyName), text };
}

// =====================================================================
// Demande d'avis Google
// =====================================================================

export type ReviewTemplateKey = "professionnel" | "court" | "chaleureux";

export const REVIEW_TEMPLATES: { key: ReviewTemplateKey; label: string; body: string }[] = [
  {
    key: "professionnel",
    label: "Professionnel",
    body: `Bonjour,

Nous espérons que notre intervention vous a donné entière satisfaction.

Votre avis compte énormément pour notre entreprise et nous aiderait à continuer à améliorer nos services.

Vous pouvez laisser votre avis en cliquant sur le lien ci-dessous :
{{google_review_link}}

Merci pour votre confiance.

Cordialement,
{{company_name}}`,
  },
  {
    key: "court",
    label: "Court",
    body: `Bonjour,

Merci pour votre confiance.

Si vous avez été satisfait de notre prestation, un avis Google nous aiderait énormément.

{{google_review_link}}

Merci beaucoup.
{{company_name}}`,
  },
  {
    key: "chaleureux",
    label: "Chaleureux",
    body: `Bonjour,

Ce fut un plaisir de travailler avec vous.

Quelques secondes suffisent pour partager votre expérience et aider d'autres clients à nous faire confiance.

Cliquez simplement ici :
{{google_review_link}}

Un grand merci pour votre soutien.
{{company_name}}`,
  },
];

export const DEFAULT_REVIEW_SUBJECT = "Votre avis compte pour nous — {{company_name}}";
export const REVIEW_LINK_TOKEN = "{{google_review_link}}";

export const REVIEW_VARIABLES = [
  { key: "{{google_review_link}}", label: "Lien vers votre fiche Google (obligatoire)" },
  { key: "{{company_name}}", label: "Nom de votre entreprise" },
  { key: "{{client_name}}", label: "Nom du client" },
] as const;

/** Remplace les variables texte (le lien est traité à part, en bouton). */
export function fillReviewVariables(text: string, v: { companyName: string; clientName: string }) {
  return text.replaceAll("{{company_name}}", v.companyName).replaceAll("{{client_name}}", v.clientName);
}

/** E-mail de demande d'avis : le lien apparaît comme un bouton (et en clair dans la version texte). */
export function renderReviewEmail(opts: {
  subject: string;
  body: string;
  companyName: string;
  clientName: string;
  reviewUrl: string; // lien de suivi (redirige vers Google)
  unsubscribeUrl?: string;
}): RenderedEmail {
  const vars = { companyName: opts.companyName, clientName: opts.clientName };
  const subject = fillReviewVariables(opts.subject, vars).replace(/[\r\n]+/g, " ").trim().slice(0, 200);
  const body = fillReviewVariables(opts.body, vars).trim();
  const href = escapeHtml(opts.reviewUrl);
  const button = `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 18px 0;"><tr><td style="border-radius:8px;background:#1a73e8;">
<a href="${href}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">⭐ Laisser un avis Google</a>
</td></tr></table>`;
  const inlineLink = `<a href="${href}" style="color:#1a73e8;font-weight:600;">laisser un avis Google</a>`;

  const html = body
    .split(/\n{2,}/)
    .map((paragraph) => {
      const lines = paragraph.split("\n");
      const out: string[] = [];
      let buffer: string[] = [];
      const flush = () => {
        if (buffer.length) {
          out.push(
            `<p style="margin:0 0 14px 0;">${buffer
              .map((l) => escapeHtml(l).replaceAll(escapeHtml(REVIEW_LINK_TOKEN), inlineLink))
              .join("<br>")}</p>`,
          );
          buffer = [];
        }
      };
      for (const line of lines) {
        if (line.trim() === REVIEW_LINK_TOKEN) {
          flush();
          out.push(button);
        } else {
          buffer.push(line);
        }
      }
      flush();
      return out.join("\n");
    })
    .join("\n");

  const footer = `Vous recevez ce message car ${escapeHtml(opts.companyName)} est intervenu pour vous.${
    opts.unsubscribeUrl
      ? ` <a href="${escapeHtml(opts.unsubscribeUrl)}" style="color:#a1a1aa;">Ne plus recevoir de demande d'avis</a>.`
      : ""
  }`;

  const text = [
    body.replaceAll(REVIEW_LINK_TOKEN, opts.reviewUrl),
    "",
    "—",
    `Vous recevez ce message car ${opts.companyName} est intervenu pour vous.`,
    opts.unsubscribeUrl ? `Ne plus recevoir de demande d'avis : ${opts.unsubscribeUrl}` : "",
  ]
    .filter((l, i, a) => !(l === "" && i === a.length - 1))
    .join("\n");

  return { subject, html: layout(html, footer, subject, opts.companyName), text };
}
