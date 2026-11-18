import Link from "next/link";
import { Logo } from "@/components/logo";
import { METIERS } from "@/lib/content/metiers";
import { GUIDES } from "@/lib/content/guides";
import { SITE } from "@/lib/site";

const col = "space-y-2";
const head = "mb-3 text-sm font-medium text-foreground";

export function SiteFooter() {
  return (
    <footer className="border-t pb-20 md:pb-0">
      <div className="container grid gap-10 py-12 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p>Le logiciel de relance de devis pour les artisans du bâtiment.</p>
          <p>
            <Link href={SITE.demoHref} className="underline underline-offset-4 hover:text-foreground">{SITE.demoLabel}</Link>
          </p>
        </div>
        <nav aria-label="Produit">
          <p className={head}>Produit</p>
          <ul className={col}>
            <li><Link href="/#fonctionnement" className="hover:text-foreground">Fonctionnement</Link></li>
            <li><Link href="/tarifs" className="hover:text-foreground">Tarifs</Link></li>
            <li><Link href="/comparatif" className="hover:text-foreground">Comparatif</Link></li>
            <li><Link href="/presentation" className="hover:text-foreground">Présentation</Link></li>
            <li><Link href="/a-propos" className="hover:text-foreground">À propos</Link></li>
            <li><Link href="/faq" className="hover:text-foreground">FAQ</Link></li>
            <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
          </ul>
        </nav>
        <nav aria-label="Métiers">
          <p className={head}>Par métier</p>
          <ul className={col}>
            {METIERS.map((m) => (
              <li key={m.slug}><Link href={`/relance-devis/${m.slug}`} className="hover:text-foreground">Relance devis {m.metier}</Link></li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Guides">
          <p className={head}>Guides</p>
          <ul className={col}>
            {GUIDES.map((g) => (
              <li key={g.slug}><Link href={`/guides/${g.slug}`} className="hover:text-foreground">{g.short}</Link></li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Informations légales">
          <p className={head}>Légal</p>
          <ul className={col}>
            <li><Link href="/mentions-legales" className="hover:text-foreground">Mentions légales</Link></li>
            <li><Link href="/confidentialite" className="hover:text-foreground">Confidentialité</Link></li>
            <li><Link href="/cgu" className="hover:text-foreground">CGU</Link></li>
          </ul>
        </nav>
      </div>
      <div className="container border-t py-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Artisan Relance — un produit {SITE.editor}.
      </div>
    </footer>
  );
}
