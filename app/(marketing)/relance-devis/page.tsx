import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { METIERS } from "@/lib/content/metiers";
import { pageMetadata } from "@/lib/seo";
import { CtaBlock } from "@/components/marketing/cta-block";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata = pageMetadata({
  title: "Relance de devis par métier du bâtiment — Artisan Relance",
  description: "Calendrier de relance, modèles de mail et conseils adaptés à votre métier : plombier, électricien, couvreur, chauffagiste, peintre, menuisier.",
  path: "/relance-devis",
});

export default function RelanceDevisHub() {
  return (
    <section className="container max-w-4xl py-12 md:py-16">
      <BreadcrumbJsonLd items={[{ name: "Accueil", path: "/" }, { name: "Relance de devis par métier", path: "/relance-devis" }]} />
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Relance de devis par métier du bâtiment</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Un devis de toiture ne se relance pas comme un devis de peinture. Choisissez votre métier : délais conseillés,
        arguments qui font signer, modèle de mail prêt à l'emploi et questions fréquentes.
      </p>
      <ul className="mt-10 grid gap-3 sm:grid-cols-2">
        {METIERS.map((m) => (
          <li key={m.slug}>
            <Link href={`/relance-devis/${m.slug}`} className="flex h-full flex-col rounded-xl border bg-card p-5 hover:bg-muted/40">
              <span className="flex items-center justify-between font-medium">
                Relance de devis pour {m.metier}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </span>
              <span className="mt-2 text-sm text-muted-foreground">{m.description}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-14">
        <CtaBlock title="Votre métier n'est pas dans la liste ?" text="Artisan Relance fonctionne pour tous les artisans et indépendants qui envoient des devis : maçon, plaquiste, carreleur, paysagiste, serrurier…" />
      </div>
    </section>
  );
}
