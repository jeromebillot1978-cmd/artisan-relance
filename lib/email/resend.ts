import "server-only";
import { Resend } from "resend";
import type { EmailType } from "@/types/database";
import { renderQuoteReminder, type QuoteEmailData } from "@/lib/email/templates";

let client: Resend | null = null;

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY manquant.");
  client ??= new Resend(process.env.RESEND_API_KEY);
  return client;
}

/** Nettoie le nom d'expéditeur (pas de guillemets ni chevrons). */
function senderName(name: string) {
  const clean = name.replace(/["<>]/g, "").trim();
  return clean || "Artisan Relance";
}

export async function sendQuoteReminder(params: {
  id: string; // id scheduled_emails -> clé d'idempotence
  type: EmailType;
  to: string;
  data: QuoteEmailData;
}) {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) throw new Error("RESEND_FROM_EMAIL manquant.");

  const { subject, html, text } = renderQuoteReminder(params.type, params.data);

  const { data, error } = await getResend().emails.send(
    {
      from: `${senderName(params.data.companyName)} <${from}>`,
      to: [params.to],
      replyTo: params.data.replyTo,
      subject,
      html,
      text,
      tags: [{ name: "type", value: params.type }],
    },
    { idempotencyKey: `scheduled-email-${params.id}` },
  );

  if (error) throw new Error(`${error.name}: ${error.message}`);
  return data?.id ?? null;
}
