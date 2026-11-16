import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Déclencheur de secours (Vercel Cron, 1 fois par jour).
 * Le déclencheur principal est pg_cron dans Supabase (toutes les 15 min).
 * La base appelle elle-même l'Edge Function avec le secret de son coffre :
 * plus besoin que le CRON_SECRET de Vercel soit identique à celui de Supabase.
 * Aucun risque de doublon : chaque envoi est réservé une seule fois en base.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { data, error } = await createAdminClient().rpc("mailer_kick", { p_mode: "due" });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 502 });
  return NextResponse.json({ ok: true, request_id: data });
}
