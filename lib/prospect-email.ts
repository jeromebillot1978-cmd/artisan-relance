/**
 * Construction de l'e-mail de prospection envoyé PAR LE SERVEUR — fonctions pures,
 * sans dépendance, testées par lib/prospect-email.test.ts.
 *
 * Règle absolue : chaque lien du texte devient une balise directe
 *   <a href="https://artisan-relance.jercat.fr/">https://artisan-relance.jercat.fr/</a>
 * sans redirection, sans paramètre de suivi, sans intermédiaire.
 * Le HTML est vérifié avant l'envoi (assertDirectLinks) : un lien réécrit bloque l'envoi.
 */
import { cleanLinks, SITE_LINK } from "./prospect-links.ts";

export type BuiltEmail = { subject: string; html: string; text: string; hrefs: string[] };

const URL_RE = /\bhttps?:\/\/[^\s<>"'«»]+/gi;
/** Ponctuation de fin de phrase collée à un lien : ne fait pas partie de l'adresse. */
const TRAILING = /[.,;:!?)\]]+$/;

/** Redirections et réécritures connues (Gmail, Outlook SafeLinks, Proofpoint). */
export const REWRITE_RE = /^https?:\/\/([a-z0-9-]+\.)*(google\.[a-z.]+\/url\?|safelinks\.protection\.outlook\.com\/|urldefense\.(com|proofpoint\.com)\/)/i;

export function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Une ligne de texte → HTML échappé, chaque URL transformée en lien direct (sans style : comme Gmail). */
function lineToHtml(line: string, hrefs: Set<string>) {
  let out = "";
  let last = 0;
  for (const m of line.matchAll(URL_RE)) {
    let url = m[0];
    const tail = TRAILING.exec(url)?.[0] ?? "";
    if (tail) url = url.slice(0, -tail.length);
    out += escapeHtml(line.slice(last, m.index));
    hrefs.add(url);
    out += `<a href="${escapeHtml(url)}">${escapeHtml(url)}</a>${escapeHtml(tail)}`;
    last = (m.index ?? 0) + m[0].length;
  }
  return out + escapeHtml(line.slice(last));
}

/** Ligne de signature ajoutée quand le message ne contient pas déjà le site. */
export const SITE_LINE = `Site web : ${SITE_LINK}`;

/**
 * Garantit le lien vers le site principal (https://dev.jercat.fr/) dans tout e-mail de prospection :
 *  - déjà présent (n'importe où) → texte inchangé, jamais de doublon ;
 *  - sinon, placé dans la signature : juste après la ligne du numéro de téléphone,
 *    à défaut juste après la ligne « Jercat », à défaut avant la phrase « STOP » finale,
 *    à défaut en fin de message (cas des réponses courtes envoyées depuis la fiche).
 */
export function ensureSiteLink(text: string): string {
  if (/(?:https?:\/\/)?(?:www\.)?dev\.jercat\.fr/i.test(text)) return text;
  const lines = text.split("\n");
  const phone = lines.findIndex((l) => /^\s*(?:tél[^:]*:\s*)?0\d(?:[\s.]?\d{2}){4}\s*$/i.test(l));
  if (phone >= 0) { lines.splice(phone + 1, 0, SITE_LINE); return lines.join("\n"); }
  const sig = lines.findIndex((l) => /^\s*jercat\s*$/i.test(l));
  if (sig >= 0) { lines.splice(sig + 1, 0, SITE_LINE); return lines.join("\n"); }
  const paras = text.split(/\n{2,}/);
  if (paras.length > 1 && /\bstop\b/i.test(paras[paras.length - 1])) {
    paras.splice(paras.length - 1, 0, SITE_LINE);
    return paras.join("\n\n");
  }
  return `${text}\n\n${SITE_LINE}`;
}

/**
 * Texte saisi dans la fiche → e-mail HTML + texte brut, liens directs uniquement.
 *
 * Délivrabilité (boîte de réception principale plutôt que « Promotions ») : le HTML reproduit
 * exactement la forme d'un e-mail tapé dans Gmail — un seul <div dir="ltr">, des <br>, des liens
 * nus — sans <!DOCTYPE>, sans <head>, sans couleur, sans police imposée, sans bouton ni image.
 * Le texte brut et le HTML contiennent donc les mêmes mots (ratio texte/HTML proche de 1).
 */
