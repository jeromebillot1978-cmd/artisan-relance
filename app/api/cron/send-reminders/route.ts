import { NextResponse, type NextRequest } from "next/server";
import { runMailer } from "@/lib/mailer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Déclencheur de secours (Vercel Cron, 1 fois / jour).
 * Le déclencheur principal est pg_cron dans Supabase (toutes les 15 min).
 * Aucun risque de doublon : chaque envoi est réservé une seule fois en base.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const result = await runMailer({ mode: "due" });
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
