import "server-only";

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
