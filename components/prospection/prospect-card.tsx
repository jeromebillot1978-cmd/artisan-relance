"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Archive, CheckCircle2, CircleAlert, CircleDashed, Copy, ExternalLink, Globe, History, Mail, MessageSquareText,
  Phone, ShieldAlert, ShieldCheck, TriangleAlert, Undo2,
} from "lucide-react";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  approveMessage, archiveProspect, cancelAttempt, declareAttempt, doNotContact, failAttempt, recordReply, startAttempt, updateNotes,
  type ProspectActionResult,
} from "@/lib/actions/prospects";
import type { Attempt, CallOutcome, Channel, Prospect, Stage } from "@/lib/prospects";

// ---------------------------------------------------------------------------
// Libellés : un verbe au passé n'apparaît QUE s'il existe une preuve.
// ---------------------------------------------------------------------------
const STAGE: Record<Stage, { label: string; variant: "pending" | "info" | "violet" | "signed" | "neutral" | "lost" }> = {
  a_preparer: { label: "Message à relire", variant: "pending" },
  pret: { label: "Message relu, pas encore contacté", variant: "info" },
  contacte: { label: "Contacté, en attente de réponse", variant: "violet" },
  en_discussion: { label: "En discussion", variant: "info" },
  interesse: { label: "Intéressé", variant: "signed" },
  pas_interesse: { label: "Pas intéressé", variant: "neutral" },
  ne_plus_contacter: { label: "Ne plus contacter (STOP)", variant: "lost" },
};
const CHANNEL: Record<Channel, string> = { email: "E-mail", formulaire: "Formulaire de leur site", telephone: "Téléphone" };
const OUTCOME: Record<CallOutcome, string> = {
  joint: "Joint, on a parlé",
  messagerie: "Messagerie, message laissé",
  pas_de_reponse: "Pas de réponse",
  faux_numero: "Faux numéro",
  a_rappeler: "À rappeler",
};
const SENDER = "jercat.bilman@gmail.com";

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }) : "";

/** Un champ téléphone peut contenir plusieurs numéros (« 03… / 07… ») : un lien par numéro (corrige M10). */
function phoneNumbers(raw: string | null) {
  return (raw ?? "")
    .split(/[\/,;]| ou /)
    .map((s) => s.trim())
    .filter((s) => s.replace(/\D/g, "").length >= 10)
    .map((label) => ({ label, href: `tel:${label.replace(/[^\d+]/g, "")}` }));
}

