import { notFound } from "next/navigation";
import { ContentArticle } from "@/components/marketing/content-article";
import { METIERS, getMetier } from "@/lib/content/metiers";
import { getKit } from "@/lib/content/metier-kits";
import { MetierKitSection } from "@/components/marketing/metier-kit";
import { HowToJsonLd } from "@/components/seo/json-ld";
import { pageMetadata } from "@/lib/seo";
import { GUIDES } from "@/lib/content/guides";

export const dynamicParams = false;

export function generateStaticParams() {
  return METIERS.map((m) => ({ metier: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ metier: string }> }) {
  const m = getMetier((await params).metier);
  if (!m) return {};
  const kit = getKit(m.slug);
  return pageMetadata({
    title: kit?.title ?? m.title,
    description: kit?.description ?? m.description,
    path: `/relance-devis/${m.slug}`,
    type: "article",
  });
}

export default async function MetierPage({ params }: { params: Promise<{ metier: string }> }) {
  const m = getMetier((await params).metier);
  if (!m) notFound();
  const kit = getKit(m.slug);
  const page = kit ? { ...m, h1: kit.question, title: kit.title, description: kit.description } : m;
  return (
    <ContentArticle
      page={page}
      afterAnswer={
        kit && (
          <>
            <HowToJsonLd name={kit.question} steps={kit.delays.map((d) => ({ name: d.moment, text: `${d.action} (${d.channel})` }))} />
            <MetierKitSection kit={kit} metier={m.short.toLowerCase()} />
          </>
        )
      }
      path={`/relance-devis/${m.slug}`}
      crumbs={[
        { name: "Accueil", path: "/" },
        { name: "Relance de devis par métier", path: "/relance-devis" },
        { name: m.short, path: `/relance-devis/${m.slug}` },
      ]}
      ctaTitle={`${m.short} : relancez vos devis sans y penser`}
      more={[
        {
          title: "Relance de devis pour les autres métiers",
          links: [
            ...METIERS.filter((x) => x.slug !== m.slug).map((x) => ({ href: `/relance-devis/${x.slug}`, label: `Relance de devis ${x.short.toLowerCase()}` })),
            { href: "/relance-devis", label: "Tous les métiers" },
          ],
        },
        {
          title: "Guides pour relancer vos devis",
          links: GUIDES.map((g) => ({ href: `/guides/${g.slug}`, label: g.short })),
        },
      ]}
    />
  );
}
