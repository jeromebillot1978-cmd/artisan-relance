"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Clock, Download, FileText, Inbox, Loader2, MessageSquare, Paperclip, Send, X, XCircle } from "lucide-react";
import type { CampaignMessage } from "@/types/database";
import { formatBytes, formatDateTime } from "@/lib/campaigns/constants";
import { markCampaignMessagesRead, sendCampaignMessage } from "@/lib/actions/messages";
import { createClient } from "@/lib/supabase/client";
import { REPLY_FILES, replyFileType, shrinkForReply, storageName } from "@/lib/reply-files";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const KIND_LABEL: Partial<Record<CampaignMessage["kind"], { text: string; className: string }>> = {
  auto_reply: { text: "Réponse automatique", className: "bg-muted text-muted-foreground" },
  opt_out: { text: "STOP : ne plus relancer", className: "bg-red-500/10 text-red-700 dark:text-red-400" },
  suspicious: { text: "Expéditeur non vérifié", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
};

const MAX = 5000;

function senderName(from: string | null, fallback: string) {
  if (!from) return fallback;
  const m = /^\s*"?([^"<]+?)"?\s*</.exec(from);
  return m?.[1]?.trim() || from.replace(/[<>]/g, "");
}

function OutStatus({ m }: { m: CampaignMessage }) {
  if (m.status === "sent") return <span>Envoyé {formatDateTime(m.sent_at)}</span>;
  if (m.status === "failed")
    return (
      <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
        <XCircle className="h-3 w-3" />
        {(m.attempts ?? 0) >= 3 ? "Échec d'envoi : message non parti" : "Échec temporaire, nouvel essai automatique"}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1">
      <Clock className="h-3 w-3" /> Envoi en cours…
    </span>
  );
}

function isPreviewable(mime: string) {
  return mime.startsWith("image/") && mime !== "image/heic" && mime !== "image/heif";
}

