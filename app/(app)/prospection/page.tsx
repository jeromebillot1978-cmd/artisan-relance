import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { ProspectCard } from "@/components/prospection/prospect-card";
import { NewProspectButton } from "@/components/prospection/prospect-form";
import { getProspects, STAGE_LABEL, type Prospect, type Stage } from "@/lib/prospects";
import { isPlatformAdmin } from "@/lib/stats";

export const metadata: Metadata = { title: "Prospection" };
export const dynamic = "force-dynamic";

const DAY = 24 * 3600 * 1000;

/** Raison pour laquelle un prospect demande une action aujourd'hui (null = rien à faire). */
function todo(p: Prospect, today: string, now: number): string | null {
  if (p.do_not_contact_at) return null;
  const open = p.attempts.find((a) => a.state === "ouverte");
  if (open) return open.draft_opened_at ? "Tentative à terminer (confirmer, signaler un échec ou annuler)" : "Tentative commencée, brouillon jamais ouvert";
  const bad = p.attempts.find((a) => a.state === "verifiee" && (a.wrong_sender || a.content_check === "tronque"));
  if (bad && p.stage === "contacte") return bad.wrong_sender ? "Envoyé depuis un autre compte : à vérifier" : "Message reçu incomplet : à vérifier";
  const unproven = p.attempts.find((a) => a.channel === "email" && a.state === "declaree");
  if (unproven && unproven.declared_at && now - new Date(unproven.declared_at).getTime() > DAY)
    return "E-mail déclaré il y a plus de 24 h, toujours sans preuve : vérifiez « Messages envoyés »";
  if (p.next_action_at && p.next_action_at <= today) return `Action prévue le ${new Date(`${p.next_action_at}T12:00:00`).toLocaleDateString("fr-FR")}`;
  return null;
}

/**
 * Prospection (administrateur uniquement). Rien n'est envoyé depuis cette page.
 * Les compteurs séparent ce qui est PROUVÉ de ce qui est seulement DÉCLARÉ.
 */
export default async function ProspectionPage({ searchParams }: { searchParams: Promise<{ vue?: string; etape?: string }> }) {
  if (!(await isPlatformAdmin())) notFound();
  const sp = await searchParams;
  const archives = sp.vue === "archives";
  const stageFilter = (Object.keys(STAGE_LABEL) as string[]).includes(sp.etape ?? "") ? (sp.etape as Stage) : null;
  const prospects = await getProspects({ archived: archives });

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

  const now = Date.now();
  const today = new Date(now).toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
  const real = prospects.filter((p) => !p.is_test);
  const attempts = real.flatMap((p) => p.attempts);
  const proven = attempts.filter((a) => a.state === "verifiee").length;
  const provenWithWarning = attempts.filter((a) => a.state === "verifiee" && (a.wrong_sender || a.content_check === "tronque")).length;
  const declaredEmail = attempts.filter((a) => a.state === "declaree" && a.channel === "email").length;
  const declaredOther = attempts.filter((a) => a.state === "declaree" && a.channel !== "email").length;
  const stages = (Object.keys(STAGE_LABEL) as Stage[]).map((s) => ({ s, label: STAGE_LABEL[s], n: real.filter((p) => p.stage === s).length }));
  const proofDomain = process.env.INBOUND_DOMAIN || "reponses.jercat.fr";
  const todoList = archives ? [] : prospects.map((p) => ({ p, why: todo(p, today, now) })).filter((x) => x.why);
  const shown = stageFilter ? prospects.filter((p) => p.stage === stageFilter) : prospects;

  const chip = (href: string, active: boolean, label: React.ReactNode) => (
    <Link
      href={href}
      scroll={false}
      className={`rounded-full border px-3 py-1 ${active ? "border-foreground bg-foreground text-background" : "hover:bg-muted"}`}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </Link>
  );

  return (
    <>
      <PageHeader
        title="Prospection"
        description="Artisans à démarcher. Visible uniquement par vous. Aucun envoi automatique."
        actions={!archives ? <NewProspectButton /> : undefined}
      />

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {chip("/prospection", !archives, "Prospects actifs")}
        {chip("/prospection?vue=archives", archives, "Archives")}
      </div>

      {!archives && (
        <>
          <Card className="mb-6 flex gap-3 border-sky-500/30 bg-sky-500/5 p-4 text-sm">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
            <div className="space-y-1">
              <p className="font-medium">Ce que cette page affiche</p>
              <p className="text-muted-foreground">
                Chaque contact passe par 4 niveaux : 1. intention (tentative commencée) → 2. brouillon ouvert → 3. action déclarée
                par vous → 4. preuve. « Prouvé » : la plateforme a reçu la copie de contrôle de l&apos;e-mail (adresse en Cci).
                « Déclaré » : vous avez indiqué l&apos;avoir fait, sans preuve technique (formulaires, appels, ou e-mail dont la copie
                n&apos;est pas arrivée).
              </p>
            </div>
          </Card>

          <div className="mb-3 grid gap-3 sm:grid-cols-3">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">E-mails envoyés — prouvés</p>
              <p className="text-2xl font-semibold tabular-nums">{proven}</p>
              {provenWithWarning > 0 && <p className="text-xs text-red-700 dark:text-red-400">dont {provenWithWarning} avec une anomalie</p>}
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

          {todoList.length > 0 && (
            <Card className="mb-6 border-amber-500/30 bg-amber-500/5 p-4 text-sm">
              <p className="mb-2 font-medium">À faire aujourd&apos;hui ({todoList.length})</p>
              <ul className="space-y-1">
                {todoList.map(({ p, why }) => (
                  <li key={p.id}>
                    <a href={`#prospect-${p.id}`} className="font-medium underline underline-offset-4">
                      {p.company}
                    </a>{" "}
                    — <span className="text-muted-foreground">{why}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <div className="mb-6 flex flex-wrap gap-2 text-sm">
            {chip("/prospection", !stageFilter, <>Toutes : <strong className="tabular-nums">{real.length}</strong></>)}
            {stages.map((c) =>
              chip(`/prospection?etape=${c.s}`, stageFilter === c.s, <>
                {c.label} : <strong className="tabular-nums">{c.n}</strong>
              </>),
            )}
          </div>
        </>
      )}

      {shown.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">
          {archives ? "Aucun prospect archivé." : stageFilter ? "Aucun prospect à cette étape." : "Aucun prospect pour l'instant."}
        </Card>
      ) : (
        <div className="space-y-4">
          {shown.map((p) => (
            // La clé inclut la version : quand la base change, la carte repart des valeurs à jour (M2)
            <div id={`prospect-${p.id}`} key={`${p.id}-${p.version}`} className="scroll-mt-20">
              <ProspectCard p={p} proofDomain={proofDomain} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
