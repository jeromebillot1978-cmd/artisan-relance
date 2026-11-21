"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Archive, ArchiveRestore, CalendarClock, CheckCircle2, Circle, CircleAlert, CircleDashed, Copy, ExternalLink, Globe, History, Mail,
  Loader2, MessageSquareText, Pencil, Phone, Send, ShieldAlert, ShieldCheck, Trash2, TriangleAlert, Undo2,
} from "lucide-react";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProspectFormDialog } from "@/components/prospection/prospect-form";
import { ProspectConversation } from "@/components/prospection/prospect-conversation";
import { ProspectTimeline } from "@/components/prospection/prospect-timeline";
import { prospectDeliveryStatus } from "@/lib/prospect-status";
import {
  approveMessage, archiveProspect, cancelAttempt, declareAttempt, doNotContact, eraseProspect, failAttempt, markDraftOpened, recordReply,
  sendProspectEmail, setNextAction, startAttempt, updateNotes, type ProspectActionResult,
} from "@/lib/actions/prospects";
import { confirmNorm, detectPlatform, emailDraftLinks, phoneNumbers, PROSPECTION_SENDER, type Platform } from "@/lib/prospect-links";
import type { Attempt, CallOutcome, Channel, DraftMethod, Prospect, Stage } from "@/lib/prospects";

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
const SENDER = PROSPECTION_SENDER;
/** Délai minimum imposé par la base entre le début d'une tentative et la déclaration (C1). */
const MIN_SECONDS_BEFORE_DECLARE = 20;
const METHOD: Record<string, string> = {
  gmail_web: "Gmail (ordinateur)",
  gmail_app_android: "appli Gmail (Android)",
  gmail_app_ios: "appli Gmail (iPhone)",
  mailto: "appli e-mail du téléphone",
  copie: "message copié",
  site_ouvert: "site ouvert",
  numero_compose: "numéro composé",
  manuel: "préparé autrement",
  serveur: "envoi direct par le serveur",
};

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }) : "";

/** Date et heure à la seconde (envois serveur). */
const whenS = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/Paris" })
    : "";

const day = (d: string | null) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString("fr-FR") : "");