function FileRow({ f }: { f: CampaignMessage["files"][number] }) {
  const reduced = f.original_size_bytes && f.original_size_bytes > f.size_bytes * 1.2;
  return (
    <div className="flex items-center gap-2 px-2.5 py-2 text-xs">
      <FileText className="h-3.5 w-3.5 shrink-0 text-brand" />
      <span className="min-w-0 flex-1 truncate" title={f.file_name}>
        {f.file_name}
      </span>
      <span className="shrink-0 text-muted-foreground" title={reduced ? `Original : ${formatBytes(f.original_size_bytes!)}` : undefined}>
        {formatBytes(f.size_bytes)}
        {reduced ? " (réduite)" : ""}
      </span>
      {f.url && (
        <a href={f.url} target="_blank" rel="noreferrer" download={f.file_name} className="text-muted-foreground hover:text-foreground" aria-label={`Télécharger ${f.file_name}`}>
          <Download className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}

function Files({ m }: { m: CampaignMessage }) {
  if (!m.files.length && !m.files_note) return null;
  const images = m.files.filter((f) => isPreviewable(f.mime_type) && f.url);
  const others = m.files.filter((f) => !images.includes(f));
  return (
    <div className="mt-3 space-y-2">
      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((f) => (
            <li key={f.id} className="overflow-hidden rounded-lg border bg-background">
              <a href={f.url!} target="_blank" rel="noreferrer" className="block bg-muted/40" title={`${f.file_name} : ouvrir en grand`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- lien signé temporaire, pas d'optimisation Next */}
                <img src={f.url!} alt={f.file_name} loading="lazy" className="aspect-[4/3] w-full object-cover" />
              </a>
              <p className="truncate px-2 py-1.5 text-[11px] text-muted-foreground" title={f.file_name}>
                {formatBytes(f.size_bytes)}
                {f.original_size_bytes && f.original_size_bytes > f.size_bytes * 1.2 ? " · réduite" : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
      {others.length > 0 && (
        <ul className="divide-y rounded-lg border bg-background">
          {others.map((f) => (
            <li key={f.id}>
              <FileRow f={f} />
            </li>
          ))}
        </ul>
      )}
      {m.files_note && <p className="text-xs text-muted-foreground">{m.files_note}</p>}
    </div>
  );
}

interface Picked {
  key: string;
  file: File;
  type: string;
}

export function Conversation({
  userId,
  campaignId,
  prospectName,
  recipients,
  messages,
  blockedReason,
}: {
  userId: string;
  campaignId: string;
  prospectName: string;
  recipients: string[];
  messages: CampaignMessage[];
  blockedReason?: string | null;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [picked, setPicked] = useState<Picked[]>([]);
  const [step, setStep] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function addFiles(list: FileList | null) {
    if (!list?.length) return;
    const next = [...picked];
    for (const file of Array.from(list)) {
      const type = replyFileType(file);
      if (!type) {
        toast.error(`« ${file.name} » : type de fichier non accepté (PDF, photo, Word, Excel, texte).`);
        continue;
      }
      if (file.size > REPLY_FILES.maxFileBytes && !(type === "image/jpeg" || type === "image/png")) {
        toast.error(`« ${file.name} » dépasse 10 Mo.`);
        continue;
      }
      if (next.length >= REPLY_FILES.maxFiles) {
        toast.error("5 pièces jointes maximum par message.");
        break;
      }
      next.push({ key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`, file, type });
    }
    setPicked(next);
    if (fileInput.current) fileInput.current.value = "";
  }
  const endRef = useRef<HTMLDivElement>(null);
  const unread = messages.some((m) => m.direction === "in" && !m.read_at);
  const waiting = messages.some((m) => m.direction === "out" && (m.status === "queued" || m.status === "sending"));

  // Ouverture du dossier : réponses marquées comme lues
  useEffect(() => {
    if (unread) void markCampaignMessagesRead(campaignId);
  }, [campaignId, unread]);

  // Mise à jour automatique : rapide pendant un envoi, sinon toutes les minutes (onglet visible)
  useEffect(() => {
    const delay = waiting ? 4000 : 60000;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, delay);
    return () => clearInterval(t);
  }, [router, waiting]);

  function submit() {
    const text = body.trim();
    if (text.length < 2 && picked.length === 0) return toast.error("Écrivez votre message ou joignez un fichier.");
    startTransition(async () => {
      // 1. Photos réduites puis fichiers téléversés dans votre dossier privé
      const uploaded: { path: string; name: string }[] = [];
      if (picked.length) {
        const supabase = createClient();
        let total = 0;
        for (const [i, p] of picked.entries()) {
          setStep(`Préparation des pièces jointes (${i + 1}/${picked.length})…`);
          const { blob, type, name } = await shrinkForReply(p.file, p.type);
          if (blob.size > REPLY_FILES.maxFileBytes) {
            setStep(null);
            return void toast.error(`« ${p.file.name} » dépasse 10 Mo.`);
          }
          total += blob.size;
          if (total > REPLY_FILES.maxTotalBytes) {
            setStep(null);
            return void toast.error("Pièces jointes : 15 Mo maximum au total.");
          }
          const path = `${userId}/out/${crypto.randomUUID()}-${storageName(name)}`;
          const { error } = await supabase.storage.from("messages").upload(path, blob, { contentType: type, upsert: false });
          if (error) {
            setStep(null);
            return void toast.error(`« ${p.file.name} » n'a pas pu être envoyé. Réessayez.`);
          }
          uploaded.push({ path, name });
        }
      }
      // 2. Message mis en file, envoyé aussitôt
      setStep("Envoi…");
      const res = await sendCampaignMessage(campaignId, text, uploaded);
      setStep(null);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setBody("");
      setPicked([]);
      toast.success("Réponse envoyée.");
      router.refresh();
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 300);
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4" /> Échanges avec le client
        </CardTitle>
        {messages.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {messages.length} message{messages.length > 1 ? "s" : ""}
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            <Inbox className="h-5 w-5" />
            <p>Les réponses de {prospectName} s'afficheront ici, avec leurs pièces jointes.</p>
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
                        L'expéditeur de ce message n'a pas pu être authentifié. Vérifiez avant d'ouvrir les pièces jointes ou de répondre.
                      </p>
                    )}
                    {(m.body || !m.files.length) && (
                      <p className="whitespace-pre-line break-words">{m.body || <span className="text-muted-foreground">(message vide)</span>}</p>
                    )}
                    <Files m={m} />
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        <div ref={endRef} />

        {blockedReason ? (
          <p className="rounded-lg border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">{blockedReason}</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="space-y-2"
          >
            <label htmlFor="reply-body" className="sr-only">
              Votre réponse
            </label>
            <Textarea
              id="reply-body"
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, MAX))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={`Répondre à ${prospectName}…`}
              rows={4}
              disabled={pending}
            />
            {picked.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {picked.map((p) => (
                  <li key={p.key} className="flex max-w-full items-center gap-1.5 rounded-md border bg-muted/40 py-1 pl-2 pr-1 text-xs">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-brand" />
                    <span className="max-w-[180px] truncate" title={p.file.name}>
                      {p.file.name}
                    </span>
                    <span className="text-muted-foreground">{formatBytes(p.file.size)}</span>
                    <button
                      type="button"
                      onClick={() => setPicked((list) => list.filter((x) => x.key !== p.key))}
                      disabled={pending}
                      className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={`Retirer ${p.file.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <input
              ref={fileInput}
              type="file"
              multiple
              accept={REPLY_FILES.accept}
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {step ?? (
                  <>
                    Envoyé à {recipients.join(", ")}, avec votre signature. Sa réponse arrivera ici.
                    {body.length > MAX - 500 && <span className="ml-1">{MAX - body.length} caractères restants.</span>}
                  </>
                )}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInput.current?.click()}
                  disabled={pending || picked.length >= REPLY_FILES.maxFiles}
                >
                  <Paperclip /> Joindre
                </Button>
                <Button type="submit" variant="brand" size="sm" disabled={pending || (body.trim().length < 2 && picked.length === 0)}>
                  {pending ? <Loader2 className="animate-spin" /> : <Send />} Envoyer
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              PDF, photos, Word, Excel ou texte : 5 fichiers et 15 Mo au plus. Les photos sont réduites automatiquement.
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
