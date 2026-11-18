import Link from "next/link";
import { Flag, LifeBuoy, LockKeyhole, RefreshCw, Server } from "lucide-react";
import { cn } from "@/lib/utils";

/** Preuves de crédibilité : chaque badge renvoie à une information vérifiable sur la page Confiance. */
export const TRUST_BADGES = [
  { icon: Flag, title: "Logiciel français", text: "Conçu et développé en France, entièrement en français.", anchor: "editeur" },
  { icon: LifeBuoy, title: "Support disponible", text: "Par e-mail, en français, directement par l'éditeur.", anchor: "contact" },
  { icon: LockKeyhole, title: "Données protégées", text: "RGPD, comptes isolés, aucune donnée revendue.", anchor: "donnees" },
  { icon: Server, title: "Hébergement sécurisé en Europe", text: "Base de données à Zurich, e-mails en Irlande, HTTPS.", anchor: "securite" },
  { icon: RefreshCw, title: "Mise à jour continue", text: "Nouvelles fonctions et corrections publiées en continu.", anchor: "engagements" },
] as const;

export function TrustBadges({ compact = false, className }: { compact?: boolean; className?: string }) {
  if (compact) {
    return (
      <ul className={cn("flex flex-wrap justify-center gap-2", className)} aria-label="Garanties Artisan Relance">
        {TRUST_BADGES.map((b) => (
          <li key={b.title}>
            <Link
              href={`/confiance#${b.anchor}`}
              className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <b.icon className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
              {b.title}
            </Link>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-5", className)} aria-label="Garanties Artisan Relance">
      {TRUST_BADGES.map((b) => (
        <li key={b.title}>
          <Link href={`/confiance#${b.anchor}`} className="flex h-full flex-col rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40">
            <b.icon className="h-5 w-5 text-brand" aria-hidden="true" />
            <span className="mt-2.5 text-sm font-medium">{b.title}</span>
            <span className="mt-1 text-xs text-muted-foreground">{b.text}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
