import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";

export function CtaButtons({ className }: { className?: string }) {
  return (
    <div className={className ?? "flex w-full flex-col gap-3 sm:w-auto sm:flex-row"}>
      <Button asChild size="lg" variant="brand">
        <Link href={SITE.ctaHref}>
          {SITE.cta} <ArrowRight />
        </Link>
      </Button>
      <Button asChild size="lg" variant="outline">
        <Link href={SITE.demoHref}>{SITE.demoLabel}</Link>
      </Button>
    </div>
  );
}

export function CtaBlock({ title, text }: { title: string; text: string }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border bg-card px-6 py-12 text-center">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom,hsl(var(--brand)/0.12),transparent_60%)]" />
      <h2 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-lg text-muted-foreground">{text}</p>
      <CtaButtons className="mt-8 flex flex-col justify-center gap-3 sm:flex-row" />
      <p className="mt-4 text-xs text-muted-foreground">Gratuit pendant le lancement · Sans carte bancaire · Prêt en 2 minutes</p>
    </section>
  );
}
