import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { VercelAnalytics } from "@/components/stats/vercel-analytics";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteVisitTracker } from "@/components/stats/site-visit-tracker";
import { siteUrl } from "@/lib/utils";
import "./globals.css";

// Geist en « optional » : si la police n'est pas là tout de suite (4G lente), le texte reste
// dans la police système, sans changement visible ni décalage : le contenu s'affiche immédiatement.
const geistSans = localFont({
  src: "./fonts/Geist-Variable.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "optional",
  adjustFontFallback: "Arial",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Logiciel de relance de devis pour artisans | Artisan Relance",
    template: "%s · Artisan Relance",
  },
  description:
    "Artisans : envoyez vos devis et laissez les relances partir toutes seules, au rythme de votre choix. Plus de devis signés, zéro temps passé.",
  applicationName: "Artisan Relance",
  openGraph: {
    title: "Artisan Relance — logiciel de relance de devis pour artisans",
    description: "Envoyez vos devis et laissez les relances partir toutes seules, à votre nom. Gratuit pendant le lancement.",
    siteName: "Artisan Relance",
    locale: "fr_FR",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={geistSans.variable}>
      <body className="min-h-dvh font-sans">
        <ThemeProvider>
          {children}
        </ThemeProvider>
        {/* Statistiques : Vercel Web Analytics + comptage anonyme maison (sans cookie) */}
        <VercelAnalytics />
        <SiteVisitTracker />
      </body>
    </html>
  );
}
