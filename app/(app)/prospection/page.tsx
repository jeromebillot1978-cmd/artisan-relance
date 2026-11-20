import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { ProspectCard } from "@/components/prospection/prospect-card";
import { getProspects, PROSPECT_STATUSES } from "@/lib/prospects";
import { isPlatformAdmin } from "@/lib/stats";

export const metadata: Metadata = { title: "Prospection" };
export const dynamic = "force-dynamic";

/**
 * Prospection d'artisans (administrateur uniquement). Rien n'est envoyé
 * depuis cette page : on copie le message ou on ouvre un brouillon Gmail,
 * puis on envoie soi-même et on met à jour le statut.
 */
export default async function ProspectionPage() {
  if (!(await isPlatformAdmin())) notFound();
  const prospects = await getProspects();

  if (!prospects) {
    return (
      <>
        <PageHeader title="Prospection" />
        <Card className="p-6 text-sm text-muted-foreground">La liste des prospects est momentanément indisponible. Réessayez dans un instant.</Card>
      </>
    );
  }

  const counts = PROSPECT_STATUSES.map((s) => ({ ...s, n: prospects.filter((p) => p.status === s.value).length }));

  return (
    <>
      <PageHeader
        title="Prospection"
        description="Artisans à démarcher et messages préparés. Visible uniquement par vous."
      />

      <Card className="mb-6 flex gap-3 border-sky-500/30 bg-sky-500/5 p-4 text-sm">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
        <div className="space-y-1">
          <p className="font-medium">Aucun envoi automatique.</p>
          <p className="text-muted-foreground">
            Relisez chaque message, passez-le en « Validé », ouvrez le brouillon et cliquez vous-même sur « Envoyer ».
            Vérifiez que l'expéditeur est bien jercat.bilman@gmail.com et que le message apparaît dans « Messages envoyés »,
            puis seulement marquez le prospect « Envoyé ». Ces prospects ne reçoivent jamais de relance automatique.
          </p>
          <p className="text-muted-foreground">
            Conseil : 2 ou 3 envois par jour, depuis jercat.bilman@gmail.com. Chaque message se termine par la possibilité de
            répondre « stop » : respectez-la.
          </p>
        </div>
      </Card>

      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        {counts.map((c) => (
          <span key={c.value} className="rounded-full border px-3 py-1">
            {c.label} : <strong className="tabular-nums">{c.n}</strong>
          </span>
        ))}
      </div>

      {prospects.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">Aucun prospect pour l'instant.</Card>
      ) : (
        <div className="space-y-4">
          {prospects.map((p, i) => (
            <ProspectCard key={p.id} p={p} index={i} />
          ))}
        </div>
      )}
    </>
  );
}
