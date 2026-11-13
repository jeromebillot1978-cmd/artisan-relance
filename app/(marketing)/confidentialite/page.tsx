import type { Metadata } from "next";

export const metadata: Metadata = { title: "Confidentialité" };

// ⚠️ Faire relire cette page avant la mise en ligne publique.
export default function PrivacyPage() {
  return (
    <article className="container max-w-3xl space-y-6 py-16 text-sm leading-relaxed text-muted-foreground">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Politique de confidentialité</h1>
      <section className="space-y-2">
        <h2 className="text-base font-semibold text-foreground">Données collectées</h2>
        <p>
          Compte : adresse e-mail, nom de l'entreprise et, si renseignés, nom du contact et téléphone.
          Devis : nom, e-mail et téléphone du client final, montant, date et statut du devis.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-base font-semibold text-foreground">Finalité</h2>
        <p>
          Les données servent uniquement à fournir le service : affichage du tableau de bord et envoi des
          relances de devis au nom de l'utilisateur. Elles ne sont ni revendues ni utilisées à des fins
          publicitaires.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-base font-semibold text-foreground">Rôles</h2>
        <p>
          Pour les données de ses clients, l'artisan utilisateur est responsable de traitement ; Artisan Relance
          agit en tant que sous-traitant. Les sous-traitants techniques sont Supabase (base de données), Vercel
          (hébergement) et Resend (envoi des e-mails).
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-base font-semibold text-foreground">Durée et droits</h2>
        <p>
          Les données sont conservées tant que le compte est actif. Vous pouvez supprimer vos devis à tout
          moment et demander la suppression de votre compte ou exercer vos droits (accès, rectification,
          effacement) à l'adresse : [À COMPLÉTER].
        </p>
      </section>
    </article>
  );
}
