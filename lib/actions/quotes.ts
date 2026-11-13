"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUser } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/actions/types";
import type { QuoteStatus } from "@/types/database";

const quoteSchema = z.object({
  client_name: z.string().trim().min(2, "Nom du client requis.").max(120),
  client_email: z.string().trim().toLowerCase().email("E-mail du client invalide."),
  client_phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .transform((v) => v || null),
  reference: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((v) => v || null),
  amount: z
    .string()
    .trim()
    .transform((v) => Number(v.replace(/\s/g, "").replace(",", ".")))
    .pipe(z.number({ message: "Montant invalide." }).min(0, "Montant invalide.").max(10_000_000)),
  quote_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide."),
  notes: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => v || null),
});

function revalidateApp() {
  revalidatePath("/dashboard");
  revalidatePath("/devis");
}

export async function createQuote(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Session expirée. Reconnectez-vous." };

  const parsed = quoteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Vérifiez les champs.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Les relances J+4 / J+10 sont programmées par le déclencheur SQL
  const { error } = await supabase.from("quotes").insert({ ...parsed.data, user_id: user.id });
  if (error) {
    // Limite anti-abus définie côté base (trigger enforce_quote_quota)
    if (error.message?.includes("Limite")) return { error: error.message };
    return { error: "Impossible d'enregistrer le devis." };
  }

  revalidateApp();
  return { ok: true, message: "Devis ajouté. Les relances sont programmées." };
}

export async function updateQuote(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Session expirée. Reconnectez-vous." };

  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return { error: "Devis introuvable." };

  const parsed = quoteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Vérifiez les champs.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { error } = await supabase
    .from("quotes")
    .update(parsed.data)
    .eq("id", id.data)
    .eq("user_id", user.id);
  if (error) return { error: "Impossible de modifier le devis." };

  revalidateApp();
  return { ok: true, message: "Devis mis à jour." };
}

export async function setQuoteStatus(id: string, status: QuoteStatus): Promise<ActionState> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Session expirée. Reconnectez-vous." };
  if (!["pending", "signed", "lost"].includes(status)) return { error: "Statut invalide." };

  // Signé/perdu -> le déclencheur SQL annule les relances restantes
  const { error } = await supabase
    .from("quotes")
    .update({ status, signed_at: status === "signed" ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: "Impossible de changer le statut." };

  revalidateApp();
  const messages: Record<QuoteStatus, string> = {
    signed: "Bravo ! Devis signé, relances arrêtées.",
    lost: "Devis marqué perdu, relances arrêtées.",
    pending: "Devis remis en attente, relances reprogrammées.",
  };
  return { ok: true, message: messages[status] };
}

export async function deleteQuote(id: string): Promise<ActionState> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Session expirée. Reconnectez-vous." };

  const { error } = await supabase.from("quotes").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: "Impossible de supprimer le devis." };

  revalidateApp();
  return { ok: true, message: "Devis supprimé." };
}
