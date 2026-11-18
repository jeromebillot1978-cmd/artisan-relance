import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { lastUpdate, type ContentPage } from "@/lib/content/types";
import { FaqList } from "@/components/marketing/faq-list";
import { CtaBlock } from "@/components/marketing/cta-block";
import { ArticleJsonLd, BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo/json-ld";

/** Gabarit des pages métiers et des guides : HTML sémantique, rendu serveur, sans JavaScript. */
export function ContentArticle({
  page,
  path,
  crumbs,
  ctaTitle,
  afterAnswer,
}: {
  page: ContentPage;
  path: string;
  crumbs: { name: string; path: string }[];
  ctaTitle: string;
  /** Bloc inséré juste après « En bref » (kit de relance des pages métiers) */
  afterAnswer?: React.ReactNode;
}) {
  return (
    <article className="container max-w-3xl py-10 md:py-16">
      <ArticleJsonLd title={page.h1} description={page.description} path={path} date={page.date} modified={lastUpdate(page)} />
      <BreadcrumbJsonLd items={crumbs} />
      <FaqJsonLd items={[...(page.quick ?? []), ...page.faq]} />

      <nav aria-label="Fil d'Ariane" className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {crumbs.map((c, i) => (
          <span key={c.path} className="inline-flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
            {i < crumbs.length - 1 ? (
              <Link href={c.path} className="hover:text-foreground">{c.name}</Link>
            ) : (
              <span aria-current="page" className="text-foreground">{c.name}</span>
            )}
          </span>
        ))}
      </nav>

      <header>
        <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">{page.h1}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Par Jercat · mis à jour le {new Date(lastUpdate(page)).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </header>

      <section aria-label="En bref" className="mt-8 rounded-xl border border-brand/30 bg-brand/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">En bref</p>
        <p className="mt-2 leading-relaxed">{page.answer}</p>
      </section>

      {afterAnswer}

      <div className="mt-12 space-y-10 leading-relaxed">
        {page.sections.map((s) => (
          <section key={s.h2}>
            <h2 className="text-2xl font-semibold tracking-tight">{s.h2}</h2>
            {s.paragraphs?.map((p) => (
              <p key={p.slice(0, 40)} className="mt-4 text-muted-foreground">{p}</p>
            ))}
            {s.steps && (
              <ol className="mt-5 space-y-3">
                {s.steps.map((st) => (
                  <li key={st.title} className="rounded-lg border bg-card p-4">
                    <p className="font-medium">{st.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{st.text}</p>
                  </li>
                ))}
              </ol>
            )}
            {s.list && (
              <ul className="mt-4 space-y-2 text-muted-foreground">
                {s.list.map((li) => (
                  <li key={li} className="flex gap-2">
                    <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    <span>{li}</span>
                  </li>
                ))}
              </ul>
            )}
            {s.template && (
              <figure className="mt-5 overflow-hidden rounded-xl border">
                <figcaption className="border-b bg-muted/50 px-4 py-2 text-xs font-medium">{s.template.label}</figcaption>
                <div className="p-4 text-sm">
                  <p><span className="text-muted-foreground">Objet :</span> {s.template.subject}</p>
                  <p className="mt-3 whitespace-pre-line text-muted-foreground">{s.template.body}</p>
                </div>
              </figure>
            )}
          </section>
        ))}
      </div>

      {page.quick && page.quick.length > 0 && (
        <section aria-labelledby="reponses-rapides" className="mt-14 rounded-xl border border-brand/30 bg-brand/5 p-5 md:p-6">
          <h2 id="reponses-rapides" className="text-2xl font-semibold tracking-tight">Réponses rapides</h2>
          <dl className="mt-5 space-y-5">
            {page.quick.map((qa) => (
              <div key={qa.q}>
                <dt className="font-medium">{qa.q}</dt>
                <dd className="mt-1 text-muted-foreground">{qa.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="mt-14">
        <h2 className="mb-5 text-2xl font-semibold tracking-tight">Questions fréquentes</h2>
        <FaqList items={page.faq} />
      </section>

      <div className="mt-14">
        <CtaBlock title={ctaTitle} text="Envoyez votre devis depuis Artisan Relance : les relances partent seules, à votre nom, au rythme que vous choisissez." />
      </div>

      <nav aria-label="À lire aussi" className="mt-12">
        <h2 className="text-lg font-semibold">À lire aussi</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {page.related.map((r) => (
            <li key={r.href}>
              <Link href={r.href} className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-muted/50">
                {r.label} <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </article>
  );
}
