import type { NextConfig } from "next";

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseWs = supabase.replace(/^https:/, "wss:");
// Barre d'outils Vercel : seulement sur les déploiements de prévisualisation
const vercelLive = process.env.VERCEL_ENV === "preview" ? " https://vercel.live" : "";

/**
 * Content-Security-Policy : seuls ce site et Supabase sont autorisés.
 * 'unsafe-inline' reste nécessaire aux scripts d'hydratation de Next.js et au JSON-LD ;
 * aucun script externe ne peut être chargé, aucune page ne peut nous afficher en iframe.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${vercelLive}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabase}`.trim(),
  "font-src 'self' data:",
  `connect-src 'self' ${supabase} ${supabaseWs}${vercelLive}`.trim(),
  `frame-src 'self'${vercelLive}`,
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

// Pages qui ne doivent jamais apparaître dans Google (application, connexion, liens privés)
const noindex = { key: "X-Robots-Tag", value: "noindex, nofollow" };
const PRIVATE_SOURCES = [
  "/dashboard/:path*",
  "/devis/:path*",
  "/parametres/:path*",
  "/avis-google/:path*",
  "/connexion",
  "/inscription",
  "/mot-de-passe-oublie",
  "/reinitialiser-mot-de-passe",
  "/auth/:path*",
  "/api/:path*",
  "/r/:path*",
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      ...PRIVATE_SOURCES.map((source) => ({ source, headers: [noindex] })),
    ];
  },
};

export default nextConfig;
