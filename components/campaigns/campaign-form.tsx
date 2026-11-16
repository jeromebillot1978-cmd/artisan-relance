"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { createCampaign } from "@/lib/actions/campaigns";
import type { StrategyFormInput } from "@/lib/campaigns/schema";
import {
  DEFAULT_FOLLOWUP_MESSAGE,
  DEFAULT_INITIAL_MESSAGE,
  TEMPLATE_VARIABLES,
  defaultSubject,
} from "@/supabase/functions/_shared/templates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormMessage } from "@/components/field-error";
import { RecipientsInput, parseRecipients } from "@/components/campaigns/recipients-input";
import { FileUploader, type UploadedFile } from "@/components/campaigns/file-uploader";
import { DEFAULT_STRATEGY, StrategyFields } from "@/components/campaigns/strategy-fields";
import { cn } from "@/lib/utils";

function nowLocalInput() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

/** « 2 500,00 € », « 2.500,50 », « 2500.5 » → nombre ; 0 si illisible. */
function parseAmount(raw: string) {
  let v = raw.replace(/[^\d,.-]/g, "");
  if (v.includes(",") && v.includes(".")) v = v.lastIndexOf(",") > v.lastIndexOf(".") ? v.replace(/\./g, "").replace(",", ".") : v.replace(/,/g, "");
  else v = v.replace(",", ".");
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 10_000_000) : 0;
}

