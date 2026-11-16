import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Client serveur pour les liens publics des e-mails d'avis (/r/<jeton>).
 * Les fonctions register_review_click, review_token_company et review_opt_out
 * ne sont plus appelables par le rôle « anon » via l'API REST (durcissement
 * du 16/11/2026) : seul le serveur, avec la clé service_role, peut les appeler.
 */
export function publicClient() {
  return createAdminClient();
}

export const TOKEN_RE = /^[0-9a-f]{32}$/;

/** Robots, aperçus de liens et scanners de sécurité : on redirige sans compter le clic. */
export function isAutomated(userAgent: string | null) {
  if (!userAgent) return true;
  return /bot|crawl|spider|slurp|preview|scanner|safelinks|proofpoint|mimecast|barracuda|headless|python-requests|curl|wget|facebookexternalhit|whatsapp|skypeuripreview/i.test(
    userAgent,
  );
}

function escape(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Petite page HTML autonome (désinscription, lien invalide). */
export function simplePage(title: string, inner: string, status = 200) {
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${escape(title)}</title>
<style>body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f4f4f5;color:#18181b;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:16px}
.card{max-width:440px;width:100%;background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:28px}h1{font-size:20px;margin:0 0 12px}p{line-height:1.6;color:#3f3f46;margin:0 0 16px}
button{font:inherit;font-weight:600;background:#18181b;color:#fff;border:0;border-radius:8px;padding:12px 18px;cursor:pointer;width:100%}small{color:#71717a}</style></head>
<body><main class="card"><h1>${escape(title)}</h1>${inner}</main></body></html>`;
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" },
  });
}

export { escape as escapeHtml };
