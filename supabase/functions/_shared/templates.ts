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

/** Transfert à l'artisan d'une réponse reçue de son prospect. */
export function renderReplyForward(opts: {
  prospectName: string;
  originalSubject: string;
  from: string;
  receivedText?: string | null;
  receivedHtml?: string | null;
  companyName: string;
  dashboardUrl: string;
}): RenderedEmail {
  const subject = `Réponse de ${opts.prospectName} : ${opts.originalSubject}`.slice(0, 200);
  const banner = `<div style="margin:0 0 18px 0;padding:12px 14px;border-radius:8px;background:#ecfdf5;color:#065f46;font-size:14px;">
<strong>${escapeHtml(opts.prospectName)}</strong> a répondu à votre devis. Les relances automatiques sont arrêtées.<br>
Répondez directement à cet e-mail : votre réponse partira vers ${escapeHtml(opts.from)}.
<br><a href="${escapeHtml(opts.dashboardUrl)}" style="color:#065f46;">Voir le dossier</a></div>`;
  const original = opts.receivedText?.trim()
    ? textToHtml(opts.receivedText)
    : opts.receivedHtml
      ? `<div>${opts.receivedHtml}</div>`
      : `<p style="color:#71717a;">(message vide)</p>`;
  const inner = `${banner}<div style="border-left:3px solid #e4e4e7;padding-left:14px;">${original}</div>`;
  const text = [
    `${opts.prospectName} a répondu à votre devis. Les relances automatiques sont arrêtées.`,
    `Répondez directement à cet e-mail pour lui écrire (${opts.from}).`,
    `Dossier : ${opts.dashboardUrl}`,
    "",
    "----- Message reçu -----",
    opts.receivedText?.trim() || "(voir la version HTML)",
  ].join("\n");
  return {
    subject,
    html: layout(inner, "Transféré automatiquement par Artisan Relance.", subject, opts.companyName),
    text,
  };
}
