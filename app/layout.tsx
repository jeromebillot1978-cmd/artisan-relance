import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { siteUrl } from "@/lib/utils";
import "./globals.css";

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
    <html lang="fr" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-dvh font-sans">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
