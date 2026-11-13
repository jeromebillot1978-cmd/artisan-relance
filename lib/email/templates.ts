import type { EmailType } from "@/types/database";
import { formatCurrency, formatDate } from "@/lib/utils";

export interface QuoteEmailData {
  clientName: string;
  amount: number;
  quoteDate: string;
  reference?: string | null;
  companyName: string;
  contactName?: string | null;
  phone?: string | null;
  replyTo: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export const EMAIL_SUBJECTS: Record<EmailType, string> = {
  quote_reminder_1: "Avez-vous eu le temps de consulter notre devis ?",
  quote_reminder_2: "Toujours intéressé par notre proposition ?",
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function bodyParagraphs(type: EmailType, d: QuoteEmailData): string[] {
  const devis = d.reference ? `notre devis n° ${d.reference}` : "notre devis";
  const details = `du ${formatDate(d.quoteDate, { month: "long" })} d'un montant de ${formatCurrency(d.amount)}`;

  if (type === "quote_reminder_1") {
    return [
      `Bonjour ${d.clientName},`,
      `Je me permets de revenir vers vous au sujet de ${devis} ${details}.`,
      `Avez-vous eu le temps d'en prendre connaissance ? Si vous avez la moindre question, ou si vous souhaitez ajuster certains points, je reste à votre entière disposition.`,
      `Il vous suffit de répondre directement à cet e-mail${d.phone ? ` ou de m'appeler au ${d.phone}` : ""}.`,
    ];
  }

  return [
    `Bonjour ${d.clientName},`,
    `Je reviens une dernière fois vers vous concernant ${devis} ${details}.`,
    `Votre projet est-il toujours d'actualité ? Si le devis vous convient, je peux vous proposer rapidement une date d'intervention. S'il ne correspond pas tout à fait à vos attentes, dites-le-moi : nous pouvons en discuter ensemble.`,
    `Et si votre projet a évolué, une simple réponse de votre part me permettra de mettre à jour mon planning.`,
  ];
}

export function renderQuoteReminder(type: EmailType, d: QuoteEmailData): RenderedEmail {
  const subject = EMAIL_SUBJECTS[type];
  const paragraphs = bodyParagraphs(type, d);
  const signatureLines = [d.contactName, d.companyName, d.phone, d.replyTo].filter(Boolean) as string[];

  const text = [
    ...paragraphs,
    "",
    "Bien cordialement,",
    ...signatureLines,
  ].join("\n\n");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;">
          <tr>
            <td style="padding:24px 28px 8px 28px;font-size:13px;font-weight:600;color:#71717a;letter-spacing:.02em;">
              ${escapeHtml(d.companyName || "")}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 8px 28px;font-size:15px;line-height:1.65;">
              ${paragraphs.map((p) => `<p style="margin:0 0 14px 0;">${escapeHtml(p)}</p>`).join("\n              ")}
              <p style="margin:22px 0 4px 0;">Bien cordialement,</p>
              <p style="margin:0;font-weight:600;">${escapeHtml(d.contactName || d.companyName || "")}</p>
              ${d.contactName && d.companyName ? `<p style="margin:0;color:#52525b;">${escapeHtml(d.companyName)}</p>` : ""}
              ${d.phone ? `<p style="margin:0;color:#52525b;">${escapeHtml(d.phone)}</p>` : ""}
              <p style="margin:0 0 8px 0;color:#52525b;">${escapeHtml(d.replyTo)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 24px 28px;border-top:1px solid #f4f4f5;font-size:12px;line-height:1.5;color:#a1a1aa;">
              Vous recevez ce message suite à la demande de devis effectuée auprès de ${escapeHtml(d.companyName || "notre entreprise")}. Pour ne plus être relancé, répondez simplement « STOP » à cet e-mail.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}

/** Données fictives pour l'aperçu dans les paramètres. */
export function sampleEmailData(partial: Partial<QuoteEmailData>): QuoteEmailData {
  return {
    clientName: "Mme Martin",
    amount: 4850,
    quoteDate: new Date().toISOString().slice(0, 10),
    reference: "D-2026-042",
    companyName: partial.companyName || "Votre entreprise",
    contactName: partial.contactName ?? null,
    phone: partial.phone ?? null,
    replyTo: partial.replyTo || "contact@votre-entreprise.fr",
  };
}
