import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { ProspectCard } from "@/components/prospection/prospect-card";
import { getProspects, STAGE_LABEL, type Stage } from "@/lib/prospects";
import { isPlatformAdmin } from "@/lib/stats";

export const metadata: Metadata = { title: "Prospection" };
export const dynamic = "force-dynamic";

/**
 * Prospection (administrateur uniquement). Rien n'est envoyé depuis cette page.
 * Les compteurs séparent ce qui est PROUVÉ de ce qui est seulement DÉCLARÉ.
 */
export default async function ProspectionPage() {
  if (!(await isPlatformAdmin())) notFound();
  const prospects = await getProspects();

  if (!prospects) {
    return (
      <>
        <PageHeader title="Prospection" />
        <Card className="p-6 text-sm text-muted-foreground">
          La liste est momentanément indisponible. Rien n&apos;a été modifié. Réessayez dans un instant.
        </Card>
      </>
    );
  }

  const real = prospects.filter((p) => !p.is_test);
  const attempts = real.flatMap((p) => p.attempts);
  const proven = attempts.filter((a) => a.state === "verifiee").length;
  const declaredEmail = attempts.filter((a) => a.state === "declaree" && a.channel === "email").length;
  const declaredOther = attempts.filter((a) => a.state === "declaree" && a.channel !== "email").length;
  const stages = (Object.keys(STAGE_LABEL) as Stage[]).map((s) => ({ s, label: STAGE_LABEL[s], n: real.filter((p) => p.stage === s).length }));
  const proofDomain = process.env.INBOUND_DOMAIN || "reponses.jercat.fr";

  return (
    <>
      <PageHeader title="Prospection" description="Artisans à démarcher. Visible uniquement par vous. Aucun envoi automatique." />

      <Card className="mb-6 flex gap-3 border-sky-500/30 bg-sky-500/5 p-4 text-sm">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
        <div className="space-y-1">
          <p className="font-medium">Ce que cette page affiche</p>
          <p className="text-muted-foreground">
            « Prouvé » : la plateforme a reçu la copie de contrôle de l&apos;e-mail (adresse en Cci). « Déclaré » : vous avez indiqué
            l&apos;avoir fait, sans preuve technique (formulaires, appels, ou e-mail dont la copie n&apos;est pas arrivée).
          </p>
        </div>
      </Card>

      <div className="mb-3 grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">E-mails envoyés — prouvés</p>
          <p className="text-2xl font-semibold tabular-nums">{proven}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">E-mails déclarés — en attente de preuve</p>
          <p className="text-2xl font-semibold tabular-nums">{declaredEmail}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Formulaires et appels — déclarés</p>
          <p className="text-2xl font-semibold tabular-nums">{declaredOther}</p>
        </Card>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        {stages.map((c) => (
          <span key={c.s} className="rounded-full border px-3 py-1">
            {c.label} : <strong className="tabular-nums">{c.n}</strong>
          </span>
        ))}
      </div>

      {prospects.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">Aucun prospect pour l&apos;instant.</Card>
      ) : (
        <div className="space-y-4">
          {prospects.map((p) => (
            // La clé inclut la version : quand la base change, la carte repart des valeurs à jour (M2)
            <ProspectCard key={`${p.id}-${p.version}`} p={p} proofDomain={proofDomain} />
          ))}
        </div>
      )}
    </>
  );
}
