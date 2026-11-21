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
import { PROSPECTION_SENDER as SENDER } from "@/lib/prospect-links";

export const metadata: Metadata = { title: "Prospection" };
export const dynamic = "force-dynamic";
/** L'envoi SMTP se fait dans l'action serveur de cette page : marge au-delà des ~2 s habituelles. */
export const maxDuration = 30;

const DAY = 24 * 3600 * 1000;

/** Raison pour laquelle un prospect demande une action aujourd'hui (null = rien à faire). */
function todo(p: Prospect, today: string, now: number): string | null {
  if (p.do_not_contact_at) return null;
  const unread = p.messages.filter((m) => m.direction === "in" && !m.read_at && m.kind !== "auto_reply").length;
  if (unread) return `${unread} nouvelle${unread > 1 ? "s" : ""} réponse${unread > 1 ? "s" : ""} à lire`;
  const failedReply = p.messages.find((m) => m.direction === "out" && m.status === "failed");
  if (failedReply) return `Votre réponse n'est pas partie : ${failedReply.error ?? "erreur inconnue"}`;
  const open = p.attempts.find((a) => a.state === "ouverte");
  if (open && open.draft_method === "serveur") {
    return now - new Date(open.opened_at).getTime() > 2 * 60 * 1000 ? "Envoi automatique resté sans réponse : vérifiez puis annulez" : null;
  }
  if (open) return open.draft_opened_at ? "Tentative à terminer (confirmer, signaler un échec ou annuler)" : "Tentative commencée, brouillon jamais ouvert";
  const rewritten = p.attempts.find((a) => a.link_rewrite_detected);
  if (rewritten) return "Liens réécrits détectés dans l'e-mail reçu : voir le diagnostic";
  const sentNoProof = p.attempts.find((a) => a.state === "envoyee");
  if (sentNoProof?.sent_at && now - new Date(sentNoProof.sent_at).getTime() > 15 * 60 * 1000)
    return "Envoyé par le serveur il y a plus de 15 min, copie de contrôle toujours absente";
  const lastFail = p.attempts[0];
  if (lastFail?.state === "echec" && lastFail.draft_method === "serveur" && !["contacte", "en_discussion", "interesse"].includes(p.stage))
    return `Dernier envoi en échec : ${lastFail.failure_reason ?? "raison inconnue"}`;
  const bad = p.attempts.find((a) => a.state === "verifiee" && (a.wrong_sender || a.content_check === "tronque"));
  if (bad && p.stage === "contacte") return bad.wrong_sender ? "Envoyé depuis un autre compte : à vérifier" : "Message reçu incomplet : à vérifier";
  const unproven = p.attempts.find((a) => a.channel === "email" && a.state === "declaree");
  if (unproven && unproven.declared_at && now - new Date(unproven.declared_at).getTime() > DAY)
    return "E-mail déclaré il y a plus de 24 h, toujours sans preuve : vérifiez « Messages envoyés »";
  if (p.next_action_at && p.next_action_at <= today) return `Action prévue le ${new Date(`${p.next_action_at}T12:00:00`).toLocaleDateString("fr-FR")}`;
  return null;
}

/**
 * Prospection (administrateur uniquement). L'envoi des e-mails se fait côté serveur (Gmail SMTP).
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
  const sentAwaiting = attempts.filter((a) => a.state === "envoyee").length;
  const failed = attempts.filter((a) => a.state === "echec" && a.draft_method === "serveur").length;
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
        description="Artisans à démarcher. Visible uniquement par vous. « Valider et envoyer » envoie l'e-mail directement depuis le serveur."
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
                E-mail : « Valider et envoyer » → le serveur envoie depuis {SENDER} → « Envoyé » (Gmail a accepté le message, avec
                date, heure et identifiant) → « Prouvé » (la copie de contrôle en Cci est arrivée, avec les liens réellement reçus).
                Formulaires et appels : « Déclaré » par vous, sans preuve technique possible.
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
              <p className="text-xs text-muted-foreground">E-mails envoyés — en attente de preuve</p>
              <p className="text-2xl font-semibold tabular-nums">{sentAwaiting + declaredEmail}</p>
              {failed > 0 && <p className="text-xs text-red-700 dark:text-red-400">{failed} envoi{failed > 1 ? "s" : ""} en échec</p>}
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