function gmailUrl(to: string, bcc: string, subject: string | null, body: string) {
  const p = new URLSearchParams({ view: "cm", fs: "1", authuser: SENDER, to, bcc, su: subject ?? "", body });
  return `https://mail.google.com/mail/?${p.toString()}`;
}
function mailtoUrl(to: string, bcc: string, subject: string | null, body: string) {
  return `mailto:${to}?bcc=${encodeURIComponent(bcc)}&subject=${encodeURIComponent(subject ?? "")}&body=${encodeURIComponent(body)}`;
}
async function copy(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${what} copié`);
  } catch {
    toast.error("Copie impossible : sélectionnez le texte à la main.");
  }
}

// ---------------------------------------------------------------------------
// Preuve : ce que l'on sait réellement de la dernière tentative
// ---------------------------------------------------------------------------
function ProofLine({ a, wrongSender }: { a: Attempt; wrongSender: boolean }) {
  if (a.state === "verifiee") {
    return wrongSender ? (
      <p className="flex gap-2 text-red-700 dark:text-red-400">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        Envoi prouvé le {when(a.verified_at)}, mais depuis un AUTRE compte : {a.verified_from}. Le prospect voit cet expéditeur.
      </p>
    ) : (
      <p className="flex gap-2 text-green-700 dark:text-green-400">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        E-mail envoyé, prouvé : copie de contrôle reçue le {when(a.verified_at)} depuis {a.verified_from}.
      </p>
    );
  }
  if (a.state === "declaree") {
    const text =
      a.channel === "email"
        ? `Vous avez déclaré l'envoi le ${when(a.declared_at)}. Non prouvé : la copie de contrôle n'est pas encore arrivée.`
        : a.channel === "formulaire"
          ? `Vous avez déclaré avoir rempli leur formulaire le ${when(a.declared_at)}. Ce canal ne peut pas être prouvé.`
          : `Appel déclaré le ${when(a.declared_at)} — résultat : ${a.call_outcome ? OUTCOME[a.call_outcome] : "?"}.`;
    return (
      <p className="flex gap-2 text-amber-700 dark:text-amber-400">
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
        {text}
      </p>
    );
  }
  if (a.state === "ouverte") {
    return (
      <p className="flex gap-2 text-muted-foreground">
        <CircleDashed className="mt-0.5 h-4 w-4 shrink-0" />
        Tentative ({CHANNEL[a.channel]}) commencée le {when(a.opened_at)}. Rien n'est encore confirmé.
      </p>
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// Fenêtre de confirmation générique (cases obligatoires, choix, motif)
// ---------------------------------------------------------------------------
type Check = { key: string; label: string };
function ConfirmDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  checks?: Check[];
  choices?: { label: string; options: { value: string; label: string }[] };
  reason?: { label: string; required: boolean };
  confirmLabel: string;
  destructive?: boolean;
  pending: boolean;
  onConfirm: (v: { checks: string[]; choice?: string; reason: string }) => void;
}) {
  const [checked, setChecked] = useState<string[]>([]);
  const [choice, setChoice] = useState<string | undefined>();
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (props.open) {
      setChecked([]);
      setChoice(undefined);
      setReason("");
    }
  }, [props.open]);
  const allChecked = (props.checks ?? []).every((c) => checked.includes(c.key));
  const ready = allChecked && (!props.choices || Boolean(choice)) && (!props.reason?.required || reason.trim().length >= 3);
  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{props.title}</AlertDialogTitle>
          <AlertDialogDescription>{props.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3 text-sm">
          {props.checks?.map((c) => (
            <label key={c.key} className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={checked.includes(c.key)}
                onChange={(e) => setChecked((v) => (e.target.checked ? [...v, c.key] : v.filter((k) => k !== c.key)))}
              />
              <span>{c.label}</span>
            </label>
          ))}
          {props.choices && (
            <fieldset className="space-y-1">
              <legend className="mb-1 font-medium">{props.choices.label}</legend>
              {props.choices.options.map((o) => (
                <label key={o.value} className="flex items-center gap-2">
                  <input type="radio" name="choice" value={o.value} checked={choice === o.value} onChange={() => setChoice(o.value)} />
                  {o.label}
                </label>
              ))}
            </fieldset>
          )}
          {props.reason && (
            <label className="block space-y-1">
              <span className="font-medium">{props.reason.label}</span>
              <Textarea rows={2} value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} />
            </label>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={props.pending}>Annuler</AlertDialogCancel>
          <Button
            variant={props.destructive ? "destructive" : "default"}
            disabled={!ready || props.pending}
            onClick={() => props.onConfirm({ checks: checked, choice, reason })}
          >
            {props.pending ? "Enregistrement…" : props.confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const EVENT_LABEL: Record<string, string> = {
  reprise_v2: "Reprise des anciennes données",
  message_valide: "Message relu et validé",
  tentative_ouverte: "Tentative de contact commencée",
  tentative_declaree: "Action déclarée par vous",
  tentative_annulee: "Tentative annulée",
  declaration_retiree: "Déclaration retirée (erreur corrigée)",
  tentative_echouee: "Échec signalé",
  envoi_prouve: "Envoi prouvé (copie de contrôle reçue)",
  envoi_prouve_mauvais_expediteur: "Envoi prouvé depuis un AUTRE compte",
  reponse_enregistree: "Réponse enregistrée",
  ne_plus_contacter: "Opposition enregistrée (ne plus contacter)",
  notes_modifiees: "Notes modifiées",
  archive: "Archivé",
  desarchive: "Désarchivé",
};

type DialogKind = null | "approve" | "declare" | "cancel" | "fail" | "reply" | "dnc" | "archive";

export function ProspectCard({ p, proofDomain }: { p: Prospect; proofDomain: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [notes, setNotes] = useState(p.notes);
  const [showHistory, setShowHistory] = useState(false);

  const open = p.attempts.find((a) => a.state === "ouverte") ?? null;
  const lastUseful = p.attempts.find((a) => a.state === "verifiee" || a.state === "declaree") ?? null;
  const proofPending = p.attempts.some((a) => a.channel === "email" && (a.state === "ouverte" || a.state === "declaree"));
  const wrongSender = (attemptId: string) =>
    p.events.some((e) => e.type === "envoi_prouve_mauvais_expediteur" && e.attempt_id === attemptId);
  const blocked = Boolean(p.do_not_contact_at);
  const canContact = !blocked && !open && ["pret", "contacte", "en_discussion"].includes(p.stage);
  const canReply = !blocked && Boolean(lastUseful) && ["contacte", "en_discussion"].includes(p.stage);
  const phones = phoneNumbers(p.phone);
  const notesDirty = notes !== p.notes;

  // Tant qu'une preuve d'envoi est attendue, la page se met à jour toute seule (synchronisation Gmail → écran)
  useEffect(() => {
    if (!proofPending) return;
    const t = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(t);
  }, [proofPending, router]);

  // Avertit avant de quitter la page avec des notes non enregistrées (Mo1)
  useEffect(() => {
    if (!notesDirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [notesDirty]);

  /** Jamais d'affichage « optimiste » : l'écran ne change qu'après confirmation du serveur (M1, M2). */
  function run(action: () => Promise<ProspectActionResult>, success: string) {
    start(async () => {
      const res = await action();
      if (!res.ok) {
        toast.error(res.error);
        if (res.conflict) router.refresh();
        return;
      }
      toast.success(success);
      setDialog(null);
      router.refresh();
    });
  }

  const stage = STAGE[p.stage];
  const bcc = open?.bcc_token ? `prospect-${open.bcc_token}@${proofDomain}` : "";

  return (
    <Card className={p.is_test ? "border-dashed" : undefined}>
      <CardHeader className="space-y-2 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="flex flex-wrap items-center gap-2 text-base">
            {p.company} {p.is_test && <Badge variant="neutral">TEST — non compté</Badge>}
          </CardTitle>
          <Badge variant={stage.variant}>{stage.label}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {p.trade} · {p.city}
          {p.next_action_at && !blocked && <> · Prochaine action prévue le {new Date(p.next_action_at).toLocaleDateString("fr-FR")}</>}
        </p>
      </CardHeader>

      <CardContent className="space-y-4 text-sm">
        {blocked && (
          <p className="flex gap-2 rounded-md border border-red-600/30 bg-red-600/10 p-3 text-red-800 dark:text-red-300">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            Ne plus contacter depuis le {when(p.do_not_contact_at)} : {p.do_not_contact_reason}. Tout nouveau contact est bloqué.
          </p>
        )}

        <dl className="grid gap-2 sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
            {p.website ? (
              <a href={p.website} target="_blank" rel="noopener noreferrer" className="truncate underline underline-offset-4">
                {p.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
              </a>
            ) : (
              <span className="text-muted-foreground">Aucun site trouvé</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{p.email ?? <span className="text-muted-foreground">Pas d&apos;e-mail public</span>}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
            {phones.length ? (
              phones.map((n) => (
                <a key={n.href} href={n.href} className="underline underline-offset-4">
                  {n.label}
                </a>
              ))
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        </dl>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <h3 className="mb-1 font-medium">Pourquoi c&apos;est une bonne cible</h3>
            <p className="whitespace-pre-line text-muted-foreground">{p.why}</p>
          </div>
          <div>
            <h3 className="mb-1 font-medium">Ce qui a été vérifié</h3>
            <p className="whitespace-pre-line text-muted-foreground">{p.findings}</p>
          </div>
        </div>

        {p.caution && (
          <p className="flex gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-amber-800 dark:text-amber-300">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {p.caution}
          </p>
        )}

        {/* Ce que l'on sait réellement (preuve), toujours visible */}
        <div className="rounded-md border p-3">
          <h3 className="mb-1 font-medium">Situation réelle</h3>
          {open ? (
            <ProofLine a={open} wrongSender={false} />
          ) : lastUseful ? (
            <ProofLine a={lastUseful} wrongSender={lastUseful.state === "verifiee" && wrongSender(lastUseful.id)} />
          ) : (
            <p className="text-muted-foreground">Aucun contact enregistré.</p>
          )}
        </div>

        <div className="rounded-md border bg-muted/30 p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2 font-medium">
            <MessageSquareText className="h-4 w-4" />
            {p.channel === "telephone" ? "Script d'appel" : "Message"}
            {p.approved_at && <span className="font-normal text-muted-foreground">· relu et validé le {when(p.approved_at)}</span>}
          </div>
          {p.subject && (
            <p className="mb-2">
              <span className="text-muted-foreground">Objet : </span>
              {p.subject}
            </p>
          )}
          <p className="whitespace-pre-line">{p.message}</p>
        </div>

        {/* Étape 1 : relire */}
        {p.stage === "a_preparer" && !blocked && (
          <Button onClick={() => setDialog("approve")}>
            <CheckCircle2 className="h-4 w-4" /> J&apos;ai relu ce message
          </Button>
        )}

        {/* Étape 2 : commencer une tentative (un seul canal à la fois) */}
        {canContact && (
          <div className="flex flex-wrap gap-2">
            {p.email && (
              <Button onClick={() => run(() => startAttempt(p.id, "email", p.version), "Tentative par e-mail commencée")} disabled={pending}>
                <Mail className="h-4 w-4" /> Préparer l&apos;e-mail
              </Button>
            )}
            {p.website && (
              <Button variant="outline" onClick={() => run(() => startAttempt(p.id, "formulaire", p.version), "Tentative par formulaire commencée")} disabled={pending}>
                <Globe className="h-4 w-4" /> Contacter par leur formulaire
              </Button>
            )}
            {phones.length > 0 && (
              <Button variant="outline" onClick={() => run(() => startAttempt(p.id, "telephone", p.version), "Appel commencé")} disabled={pending}>
                <Phone className="h-4 w-4" /> Appeler
              </Button>
            )}
          </div>
        )}

        {/* Étape 3 : tentative en cours — instructions propres au canal */}
        {open && (
          <div className="space-y-3 rounded-md border border-sky-500/30 bg-sky-500/5 p-3">
            <p className="font-medium">Tentative en cours : {CHANNEL[open.channel]}</p>
            {open.channel === "email" && p.email && (
              <>
                <ol className="list-decimal space-y-1 pl-5">
                  <li>
                    Ouvrez le brouillon. Vérifiez que l&apos;expéditeur est <strong>{SENDER}</strong>.
                  </li>
                  <li>
                    Gardez l&apos;adresse en <strong>Cci</strong> ({bcc}) : c&apos;est elle qui prouvera l&apos;envoi.
                  </li>
                  <li>Appuyez sur « Envoyer » dans Gmail.</li>
                  <li>Revenez ici et cliquez sur « J&apos;ai envoyé l&apos;e-mail ». La preuve s&apos;affichera toute seule en moins d&apos;une minute.</li>
                </ol>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm">
                    <a href={gmailUrl(p.email, bcc, open.subject_snapshot, open.message_snapshot ?? "")} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" /> Gmail (ordinateur)
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <a href={mailtoUrl(p.email, bcc, open.subject_snapshot, open.message_snapshot ?? "")}>
                      <Mail className="h-4 w-4" /> Appli e-mail (téléphone)
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => copy(bcc, "Adresse Cci")}>
                    <Copy className="h-4 w-4" /> Copier l&apos;adresse Cci
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => copy(open.message_snapshot ?? "", "Message")}>
                    <Copy className="h-4 w-4" /> Copier le message
                  </Button>
                </div>
              </>
            )}
            {open.channel === "formulaire" && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => copy(open.message_snapshot ?? "", "Message")}>
                  <Copy className="h-4 w-4" /> Copier le message
                </Button>
                {p.website && (
                  <Button asChild size="sm">
                    <a href={p.website} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" /> Ouvrir leur site
                    </a>
                  </Button>
                )}
              </div>
            )}
            {open.channel === "telephone" && (
              <div className="flex flex-wrap gap-2">
                {phones.map((n) => (
                  <Button asChild size="sm" key={n.href}>
                    <a href={n.href}>
                      <Phone className="h-4 w-4" /> {n.label}
                    </a>
                  </Button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2 border-t pt-3">
              <Button size="sm" onClick={() => setDialog("declare")}>
                {open.channel === "email" ? "J'ai envoyé l'e-mail" : open.channel === "formulaire" ? "J'ai envoyé le formulaire" : "J'ai passé l'appel"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDialog("fail")}>
                Ça n&apos;a pas marché
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDialog("cancel")}>
                Annuler cette tentative
              </Button>
            </div>
          </div>
        )}

        {/* Retour arrière d'une déclaration erronée (jamais d'un envoi prouvé) */}
        {!open && lastUseful?.state === "declaree" && (
          <Button size="sm" variant="ghost" onClick={() => setDialog("cancel")}>
            <Undo2 className="h-4 w-4" /> Retirer ma déclaration (ce n&apos;était pas fait)
          </Button>
        )}

        <div className="flex flex-wrap gap-2">
          {canReply && (
            <Button size="sm" variant="outline" onClick={() => setDialog("reply")}>
              Enregistrer sa réponse
            </Button>
          )}
          {!blocked && (
            <Button size="sm" variant="ghost" onClick={() => setDialog("dnc")}>
              Ne plus contacter
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setDialog("archive")}>
            <Archive className="h-4 w-4" /> Archiver
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowHistory((v) => !v)}>
            <History className="h-4 w-4" /> Historique ({p.events.length})
          </Button>
        </div>

        {showHistory && (
          <ol className="space-y-1 border-l pl-3 text-xs text-muted-foreground">
            {p.events.map((e) => (
              <li key={e.id}>
                <span className="tabular-nums">{when(e.created_at)}</span> — {EVENT_LABEL[e.type] ?? e.type}
                {e.actor === "reception" && " (automatique)"}
                {typeof e.detail?.raison === "string" && ` : ${e.detail.raison}`}
              </li>
            ))}
          </ol>
        )}

        <div className="space-y-1 border-t pt-4">
          <span className="text-xs font-medium text-muted-foreground">Notes</span>
          <Textarea rows={2} value={notes} maxLength={2000} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!notesDirty || pending}
              onClick={() => run(() => updateNotes(p.id, notes, p.version), "Notes enregistrées")}
            >
              Enregistrer les notes
            </Button>
            {notesDirty && <span className="text-xs text-amber-700 dark:text-amber-400">Modifications non enregistrées</span>}
          </div>
        </div>
      </CardContent>

      {/* ------------------------- Fenêtres de confirmation ------------------------- */}
      <ConfirmDialog
        open={dialog === "approve"}
        onOpenChange={(v) => !v && setDialog(null)}
        title="Valider ce message ?"
        description="La validation enregistre ce texte précis. S'il est modifié ensuite, il faudra le relire à nouveau avant tout contact."
        checks={[{ key: "relu", label: "J'ai relu le message en entier, l'objet et les liens." }]}
        confirmLabel="Valider le message"
        pending={pending}
        onConfirm={() => run(() => approveMessage(p.id, p.version), "Message validé")}
      />
      {open && (
        <ConfirmDialog
          open={dialog === "declare"}
          onOpenChange={(v) => !v && setDialog(null)}
          title={open.channel === "email" ? "Confirmer l'envoi de l'e-mail" : open.channel === "formulaire" ? "Confirmer l'envoi du formulaire" : "Résultat de l'appel"}
          description={
            open.channel === "email"
              ? "Cochez seulement ce que vous avez vu de vos yeux. L'envoi restera marqué « non prouvé » tant que la copie de contrôle n'est pas arrivée."
              : open.channel === "formulaire"
                ? "Un formulaire ne peut pas être prouvé automatiquement : votre déclaration sera affichée comme telle."
                : "Un appel n'est pas un envoi : indiquez ce qui s'est réellement passé."
          }
          checks={
            open.channel === "email"
              ? [
                  { key: "bon_compte", label: `L'expéditeur affiché était ${SENDER}.` },
                  { key: "clique_envoyer", label: "J'ai appuyé sur « Envoyer »." },
                  { key: "vu_dans_envoyes", label: "Je vois le message dans « Messages envoyés » de ce compte." },
                ]
              : open.channel === "formulaire"
                ? [
                    { key: "formulaire_soumis", label: "J'ai collé le message et cliqué sur le bouton d'envoi de leur formulaire." },
                    { key: "confirmation_du_site", label: "Leur site a affiché un message de confirmation." },
                  ]
                : [{ key: "appel_passe", label: "J'ai composé le numéro." }]
          }
          choices={
            open.channel === "telephone"
              ? { label: "Résultat", options: (Object.keys(OUTCOME) as CallOutcome[]).map((k) => ({ value: k, label: OUTCOME[k] })) }
              : undefined
          }
          confirmLabel="Confirmer"
          pending={pending}
          onConfirm={(v) => run(() => declareAttempt(open.id, v.checks, v.choice), "Enregistré")}
        />
      )}
      <ConfirmDialog
        open={dialog === "cancel"}
        onOpenChange={(v) => !v && setDialog(null)}
        title={open ? "Annuler cette tentative ?" : "Retirer votre déclaration ?"}
        description="Rien n'est effacé : l'historique gardera la tentative et la raison. Si la copie de contrôle arrive malgré tout, l'envoi sera affiché comme prouvé."
        reason={{ label: "Raison (obligatoire)", required: true }}
        confirmLabel={open ? "Annuler la tentative" : "Retirer la déclaration"}
        destructive
        pending={pending}
        onConfirm={(v) => {
          const target = open ?? lastUseful;
          if (target) run(() => cancelAttempt(target.id, v.reason), "Corrigé");
        }}
      />
      {open && (
        <ConfirmDialog
          open={dialog === "fail"}
          onOpenChange={(v) => !v && setDialog(null)}
          title="Signaler un échec"
          description="Exemples : adresse refusée, formulaire en panne, faux numéro."
          reason={{ label: "Que s'est-il passé ?", required: true }}
          confirmLabel="Enregistrer l'échec"
          pending={pending}
          onConfirm={(v) => run(() => failAttempt(open.id, v.reason), "Échec enregistré")}
        />
      )}
      <ConfirmDialog
        open={dialog === "reply"}
        onOpenChange={(v) => !v && setDialog(null)}
        title="Enregistrer la réponse du prospect"
        description="Choisissez le sens de la réponse. « Stop » bloque définitivement tout nouveau contact."
        choices={{
          label: "Sa réponse",
          options: [
            { value: "positive", label: "Intéressé" },
            { value: "question", label: "Pose une question / à suivre" },
            { value: "negative", label: "Pas intéressé" },
            { value: "stop", label: "Demande à ne plus être contacté (STOP)" },
          ],
        }}
        reason={{ label: "Résumé de sa réponse (facultatif)", required: false }}
        confirmLabel="Enregistrer"
        pending={pending}
        onConfirm={(v) => run(() => recordReply(p.id, v.choice as "positive" | "question" | "negative" | "stop", v.reason, p.version), "Réponse enregistrée")}
      />
      <ConfirmDialog
        open={dialog === "dnc"}
        onOpenChange={(v) => !v && setDialog(null)}
        title="Ne plus jamais contacter ce prospect ?"
        description="Tout contact sera bloqué. À utiliser dès qu'une personne s'y oppose, par n'importe quel moyen."
        reason={{ label: "Raison (obligatoire)", required: true }}
        confirmLabel="Bloquer les contacts"
        destructive
        pending={pending}
        onConfirm={(v) => run(() => doNotContact(p.id, v.reason, p.version), "Contacts bloqués")}
      />
      <ConfirmDialog
        open={dialog === "archive"}
        onOpenChange={(v) => !v && setDialog(null)}
        title="Archiver ce prospect ?"
        description="Il disparaît de la liste et des compteurs. Son historique est conservé."
        confirmLabel="Archiver"
        pending={pending}
        onConfirm={() => run(() => archiveProspect(p.id, true, p.version), "Archivé")}
      />
    </Card>
  );
}
