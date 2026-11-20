import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Prospection v2 (espace administrateur).
 *
 * Trois notions séparées, jamais confondues à l'écran :
 *   - l'ÉTAPE commerciale du prospect (décision humaine) ;
 *   - les TENTATIVES de contact (e-mail, formulaire, appel), chacune avec son état ;
 *   - la PREUVE de chaque tentative (aucune, déclaration, copie cachée reçue, API Gmail).
 *
 * Aucune donnée affichée ne doit laisser croire qu'une action a eu lieu sans preuve.
 * Aucun envoi automatique : l'envoi est toujours fait à la main par l'administrateur.
 */

export type Stage = "a_preparer" | "pret" | "contacte" | "en_discussion" | "interesse" | "pas_interesse" | "ne_plus_contacter";
export type Channel = "email" | "formulaire" | "telephone";
export type AttemptState = "ouverte" | "declaree" | "verifiee" | "echec" | "annulee";
export type Proof = "aucune" | "declaration" | "cci_recue" | "gmail_api";
export type CallOutcome = "joint" | "messagerie" | "pas_de_reponse" | "faux_numero" | "a_rappeler";

/** Libellés de l'étape : décrivent une situation commerciale, jamais une action technique. */
export const STAGE_LABEL: Record<Stage, string> = {
  a_preparer: "Message à relire",
  pret: "Message relu, pas encore contacté",
  contacte: "Contacté, en attente de réponse",
  en_discussion: "En discussion",
  interesse: "Intéressé",
  pas_interesse: "Pas intéressé",
  ne_plus_contacter: "Ne plus contacter (STOP)",
};

export type Attempt = {
  id: string;
  channel: Channel;
  state: AttemptState;
  proof: Proof;
  bcc_token: string | null;
  to_address: string | null;
  subject_snapshot: string | null;
  message_snapshot: string | null;
  call_outcome: CallOutcome | null;
  verified_from: string | null;
  failure_reason: string | null;
  cancel_reason: string | null;
  opened_at: string;
  declared_at: string | null;
  verified_at: string | null;
};

export type ProspectEvent = { id: number; attempt_id: string | null; type: string; actor: string; detail: Record<string, unknown>; created_at: string };

export type Prospect = {
  id: string;
  company: string;
  city: string;
  trade: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  channel: Channel;
  why: string;
  findings: string;
  subject: string | null;
  message: string;
  caution: string | null;
  notes: string;
  stage: Stage;
  approved_at: string | null;
  do_not_contact_at: string | null;
  do_not_contact_reason: string | null;
  next_action_at: string | null;
  is_test: boolean;
  version: number;
  attempts: Attempt[];
  events: ProspectEvent[];
};

const PROSPECT_COLUMNS =
  "id, company, city, trade, website, email, phone, channel, why, findings, subject, message, caution, notes, stage, approved_at, do_not_contact_at, do_not_contact_reason, next_action_at, is_test, version, position";

export async function getProspects(): Promise<Prospect[] | null> {
  const supabase = await createClient();
  const [p, a, e] = await Promise.all([
    supabase.from("prospects").select(PROSPECT_COLUMNS).is("archived_at", null).order("is_test", { ascending: false }).order("position"),
    supabase
      .from("prospect_attempts")
      .select("id, prospect_id, channel, state, proof, bcc_token, to_address, subject_snapshot, message_snapshot, call_outcome, verified_from, failure_reason, cancel_reason, opened_at, declared_at, verified_at")
      .order("opened_at", { ascending: false }),
    supabase.from("prospect_events").select("id, prospect_id, attempt_id, type, actor, detail, created_at").order("id", { ascending: false }).limit(500),
  ]);
  if (p.error || a.error || e.error) {
    console.error("prospects", p.error?.message ?? a.error?.message ?? e.error?.message);
    return null;
  }
  return (p.data ?? []).map((row) => ({
    ...(row as Omit<Prospect, "attempts" | "events">),
    attempts: (a.data ?? []).filter((x) => x.prospect_id === row.id) as Attempt[],
    events: (e.data ?? []).filter((x) => x.prospect_id === row.id) as ProspectEvent[],
  }));
}

/** Adresse de copie cachée qui sert de PREUVE d'envoi (reçue par la plateforme). */
export function proofAddress(token: string) {
  const domain = process.env.INBOUND_DOMAIN || "reponses.jercat.fr";
  return `prospect-${token}@${domain}`;
}
