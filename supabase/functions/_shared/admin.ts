import { createClient } from "npm:@supabase/supabase-js@2";

export const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Log structuré (visible dans Supabase > Edge Functions > Logs). */
export function log(event: string, data: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ event, ...data, at: new Date().toISOString() }));
}
