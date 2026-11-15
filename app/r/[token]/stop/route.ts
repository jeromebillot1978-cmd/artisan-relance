import type { NextRequest } from "next/server";
import { escapeHtml, publicClient, simplePage, TOKEN_RE } from "@/lib/reviews/public";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

/** Page de désinscription : confirmation par un bouton (les scanners de liens ne désinscrivent pas). */
export async function GET(_: NextRequest, { params }: Ctx) {
  const { token } = await params;
  if (!TOKEN_RE.test(token)) return invalid();
  const { data: company } = await publicClient().rpc("review_token_company", { p_token: token });
  if (!company) return invalid();
  return simplePage(
    "Ne plus recevoir de demande d'avis",
    `<p>Vous ne recevrez plus de demande d'avis de la part de <strong>${escapeHtml(String(company))}</strong>.</p>
<form method="post"><button type="submit">Confirmer la désinscription</button></form>
<p style="margin-top:16px"><small>Vos autres échanges avec cette entreprise ne sont pas concernés.</small></p>`,
  );
}

/** Confirmation du formulaire, ou désinscription « en un clic » des messageries (RFC 8058). */
export async function POST(_: NextRequest, { params }: Ctx) {
  const { token } = await params;
  if (!TOKEN_RE.test(token)) return invalid();
  const { data: ok, error } = await publicClient().rpc("review_opt_out", { p_token: token });
  if (error) {
    console.error("review_opt_out", error.message);
    return simplePage("Une erreur est survenue", "<p>Merci de réessayer dans quelques instants.</p>", 500);
  }
  if (!ok) return invalid();
  return simplePage("C'est noté", "<p>Vous ne recevrez plus de demande d'avis de cette entreprise.</p>");
}

function invalid() {
  return simplePage("Lien expiré", "<p>Ce lien n'est plus valide.</p>", 404);
}
