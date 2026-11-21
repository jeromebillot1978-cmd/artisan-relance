"use client";

/**
 * Échanges avec le prospect — même présentation et même comportement que
 * « Échanges avec le client » d'un dossier de devis (components/campaigns/conversation.tsx) :
 * bulles entrantes / sortantes, étiquettes (réponse automatique, STOP, non vérifié),
 * « Nouveau » tant que non lu, statut d'envoi, réponse depuis le site.
 * Seule différence : la réponse part par Gmail (boîte de prospection) au lieu de Resend.
 */
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Clock, Inbox, MessageSquare, Paperclip, Send, Trash2, XCircle } from "lucide-react";
import { formatDateTime } from "@/lib/campaigns/constants";
import { clearProspectConversation, markProspectRead, replyToProspect } from "@/lib/actions/prospects";
import type { ProspectMessage } from "@/lib/prospects";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const KIND_LABEL: Partial<Record<ProspectMessage["kind"], { text: string; className: string }>> = {
  auto_reply: { text: "Réponse automatique", className: "bg-muted text-muted-foreground" },
  opt_out: { text: "STOP : ne plus contacter", className: "bg-red-500/10 text-red-700 dark:text-red-400" },
  suspicious: { text: "Expéditeur non vérifié", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
};
const MAX = 5000;

function senderName(from: string | null, fallback: string) {
  if (!from) return fallback;
  const m = /^\s*"?([^"<]+?)"?\s*</.exec(from);
  return m?.[1]?.trim() || from.replace(/[<>]/g, "");
}

function OutStatus({ m }: { m: ProspectMessage }) {
  if (m.status === "sent") return <span>Envoyé {formatDateTime(m.sent_at)}</span>;
  if (m.status === "failed")
    return (
      <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
        <XCircle className="h-3 w-3" /> Échec d&apos;envoi : {m.error ?? "message non parti"}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1">
      <Clock className="h-3 w-3" /> Envoi en cours…
    </span>
  );
}

export function ProspectConversation({
  prospectId,
  prospectName,
  messages,
  blockedReason,
}: {
  prospectId: string;
  prospectName: string;
  messages: ProspectMessage[];
  blockedReason?: string | null;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const [confirmClear, setConfirmClear] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const unread = messages.some((m) => m.direction === "in" && !m.read_at);
  const waiting = messages.some((m) => m.direction === "out" && m.status === "sending");

  // Ouverture : réponses marquées comme lues (comme dans un dossier de devis)
  useEffect(() => {
    if (unread) void markProspectRead(prospectId);
  }, [prospectId, unread]);

  // Mise à jour automatique : rapide pendant un envoi, sinon toutes les minutes (onglet visible)
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, waiting ? 4000 : 60000);
    return () => clearInterval(t);
  }, [router, waiting]);

  function submit() {
    const text = body.trim();
    if (text.length < 2) return toast.error("Écrivez votre message.");
    start(async () => {
      let res;
      try {
        res = await replyToProspect(prospectId, text);
      } catch {
        res = { ok: false as const, error: "Envoi non confirmé (connexion). Vérifiez la conversation avant de réessayer." };
      }
      if (!res.ok) return void toast.error(res.error);
      setBody("");
      toast.success("Réponse envoyée.");
      router.refresh();
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 300);
    });
  }

  function clearAll() {
    start(async () => {
      let res;
      try {
        res = await clearProspectConversation(prospectId);
      } catch {
        res = { ok: false as const, error: "Effacement non confirmé (connexion). Rechargez la page." };
      }
      if (!res.ok) return void toast.error(res.error);
      setConfirmClear(false);
      toast.success("Conversation effacée.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-medium">
          <MessageSquare className="h-4 w-4" /> Échanges avec le prospect
        </h3>
        {messages.length > 0 && (
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            {messages.length} message{messages.length > 1 ? "s" : ""}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-red-700 dark:text-red-400"
              onClick={() => setConfirmClear(true)}
              disabled={pending}
            >
              <Trash2 className="h-3.5 w-3.5" /> Effacer la conversation
            </Button>
          </span>
        )}
      </div>
      {messages.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">
          <Inbox className="h-5 w-5" />
          <p>Les réponses de {prospectName} s&apos;afficheront ici. Vous serez aussi prévenu par e-mail.</p>
        </div>
      ) : (
        <ol className="space-y-3">
          {messages.map((m) => {
            const out = m.direction === "out";
            const label = KIND_LABEL[m.kind];
            return (
              <li key={m.id} className={cn("flex", out ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "w-full max-w-[92%] rounded-xl border px-3.5 py-3 text-sm sm:max-w-[85%]",
                    out ? "border-brand/30 bg-brand/5" : "bg-muted/40",
                    !out && !m.read_at && m.kind !== "auto_reply" && "ring-1 ring-sky-500/50",
                  )}
                >
                  <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{out ? "Vous" : senderName(m.from_address, prospectName)}</span>
                    <span>{out ? <OutStatus m={m} /> : formatDateTime(m.created_at)}</span>
                    {label && <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", label.className)}>{label.text}</span>}
                    {!out && !m.read_at && m.kind !== "auto_reply" && (
                      <span className="rounded bg-sky-500/15 px-1.5 py-0.5 text-[11px] font-medium text-sky-700 dark:text-sky-400">Nouveau</span>
                    )}
                  </div>
                  {m.kind === "suspicious" && (
                    <p className="mb-2 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      L&apos;expéditeur de ce message n&apos;a pas pu être authentifié. Vérifiez avant de répondre.
                    </p>
                  )}
                  <p className="whitespace-pre-line break-words">{m.body || <span className="text-muted-foreground">(message vide)</span>}</p>
                  {m.files_note && (
                    <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                      <Paperclip className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {m.files_note}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <div ref={endRef} />
      {blockedReason ? (
        <p className="rounded-lg border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">{blockedReason}</p>
      ) : messages.some((m) => m.direction === "in") ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="space-y-2"
        >
          <label htmlFor={`reply-${prospectId}`} className="sr-only">
            Votre réponse
          </label>
          <Textarea
            id={`reply-${prospectId}`}
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, MAX))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={`Répondre à ${prospectName}…`}
            rows={3}
            disabled={pending}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Envoyé depuis votre boîte Gmail de prospection, dans le même fil.</span>
            <Button type="submit" size="sm" disabled={pending || body.trim().length < 2}>
              <Send className="h-4 w-4" /> {pending ? "Envoi…" : "Envoyer"}
            </Button>
          </div>
        </form>
      ) : null}

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Effacer la conversation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les {messages.length} message{messages.length > 1 ? "s" : ""} échangé{messages.length > 1 ? "s" : ""} avec {prospectName} seront
              supprimés définitivement du site. La fiche, l&apos;envoi et sa preuve sont conservés, et l&apos;historique garde la trace de
              l&apos;effacement. Les e-mails déjà présents dans vos boîtes Gmail ne sont pas touchés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Annuler</AlertDialogCancel>
            <Button variant="destructive" onClick={clearAll} disabled={pending}>
              <Trash2 className="h-4 w-4" /> {pending ? "Effacement…" : "Effacer définitivement"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
