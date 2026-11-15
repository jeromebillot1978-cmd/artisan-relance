import { NextResponse, type NextRequest } from "next/server";
import { isAutomated, publicClient, simplePage, TOKEN_RE } from "@/lib/reviews/public";

export const dynamic = "force-dynamic";

/** Lien de l'e-mail de demande d'avis : compte le clic puis redirige vers la fiche Google. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!TOKEN_RE.test(token)) return invalid();

  // Les requêtes HEAD (vérification de lien par une messagerie) ne comptent pas.
  const count = request.method === "GET" && !isAutomated(request.headers.get("user-agent"));
  const { data: url, error } = await publicClient().rpc("register_review_click", { p_token: token, p_count: count });
  if (error) console.error("register_review_click", error.message);
  if (!url || typeof url !== "string") return invalid();

  const res = NextResponse.redirect(url, 302);
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}

function invalid() {
  return simplePage("Lien expiré", "<p>Ce lien n'est plus valide. Merci de votre intérêt !</p>", 404);
}