export function buildProspectEmail(subject: string, message: string): BuiltEmail {
  const text = ensureSiteLink(cleanLinks(message).replace(/\r\n?/g, "\n").trim());
  const hrefs = new Set<string>();
  const html = `<div dir="ltr">${text.split("\n").map((l) => lineToHtml(l, hrefs) || "").join("<br>")}</div>\n`;
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

// ---------------------------------------------------------------------------
// Modèle court « écrit à la main » + personnalisation (identique à _prospect_render en base)
// ---------------------------------------------------------------------------

/** Variables utilisables dans l'objet et le message. Remplacées au moment de l'envoi, côté base. */
export const TEMPLATE_VARIABLES = ["{prenom}", "{entreprise}", "{ville}"] as const;

export const DEFAULT_PROSPECT_SUBJECT = "Question pour {entreprise}";

/**
 * Modèle par défaut : court (~80 mots), une question, deux liens au plus, aucun mot publicitaire
 * (« gratuit », « offre », « promotion »…), signature simple, phrase de retrait en dernière ligne
 * (elle sert aussi au contrôle « message complet » de la preuve d'envoi).
 */
export const DEFAULT_PROSPECT_MESSAGE = `Bonjour {prenom},

J'ai vu le site de {entreprise} en cherchant des artisans à {ville}.

Une question : quand un client ne répond pas à un devis, qui s'occupe de le relancer chez vous ?

J'ai créé un petit outil qui fait ces relances par e-mail à votre place et vous prévient dès que le client répond. Vous pouvez le découvrir ici :
https://artisan-relance.jercat.fr/artisans

Jercat
Développeur web indépendant
https://dev.jercat.fr/
07 63 49 49 24

Si ce n'est pas pour vous, répondez « stop » et je ne vous écrirai plus.`;

/** « Liège (BE) » → « Liège », « Laon (02) » → « Laon ». */
export function cityLabel(city: string | null | undefined) {
  return (city ?? "").replace(/\s*\([^)]*\)\s*$/, "").trim();
}

/** Aperçu à l'écran : même règle que la base (sans prénom, « Bonjour {prenom}, » → « Bonjour, »). */
export function renderProspectTemplate(text: string, v: { firstName?: string | null; company?: string | null; city?: string | null }) {
  const fn = (v.firstName ?? "").trim();
  let t = fn ? text.replace(/\{prenom\}/gi, fn) : text.replace(/[ \t]*\{prenom\}/gi, "");
  t = t.replace(/\{entreprise\}/gi, (v.company ?? "").trim() || "votre entreprise");
  t = t.replace(/\{ville\}/gi, cityLabel(v.city) || "votre secteur");
  return t;
}

/** Variables inconnues restantes ({nom}, {prénom} mal écrit…) : la base refuse l'envoi. */
export function unknownVariables(text: string) {
  const known = new Set(TEMPLATE_VARIABLES.map((x) => x.toLowerCase()));
  return [...new Set((text.match(/\{[^{}\s]{1,30}\}/g) ?? []).filter((x) => !known.has(x.toLowerCase())))];
}

/** Mots et signes qui font « publicité » et poussent vers l'onglet Promotions ou les spams. */
const PROMO_WORDS = [
  "gratuit", "gratuitement", "offert", "offre", "promo", "promotion", "remise", "réduction", "-50", "%", "€",
  "cliquez ici", "cliquez", "urgent", "dernière chance", "exclusif", "garanti", "100 %", "sans engagement",
  "meilleur prix", "inscrivez-vous", "essai", "!!!", "$",
];

export type DeliverabilityCheck = { level: "ok" | "attention"; label: string };

/** Contrôle du texte avant envoi (affiché dans la fiche) : longueur, liens, mots publicitaires, majuscules. */
export function deliverabilityChecks(subject: string, message: string): DeliverabilityCheck[] {
  const out: DeliverabilityCheck[] = [];
  const text = `${subject}\n${message}`;
  const words = message.trim().split(/\s+/).filter(Boolean).length;
  const links = new Set((cleanLinks(ensureSiteLink(message)).match(URL_RE) ?? []).map((u) => u.replace(TRAILING, "")));
  const found = PROMO_WORDS.filter((w) => text.toLowerCase().includes(w.toLowerCase()));
  const caps = (subject.match(/\b[A-ZÀ-Ý]{4,}\b/g) ?? []).length;
  out.push(words <= 140 ? { level: "ok", label: `Message court (${words} mots)` } : { level: "attention", label: `Message long (${words} mots) : visez moins de 120 mots` });
  out.push(links.size <= 2 ? { level: "ok", label: `${links.size} lien${links.size > 1 ? "s" : ""}` } : { level: "attention", label: `${links.size} liens : gardez-en 2 au plus (artisan-relance.jercat.fr/artisans et dev.jercat.fr)` });
  out.push(found.length ? { level: "attention", label: `Mots publicitaires à éviter : ${found.join(", ")}` } : { level: "ok", label: "Aucun mot publicitaire" });
  if (caps) out.push({ level: "attention", label: "Objet avec des mots en MAJUSCULES" });
  if (/[!?]{2,}/.test(text)) out.push({ level: "attention", label: "Ponctuation répétée (!! ou ??)" });
  if (!/\{prenom\}|\{entreprise\}/i.test(text)) out.push({ level: "attention", label: "Pas de personnalisation : ajoutez {prenom} ou {entreprise}" });
  const unk = unknownVariables(text);
  if (unk.length) out.push({ level: "attention", label: `Variable inconnue : ${unk.join(", ")} (possibles : {prenom}, {entreprise}, {ville})` });
  return out;
}
