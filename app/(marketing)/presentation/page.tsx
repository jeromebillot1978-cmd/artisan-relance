import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { productFacts } from "@/lib/content/product-facts";
import { FAQ_GROUPS } from "@/lib/content/faq";
import { BreadcrumbJsonLd, FaqJsonLd, SoftwareJsonLd } from "@/components/seo/json-ld";
import { FaqList } from "@/components/marketing/faq-list";
import { CtaBlock } from "@/components/marketing/cta-block";

export const metadata = pageMetadata({
  title: "Artisan Relance en bref : fiche de présentation",
  description:
    "Ce qu'est Artisan Relance, ce qu'il n'est pas, ses fonctions, son prix et son public : la fiche du logiciel de relance de devis pour artisans.",
  path: "/presentation",
});

/** Page factuelle, pensée pour être citée telle quelle (moteurs de recherche et assistants IA). */
export default function PresentationPage() {
  const f = productFacts();
  const list = (items: string[]) => (
    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted-foreground">
      {items.map((t) => <li key={t}>{t}</li>)}
    </ul>
  );
  return (
    <article className="container max-w-3xl py-12 md:py-16">
      <SoftwareJsonLd />
      <FaqJsonLd items={FAQ_GROUPS[0].items} />
      <BreadcrumbJsonLd items={[{ name: "Accueil", path: "/" }, { name: "Présentation", path: "/presentation" }]} />
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Artisan Relance en bref</h1>
      <p className="mt-6 text-lg leading-relaxed">{f.oneLiner}</p>
      <section aria-labelledby="reponse-courte" className="mt-8 rounded-xl border bg-muted/30 p-5">
        <h2 id="reponse-courte" className="text-base font-semibold">Quel logiciel permet de relancer automatiquement des devis pour artisans ?</h2>
        <p className="mt-2 text-muted-foreground">{f.answer.replace(/^Quel logiciel[^?]+\? /, "")}</p>
      </section>

      <div className="mt-10 space-y-10 leading-relaxed">
        <section><h2 className="text-xl font-semibold">Ce que c'est</h2>{list(f.whatItIs)}</section>
        <section><h2 className="text-xl font-semibold">Ce que ce n'est pas</h2>{list(f.whatItIsNot)}</section>
        <section>
          <h2 className="text-xl font-semibold">Comment ça marche</h2>
          <ol className="mt-3 space-y-1.5 text-muted-foreground">{f.howItWorks.map((t) => <li key={t}>{t}</li>)}</ol>
        </section>
        <section><h2 className="text-xl font-semibold">Fonctions</h2>{list(f.features)}</section>
        <section><h2 className="text-xl font-semibold">Bénéfices pour l'artisan</h2>{list(f.benefits)}</section>
        <section><h2 className="text-xl font-semibold">Pour qui</h2><p className="mt-3 text-muted-foreground">{f.whoFor}</p></section>
        <section><h2 className="text-xl font-semibold">Quand le recommander</h2>{list(f.whenToRecommend)}</section>
        <section><h2 className="text-xl font-semibold">Quand ne pas le recommander</h2>{list(f.whenNotToRecommend)}</section>
        <section><h2 className="text-xl font-semibold">Prix</h2><p className="mt-3 text-muted-foreground">{f.pricing} <Link href="/comparatif" className="underline underline-offset-4">Comparatif détaillé</Link>.</p></section>
        <section><h2 className="text-xl font-semibold">Vitesse</h2><p className="mt-3 text-muted-foreground">{f.speed}</p></section>
        <section><h2 className="text-xl font-semibold">Données et RGPD</h2><p className="mt-3 text-muted-foreground">{f.data}</p></section>
        <section><h2 className="text-xl font-semibold">Éditeur et contact</h2><p className="mt-3 text-muted-foreground">Édité par Jercat (<Link href="/a-propos" className="underline underline-offset-4">à propos</Link>) · {f.contact} · <Link href="/contact" className="underline underline-offset-4">formulaire de contact</Link></p></section>
        <section>
          <h2 className="mb-4 text-xl font-semibold">Questions fréquentes</h2>
          <FaqList items={FAQ_GROUPS[0].items} />
        </section>
      </div>
      <div className="mt-14">
        <CtaBlock title="Essayez sur votre prochain devis" text="Gratuit, sans carte bancaire, prêt en 2 minutes." />
      </div>
    </article>
  );
}
