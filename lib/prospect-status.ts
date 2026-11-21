/**
 * Statut d'envoi d'un prospect, affiché comme le statut d'un devis (même badge, mêmes couleurs :
 * gris en cours · orange en attente · bleu répondu · vert prouvé · rouge échec).
 */
type Tone = "pending" | "info" | "violet" | "signed" | "neutral" | "lost";
type A = { state: string; draft_method: string | null; channel: string };
type M = { direction: string; kind: string };

export function prospectDeliveryStatus(p: { do_not_contact_at: string | null; attempts: A[]; messages: M[] }): { label: string; tone: Tone } | null {
  if (p.do_not_contact_at) return { label: "Désinscrit (STOP)", tone: "neutral" };
  if (p.messages.some((m) => m.direction === "in" && m.kind === "reply")) return { label: "Répondu", tone: "info" };
  const email = p.attempts.filter((a) => a.channel === "email");
  const last = email[0];
  if (last?.state === "ouverte" && last.draft_method === "serveur") return { label: "Envoi en cours", tone: "neutral" };
  if (email.some((a) => a.state === "verifiee")) return { label: "Envoyé — prouvé", tone: "signed" };
  if (email.some((a) => a.state === "envoyee")) return { label: "Envoyé — preuve attendue", tone: "pending" };
  if (last?.state === "echec") return { label: "Échec d'envoi", tone: "lost" };
  if (email.some((a) => a.state === "declaree")) return { label: "Envoi déclaré", tone: "pending" };
  return null;
}
