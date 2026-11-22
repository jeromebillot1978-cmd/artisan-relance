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
 * E-mails : envoyés par le serveur (Gmail SMTP) en un clic, puis prouvés par la copie cachée reçue.
 */

export type Stage = "a_preparer" | "pret" | "contacte" | "en_discussion" | "interesse" | "pas_interesse" | "ne_plus_contacter";
export type Channel = "email" | "formulaire" | "telephone";
export type AttemptState = "ouverte" | "envoyee" | "declaree" | "verifiee" | "echec" | "annulee";
export type Proof = "aucune" | "declaration" | "smtp" | "cci_recue" | "gmail_api";
export type CallOutcome = "joint" | "messagerie" | "pas_de_reponse" | "faux_numero" | "a_rappeler";
export type DraftMethod = "gmail_web" | "gmail_app_android" | "gmail_app_ios" | "mailto" | "copie" | "site_ouvert" | "numero_compose" | "manuel" | "serveur";
export type ContentCheck = "complet" | "tronque" | "inconnu";

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
  /** Niveau 2 : brouillon (ou site, ou numéro) réellement ouvert depuis la page */
  draft_opened_at: string | null;
  draft_method: DraftMethod | null;
  verified_from: string | null;
  /** Niveau 4 : la copie reçue venait d'un autre compte que celui de prospection */
  wrong_sender: boolean;
  /** Niveau 4 : le texte reçu contient-il la fin du message prévu ? */
  content_check: ContentCheck | null;
  failure_reason: string | null;
  cancel_reason: string | null;
  opened_at: string;
  declared_at: string | null;
  verified_at: string | null;
  closed_at: string | null;
  /** Envoi serveur : Gmail a accepté le message (date, heure, Message-ID, réponse SMTP) */
  sent_at: string | null;
  smtp_message_id: string | null;
  smtp_response: string | null;
  send_duration_ms: number | null;
  /** Diagnostic des liens : href du HTML envoyé / du HTML réellement reçu (copie cachée) */
  sent_hrefs: string[] | null;
  received_hrefs: string[] | null;
  link_rewrite_detected: boolean | null;
};

/** Message échangé avec le prospect (mêmes champs que campaign_messages). */
export type ProspectMessage = {
  id: string;
  direction: "in" | "out";
  kind: "reply" | "auto_reply" | "opt_out" | "suspicious" | "jercat";
  from_address: string | null;
  subject: string | null;
  body: string;
  status: "received" | "sending" | "sent" | "failed";
  error: string | null;
  files_note: string | null;
  read_at: string | null;
  sent_at: string | null;
  created_at: string;
};

export type ProspectEvent = { id: number; attempt_id: string | null; type: string; actor: string; detail: Record<string, unknown>; created_at: string };

export type Prospect = {
  id: string;
  company: string;
  /** Prénom du contact (facultatif), pour « Bonjour {prenom}, » */
  first_name: string | null;
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
  /** Vrai seulement si le texte ACTUEL est celui qui a été validé */
  approved_current: boolean;
  do_not_contact_at: string | null;
  do_not_contact_reason: string | null;
  next_action_at: string | null;
  source_label: string | null;
  source_url: string | null;
  source_checked_at: string | null;
  archived_at: string | null;
  is_test: boolean;
  version: number;
  attempts: Attempt[];
  events: ProspectEvent[];
  messages: ProspectMessage[];
};

const PROSPECT_COLUMNS =
  "id, company, first_name, city, trade, website, email, phone, channel, why, findings, subject, message, caution, notes, stage, approved_at, approved_message_md5, do_not_contact_at, do_not_contact_reason, next_action_at, source_label, source_url, source_checked_at, archived_at, is_test, version, position";
const ATTEMPT_COLUMNS =
  "id, prospect_id, channel, state, proof, bcc_token, to_address, subject_snapshot, message_snapshot, call_outcome, draft_opened_at, draft_method, verified_from, wrong_sender, content_check, failure_reason, cancel_reason, opened_at, declared_at, verified_at, closed_at, sent_at, smtp_message_id, smtp_response, send_duration_ms, sent_hrefs, received_hrefs, link_rewrite_detected";

/**
 * Empreinte du texte, calculée comme en base (_prospect_md5 : objet + « | » + message).
 * Sert seulement à l'AFFICHAGE « texte validé » ; c'est la base qui décide.
 */
async function textMd5(subject: string | null, message: string) {
  const { createHash } = await import("node:crypto");
  return createHash("md5").update(`${subject ?? ""}|${message ?? ""}`).digest("hex");
}

/** archived = true : seulement les archives ; sinon seulement les prospects actifs. */
export async function getProspects({ archived = false } = {}): Promise<Prospect[] | null> {
  const supabase = await createClient();
  let pq = supabase.from("prospects").select(PROSPECT_COLUMNS);
  pq = archived ? pq.not("archived_at", "is", null) : pq.is("archived_at", null);
  const [p, a, e, m] = await Promise.all([
    pq.order("is_test", { ascending: false }).order("position"),
    supabase.from("prospect_attempts").select(ATTEMPT_COLUMNS).order("opened_at", { ascending: false }),
    // Pas de limite globale : une limite ferait disparaître l'historique des prospects les plus anciens (Mi).
    supabase.from("prospect_events").select("id, prospect_id, attempt_id, type, actor, detail, created_at").order("id", { ascending: false }),
    supabase
      .from("prospect_messages")
      .select("id, prospect_id, direction, kind, from_address, subject, body, status, error, files_note, read_at, sent_at, created_at")
      .order("created_at"),
  ]);
  if (p.error || a.error || e.error || m.error) {
    console.error("prospects", p.error?.message ?? a.error?.message ?? e.error?.message ?? m.error?.message);
    return null;
  }
  return Promise.all(
    (p.data ?? []).map(async (row) => {
      const { approved_message_md5, ...rest } = row as typeof row & { approved_message_md5: string | null };
      return {
        ...(rest as unknown as Omit<Prospect, "attempts" | "events" | "approved_current">),
        approved_current: Boolean(approved_message_md5) && approved_message_md5 === (await textMd5(row.subject, row.message)),
        attempts: (a.data ?? []).filter((x) => x.prospect_id === row.id) as Attempt[],
        events: (e.data ?? []).filter((x) => x.prospect_id === row.id) as ProspectEvent[],
        messages: (m.data ?? []).filter((x) => x.prospect_id === row.id) as ProspectMessage[],
      };
    }),
  );
}

/** Adresse de copie cachée qui sert de PREUVE d'envoi (reçue par la plateforme). */
export function proofAddress(token: string) {
  const domain = process.env.INBOUND_DOMAIN || "reponses.jercat.fr";
  return `prospect-${token}@${domain}`;
}
