import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Prospection (espace administrateur). Aucun envoi automatique : ces données
 * ne sont lues par aucun mailer ni tâche planifiée. L'administrateur envoie
 * lui-même chaque message depuis sa boîte e-mail, puis met à jour le statut.
 */
export const PROSPECT_STATUSES = [
  { value: "a_valider", label: "À valider" },
  { value: "valide", label: "Validé, prêt à envoyer" },
  { value: "envoye", label: "Envoyé" },
  { value: "repondu", label: "A répondu" },
  { value: "pas_interesse", label: "Pas intéressé" },
] as const;

export type ProspectStatus = (typeof PROSPECT_STATUSES)[number]["value"];

export type Prospect = {
  id: string;
  company: string;
  city: string;
  trade: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  channel: "email" | "formulaire" | "telephone";
  why: string;
  findings: string;
  subject: string | null;
  message: string;
  caution: string | null;
  status: ProspectStatus;
  notes: string;
  sent_at: string | null;
  position: number;
};

export async function getProspects(): Promise<Prospect[] | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prospects")
    .select("id, company, city, trade, website, email, phone, channel, why, findings, subject, message, caution, status, notes, sent_at, position")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("prospects", error.message);
    return null;
  }
  return data as Prospect[];
}
