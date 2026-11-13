import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendQuoteReminder } from "@/lib/email/resend";
import type { DueEmail } from "@/types/database";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH_SIZE = 80; // ~45 s avec la pause anti rate-limit
const PAUSE_MS = 550; // Resend : 2 requêtes / seconde max (offre gratuite)
const MAX_ATTEMPTS = 3;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Tâche quotidienne (Vercel Cron, voir vercel.json) :
 * 1. réserve les e-mails dont la date d'envoi est atteinte
 * 2. les envoie via Resend
 * 3. met à jour leur statut (sent / failed)
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const startedAt = Date.now();

  // Sécurité : annule les relances de devis déjà signés / perdus
  const { data: cancelled } = await supabase.rpc("cancel_orphan_emails");

  const { data, error } = await supabase.rpc("claim_due_emails", { p_limit: BATCH_SIZE });
  if (error) {
    console.error("[cron] claim_due_emails", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const due = (data ?? []) as DueEmail[];
  let sent = 0;
  let failed = 0;

  for (const [index, email] of due.entries()) {
    if (index > 0) await sleep(PAUSE_MS);

    try {
      const providerId = await sendQuoteReminder({
        id: email.id,
        type: email.email_type,
        to: email.client_email,
        data: {
          clientName: email.client_name,
          amount: Number(email.amount),
          quoteDate: email.quote_date,
          reference: email.reference,
          companyName: email.company_name,
          contactName: email.contact_name,
          phone: email.phone,
          replyTo: email.reply_to_email || email.user_email,
        },
      });

      await supabase
        .from("scheduled_emails")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          provider_id: providerId,
          last_error: null,
        })
        .eq("id", email.id);
      sent++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[cron] échec envoi ${email.id}`, message);
      await supabase
        .from("scheduled_emails")
        .update({
          // "failed" est retenté au prochain passage tant que attempts < 3
          status: "failed",
          last_error: message.slice(0, 500),
        })
        .eq("id", email.id);
      failed++;
    }
  }

  const result = {
    ok: true,
    processed: due.length,
    sent,
    failed,
    cancelled: cancelled ?? 0,
    maxAttempts: MAX_ATTEMPTS,
    durationMs: Date.now() - startedAt,
  };
  console.log("[cron] send-reminders", result);
  return NextResponse.json(result);
}
