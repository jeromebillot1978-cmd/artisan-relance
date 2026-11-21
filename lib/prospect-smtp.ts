import "server-only";
import nodemailer from "nodemailer";

/**
 * Envoi SMTP direct depuis la boîte Gmail de prospection (côté serveur uniquement).
 *
 * Pourquoi Gmail SMTP et pas Resend : la politique d'utilisation de Resend interdit la
 * prospection à froid. Resend reste réservé aux e-mails des artisans (devis, relances),
 * qui ne doivent pas être mis en danger par une suspension du compte.
 *
 * Configuration (variables d'environnement Vercel, jamais dans le code) :
 *   PROSPECTION_SMTP_USER      adresse Gmail d'envoi (défaut : jercat.bilman@gmail.com)
 *   PROSPECTION_SMTP_PASSWORD  mot de passe d'application Google (16 caractères)
 *   PROSPECTION_FROM_NAME      nom affiché (défaut : « Jercat »)
 */
export const PROSPECTION_SMTP_USER = (process.env.PROSPECTION_SMTP_USER || "jercat.bilman@gmail.com").trim().toLowerCase();

export function smtpConfigured() {
  return Boolean(process.env.PROSPECTION_SMTP_PASSWORD?.replace(/\s/g, ""));
}

export type SmtpResult = { messageId: string; response: string; accepted: string[]; rejected: string[]; durationMs: number };

/** Messages d'erreur SMTP traduits pour l'écran (la réponse brute reste dans le journal). */
export function explainSmtpError(e: unknown): { message: string; response: string | null } {
  const err = e as { code?: string; responseCode?: number; response?: string; message?: string };
  const response = err.response ?? null;
  const raw = `${err.responseCode ?? ""} ${err.response ?? err.message ?? ""}`;
  if (err.responseCode === 535 || /Username and Password not accepted|BadCredentials/i.test(raw)) {
    return { message: "Gmail a refusé les identifiants : vérifiez le mot de passe d'application (PROSPECTION_SMTP_PASSWORD).", response };
  }
  if (/Daily user sending limit|sending limit exceeded|5\.4\.5/i.test(raw)) {
    return { message: "Limite d'envoi quotidienne de Gmail atteinte. Réessayez demain.", response };
  }
  if (err.responseCode && err.responseCode >= 550 && err.responseCode < 560) {
    return { message: `Adresse refusée par le serveur de destination (${err.responseCode}).`, response };
  }
  if (err.code === "ETIMEDOUT" || err.code === "ECONNECTION" || err.code === "ESOCKET" || /timeout/i.test(raw)) {
    return { message: "Gmail ne répond pas (délai dépassé). Rien n'a été envoyé : réessayez dans un instant.", response };
  }
  return { message: `Envoi refusé par Gmail : ${(err.message ?? "erreur inconnue").slice(0, 300)}`, response };
}

export type ProspectMail = {
  to: string;
  /** Copie cachée de preuve (envoi initial uniquement) */
  bcc?: string;
  subject: string;
  html: string;
  text: string;
  /** Adresse de réponse : prospect-reponse-<jeton>@reponses.jercat.fr (réponses gérées comme pour les devis) */
  replyTo: string;
  /** Même fil de discussion chez le destinataire */
  inReplyTo?: string | null;
  /** Référence interne pour le journal (tentative ou message) */
  ref: string;
};

/** Adresse de réponse d'un prospect (comme devis-<jeton>@… pour les devis). */
export function prospectReplyAddress(token: string) {
  return `prospect-reponse-${token}@${process.env.INBOUND_DOMAIN || "reponses.jercat.fr"}`;
}

export async function sendProspectSmtp(mail: ProspectMail): Promise<SmtpResult> {
  const pass = (process.env.PROSPECTION_SMTP_PASSWORD ?? "").replace(/\s/g, "");
  if (!pass) throw Object.assign(new Error("PROSPECTION_SMTP_PASSWORD manquant"), { code: "ENOCONFIG" });
  const fromName = (process.env.PROSPECTION_FROM_NAME || "Jercat").replace(/["<>\r\n]/g, "").trim();
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: PROSPECTION_SMTP_USER, pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  const started = Date.now();
  const info = await transport.sendMail({
    from: { name: fromName, address: PROSPECTION_SMTP_USER },
    to: mail.to,
    bcc: mail.bcc,
    replyTo: mail.replyTo,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
    ...(mail.inReplyTo ? { inReplyTo: mail.inReplyTo, references: [mail.inReplyTo] } : {}),
    // Désinscription : même en-tête que les devis (« STOP » vers l'adresse de réponse, traité automatiquement)
    headers: {
      "List-Unsubscribe": `<mailto:${mail.replyTo}?subject=STOP>`,
      "X-Prospect-Ref": mail.ref,
    },
  });
  transport.close();
  return {
    messageId: String(info.messageId ?? ""),
    response: String(info.response ?? ""),
    accepted: (info.accepted ?? []).map(String),
    rejected: (info.rejected ?? []).map(String),
    durationMs: Date.now() - started,
  };
}
