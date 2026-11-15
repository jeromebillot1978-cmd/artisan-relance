import { SITE } from "@/lib/site";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="container max-w-3xl py-14 md:py-20">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Dernière mise à jour : {SITE.legalUpdated}</p>
      <div className="prose-legal mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-3 [&_strong]:text-foreground [&_ul]:mt-2 [&_ul]:space-y-1">
        {children}
      </div>
    </article>
  );
}
