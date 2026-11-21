/**
 * Construction de l'e-mail de prospection envoyé PAR LE SERVEUR — fonctions pures,
 * sans dépendance, testées par lib/prospect-email.test.ts.
 *
 * Règle absolue : chaque lien du texte devient une balise directe
 *   <a href="https://artisan-relance.jercat.fr/">https://artisan-relance.jercat.fr/</a>
 * sans redirection, sans paramètre de suivi, sans intermédiaire.
 * Le HTML est vérifié avant l'envoi (assertDirectLinks) : un lien réécrit bloque l'envoi.
 */
import { cleanLinks } from "./prospect-links.ts";

export type BuiltEmail = { subject: string; html: string; text: string; hrefs: string[] };

const URL_RE = /\bhttps?:\/\/[^\s<>"'«»]+/gi;
/** Ponctuation de fin de phrase collée à un lien : ne fait pas partie de l'adresse. */
const TRAILING = /[.,;:!?)\]]+$/;

/** Redirections et réécritures connues (Gmail, Outlook SafeLinks, Proofpoint). */
export const REWRITE_RE = /^https?:\/\/([a-z0-9-]+\.)*(google\.[a-z.]+\/url\?|safelinks\.protection\.outlook\.com\/|urldefense\.(com|proofpoint\.com)\/)/i;

export function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Une ligne de texte → HTML échappé, chaque URL transformée en lien direct. */
function lineToHtml(line: string, hrefs: Set<string>) {
  let out = "";
  let last = 0;
  for (const m of line.matchAll(URL_RE)) {
    let url = m[0];
    const tail = TRAILING.exec(url)?.[0] ?? "";
    if (tail) url = url.slice(0, -tail.length);
    out += escapeHtml(line.slice(last, m.index));
    hrefs.add(url);
    out += `<a href="${escapeHtml(url)}" style="color:#1d4ed8;">${escapeHtml(url)}</a>${escapeHtml(tail)}`;
    last = (m.index ?? 0) + m[0].length;
  }
  return out + escapeHtml(line.slice(last));
}

/** Texte saisi dans la fiche → e-mail HTML + texte brut, liens directs uniquement. */
export function buildProspectEmail(subject: string, message: string): BuiltEmail {
  const text = cleanLinks(message).replace(/\r\n?/g, "\n").trim();
  const hrefs = new Set<string>();
  const body = text
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px 0;">${p.split("\n").map((l) => lineToHtml(l, hrefs)).join("<br>")}</p>`)
    .join("\n");
  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#18181b;">
${body}
</body></html>`;
  return { subject: subject.replace(/[\r\n]+/g, " ").trim().slice(0, 200), html, text, hrefs: [...hrefs] };
}

/** Tous les href d'un HTML (entités &amp; décodées). */
export function extractHrefs(html: string): string[] {
  return [...new Set([...html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1].replace(/&amp;/g, "&")))];
}

/** Bloque l'envoi si un lien du HTML passe par une redirection. Renvoie la liste des href. */
export function assertDirectLinks(html: string): string[] {
  const hrefs = extractHrefs(html);
  const bad = hrefs.filter((h) => REWRITE_RE.test(h));
  if (bad.length) throw new Error(`Lien réécrit détecté avant l'envoi : ${bad.join(", ")}`);
  return hrefs;
}
