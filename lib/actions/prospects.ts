"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUser } from "@/lib/supabase/server";

/**
 * Actions de prospection. Chaque action appelle UNE fonction de base de données,
 * qui vérifie les règles métier et écrit le journal. L'application n'écrit plus
 * jamais directement dans les tables (la base le refuse).
 * Aucune de ces actions n'envoie quoi que ce soit.
 */

export type ProspectActionResult = { ok: true; data?: unknown } | { ok: false; error: string; conflict?: boolean };

const uuid = z.string().uuid();
const version = z.number().int().positive();

async function call(fn: string, args: Record<string, unknown>): Promise<ProspectActionResult> {
  const { supabase, user } = await getUser();
  if (!user) return { ok: false, error: "Session expirée. Reconnectez-vous." };
  const { data, error } = await supabase.rpc(fn, args);
  if (error) {
    // Les fonctions renvoient des messages clairs en français (code P0001) : on les affiche tels quels.
    console.error(`prospect action ${fn}`, error.code, error.message);
    const readable = error.code === "P0001" || error.code === "40001" || error.code === "42501" || error.code === "P0002";
    return {
      ok: false,
      conflict: error.code === "40001",
      error: readable ? error.message : "Action impossible pour le moment. Rien n'a été enregistré.",
    };
  }
  revalidatePath("/prospection");
  return { ok: true, data };
}

export async function approveMessage(id: string, v: number) {
  return call("prospect_approve", { p_id: uuid.parse(id), p_version: version.parse(v) });
}

export async function startAttempt(id: string, channel: "email" | "formulaire" | "telephone", v: number) {
  return call("prospect_start_attempt", {
    p_id: uuid.parse(id),
    p_channel: z.enum(["email", "formulaire", "telephone"]).parse(channel),
    p_version: version.parse(v),
  });
}

export async function declareAttempt(attemptId: string, confirmations: string[], callOutcome?: string) {
  return call("prospect_declare_attempt", {
    p_attempt_id: uuid.parse(attemptId),
    p_confirmations: z.array(z.string().max(40)).max(10).parse(confirmations),
    p_call_outcome: callOutcome ? z.enum(["joint", "messagerie", "pas_de_reponse", "faux_numero", "a_rappeler"]).parse(callOutcome) : null,
  });
}

export async function cancelAttempt(attemptId: string, reason: string) {
  return call("prospect_cancel_attempt", { p_attempt_id: uuid.parse(attemptId), p_reason: z.string().trim().min(3).max(500).parse(reason) });
}

export async function failAttempt(attemptId: string, reason: string) {
  return call("prospect_fail_attempt", { p_attempt_id: uuid.parse(attemptId), p_reason: z.string().trim().min(3).max(500).parse(reason) });
}

export async function recordReply(id: string, kind: "positive" | "question" | "negative" | "stop", note: string, v: number) {
  return call("prospect_record_reply", {
    p_id: uuid.parse(id),
    p_kind: z.enum(["positive", "question", "negative", "stop"]).parse(kind),
    p_note: z.string().max(1000).parse(note),
    p_version: version.parse(v),
  });
}

export async function doNotContact(id: string, reason: string, v: number) {
  return call("prospect_do_not_contact", { p_id: uuid.parse(id), p_reason: z.string().trim().min(3).max(500).parse(reason), p_version: version.parse(v) });
}

export async function updateNotes(id: string, notes: string, v: number) {
  return call("prospect_update_notes", { p_id: uuid.parse(id), p_notes: z.string().max(2000).parse(notes), p_version: version.parse(v) });
}

export async function archiveProspect(id: string, archive: boolean, v: number) {
  return call("prospect_archive", { p_id: uuid.parse(id), p_archive: archive, p_version: version.parse(v) });
}
