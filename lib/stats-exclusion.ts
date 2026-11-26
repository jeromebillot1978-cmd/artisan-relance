/**
 * Ce qui n'est PAS compté dans les statistiques de visites (Vercel Analytics + compteur maison).
 *
 * 1. Les pages privées : application, administration (dont /prospection) et pages de connexion.
 *    « /inscription » reste comptée : c'est la page où un visiteur devient utilisateur.
 * 2. Les visites de l'administrateur sur tout le site, y compris les pages publiques :
 *    dès qu'il ouvre l'administration, son navigateur est marqué (localStorage) et ses visites
 *    suivantes ne sont plus comptées. Rien n'est envoyé : le marquage reste dans le navigateur.
 */
export const PRIVATE_PATH =
  /^\/(dashboard|devis|parametres|avis-google|statistiques|prospection|connexion|mot-de-passe-oublie|reinitialiser-mot-de-passe|auth|r)(\/|$)/;

/** Pages qui marquent le navigateur comme « administrateur » (jamais visitées par un prospect). */
const ADMIN_PATH = /^\/(prospection|statistiques)(\/|$)/;

const KEY = "ar-stats-ignorer";

export function isPrivatePath(pathname: string) {
  return PRIVATE_PATH.test(pathname);
}

/** À appeler à chaque page vue : marque le navigateur si c'est une page d'administration. */
export function markAdminIfNeeded(pathname: string) {
  if (!ADMIN_PATH.test(pathname)) return;
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* navigation privée, stockage bloqué : sans effet */
  }
}

export function isAdminBrowser() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** Vrai si cette page vue ne doit pas être comptée. */
export function shouldSkipStats(pathname: string) {
  markAdminIfNeeded(pathname);
  return isPrivatePath(pathname) || isAdminBrowser();
}
