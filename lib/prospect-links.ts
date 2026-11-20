/**
 * Liens d'envoi de la prospection — fonctions pures, sans dépendance,
 * testées par lib/prospect-links.test.ts (node --experimental-strip-types).
 *
 * Pourquoi un lien différent par appareil (C3, M4, M5) :
 *  - Ordinateur : le lien web « /mail/u/<compte>/?view=cm » ouvre la fenêtre de rédaction
 *    du bon compte (ou fait se connecter à CE compte, puis revient au brouillon).
 *  - Android : un lien web Gmail ouvert sur téléphone tombe souvent sur l'appli ou le site
 *    mobile qui ignorent le brouillon. On cible directement l'appli Gmail par un « intent »,
 *    avec le lien web en solution de repli si l'appli n'est pas installée.
 *  - iPhone : schéma « googlegmail://co » de l'appli Gmail.
 *  - Partout : « mailto: » (appli e-mail par défaut) et copie manuelle en dernier recours.
 * Aucun de ces liens n'envoie quoi que ce soit : ils ouvrent un brouillon.
 * La PREUVE d'envoi vient de la copie cachée (Cci), quel que soit le lien utilisé.
 */

export type Platform = "desktop" | "android" | "ios";
export type DraftMethod = "gmail_web" | "gmail_app_android" | "gmail_app_ios" | "mailto";

export const PROSPECTION_SENDER = "jercat.bilman@gmail.com";
/** Au-delà, certains clients mobiles coupent les liens : on prévient et on propose la copie (Mo3). */
export const SAFE_LINK_LENGTH = 2000;

export function detectPlatform(userAgent: string, maxTouchPoints = 0): Platform {
  const ua = userAgent || "";
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  // iPadOS se présente comme un Mac : on le reconnaît à l'écran tactile
  if (/macintosh/i.test(ua) && maxTouchPoints > 1) return "ios";
  return "desktop";
}

/** Un champ téléphone peut contenir plusieurs numéros (« 03… / 07… ») : un lien par numéro (M10). */
export function phoneNumbers(raw: string | null | undefined): { label: string; href: string }[] {
  return (raw ?? "")
    .split(/\s*(?:\/|,|;|\bou\b|\bet\b)\s*/i)
    .map((s) => s.trim())
    .filter((s) => s.replace(/\D/g, "").length >= 10)
    .map((label) => {
      const digits = label.replace(/[^\d+]/g, "");
      // 0033 6… → +33 6…
      const href = `tel:${digits.startsWith("00") ? `+${digits.slice(2)}` : digits}`;
      return { label, href };
    });
}

/** Adresses officielles, écrites exactement ainsi dans les messages (barre finale comprise). */
export const CANONICAL_LINKS = ["https://artisan-relance.jercat.fr/", "https://pubartisanrelance.vercel.app/"] as const;

/**
 * Liens propres dans un message de prospection :
 *  1. toute redirection Google (« https://www.google.com/url?q=<lien>&… », souvent recopiée
 *     depuis un brouillon Gmail) est remplacée par le lien d'origine, sans paramètre ajouté ;
 *  2. les deux adresses officielles sont écrites exactement comme CANONICAL_LINKS
 *     (https, barre finale) quand elles désignent la page d'accueil.
 * Les autres liens et le reste du texte ne sont pas modifiés.
 */
export function cleanLinks(text: string): string {
  let out = (text ?? "").replace(
    /https?:\/\/(?:www\.)?google\.[a-z.]+\/url\?[^\s<>"']*/gi,
    (redirect) => {
      const query = redirect.slice(redirect.indexOf("?") + 1).replace(/&amp;/g, "&");
      const target = new URLSearchParams(query).get("q") ?? new URLSearchParams(query).get("url");
      return target && /^https?:\/\//i.test(target) ? target : redirect;
    },
  );
  for (const link of CANONICAL_LINKS) {
    const host = link.replace(/^https:\/\//, "").replace(/\/$/, "").replace(/\./g, "\\.");
    // l'adresse d'accueil, avec ou sans « https:// », « www. » ou barre finale — pas une sous-page
    out = out.replace(new RegExp(`(?<![\\w.@/-])(?:https?:\\/\\/)?(?:www\\.)?${host}\\/?(?![\\w/?#%-]|\\.[a-z])`, "gi"), link);
  }
  return out;
}

export type EmailDraft = { to: string; bcc: string; subject: string | null; body: string };

const enc = encodeURIComponent;

export function gmailWebUrl(d: EmailDraft, account = PROSPECTION_SENDER) {
  const p = new URLSearchParams({ view: "cm", fs: "1", to: d.to, bcc: d.bcc, su: d.subject ?? "", body: d.body });
  // Le « @ » est autorisé dans un chemin d'URL : le compte reste lisible et reconnu par Gmail
  return `https://mail.google.com/mail/u/${account.replace(/[^a-z0-9@._+-]/gi, "")}/?${p.toString()}`;
}

export function mailtoUrl(d: EmailDraft) {
  return `mailto:${d.to}?bcc=${enc(d.bcc)}&subject=${enc(d.subject ?? "")}&body=${enc(d.body)}`;
}

/** Android : ouvre l'appli Gmail (paquet com.google.android.gm), repli sur le web si absente. */
export function gmailAndroidIntentUrl(d: EmailDraft) {
  const query = `bcc=${enc(d.bcc)}&subject=${enc(d.subject ?? "")}&body=${enc(d.body)}`;
  return `intent:${d.to}?${query}#Intent;scheme=mailto;package=com.google.android.gm;S.browser_fallback_url=${enc(gmailWebUrl(d))};end`;
}

/** iPhone / iPad : appli Gmail. */
export function gmailIosUrl(d: EmailDraft) {
  return `googlegmail://co?to=${enc(d.to)}&bcc=${enc(d.bcc)}&subject=${enc(d.subject ?? "")}&body=${enc(d.body)}`;
}

export type DraftLink = { method: DraftMethod; label: string; href: string; primary: boolean; newTab: boolean; long: boolean };

/** Liens proposés, dans l'ordre recommandé pour l'appareil. */
export function emailDraftLinks(draft: EmailDraft, platform: Platform): DraftLink[] {
  const d = { ...draft, body: cleanLinks(draft.body) };
  const make = (method: DraftMethod, label: string, href: string, primary: boolean, newTab: boolean): DraftLink => ({
    method, label, href, primary, newTab, long: href.length > SAFE_LINK_LENGTH,
  });
  const mailto = make("mailto", "Autre appli e-mail", mailtoUrl(d), false, false);
  if (platform === "android") return [make("gmail_app_android", "Ouvrir dans l'appli Gmail", gmailAndroidIntentUrl(d), true, false), mailto];
  if (platform === "ios") return [make("gmail_app_ios", "Ouvrir dans l'appli Gmail", gmailIosUrl(d), true, false), mailto];
  return [make("gmail_web", "Ouvrir dans Gmail", gmailWebUrl(d), true, true), mailto];
}
