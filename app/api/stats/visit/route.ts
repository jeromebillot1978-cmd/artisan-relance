import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTrackablePath } from "@/lib/stats";
import { isAutomated } from "@/lib/reviews/public";

export const dynamic = "force-dynamic";

/**
 * Comptage anonyme des visites (sans cookie, sans IP stockée).
 * L'empreinte = hachage (secret + mois + IP + navigateur), tronqué : elle change chaque mois
 * et ne permet pas de retrouver la personne. Conservation 13 mois maximum.
 */
export async function POST(request: NextRequest) {
  const done = new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });

  // Uniquement depuis nos propres pages
  const site = request.nextUrl.host;
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== site) return done;

  const userAgent = request.headers.get("user-agent");
  if (isAutomated(userAgent)) return done;

  let body: { path?: unknown; referrer?: unknown };
  try {
    body = await request.json();
  } catch {
    return done;
  }
  const path = typeof body.path === "string" ? body.path.split("?")[0].split("#")[0] : "";
  if (!isTrackablePath(path)) return done;

  let referrerHost: string | null = null;
  if (typeof body.referrer === "string" && body.referrer) {
    try {
      const host = new URL(body.referrer).host.toLowerCase();
      if (host && host !== site) referrerHost = host.slice(0, 120);
    } catch {
      /* référent invalide : ignoré */
    }
  }

  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || request.headers.get("x-real-ip") || "";
  const salt = process.env.VISIT_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const month = new Date().toISOString().slice(0, 7);
  const visitor = createHash("sha256").update(`${salt}|${month}|${ip}|${userAgent}`).digest("hex").slice(0, 24);

  try {
    const { error } = await createAdminClient().rpc("record_site_visit", {
      p_visitor: visitor,
      p_path: path,
      p_referrer_host: referrerHost,
    });
    if (error) console.error("record_site_visit", error.message);
  } catch (e) {
    console.error("record_site_visit", e instanceof Error ? e.message : e);
  }
  return done;
}
