import { notFound } from "next/navigation";
import { ContentArticle } from "@/components/marketing/content-article";
import { GUIDES, getGuide } from "@/lib/content/guides";
import { pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const g = getGuide((await params).slug);
  if (!g) return {};
  return pageMetadata({ title: g.title, description: g.description, path: `/guides/${g.slug}`, type: "article" });
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const g = getGuide((await params).slug);
  if (!g) notFound();
  return (
    <ContentArticle
      page={g}
      path={`/guides/${g.slug}`}
      crumbs={[
        { name: "Accueil", path: "/" },
        { name: "Guides", path: "/guides" },
        { name: g.short, path: `/guides/${g.slug}` },
      ]}
      ctaTitle="Programmez vos relances dès l'envoi du devis"
    />
  );
}
