import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="container flex flex-col gap-6 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Logo />
          <p>La relance de devis automatique pour les artisans.</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/tarifs" className="hover:text-foreground">Tarifs</Link>
          <Link href="/faq" className="hover:text-foreground">FAQ</Link>
          <Link href="/mentions-legales" className="hover:text-foreground">Mentions légales</Link>
          <Link href="/confidentialite" className="hover:text-foreground">Confidentialité</Link>
        </nav>
      </div>
      <div className="container border-t py-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Artisan Relance — un produit Jercat.
      </div>
    </footer>
  );
}
