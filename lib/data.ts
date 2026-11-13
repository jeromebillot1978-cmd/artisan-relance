import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import type { Profile, QuoteWithEmails } from "@/types/database";

/** Utilisateur + profil, mis en cache pour la durée d'une requête. */
export const requireUser = cache(async () => {
  const { supabase, user } = await getUser();
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();

  return {
    supabase,
    user,
    profile:
      profile ??
      ({
        id: user.id,
        email: user.email ?? "",
        company_name: "",
        contact_name: null,
        phone: null,
        reply_to_email: null,
        plan: "free",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } satisfies Profile),
  };
});

export async function getQuotes() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("quotes")
    .select("*, scheduled_emails(id, send_date, email_type, status, sent_at)")
    .eq("user_id", user.id)
    .order("quote_date", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<QuoteWithEmails[]>();

  if (error) throw new Error(error.message);
  return data ?? [];
}

export function computeStats(quotes: QuoteWithEmails[]) {
  const pending = quotes.filter((q) => q.status === "pending");
  const signed = quotes.filter((q) => q.status === "signed");
  const lost = quotes.filter((q) => q.status === "lost");
  const closed = signed.length + lost.length;

  return {
    total: quotes.length,
    pending: pending.length,
    signed: signed.length,
    lost: lost.length,
    conversionRate: closed > 0 ? Math.round((signed.length / closed) * 100) : null,
    amountWon: signed.reduce((sum, q) => sum + Number(q.amount), 0),
    amountPending: pending.reduce((sum, q) => sum + Number(q.amount), 0),
    remindersSent: quotes.reduce(
      (sum, q) => sum + q.scheduled_emails.filter((e) => e.status === "sent").length,
      0,
    ),
  };
}

export function nextReminder(quote: QuoteWithEmails) {
  if (quote.status !== "pending") return null;
  return (
    quote.scheduled_emails
      .filter((e) => e.status === "pending" || e.status === "failed" || e.status === "processing")
      .sort((a, b) => a.send_date.localeCompare(b.send_date))[0] ?? null
  );
}
