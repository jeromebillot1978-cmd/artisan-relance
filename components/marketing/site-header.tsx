import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/supabase/server";

const links = [
  { href: "/#fonctionnement", label: "Fonctionnement" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/faq", label: "FAQ" },
];

export async function SiteHeader() {
  const { user } = await getUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-14 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {user ? (
            <Button asChild size="sm">
              <Link href="/dashboard">Mon espace</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/connexion">Connexion</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/inscription">Essayer</Link>
              </Button>
            </>
          )}
        </div>
      </div>
      <nav className="container flex gap-5 overflow-x-auto pb-2 text-sm text-muted-foreground md:hidden">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="whitespace-nowrap hover:text-foreground">
            {l.label}
          </Link>
        ))}
        <Link href="/connexion" className="whitespace-nowrap hover:text-foreground sm:hidden">
          Connexion
        </Link>
      </nav>
    </header>
  );
}
