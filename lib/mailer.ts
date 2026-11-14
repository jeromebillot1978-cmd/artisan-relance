import "server-only";

export interface MailerResult {
  ok: boolean;
  processed?: number;
  sent?: number;
  failed?: number;
  results?: { ok: boolean; error?: string }[];
  error?: string;
}

/** Appelle l'Edge Function Supabase « campaign-mailer ». */
export async function runMailer(body: { mode: "due" } | { mode: "initial"; campaign_id: string }): Promise<MailerResult> {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/campaign-mailer`;
  const secret = process.env.CRON_SECRET;
  if (!secret) return { ok: false, error: "CRON_SECRET manquant" };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cron-secret": secret,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(body.mode === "initial" ? 25_000 : 55_000),
    });
    const data = (await res.json().catch(() => ({}))) as MailerResult;
    return res.ok ? data : { ok: false, error: data.error ?? `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

type ServerSupabase = Awaited<ReturnType<typeof import("@/lib/supabase/server").getUser>>["supabase"];

/**
 * Envoi immédiat du devis : la base appelle l'Edge Function avec le secret
 * du coffre (pg_net). On attend jusqu'à ~10 s la confirmation pour l'afficher.
 * Si rien n'est confirmé, le cron (toutes les 15 min) reprend l'envoi.
 */
export async function requestInitialSend(
  supabase: ServerSupabase,
  campaignId: string,
): Promise<"sent" | "failed" | "pending"> {
  const { error } = await supabase.rpc("request_initial_send", { p_campaign_id: campaignId });
  if (error) return "pending";
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const { data } = await supabase.from("campaigns").select("initial_send_status").eq("id", campaignId).maybeSingle();
    if (data?.initial_send_status === "sent") return "sent";
    if (data?.initial_send_status === "failed") return "failed";
  }
  return "pending";
}
