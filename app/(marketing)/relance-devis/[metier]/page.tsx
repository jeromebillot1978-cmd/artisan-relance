import { notFound } from "next/navigation";
import { ContentArticle } from "@/components/marketing/content-article";
import { METIERS, getMetier } from "@/lib/content/metiers";
import { pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return METIERS.map((m) => ({ metier: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ metier: string }> }) {
  const m = getMetier((await params).metier);
  if (!m) return {};
  return pageMetadata({ title: m.title, description: m.description, path: `/relance-devis/${m.slug}`, type: "article" });
}

export default async function MetierPage({ params }: { params: Promise<{ metier: string }> }) {
  const m = getMetier((await params).metier);
  if (!m) notFound();
  return (
    <ContentArticle
      page={m}
      path={`/relance-devis/${m.slug}`}
      crumbs={[
        { name: "Accueil", path: "/" },
        { name: "Relance de devis par métier", path: "/relance-devis" },
        { name: m.short, path: `/relance-devis/${m.slug}` },
      ]}
      ctaTitle={`${m.short} : relancez vos devis sans y penser`}
    />
  );
}