export function CampaignForm({ userId, companyName }: { userId: string; companyName: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Clé unique de cet envoi : protège contre le double clic et sert de dossier aux pièces jointes
  const idempotencyKey = useRef(crypto.randomUUID()).current;

  const [prospectName, setProspectName] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);
  // Adresse saisie mais pas encore validée (Entrée/virgule) : prise en compte à l'envoi.
  // Lue via une référence pour éviter l'état périmé quand on clique « Envoyer » juste après la saisie.
  const recipientDraft = useRef("");
  // Copie synchrone de la liste : la validation au « blur » (clic sur Envoyer) arrive dans le même
  // geste que le clic, avant que React n'ait rafraîchi l'état.
  const recipientsRef = useRef<string[]>([]);
  const updateRecipients = (list: string[]) => {
    recipientsRef.current = list;
    setRecipients(list);
  };
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [subjectEdited, setSubjectEdited] = useState(false);
  const [subject, setSubject] = useState(defaultSubject(companyName));
  const [message, setMessage] = useState(DEFAULT_INITIAL_MESSAGE);
  const [followupMessage, setFollowupMessage] = useState(DEFAULT_FOLLOWUP_MESSAGE);
  const [sendInitial, setSendInitial] = useState(true);
  const [sentAtLocal, setSentAtLocal] = useState(nowLocalInput());
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [strategy, setStrategy] = useState<StrategyFormInput>(DEFAULT_STRATEGY);
  const [errors, setErrors] = useState<{ form?: string; fields?: Record<string, string[] | undefined> }>({});

  const startFrom = useMemo(
    () => (sendInitial ? new Date() : new Date(sentAtLocal || Date.now())),
    [sendInitial, sentAtLocal],
  );
  const uploading = files.some((f) => f.status === "uploading");

  function onReferenceChange(value: string) {
    setReference(value);
    if (!subjectEdited) setSubject(defaultSubject(companyName, value || null));
  }

  function submit() {
    setErrors({});
    const pending = parseRecipients(recipientDraft.current);
    const allRecipients = Array.from(new Set([...recipientsRef.current, ...pending]));
    if (pending.length) {
      updateRecipients(allRecipients);
      recipientDraft.current = "";
    }
    startTransition(async () => {
      const res = await createCampaign({
        expectedUserId: userId,
        idempotencyKey,
        prospectName,
        recipients: allRecipients,
        reference,
        amount: parseAmount(amount),
        clientPhone,
        notes,
        subject,
        message,
        followupMessage,
        sendInitial,
        initialSentAt: sendInitial ? null : new Date(sentAtLocal).toISOString(),
        attachments: files.filter((f) => f.status === "done").map((f) => ({ path: f.path, name: f.name })),
        strategy,
      });
      if (res.error) {
        setErrors({ form: res.error, fields: res.fieldErrors });
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Enregistré");
      router.push(`/devis/${res.id}`);
    });
  }

  const fieldError = (name: string) => errors.fields?.[name]?.[0];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="grid gap-4 lg:grid-cols-[1.2fr_1fr]"
    >
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Le client</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="prospectName">Nom du client *</Label>
              <Input id="prospectName" name="prospectName" autoComplete="name" value={prospectName} onChange={(e) => setProspectName(e.target.value)} placeholder="M. et Mme Dupont" />
              {fieldError("prospectName") && <p className="text-xs text-destructive">{fieldError("prospectName")}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="recipients">Destinataire(s) *</Label>
              <RecipientsInput
                id="recipients"
                value={recipients}
                onChange={updateRecipients}
                onDraftChange={(d) => (recipientDraft.current = d)}
              />
              {fieldError("recipients") && <p className="text-xs text-destructive">{fieldError("recipients")}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="reference">N° de devis</Label>
                <Input id="reference" name="reference" autoComplete="off" value={reference} onChange={(e) => onReferenceChange(e.target.value)} placeholder="D-2026-001" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Montant TTC (€)</Label>
                <Input id="amount" name="amount" autoComplete="off" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="2 500" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="clientPhone">Téléphone du client</Label>
              <Input id="clientPhone" name="clientPhone" type="tel" inputMode="tel" autoComplete="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="06 12 34 56 78" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes internes</Label>
              <Textarea id="notes" autoComplete="off" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Visible uniquement par vous" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Le devis</CardTitle>
            <CardDescription>Envoyez-le d'ici, ou déclarez-le si vous l'avez déjà envoyé.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: true, label: "Envoyer le devis maintenant", icon: Send },
                { v: false, label: "Je l'ai déjà envoyé", icon: Mail },
              ].map((o) => (
                <button
                  key={String(o.v)}
                  type="button"
                  onClick={() => setSendInitial(o.v)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm",
                    sendInitial === o.v ? "border-brand bg-brand/10 font-medium" : "text-muted-foreground hover:bg-muted/50",
                  )}
                >
                  <o.icon className="h-4 w-4 shrink-0" />
                  {o.label}
                </button>
              ))}
            </div>

            {!sendInitial && (
              <div className="grid gap-2">
                <Label htmlFor="sentAt">Date et heure d'envoi du devis</Label>
                <Input id="sentAt" type="datetime-local" value={sentAtLocal} max={nowLocalInput()} onChange={(e) => setSentAtLocal(e.target.value)} />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="subject">{sendInitial ? "Objet *" : "Objet du devis envoyé *"}</Label>
              <Input
                id="subject"
                autoComplete="off"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setSubjectEdited(true);
                }}
              />
              {fieldError("subject") && <p className="text-xs text-destructive">{fieldError("subject")}</p>}
            </div>

            {sendInitial && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea id="message" rows={8} value={message} onChange={(e) => setMessage(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Votre signature (nom, entreprise, téléphone) est ajoutée automatiquement.</p>
                  {fieldError("message") && <p className="text-xs text-destructive">{fieldError("message")}</p>}
                </div>
              </>
            )}

            <div className="grid gap-2">
              <Label>Pièces jointes{sendInitial ? " (conseillé)" : ""}</Label>
              <FileUploader folder={`${userId}/${idempotencyKey}`} files={files} onChange={setFiles} />
              {fieldError("attachments") && <p className="text-xs text-destructive">{fieldError("attachments")}</p>}
              {sendInitial && !files.some((f) => f.status === "done") && !uploading && (
                <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-foreground">
                  Aucune pièce jointe : le message partira sans devis joint.
                  {/ci-joint/i.test(message) ? " Pensez à retirer « ci-joint » du message ci-dessus." : ""}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. Les relances</CardTitle>
            <CardDescription>Le client vous répond directement ; un clic arrête ensuite les relances.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <StrategyFields value={strategy} onChange={setStrategy} startFrom={startFrom} />
            {strategy.followupEnabled && (
              <div className="grid gap-2">
                <Label htmlFor="followupMessage">Message de relance</Label>
                <Textarea id="followupMessage" rows={6} value={followupMessage} onChange={(e) => setFollowupMessage(e.target.value)} />
                <p className="text-xs text-muted-foreground">
                  Objet : « Re: {subject || "…"} ». Variables :{" "}
                  {TEMPLATE_VARIABLES.map((v) => v.key).join(" ")}
                </p>
                {fieldError("followupMessage") && <p className="text-xs text-destructive">{fieldError("followupMessage")}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        <FormMessage error={errors.form} />

        <Button type="submit" variant="brand" size="lg" className="w-full" disabled={isPending || uploading}>
          {isPending ? <Loader2 className="animate-spin" /> : sendInitial ? <Send /> : null}
          {isPending
            ? sendInitial
              ? "Envoi en cours…"
              : "Enregistrement…"
            : uploading
              ? "Téléversement en cours…"
              : sendInitial
                ? "Envoyer le devis"
                : "Enregistrer et programmer les relances"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {sendInitial
            ? "La date et l'heure d'envoi sont enregistrées automatiquement. Vous recevez une copie du message."
            : "Aucun e-mail ne part maintenant : seules les relances seront envoyées, à partir de la date indiquée."}
        </p>
      </div>
    </form>
  );
}
