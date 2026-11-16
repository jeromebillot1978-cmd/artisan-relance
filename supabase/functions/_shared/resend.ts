// Client minimal de l'API Resend (fetch) pour les Edge Functions Deno.
const API = "https://api.resend.com";

function apiKey() {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) throw new Error("RESEND_API_KEY manquant");
  return key;
}

/**
 * Lecture des e-mails reçus (réponses des clients). Une clé « Sending access » ne peut pas
 * les lire (401) : on utilise une clé dédiée RESEND_RECEIVING_API_KEY (« Full access »),
 * la clé d'envoi restant limitée à l'envoi.
 */
function receivingKey() {
  return Deno.env.get("RESEND_RECEIVING_API_KEY") || apiKey();
}

export interface OutgoingAttachment {
  filename: string;
  path: string; // URL signée : Resend télécharge lui-même le fichier
}

export interface OutgoingEmail {
  from: string;
  to: string[];
  bcc?: string[];
  reply_to?: string | string[];
  subject: string;
  html: string;
  text: string;
  attachments?: OutgoingAttachment[];
  headers?: Record<string, string>;
  tags?: { name: string; value: string }[];
}

/** Envoie un e-mail. La clé d'idempotence empêche tout doublon côté Resend (24 h). */
export async function sendEmail(email: OutgoingEmail, idempotencyKey: string): Promise<string> {
  const res = await fetch(`${API}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(email),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Resend ${res.status} ${body?.name ?? ""}: ${body?.message ?? res.statusText}`.trim());
  }
  return String(body.id);
}

export interface ReceivedEmail {
  id: string;
  from: string;
  to: string[];
  subject: string | null;
  text: string | null;
  html: string | null;
  headers?: Record<string, unknown> | null;
  authentication?: { spf?: unknown; dkim?: unknown; dmarc?: unknown } | null;
  message_id?: string | null;
}

/** Message-ID réel d'un e-mail envoyé (pour relier les relances au devis d'origine). */
export async function getSentMessageId(id: string): Promise<string | null> {
  const res = await fetch(`${API}/emails/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${receivingKey()}` },
  });
  if (!res.ok) return null;
  const body = await res.json().catch(() => ({}));
  const value = typeof body?.message_id === "string" ? body.message_id.trim() : "";
  return /^<[^<>\s]+@[^<>\s]+>$/.test(value) ? value : null;
}

export async function getReceivedEmail(id: string): Promise<ReceivedEmail> {
  const res = await fetch(`${API}/emails/receiving/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${receivingKey()}` },
  });
  if (!res.ok) throw new Error(`Resend receiving ${res.status}`);
  return await res.json();
}

/** Pièces jointes d'un e-mail reçu (URL de téléchargement valables 1 h). */
export async function listReceivedAttachments(id: string): Promise<OutgoingAttachment[]> {
  const res = await fetch(`${API}/emails/receiving/${encodeURIComponent(id)}/attachments`, {
    headers: { Authorization: `Bearer ${receivingKey()}` },
  });
  if (!res.ok) return [];
  const body = await res.json().catch(() => ({}));
  const list: { filename?: string; download_url?: string }[] = body?.data ?? [];
  return list
    .filter((a) => a.download_url)
    .map((a) => ({ filename: a.filename ?? "piece-jointe", path: a.download_url as string }));
}

export function senderName(name: string) {
  return name.replace(/["<>\r\n]/g, "").trim().slice(0, 80) || "Artisan Relance";
}
