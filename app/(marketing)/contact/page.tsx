import { Suspense } from "react";
import Link from "next/link";
import { Clock, Mail, MonitorPlay } from "lucide-react";
import { ContactForm } from "@/components/marketing/contact-form";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata = pageMetadata({
  title: "Contact et démonstration — Artisan Relance",
  description: "Une question sur la relance automatique de vos devis ? Écrivez-nous ou demandez une démonstration gratuite de 10 minutes d'Artisan Relance.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <section className="container grid gap-12 py-14 md:grid-cols-[1fr_1.3fr] md:py-20">
      <BreadcrumbJsonLd items={[{ name: "Accueil", path: "/" }, { name: "Contact", path: "/contact" }]} />
      <div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Contact et démonstration</h1>
        <p className="mt-4 text-muted-foreground">
          Une question avant d'essayer, un doute sur vos devis ou envie de voir l'outil en action ? Écrivez-nous :
          une personne vous répond, pas un robot.
        </p>
        <ul className="mt-8 space-y-5 text-sm">
          <li className="flex gap-3">
            <MonitorPlay className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <span>
              <strong className="block text-foreground">Démonstration de 10 minutes</strong>
              <span className="text-muted-foreground">En visio ou au téléphone, sur un de vos vrais devis si vous le souhaitez.</span>
            </span>
          </li>
          <li className="flex gap-3">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <span>
              <strong className="block text-foreground">Réponse sous 24 heures ouvrées</strong>
              <span className="text-muted-foreground">Du lundi au vendredi.</span>
            </span>
          </li>
          <li className="flex gap-3">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <span>
              <strong className="block text-foreground">Par e-mail</strong>
              <a href={`mailto:${SITE.contactEmail}`} className="text-muted-foreground underline underline-offset-4">
                {SITE.contactEmail}
              </a>
            </span>
          </li>
        </ul>
        <p className="mt-8 text-sm text-muted-foreground">
          Vous préférez tester tout de suite ?{" "}
          <Link href={SITE.ctaHref} className="font-medium text-foreground underline underline-offset-4">
            {SITE.cta}
          </Link>
          , sans carte bancaire.
        </p>
      </div>
      <div className="rounded-2xl border bg-card p-6 md:p-8">
        <Suspense>
          <ContactForm />
        </Suspense>
      </div>
    </section>
  );
}
