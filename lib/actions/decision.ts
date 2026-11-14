"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const inputSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{24}$/),
  decision: z.enum(["accept", "refuse"]),
  reason: z.string().trim().max(500).optional(),
});

export type DecisionState = { ok?: boolean; status?: "won" | "lost"; changed?: boolean; error?: string };

/** Décision du client depuis la page publique /d/<jeton> (sans compte). */
export async function submitDecision(input: z.input<typeof inputSchema>): Promise<DecisionState> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { error: "Lien invalide." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("client_decision", {
      p_token: parsed.data.token,
      p_decision: parsed.data.decision,
      p_reason: parsed.data.reason || null,
    })
    .single<{ status: "won" | "lost"; changed: boolean }>();
  if (error || !data) return { error: error?.message?.includes("Lien") ? error.message : "Une erreur est survenue. Réessayez." };
  return { ok: true, status: data.status, changed: data.changed };
}