async function copy(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${what} copié`);
    return true;
  } catch {
    toast.error("Copie impossible : sélectionnez le texte à la main.");
    return false;
  }
}

/** Appareil détecté APRÈS le premier affichage (évite un écart serveur / navigateur). */
function usePlatform(): Platform | null {
  const [platform, setPlatform] = useState<Platform | null>(null);
  useEffect(() => setPlatform(detectPlatform(navigator.userAgent, navigator.maxTouchPoints)), []);
  return platform;
}

// ---------------------------------------------------------------------------
// Preuve : ce que l'on sait réellement de la dernière tentative
// ---------------------------------------------------------------------------
function ProofLine({ a }: { a: Attempt }) {
  if (a.state === "envoyee") {
    return (
      <div className="space-y-1">
        <p className="flex gap-2 text-sky-700 dark:text-sky-400">
          <Send className="mt-0.5 h-4 w-4 shrink-0" />
          Envoyé le {whenS(a.sent_at)} par le serveur à {a.to_address} — Gmail a accepté le message.
        </p>
        <p className="flex gap-2 text-muted-foreground">
          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
          En attente de la copie de contrôle (preuve de réception)… La page se met à jour toute seule.
        </p>
      </div>
    );
  }
  if (a.state === "ouverte" && a.draft_method === "serveur") {
    return (
      <p className="flex gap-2 text-sky-700 dark:text-sky-400">
        <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
        Envoi en cours depuis le serveur (demandé le {whenS(a.opened_at)})…
      </p>
    );
  }
  if (a.state === "verifiee") {
    const truncated = a.content_check === "tronque" && (
      <p className="flex gap-2 text-red-700 dark:text-red-400">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
        Le message reçu est INCOMPLET : la fin du texte prévu n&apos;y figure pas (lien trop long sur téléphone ?). Vérifiez
        dans « Messages envoyés » et envoyez un complément si besoin.
      </p>
    );
    return a.wrong_sender ? (
      <div className="space-y-1">
        <p className="flex gap-2 text-red-700 dark:text-red-400">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          Envoi prouvé le {when(a.verified_at)}, mais depuis un AUTRE compte : {a.verified_from}. Le prospect voit cet expéditeur.
        </p>
        {truncated}
      </div>
    ) : (
      <div className="space-y-1">
        <p className="flex gap-2 text-green-700 dark:text-green-400">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          {a.sent_at ? <>Envoyé le {whenS(a.sent_at)}, prouvé le {whenS(a.verified_at)} : copie de contrôle reçue depuis {a.verified_from}.</>
            : <>E-mail envoyé, prouvé : copie de contrôle reçue le {when(a.verified_at)} depuis {a.verified_from}.</>}
        </p>
        {truncated}
        {a.content_check === "inconnu" && (
          <p className="text-xs text-muted-foreground">Le contenu reçu n&apos;a pas pu être comparé au message prévu.</p>
        )}
      </div>
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
        Tentative ({CHANNEL[a.channel]}) commencée le {when(a.opened_at)}.{" "}
        {a.draft_opened_at ? `Brouillon ouvert (${METHOD[a.draft_method ?? "manuel"]}) — rien n'est encore envoyé ni confirmé.` : "Rien n'est encore ouvert ni confirmé."}
      </p>
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// Les 4 niveaux, jamais confondus : intention → brouillon → action → preuve
// ---------------------------------------------------------------------------
function Levels({ a }: { a: Attempt }) {
  if (a.draft_method === "serveur") {
    const rows: { label: string; done: boolean; text: string; warn?: boolean }[] = [
      { label: "1. Validé, envoi demandé", done: true, text: whenS(a.opened_at) },
      {
        label: "2. Envoyé (Gmail a accepté)",
        done: Boolean(a.sent_at),
        text: a.sent_at
          ? `${whenS(a.sent_at)}${a.send_duration_ms != null ? ` — ${a.send_duration_ms} ms` : ""}${a.smtp_response ? ` — ${a.smtp_response.slice(0, 60)}` : ""}`
          : a.state === "echec" ? `Échec : ${a.failure_reason ?? "?"}` : "En cours…",
        warn: a.state === "echec",
      },
      {
        label: "3. Prouvé (copie reçue)",
        done: a.state === "verifiee",
        text: a.state === "verifiee"
          ? `${whenS(a.verified_at)}${a.wrong_sender ? " — AUTRE expéditeur" : ""}${a.content_check === "tronque" ? " — message INCOMPLET" : ""}`
          : "Pas encore reçue",
        warn: a.state === "verifiee" && (a.wrong_sender || a.content_check === "tronque"),
      },
      {
        label: "4. Liens reçus",
        done: a.link_rewrite_detected === false,
        text: a.link_rewrite_detected == null ? "Pas encore contrôlés" : a.link_rewrite_detected ? "RÉÉCRITS (voir le diagnostic)" : "Directs, aucune réécriture",
        warn: a.link_rewrite_detected === true,
      },
    ];
    return <LevelRows rows={rows} />;
  }
  const proofLabel =
    a.channel !== "email"
      ? "Impossible à prouver pour ce canal"
      : a.state === "verifiee"
        ? `Copie de contrôle reçue ${when(a.verified_at)}${a.wrong_sender ? " — AUTRE expéditeur" : ""}${a.content_check === "tronque" ? " — message INCOMPLET" : ""}`
        : "Pas encore reçue";
  const rows: { label: string; done: boolean; text: string; warn?: boolean }[] = [
    { label: "1. Intention", done: true, text: `Tentative commencée ${when(a.opened_at)}` },
    {
      label: a.channel === "email" ? "2. Brouillon ouvert" : a.channel === "formulaire" ? "2. Site ouvert" : "2. Numéro composé",
      done: Boolean(a.draft_opened_at),
      text: a.draft_opened_at ? `${when(a.draft_opened_at)} — ${METHOD[a.draft_method ?? "manuel"]}` : "Pas encore",
    },
    {
      label: "3. Action déclarée par vous",
      done: Boolean(a.declared_at),
      text: a.declared_at ? `${when(a.declared_at)}${a.call_outcome ? ` — ${OUTCOME[a.call_outcome]}` : ""}` : "Pas encore",
    },
    {
      label: "4. Preuve",
      done: a.state === "verifiee",
      text: proofLabel,
      warn: a.state === "verifiee" && (a.wrong_sender || a.content_check === "tronque"),
    },
  ];
  return <LevelRows rows={rows} />;
}

function LevelRows({ rows }: { rows: { label: string; done: boolean; text: string; warn?: boolean }[] }) {
  return (
    <ol className="grid gap-1 text-xs sm:grid-cols-2">
      {rows.map((r) => (
        <li key={r.label} className="flex items-start gap-1.5">
          {r.warn ? (
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
          ) : r.done ? (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
          ) : (
            <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <span>
            <strong className="font-medium">{r.label} :</strong> <span className="text-muted-foreground">{r.text}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Diagnostic des liens : HTML envoyé par le serveur / HTML réellement reçu (copie cachée)
// ---------------------------------------------------------------------------
function LinkDiagnostic({ a }: { a: Attempt }) {
  if (!a.sent_hrefs && !a.received_hrefs) return null;
  const list = (h: string[] | null) =>
    h && h.length ? (
      <ul className="ml-4 list-disc break-all">
        {h.map((x) => (
          <li key={x} className={/google\.[a-z.]+\/url\?|safelinks|urldefense/i.test(x) ? "font-medium text-red-700 dark:text-red-400" : undefined}>
            <code>{x}</code>
          </li>
        ))}
      </ul>
    ) : (
      <p className="ml-4 text-muted-foreground">{h ? "aucun lien" : "pas encore connu"}</p>
    );
  return (
    <details className="rounded-md border p-2 text-xs" open={a.link_rewrite_detected === true}>
      <summary className="cursor-pointer font-medium">
        Diagnostic des liens{" "}
        {a.link_rewrite_detected === true ? (
          <span className="text-red-700 dark:text-red-400">— réécriture détectée</span>
        ) : a.link_rewrite_detected === false ? (
          <span className="text-green-700 dark:text-green-400">— liens directs confirmés à la réception</span>
        ) : null}
      </summary>
      <div className="mt-2 space-y-2">
        <div>
          <p className="font-medium">href dans le HTML envoyé par le serveur :</p>
          {list(a.sent_hrefs)}
        </div>
        <div>
          <p className="font-medium">href dans le HTML reçu (copie de contrôle) :</p>
          {list(a.received_hrefs)}
        </div>
        {a.smtp_message_id && <p className="break-all text-muted-foreground">Message-ID : {a.smtp_message_id}</p>}
      </div>
    </details>
  );
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
  /** Texte exact à retaper pour confirmer (effacement définitif) */
  typeToConfirm?: string;
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
  const ready =
    allChecked &&
    (!props.choices || Boolean(choice)) &&
    (!props.reason?.required || reason.trim().length >= 3) &&
    (!props.typeToConfirm || confirmNorm(reason) === confirmNorm(props.typeToConfirm));
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
          {props.typeToConfirm && (
            <label className="block space-y-1">
              <span className="font-medium">Retapez ou collez le nom : {props.typeToConfirm}</span>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} autoComplete="off" />
              <span className="block text-xs text-muted-foreground">
                Majuscules, espaces et type de tiret ne comptent pas.
                {reason && confirmNorm(reason) !== confirmNorm(props.typeToConfirm) && " Le nom ne correspond pas encore."}
              </span>
            </label>
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


type DialogKind = null | "approve" | "declare" | "cancel" | "fail" | "reply" | "dnc" | "archive" | "unarchive" | "erase" | "edit";

export function ProspectCard({ p, proofDomain }: { p: Prospect; proofDomain: string }) {
  const router = useRouter();
  const platform = usePlatform();
  const [pending, start] = useTransition();
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [notes, setNotes] = useState(p.notes);
  const [nextAt, setNextAt] = useState(p.next_action_at ?? "");
  const [showHistory, setShowHistory] = useState(false);
  const [showAllLinks, setShowAllLinks] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const archived = Boolean(p.archived_at);
  const blocked = Boolean(p.do_not_contact_at);
  const open = p.attempts.find((a) => a.state === "ouverte") ?? null;
  const lastUseful = p.attempts.find((a) => a.state === "verifiee" || a.state === "envoyee" || a.state === "declaree") ?? null;
  const lastAttempt = p.attempts[0] ?? null;
  const lastServerFail = lastAttempt?.state === "echec" && lastAttempt.draft_method === "serveur" ? lastAttempt : null;
  const proofPending = p.attempts.some((a) => a.channel === "email" && (a.state === "ouverte" || a.state === "envoyee" || a.state === "declaree"));
  // Suivi « en direct » juste après un envoi serveur : rafraîchissement toutes les 3 s pendant 5 min
  const liveWatch = p.attempts.some(
    (a) => (a.state === "ouverte" && a.draft_method === "serveur") ||
      (a.state === "envoyee" && a.sent_at && Date.now() - new Date(a.sent_at).getTime() < 5 * 60 * 1000),
  );
  const serverOpen = open?.draft_method === "serveur" ? open : null;
  const serverOpenStuck = serverOpen ? now - new Date(serverOpen.opened_at).getTime() > 2 * 60 * 1000 : false;
  const canServerSend = !archived && !blocked && !open && Boolean(p.email) && Boolean(p.subject?.trim()) &&
    ["a_preparer", "pret", "contacte", "en_discussion"].includes(p.stage);
  const canContact = !archived && !blocked && !open && p.approved_current && ["pret", "contacte", "en_discussion"].includes(p.stage);
  const canReply = !archived && !blocked && Boolean(lastUseful) && ["contacte", "en_discussion"].includes(p.stage);
  const phones = phoneNumbers(p.phone);
  const notesDirty = notes !== p.notes;
  const nextDirty = nextAt !== (p.next_action_at ?? "");
  const secondsSinceStart = open ? Math.floor((now - new Date(open.opened_at).getTime()) / 1000) : 0;
  const waitBeforeDeclare = Math.max(0, MIN_SECONDS_BEFORE_DECLARE - secondsSinceStart);

  // Tant qu'une preuve d'envoi est attendue, la page se met à jour toute seule (synchronisation Gmail → écran)
  useEffect(() => {
    if (!proofPending && !liveWatch) return;
    const t = setInterval(() => router.refresh(), liveWatch ? 3000 : 15000);
    return () => clearInterval(t);
  }, [proofPending, liveWatch, router]);

  // Horloge pour savoir si un envoi serveur reste bloqué (bouton d'annulation après 2 min)
  useEffect(() => {
    if (!serverOpen) return;
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, [serverOpen]);

  // Compte à rebours avant de pouvoir déclarer (le serveur le vérifie aussi)
  useEffect(() => {
    if (!open || waitBeforeDeclare === 0) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [open, waitBeforeDeclare]);

  // Avertit avant de quitter la page avec des notes non enregistrées (Mo1)
  useEffect(() => {
    if (!notesDirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [notesDirty]);

  /** Jamais d'affichage « optimiste » : l'écran ne change qu'après confirmation du serveur (M1, M2). */
  function run(action: () => Promise<ProspectActionResult>, success: string, after?: () => void) {
    start(async () => {
      let res: ProspectActionResult;
      try {
        res = await action();
      } catch {
        // Saisie refusée avant même d'atteindre la base, ou réseau coupé : rien n'a été enregistré
        res = { ok: false, error: "Action non enregistrée (connexion ou saisie). Réessayez." };
      }
      if (!res.ok) {
        toast.error(res.error);
        if (res.conflict) router.refresh();
        return;
      }
      toast.success(success);
      setDialog(null);
      after?.();
      router.refresh();
    });
  }

  /**
   * Niveau 2 : enregistre l'ouverture du brouillon SANS bloquer le lien (le navigateur doit garder le geste
   * de l'utilisateur pour ouvrir l'appli Gmail). En cas d'échec, l'utilisateur est prévenu et peut réessayer.
   */
  function noteDraftOpened(method: Exclude<DraftMethod, "serveur">) {
    if (!open || open.draft_opened_at) return;
    markDraftOpened(open.id, method)
      .then((res) => {
        if (!res.ok) toast.error(`Ouverture non enregistrée : ${res.error}`);
        router.refresh();
      })
      .catch(() => toast.error("Ouverture non enregistrée (connexion). Utilisez « Je l'ai préparé autrement »."));
  }

  const stage = STAGE[p.stage];
  const delivery = prospectDeliveryStatus(p);
  const unreadReplies = p.messages.filter((m) => m.direction === "in" && !m.read_at && m.kind !== "auto_reply").length;
  const bcc = open?.bcc_token ? `prospect-${open.bcc_token}@${proofDomain}` : "";
  const draft = open && p.email ? { to: p.email, bcc, subject: open.subject_snapshot, body: open.message_snapshot ?? "" } : null;
  const links = draft && platform ? emailDraftLinks(draft, platform) : [];
  const otherLinks =
    draft && platform && showAllLinks
      ? (["desktop", "android", "ios"] as Platform[])
          .filter((x) => x !== platform)
          .flatMap((x) => emailDraftLinks(draft, x).filter((l) => l.method !== "mailto"))
      : [];
  const tooLong = links.some((l) => l.primary && l.long);

  return (
    <Card className={p.is_test ? "border-dashed" : undefined}>
      <CardHeader className="space-y-2 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="flex flex-wrap items-center gap-2 text-base">
            {p.company} {p.is_test && <Badge variant="neutral">TEST — non compté</Badge>}
            {unreadReplies > 0 && (
              <Badge variant="info">{unreadReplies} nouvelle{unreadReplies > 1 ? "s" : ""} réponse{unreadReplies > 1 ? "s" : ""}</Badge>
            )}
            {archived && <Badge variant="neutral">Archivé</Badge>}
          </CardTitle>
          <span className="inline-flex flex-wrap items-center gap-1">
            {delivery && (
              <Badge variant={delivery.tone} className="whitespace-nowrap">
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {delivery.label}
              </Badge>
            )}
            <Badge variant={stage.variant}>{stage.label}</Badge>
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {p.trade} · {p.city}
          {p.next_action_at && !blocked && <> · Prochaine action prévue le {day(p.next_action_at)}</>}
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
          <div className="flex min-w-0 items-center gap-2">
            <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
            {p.website ? (
              <a href={p.website} target="_blank" rel="noopener noreferrer" className="truncate underline underline-offset-4">
                {p.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
              </a>
            ) : (
              <span className="text-muted-foreground">Aucun site trouvé</span>
            )}
          </div>
          <div className="flex min-w-0 items-center gap-2">
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

        {/* Provenance des coordonnées (Mo10) */}
        <p className="text-xs text-muted-foreground">
          Source : {p.source_label ?? "non renseignée"}
          {p.source_url && (
            <>
              {" "}
              (
              <a href={p.source_url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                lien
              </a>
              )
            </>
          )}
          {p.source_checked_at && <> · vérifiée le {day(p.source_checked_at)}</>}
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <h3 className="mb-1 font-medium">Pourquoi c&apos;est une bonne cible</h3>
            <p className="whitespace-pre-line text-muted-foreground">{p.why || "—"}</p>
          </div>
          <div>
            <h3 className="mb-1 font-medium">Ce qui a été vérifié</h3>
            <p className="whitespace-pre-line text-muted-foreground">{p.findings || "—"}</p>
          </div>
        </div>

        {p.caution && (
          <p className="flex gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-amber-800 dark:text-amber-300">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {p.caution}
          </p>
        )}

        {/* Ce que l'on sait réellement (preuve), toujours visible */}
        <div className="space-y-2 rounded-md border p-3">
          <h3 className="font-medium">Situation réelle</h3>
          {open ? <ProofLine a={open} /> : lastUseful ? <ProofLine a={lastUseful} /> : <p className="text-muted-foreground">Aucun contact enregistré.</p>}
          {(open ?? lastUseful) && <Levels a={(open ?? lastUseful)!} />}
          {lastServerFail && (
            <p className="flex gap-2 text-red-700 dark:text-red-400">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              Dernier envoi automatique en échec le {whenS(lastServerFail.closed_at ?? lastServerFail.opened_at)} : {lastServerFail.failure_reason}
            </p>
          )}
          {(open ?? lastUseful)?.draft_method === "serveur" && <LinkDiagnostic a={(open ?? lastUseful)!} />}
        </div>

        {/* Échanges : même fonctionnement que la conversation d'un dossier de devis */}
        {p.email && (p.messages.length > 0 || p.attempts.some((a) => a.state === "envoyee" || a.state === "verifiee")) && (
          <ProspectConversation
            prospectId={p.id}
            prospectName={p.company}
            messages={p.messages}
            blockedReason={blocked ? "Ce prospect a demandé à ne plus être contacté : aucune réponse ne peut lui être envoyée." : archived ? "Prospect archivé." : null}
          />
        )}

        <div className="rounded-md border bg-muted/30 p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2 font-medium">
            <MessageSquareText className="h-4 w-4" />
            {p.channel === "telephone" ? "Script d'appel" : "Message"}
            {p.approved_current ? (
              <span className="font-normal text-green-700 dark:text-green-400">· ce texte a été relu et validé le {when(p.approved_at)}</span>
            ) : (
              <span className="font-normal text-amber-700 dark:text-amber-400">· texte pas encore validé</span>
            )}
          </div>
          {p.subject && (
            <p className="mb-2">
              <span className="text-muted-foreground">Objet : </span>
              {p.subject}
            </p>
          )}
          <p className="whitespace-pre-line break-words">{p.message}</p>
        </div>

        {/* Étape 1 : relire (toute version non validée du texte, M9) */}
        {/* E-mail : UN clic — validation du texte + envoi direct par le serveur */}
        {canServerSend && (
          <Button
            className="w-full sm:w-auto"
            disabled={pending}
            onClick={() =>
              run(() => sendProspectEmail(p.id, p.version), `E-mail envoyé à ${p.email}. Preuve de réception attendue…`)
            }
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {pending ? "Envoi en cours…" : "Valider et envoyer"}
          </Button>
        )}
        {!archived && !blocked && !open && p.email && !p.subject?.trim() && <p className="text-xs text-amber-700">Ajoutez un objet (Modifier la fiche) pour pouvoir envoyer.</p>}

        {!archived && !blocked && !p.approved_current && !open && !p.email && (
          <Button onClick={() => setDialog("approve")} className="w-full sm:w-auto">
            <CheckCircle2 className="h-4 w-4" /> J&apos;ai relu ce message
          </Button>
        )}

        {/* Étape 2 : commencer une tentative (un seul canal à la fois) */}
        {canContact && (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
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
        {serverOpen && (
          <div className="space-y-2 rounded-md border border-sky-500/30 bg-sky-500/5 p-3">
            <p className="flex items-center gap-2 font-medium">
              <Loader2 className="h-4 w-4 animate-spin" /> Envoi en cours depuis le serveur…
            </p>
            {serverOpenStuck && (
              <>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Aucun compte rendu depuis plus de 2 minutes. Si l&apos;e-mail est parti, la copie de contrôle le prouvera quand même.
                  Vérifiez « Messages envoyés » de {SENDER} avant d&apos;annuler.
                </p>
                <Button size="sm" variant="ghost" onClick={() => setDialog("cancel")} disabled={pending}>
                  Annuler cet envoi bloqué
                </Button>
              </>
            )}
          </div>
        )}

        {open && !serverOpen && (
          <div className="space-y-3 rounded-md border border-sky-500/30 bg-sky-500/5 p-3">
            <p className="font-medium">Tentative en cours : {CHANNEL[open.channel]}</p>

            {open.channel === "email" && draft && (
              <>
                <ol className="list-decimal space-y-1 pl-5">
                  <li>
                    Ouvrez le brouillon avec le bouton ci-dessous. Vérifiez que l&apos;expéditeur est <strong className="break-all">{SENDER}</strong>.
                  </li>
                  <li>
                    Gardez l&apos;adresse en <strong>Cci</strong> (<span className="break-all">{bcc}</span>) : c&apos;est elle qui prouvera l&apos;envoi.
                  </li>
                  <li>Appuyez sur « Envoyer ».</li>
                  <li>Revenez ici et cliquez sur « J&apos;ai envoyé l&apos;e-mail ». La preuve s&apos;affichera toute seule en moins d&apos;une minute.</li>
                </ol>
                {platform === null ? (
                  <p className="text-muted-foreground">Détection de l&apos;appareil…</p>
                ) : (
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {links.map((l) => (
                      <Button asChild size="sm" key={l.method} variant={l.primary ? "default" : "outline"}>
                        <a
                          href={l.href}
                          {...(l.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                          onClick={() => noteDraftOpened(l.method)}
                        >
                          {l.primary ? <ExternalLink className="h-4 w-4" /> : <Mail className="h-4 w-4" />} {l.label}
                        </a>
                      </Button>
                    ))}
                    <Button size="sm" variant="outline" onClick={() => copy(bcc, "Adresse Cci")}>
                      <Copy className="h-4 w-4" /> Copier l&apos;adresse Cci
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        if (await copy(open.message_snapshot ?? "", "Message")) noteDraftOpened("copie");
                      }}
                    >
                      <Copy className="h-4 w-4" /> Copier le message
                    </Button>
                    {otherLinks.map((l) => (
                      <Button asChild size="sm" variant="ghost" key={`o-${l.method}`}>
                        <a href={l.href} {...(l.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})} onClick={() => noteDraftOpened(l.method)}>
                          {METHOD[l.method]}
                        </a>
                      </Button>
                    ))}
                  </div>
                )}
                {tooLong && (
                  <p className="flex gap-2 text-amber-700 dark:text-amber-400">
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    Message long : certaines applis le coupent. Après ouverture, vérifiez que la fin du message est bien présente,
                    sinon utilisez « Copier le message ».
                  </p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  {!showAllLinks && platform && (
                    <button type="button" className="underline underline-offset-4" onClick={() => setShowAllLinks(true)}>
                      Le bouton ne marche pas ? Autres façons d&apos;ouvrir
                    </button>
                  )}
                  {!open.draft_opened_at && (
                    <button type="button" className="underline underline-offset-4" onClick={() => noteDraftOpened("manuel")}>
                      J&apos;ai préparé le message autrement
                    </button>
                  )}
                </div>
              </>
            )}

            {open.channel === "formulaire" && (
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button size="sm" variant="outline" onClick={() => copy(open.message_snapshot ?? "", "Message")}>
                  <Copy className="h-4 w-4" /> Copier le message
                </Button>
                {p.website && (
                  <Button asChild size="sm">
                    <a href={p.website} target="_blank" rel="noopener noreferrer" onClick={() => noteDraftOpened("site_ouvert")}>
                      <ExternalLink className="h-4 w-4" /> Ouvrir leur site
                    </a>
                  </Button>
                )}
              </div>
            )}

            {open.channel === "telephone" && (
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {phones.map((n) => (
                  <Button asChild size="sm" key={n.href}>
                    <a href={n.href} onClick={() => noteDraftOpened("numero_compose")}>
                      <Phone className="h-4 w-4" /> {n.label}
                    </a>
                  </Button>
                ))}
                {!open.draft_opened_at && (
                  <Button size="sm" variant="ghost" onClick={() => noteDraftOpened("manuel")}>
                    J&apos;ai composé le numéro à la main
                  </Button>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:flex-wrap">
              <Button size="sm" onClick={() => setDialog("declare")} disabled={!open.draft_opened_at || waitBeforeDeclare > 0 || pending}>
                {open.channel === "email" ? "J'ai envoyé l'e-mail" : open.channel === "formulaire" ? "J'ai envoyé le formulaire" : "J'ai passé l'appel"}
                {open.draft_opened_at && waitBeforeDeclare > 0 && ` (${waitBeforeDeclare} s)`}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDialog("fail")} disabled={pending}>
                Ça n&apos;a pas marché
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDialog("cancel")} disabled={pending}>
                Annuler cette tentative
              </Button>
            </div>
            {!open.draft_opened_at && (
              <p className="text-xs text-muted-foreground">
                Le bouton de confirmation s&apos;active une fois le brouillon, le site ou le numéro ouvert depuis cette page.
              </p>
            )}
          </div>
        )}

        {/* Retour arrière d'une déclaration erronée (jamais d'un envoi prouvé) */}
        {!open && !archived && lastUseful?.state === "declaree" && (
          <Button size="sm" variant="ghost" onClick={() => setDialog("cancel")}>
            <Undo2 className="h-4 w-4" /> Retirer ma déclaration (ce n&apos;était pas fait)
          </Button>
        )}

        {/* Prochaine action (Mo9) */}
        {!archived && !blocked && (
          <div className="flex flex-wrap items-end gap-2">
            <label className="space-y-1">
              <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" /> Prochaine action
              </span>
              <Input type="date" value={nextAt} onChange={(e) => setNextAt(e.target.value)} className="h-9 w-44" />
            </label>
            <Button size="sm" variant="outline" disabled={!nextDirty || pending} onClick={() => run(() => setNextAction(p.id, nextAt || null, p.version), nextAt ? "Date enregistrée" : "Date retirée")}>
              Enregistrer la date
            </Button>
            {p.next_action_at && (
              <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => setNextAction(p.id, null, p.version), "Date retirée", () => setNextAt(""))}>
                Retirer
              </Button>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {canReply && (
            <Button size="sm" variant="outline" onClick={() => setDialog("reply")}>
              Enregistrer sa réponse
            </Button>
          )}
          {!archived && !open && (
            <Button size="sm" variant="ghost" onClick={() => setDialog("edit")}>
              <Pencil className="h-4 w-4" /> Modifier la fiche
            </Button>
          )}
          {!blocked && !archived && (
            <Button size="sm" variant="ghost" onClick={() => setDialog("dnc")}>
              Ne plus contacter
            </Button>
          )}
          {archived ? (
            <Button size="sm" variant="outline" onClick={() => setDialog("unarchive")}>
              <ArchiveRestore className="h-4 w-4" /> Désarchiver
            </Button>
          ) : (
            !open && (
              <Button size="sm" variant="ghost" onClick={() => setDialog("archive")}>
                <Archive className="h-4 w-4" /> Archiver
              </Button>
            )
          )}
          <Button size="sm" variant="ghost" onClick={() => setShowHistory((v) => !v)}>
            <History className="h-4 w-4" /> Historique ({p.events.length})
          </Button>
          <Button size="sm" variant="ghost" className="text-red-700 dark:text-red-400" onClick={() => setDialog("erase")}>
            <Trash2 className="h-4 w-4" /> Effacer (RGPD)
          </Button>
        </div>

        {showHistory && (
          <div className="pl-3 pt-1">
            <ProspectTimeline events={p.events} />
          </div>
        )}

        {!archived && (
          <div className="space-y-1 border-t pt-4">
            <span className="text-xs font-medium text-muted-foreground">Notes</span>
            <Textarea rows={2} value={notes} maxLength={2000} onChange={(e) => setNotes(e.target.value)} />
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={!notesDirty || pending} onClick={() => run(() => updateNotes(p.id, notes, p.version), "Notes enregistrées")}>
                Enregistrer les notes
              </Button>
              {notesDirty && <span className="text-xs text-amber-700 dark:text-amber-400">Modifications non enregistrées</span>}
            </div>
          </div>
        )}
      </CardContent>

      {/* ------------------------- Fenêtres de confirmation ------------------------- */}
      <ProspectFormDialog open={dialog === "edit"} onOpenChange={(v) => setDialog(v ? "edit" : null)} prospect={p} />
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
        description="Il disparaît de la liste et des compteurs. Son historique est conservé ; il reste visible dans « Archives »."
        confirmLabel="Archiver"
        pending={pending}
        onConfirm={() => run(() => archiveProspect(p.id, true, p.version), "Archivé")}
      />
      <ConfirmDialog
        open={dialog === "unarchive"}
        onOpenChange={(v) => !v && setDialog(null)}
        title="Désarchiver ce prospect ?"
        description="Il revient dans la liste active, à la même étape. Refusé si un prospect identique est déjà actif."
        confirmLabel="Désarchiver"
        pending={pending}
        onConfirm={() => run(() => archiveProspect(p.id, false, p.version), "Désarchivé")}
      />
      <ConfirmDialog
        open={dialog === "erase"}
        onOpenChange={(v) => !v && setDialog(null)}
        title="Effacer définitivement ce prospect ?"
        description="À utiliser uniquement si la personne demande l'effacement de ses données. La fiche, les tentatives et l'historique sont supprimés sans retour possible. Pour simplement ne plus le contacter, utilisez « Ne plus contacter »."
        typeToConfirm={p.company}
        confirmLabel="Effacer définitivement"
        destructive
        pending={pending}
        // Le nom saisi a été vérifié ici de façon tolérante (copier-coller) : la base reçoit le nom exact de la fiche
        onConfirm={() => run(() => eraseProspect(p.id, p.company), "Données effacées")}
      />
    </Card>
  );
}
