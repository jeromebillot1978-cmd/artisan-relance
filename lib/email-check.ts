/**
 * Contrôles d'adresse e-mail partagés (formulaire + serveur).
 * Objectif : éviter l'envoi d'un devis dans le vide (faute de frappe dans le domaine)
 * ou vers une adresse technique d'Artisan Relance (boucle d'e-mails).
 */

// Fautes de frappe fréquentes → domaine correct
const TYPOS: Record<string, string> = {
  "gmail.con": "gmail.com", "gmail.co": "gmail.com", "gmail.cm": "gmail.com", "gmail.fr": "gmail.com",
  "gmial.com": "gmail.com", "gmal.com": "gmail.com", "gmaill.com": "gmail.com", "gnail.com": "gmail.com",
  "gamil.com": "gmail.com", "gmai.com": "gmail.com", "gmail.om": "gmail.com", "gmail.comm": "gmail.com",
  "hotmail.con": "hotmail.com", "hotmal.com": "hotmail.com", "hotmial.com": "hotmail.com", "hotmai.fr": "hotmail.fr",
  "hotmail.f": "hotmail.fr", "hotamil.fr": "hotmail.fr", "homail.fr": "hotmail.fr",
  "outlok.fr": "outlook.fr", "outlook.con": "outlook.com", "outllok.fr": "outlook.fr",
  "yahoo.con": "yahoo.com", "yaho.fr": "yahoo.fr", "yahoo.f": "yahoo.fr",
  "orange.f": "orange.fr", "orage.fr": "orange.fr", "ornage.fr": "orange.fr", "wanadoo.f": "wanadoo.fr", "wanado.fr": "wanadoo.fr",
  "free.f": "free.fr", "fre.fr": "free.fr", "sfr.f": "sfr.fr", "laposte.ne": "laposte.net", "lapost.net": "laposte.net",
  "icloud.con": "icloud.com", "iclou.com": "icloud.com", "live.f": "live.fr", "bbox.f": "bbox.fr",
};

const TECHNICAL = [/@reponses\.jercat\.fr$/i, /^relances@jercat\.fr$/i];

/** Message d'erreur en français, ou null si l'adresse est acceptable. */
export function emailIssue(address: string): string | null {
  const email = address.trim().toLowerCase();
  if (TECHNICAL.some((re) => re.test(email))) return "Adresse technique d'Artisan Relance : indiquez l'adresse du client.";
  const domain = email.split("@")[1] ?? "";
  const fix = TYPOS[domain];
  if (fix) return `Faute de frappe probable : vouliez-vous dire ${email.split("@")[0]}@${fix} ?`;
  if (/\.\./.test(email) || /^\.|\.@|@\./.test(email)) return "Adresse e-mail invalide (point mal placé).";
  if (domain && !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) return "Adresse e-mail invalide (domaine incorrect).";
  return null;
}
