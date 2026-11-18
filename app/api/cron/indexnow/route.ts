import { NextResponse, type NextRequest } from "next/server";
import { changedUrls, submitToIndexNow } from "@/lib/indexnow";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron, 1 fois par jour : envoie à IndexNow les pages du sitemap modifiées
 * depuis 3 jours (marge si un passage est manqué). « ?all=1 » envoie tout le sitemap.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const all = request.nextUrl.searchParams.get("all") === "1";
  const urls = changedUrls(all ? null : 3);
  const result = await submitToIndexNow(urls);
  const ok = result.status === 0 || result.status === 200 || result.status === 202;
  return NextResponse.json({ ok, ...result, urls }, { status: ok ? 200 : 502 });
}
