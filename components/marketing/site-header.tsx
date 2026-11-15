import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";

const links = [
  { href: "/#fonctionnement", label: "Fonctionnement" },
  { href: "/relance-devis", label: "Métiers" },
  { href: "/guides", label: "Guides" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/faq", label: "FAQ" },
];

// Composant serveur statique : aucune requête Supabase, pages marketing servies depuis le CDN.
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-lg">
      <div className="container flex h-14 items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Navigation principale" className="hidden items-center gap-6 text-sm text-muted-foreground lg:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/connexion">Connexion</Link>
          </Button>
          <Button asChild size="sm" variant="brand" className="hidden md:inline-flex">
            <Link href={SITE.ctaHref}>{SITE.cta}</Link>
          </Button>
        </div>
      </div>
      <nav aria-label="Navigation mobile" className="container flex gap-5 overflow-x-auto pb-2 text-sm text-muted-foreground lg:hidden">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="whitespace-nowrap hover:text-foreground">
            {l.label}
          </Link>
        ))}
        <Link href="/connexion" className="whitespace-nowrap font-medium text-foreground sm:hidden">
          Connexion
        </Link>
      </nav>
    </header>
  );
}
