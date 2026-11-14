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
