// =====================================================================
// Analyse des e-mails reçus (réponses des clients) — fonctions pures,
// sans dépendance : testées en Node, utilisées par l'Edge Function.
// =====================================================================

export type InboundKind = "reply" | "auto_reply" | "opt_out" | "suspicious";

export interface InboundMessage {
  from: string;
  subject?: string | null;
  text?: string | null;
  html?: string | null;
  headers?: Record<string, unknown> | null;
  authentication?: { spf?: unknown; dkim?: unknown; dmarc?: unknown } | null;
}

/** En-têtes en minuscules, valeurs en texte (Resend peut renvoyer des tableaux). */
export function normalizeHeaders(headers?: Record<string, unknown> | null): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers ?? {})) {
    out[k.toLowerCase()] = Array.isArray(v) ? v.map(String).join(", ") : String(v ?? "");
  }
  return out;
}

/** « Nom <adresse> » → adresse en minuscules. */
export function addressOnly(value: string) {
  const m = /<([^<>]+)>/.exec(value);
  return (m ? m[1] : value).trim().toLowerCase();
}

const AUTO_SUBJECT =
  /^(r[ée]ponse automatique|auto(matic)?[ -]?(reply|response|antwort)|out of (the )?office|absent|absence|en cong[ée]s?|abwesenheit|accus[ée] de r[ée]ception|delivery status notification|undeliver(able|ed)|mail delivery (failed|subsystem)|non remis|message non d[ée]livr[ée]|returned mail)\b/i;
const BOUNCE_SENDER = /^(mailer-daemon|postmaster|no-?reply|noreply|bounce[s]?)@/i;
const STOP_WORDS = /^(stop|stopp?ez|arr[eê]t(ez)?|d[ée]sinscri(s|ption|re|vez[- ]moi)|d[ée]sabonne(r|ment|z[- ]moi)|unsubscribe|ne plus (me )?(relancer|contacter))\b[\s.!]*$/i;

/** Réponse automatique (absence, accusé de réception, rebond renvoyé à l'adresse de réponse…). */
export function isAutoReply(msg: InboundMessage): boolean {
  const h = normalizeHeaders(msg.headers);
  const autoSubmitted = (h["auto-submitted"] ?? "").toLowerCase();
  if (autoSubmitted && autoSubmitted !== "no") return true;
  if (h["x-autoreply"] || h["x-autorespond"] || h["x-autoresponse"] || h["x-auto-reply"]) return true;
  if (/^(auto_reply|bulk|junk|list)$/i.test((h["precedence"] ?? "").trim())) return true;
  if (/multipart\/report/i.test(h["content-type"] ?? "")) return true;
  if (BOUNCE_SENDER.test(addressOnly(msg.from))) return true;
  const subject = (msg.subject ?? "").replace(/^\s*((re|tr|fw|fwd)\s*:\s*)+/i, "").trim();
  return AUTO_SUBJECT.test(subject);
}

/** Texte lisible à partir du HTML (balises retirées, entités courantes décodées). */
export function htmlToText(html: string) {
  return html
    .replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6]|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Premier contenu écrit par le client (sans la citation du message d'origine). */
export function firstWrittenLine(msg: InboundMessage) {
  const text = msg.text?.trim() ? msg.text : msg.html ? htmlToText(msg.html) : "";
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith(">")) break;
    return line;
  }
  return "";
}

/** Demande de désinscription : « STOP » en objet ou en première ligne du message. */
export function isOptOut(msg: InboundMessage) {
  const subject = (msg.subject ?? "").replace(/^\s*((re|tr|fw|fwd)\s*:\s*)+/i, "").trim();
  return STOP_WORDS.test(subject) || STOP_WORDS.test(firstWrittenLine(msg));
}

/** Expéditeur usurpé probable : DMARC en échec, ou SPF et DKIM tous deux en échec. */
export function isSpoofed(msg: InboundMessage) {
  const a = msg.authentication;
  if (!a) return false;
  const status = (v: unknown) => {
    if (typeof v === "string") return v.toLowerCase();
    if (v && typeof v === "object") return String((v as Record<string, unknown>).result ?? (v as Record<string, unknown>).status ?? "").toLowerCase();
    return "";
  };
  const fail = (s: string) => s === "fail" || s === "hardfail";
  if (fail(status(a.dmarc))) return true;
  return fail(status(a.spf)) && fail(status(a.dkim));
}

export function classifyInbound(msg: InboundMessage): InboundKind {
  if (isSpoofed(msg)) return "suspicious";
  if (isAutoReply(msg)) return "auto_reply";
  if (isOptOut(msg)) return "opt_out";
  return "reply";
}

/**
 * Jeton du devis visé. Seules les adresses de notre domaine de réception comptent ;
 * les destinataires principaux (« À ») passent avant les copies.
 * Plusieurs jetons différents → on prend le premier du champ « À » et on le signale.
 */
export function extractToken(
  fields: { to?: string[]; cc?: string[]; received_for?: string[] },
  inboundDomain: string,
): { token: string | null; ambiguous: boolean } {
  const domain = inboundDomain.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // bornes strictes : « mydevis-… » ou « …@reponses.jercat.fr.pirate.com » ne comptent pas
  const re = new RegExp(`(?:^|[^\\w.+-])devis-([a-f0-9]{24})@${domain || "[^\\s>]+"}(?![\\w.-])`, "i");
  const ordered = [...(fields.received_for ?? []), ...(fields.to ?? []), ...(fields.cc ?? [])];
  const tokens = ordered.map((a) => re.exec(a)?.[1]?.toLowerCase()).filter((t): t is string => Boolean(t));
  const unique = [...new Set(tokens)];
  return { token: unique[0] ?? null, ambiguous: unique.length > 1 };
}

/**
 * Texte écrit par le client, sans l'historique recopié sous sa réponse
 * (« Le … a écrit : », « De : … Envoyé : … », « -----Message d'origine----- », lignes « > »).
 * Si tout serait retiré (réponse placée sous la citation), le texte complet est gardé.
 */
export function stripQuoted(text: string): string {
  const src = (text ?? "").replace(/\r\n?/g, "\n");
  const markers = [
    /^[ \t]*(?:Le|On)[ \t][^\n]{0,200}?(?:\n[^\n]{0,200}?){0,2}(?:a[ \t]*\n?[ \t]*[ée]crit|wrote)[ \t]*:[ \t]*$/im,
    /^[ \t]*-{2,}[ \t]*(?:Original Message|Message d'origine|Message d’origine|Message transféré|Forwarded message)[^\n]*$/im,
    /^[ \t]*\*?(?:De|From)[ \t]*:\*?[ \t][^\n]+\n[ \t]*\*?(?:Envoyé|Sent|Date)[ \t]*:/im,
    /^[ \t]*_{8,}[ \t]*$/m,
  ];
  let cut = src.length;
  for (const re of markers) {
    const m = re.exec(src);
    if (m && m.index < cut) cut = m.index;
  }
  let main = src.slice(0, cut);
  // lignes citées « > » en fin de message
  const lines = main.split("\n");
  while (lines.length && (lines[lines.length - 1].trim() === "" || lines[lines.length - 1].trimStart().startsWith(">"))) lines.pop();
  main = lines.join("\n").trim();
  return main || src.trim();
}
