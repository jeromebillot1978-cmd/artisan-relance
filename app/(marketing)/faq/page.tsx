import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FaqList } from "@/components/marketing/faq-list";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Toutes les réponses sur Artisan Relance : relances, e-mails, données, tarifs.",
};

export default function FaqPage() {
  return (
    <section className="container max-w-3xl py-16 md:py-24">
      <h1 className="text-4xl font-semibold tracking-tight">Questions fréquentes</h1>
      <p className="mt-3 text-muted-foreground">Tout ce que vous devez savoir avant de commencer.</p>
      <div className="mt-10">
        <FaqList />
      </div>
      <div className="mt-12 rounded-xl border bg-card p-6 text-center">
        <p className="font-medium">Une autre question ?</p>
        <p className="mt-1 text-sm text-muted-foreground">Le plus simple est encore d'essayer : c'est gratuit.</p>
        <Button asChild variant="brand" className="mt-4">
          <Link href="/inscription">Créer mon compte</Link>
        </Button>
      </div>
    </section>
  );
}
