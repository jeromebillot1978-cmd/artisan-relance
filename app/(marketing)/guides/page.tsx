import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { GUIDES } from "@/lib/content/guides";
import { pageMetadata } from "@/lib/seo";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata = pageMetadata({
  title: "Guides de relance de devis pour artisans — Artisan Relance",
  description: "Quand relancer un devis, modèles de mail, nombre de relances, client qui ne répond plus, e-mail ou téléphone : les guides pratiques pour signer plus.",
  path: "/guides",
});

export default function GuidesIndex() {
  return (
    <section className="container max-w-3xl py-12 md:py-16">
      <BreadcrumbJsonLd items={[{ name: "Accueil", path: "/" }, { name: "Guides", path: "/guides" }]} />
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Guides : relancer ses devis et signer plus</h1>
      <p className="mt-4 text-muted-foreground">
        Des méthodes concrètes, des modèles prêts à copier et des réponses directes aux questions que se posent les
        artisans après l'envoi d'un devis.
      </p>
      <ul className="mt-10 space-y-3">
        {GUIDES.map((g) => (
          <li key={g.slug}>
            <Link href={`/guides/${g.slug}`} className="block rounded-xl border bg-card p-5 hover:bg-muted/40">
              <span className="flex items-center justify-between gap-3 text-lg font-medium">
                {g.h1}
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </span>
              <span className="mt-2 block text-sm text-muted-foreground">{g.answer}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
