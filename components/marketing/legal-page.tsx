import Link from "next/link";
import { SITE } from "@/lib/site";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

const LEGAL_LINKS = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Politique de confidentialité" },
  { href: "/cgu", label: "Conditions générales d'utilisation" },
  { href: "/confiance", label: "Confiance et sécurité des données" },
  { href: "/a-propos", label: "À propos d'Artisan Relance" },
  { href: "/contact", label: "Contact" },
];

export function LegalPage({ title, path, children }: { title: string; path?: string; children: React.ReactNode }) {
  return (
    <article className="container max-w-3xl py-14 md:py-20">
      {path && <BreadcrumbJsonLd items={[{ name: "Accueil", path: "/" }, { name: title, path }]} />}
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Dernière mise à jour : {SITE.legalUpdated}</p>
      <div className="prose-legal mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-3 [&_strong]:text-foreground [&_ul]:mt-2 [&_ul]:space-y-1">
        {children}
      </div>
      <nav aria-label="Informations légales et confiance" className="mt-12 rounded-xl border bg-muted/30 p-5 text-sm">
        <p className="font-medium">À lire aussi</p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-muted-foreground">
          {LEGAL_LINKS.filter((l) => l.href !== path).map((l) => (
            <li key={l.href}><Link href={l.href} className="underline underline-offset-4 hover:text-foreground">{l.label}</Link></li>
          ))}
        </ul>
        <p className="mt-3 text-muted-foreground">
          Une question ? <a href={`mailto:${SITE.contactEmail}`} className="underline underline-offset-4">{SITE.contactEmail}</a>
        </p>
      </nav>
    </article>
  );
}
