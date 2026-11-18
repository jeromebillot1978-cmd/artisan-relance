import Link from "next/link";
import { MessageSquareQuote, Star } from "lucide-react";
import { TESTIMONIALS, type Testimonial } from "@/lib/content/testimonials";
import { siteUrl } from "@/lib/utils";
import { SITE } from "@/lib/site";
import { LD_IDS } from "@/components/seo/json-ld";

/** Balisage Review : seulement pour des témoignages réels affichés sur la page. */
function ReviewsJsonLd({ items }: { items: Testimonial[] }) {
  const url = siteUrl();
  const data = {
    "@context": "https://schema.org",
    "@graph": items.map((t) => ({
      "@type": "Review",
      itemReviewed: { "@id": LD_IDS.software(url), "@type": "SoftwareApplication", name: SITE.name },
      author: { "@type": "Person", name: t.name, ...(t.company ? { worksFor: { "@type": "Organization", name: t.company } } : {}) },
      reviewBody: t.quote,
      datePublished: t.date,
      inLanguage: "fr-FR",
      ...(t.rating ? { reviewRating: { "@type": "Rating", ratingValue: String(t.rating), bestRating: "5", worstRating: "1" } } : {}),
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

function Card({ t }: { t: Testimonial }) {
  return (
    <li className="flex flex-col rounded-xl border bg-card p-6">
      {t.rating && (
        <p className="mb-3 flex gap-0.5 text-amber-500" aria-label={`${t.rating} sur 5`}>
          {Array.from({ length: t.rating }, (_, i) => <Star key={i} className="h-4 w-4 fill-current" aria-hidden="true" />)}
        </p>
      )}
      <blockquote className="flex-1 text-sm leading-relaxed">« {t.quote} »</blockquote>
      {t.result && <p className="mt-4 rounded-md bg-success/10 px-2.5 py-1.5 text-xs font-medium text-success">{t.result}</p>}
      <p className="mt-4 text-sm font-medium">{t.name}</p>
      <p className="text-xs text-muted-foreground">
        {[t.trade, t.company, t.city].filter(Boolean).join(" · ")}
      </p>
    </li>
  );
}

/**
 * Témoignages d'artisans. Rien n'est affiché tant qu'il n'y a pas de vrai témoignage,
 * sauf `showInvite` (page Confiance) qui invite les premiers utilisateurs à donner leur avis.
 */
export function Testimonials({
  title = "Ce qu'en disent les artisans",
  limit,
  showInvite = false,
}: {
  title?: string;
  limit?: number;
  showInvite?: boolean;
}) {
  const items = limit ? TESTIMONIALS.slice(0, limit) : TESTIMONIALS;
  if (!items.length) {
    if (!showInvite) return null;
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm">
        <MessageSquareQuote className="mx-auto h-5 w-5 text-brand" aria-hidden="true" />
        <p className="mt-3 font-medium">Les premiers témoignages arrivent</p>
        <p className="mx-auto mt-1 max-w-md text-muted-foreground">
          Artisan Relance est en ligne depuis {SITE.launched}. Nous publions uniquement de vrais retours d'artisans,
          avec leur accord : aucun avis inventé.
        </p>
        <p className="mt-3">
          <Link href="/contact?sujet=avis" className="underline underline-offset-4">Vous l'utilisez ? Donnez votre avis</Link>
        </p>
      </div>
    );
  }
  return (
    <div>
      <ReviewsJsonLd items={items} />
      <h3 className="text-center text-xl font-semibold tracking-tight">{title}</h3>
      <ul className="mx-auto mt-6 grid max-w-5xl gap-4 md:grid-cols-3">
        {items.map((t) => <Card key={t.name + t.date} t={t} />)}
      </ul>
    </div>
  );
}
