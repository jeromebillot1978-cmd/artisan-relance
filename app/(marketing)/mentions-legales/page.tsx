import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mentions légales" };

// ⚠️ Compléter les champs [À COMPLÉTER] avant la mise en ligne publique.
export default function LegalPage() {
  return (
    <article className="container max-w-3xl space-y-6 py-16 text-sm leading-relaxed text-muted-foreground">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Mentions légales</h1>
      <section className="space-y-2">
        <h2 className="text-base font-semibold text-foreground">Éditeur</h2>
        <p>Artisan Relance est édité par Jercat — [À COMPLÉTER : statut, SIRET, adresse].</p>
        <p>Contact : [À COMPLÉTER : e-mail de contact]</p>
      </section>
      <section className="space-y-2">
        <h2 className="text-base font-semibold text-foreground">Hébergement</h2>
        <p>Application : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.</p>
        <p>Base de données : Supabase Inc. (région d'hébergement choisie lors de la création du projet).</p>
        <p>Envoi des e-mails : Resend.</p>
      </section>
      <section className="space-y-2">
        <h2 className="text-base font-semibold text-foreground">Propriété intellectuelle</h2>
        <p>L'ensemble des contenus de ce site est la propriété de son éditeur, sauf mention contraire.</p>
      </section>
    </article>
  );
}
