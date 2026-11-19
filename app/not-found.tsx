import Link from "next/link";
import { Button } from "@/components/ui/button";
import { METIERS } from "@/lib/content/metiers";

/** Page introuvable : on propose tout de suite l'essai gratuit et les pages métiers. */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 p-6 text-center">
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold">Cette page n'existe pas</h1>
      <p className="max-w-md text-muted-foreground">
        Artisan Relance relance automatiquement vos devis par e-mail, à votre nom, jusqu'à la réponse du client. Gratuit pendant le lancement.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/inscription">Essayer gratuitement</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Voir comment ça marche</Link>
        </Button>
      </div>
      <nav aria-label="Pages métiers" className="mt-2 flex max-w-lg flex-wrap justify-center gap-2 text-sm">
        {METIERS.map((m) => (
          <Link key={m.slug} href={`/relance-devis/${m.slug}`} className="rounded-full border px-3 py-1 hover:bg-muted">
            {m.short}
          </Link>
        ))}
      </nav>
    </main>
  );
}
