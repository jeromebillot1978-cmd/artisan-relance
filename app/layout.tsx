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
    default: "Artisan Relance — Relancez vos devis automatiquement",
    template: "%s · Artisan Relance",
  },
  description:
    "Artisans : envoyez vos devis et laissez les relances partir toutes seules, au rythme de votre choix. Plus de devis signés, zéro temps passé.",
  applicationName: "Artisan Relance",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Artisan Relance",
    description: "Relancez automatiquement vos devis et signez plus de chantiers.",
    url: "/",
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
