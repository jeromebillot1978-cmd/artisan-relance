import Link from "next/link";
import { FaqList } from "@/components/marketing/faq-list";
import { CtaBlock } from "@/components/marketing/cta-block";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo/json-ld";
import { FAQ_ALL, FAQ_GROUPS } from "@/lib/content/faq";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Relance de devis : 18 questions et réponses | Artisan Relance",
  description: "Quand relancer un devis, combien de relances, mail de relance, taux de transformation, RGPD : les réponses claires pour les artisans.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <section className="container max-w-3xl py-14 md:py-20">
      <FaqJsonLd items={FAQ_ALL} />
      <BreadcrumbJsonLd items={[{ name: "Accueil", path: "/" }, { name: "FAQ", path: "/faq" }]} />
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Relance de devis : vos questions, nos réponses</h1>
      <p className="mt-3 text-muted-foreground">
        Délais, nombre de relances, modèles de mail, taux de transformation, RGPD et fonctionnement d'Artisan Relance.
        Pour aller plus loin, consultez nos <Link href="/guides" className="underline underline-offset-4">guides</Link>.
      </p>
      <nav aria-label="Thèmes" className="mt-8 flex flex-wrap gap-2 text-sm">
        {FAQ_GROUPS.map((g, i) => (
          <a key={g.title} href={`#theme-${i}`} className="rounded-full border px-3 py-1 hover:bg-muted">{g.title}</a>
        ))}
      </nav>
      {FAQ_GROUPS.map((g, i) => (
        <div key={g.title} id={`theme-${i}`} className="mt-12 scroll-mt-20">
          <h2 className="mb-4 text-2xl font-semibold tracking-tight">{g.title}</h2>
          <FaqList items={g.items} />
        </div>
      ))}
      <div className="mt-16">
        <CtaBlock title="Une autre question ?" text="Écrivez-nous ou demandez une démonstration de 10 minutes. Ou testez directement : c'est gratuit." />
      </div>
    </section>
  );
}
