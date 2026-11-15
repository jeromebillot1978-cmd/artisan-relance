"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveReviewSettings } from "@/lib/actions/reviews";
import { isGoogleReviewUrl } from "@/lib/reviews";
import {
  REVIEW_LINK_TOKEN,
  REVIEW_TEMPLATES,
  REVIEW_VARIABLES,
  renderReviewEmail,
} from "@/supabase/functions/_shared/templates";
import type { ReviewSettings, ReviewTemplateChoice } from "@/types/database";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FieldError, FormMessage } from "@/components/field-error";
import { EmailPreview } from "@/components/app/email-preview";

type Errors = Record<string, string[] | undefined>;

export function ReviewSettingsForm({ settings, profileCompany }: { settings: ReviewSettings; profileCompany: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [url, setUrl] = useState(settings.google_review_url ?? "");
  const [company, setCompany] = useState(settings.company_name ?? profileCompany);
  const [templateKey, setTemplateKey] = useState<ReviewTemplateChoice>(settings.template_key);
  const [subject, setSubject] = useState(settings.subject);
  const [body, setBody] = useState(settings.body);
  const [autoWon, setAutoWon] = useState(settings.auto_on_won);
  const [wonDays, setWonDays] = useState(String(settings.won_delay_days));
  const [autoCompleted, setAutoCompleted] = useState(settings.auto_on_completed);
  const [completedDays, setCompletedDays] = useState(String(settings.completed_delay_days));

  const urlLooksValid = url.trim() === "" || isGoogleReviewUrl(url.trim());

  function pickTemplate(key: ReviewTemplateChoice) {
    const t = REVIEW_TEMPLATES.find((x) => x.key === key);
    if (!t) return;
    setTemplateKey(key);
    setBody(t.body);
  }

  function editBody(value: string) {
    setBody(value);
    const match = REVIEW_TEMPLATES.find((t) => t.body === value);
    setTemplateKey(match ? match.key : "personnalise");
  }

  function insertVariable(token: string) {
    const el = bodyRef.current;
    if (!el) return editBody(body + token);
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const next = body.slice(0, start) + token + body.slice(end);
    editBody(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  }

  const preview = useMemo(() => {
    const rendered = renderReviewEmail({
      subject: subject || "(objet)",
      body: body || REVIEW_LINK_TOKEN,
      companyName: company.trim() || profileCompany || "Votre entreprise",
      clientName: "Mme Martin",
      reviewUrl: url.trim() || "https://g.page/r/votre-fiche/review",
      unsubscribeUrl: "#",
    });
    return [{ key: "review", label: "Demande d'avis", subject: rendered.subject, html: rendered.html }];
  }, [subject, body, company, url, profileCompany]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError(undefined);
    startTransition(async () => {
      const res = await saveReviewSettings({
        googleReviewUrl: url,
        companyName: company,
        templateKey,
        subject,
        body,
        autoOnWon: autoWon,
        wonDelayDays: Number.parseInt(wonDays, 10) || 0,
        autoOnCompleted: autoCompleted,
        completedDelayDays: Number.parseInt(completedDays, 10) || 0,
      });
      if (res.error) {
        setFormError(res.error);
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
        return;
      }
      toast.success(res.message);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="grid content-start gap-5">
        <FormMessage error={formError} />

        <div className="grid gap-2">
          <Label htmlFor="google_review_url">Lien Google Avis de l'entreprise</Label>
          <div className="flex gap-2">
            <Input
              id="google_review_url"
              type="url"
              inputMode="url"
              placeholder="https://g.page/r/…/review"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              aria-invalid={!urlLooksValid}
            />
            {url.trim() && urlLooksValid && (
              <Button asChild variant="outline" size="icon" className="shrink-0" aria-label="Tester le lien">
                <a href={url.trim()} target="_blank" rel="noopener noreferrer">
                  <ExternalLink />
                </a>
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Sur votre fiche Google Business Profile : « Demander des avis », puis copiez le lien proposé.
          </p>
          {!urlLooksValid && <p className="text-xs text-destructive">Ce lien ne semble pas venir de Google.</p>}
          <FieldError errors={errors.googleReviewUrl} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="review_company">Nom de l'entreprise</Label>
          <Input id="review_company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder={profileCompany} />
          <p className="text-xs text-muted-foreground">Signature et expéditeur de la demande d'avis.</p>
          <FieldError errors={errors.companyName} />
        </div>

        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-medium">Modèle d'e-mail</legend>
          <div className="grid grid-cols-3 gap-2">
            {REVIEW_TEMPLATES.map((t) => (
              <button
                key={t.key}
                type="button"
                role="radio"
                aria-checked={templateKey === t.key}
                onClick={() => pickTemplate(t.key)}
                className={cn(
                  "rounded-lg border px-2 py-2.5 text-center text-xs transition-colors sm:px-3 sm:text-left sm:text-sm",
                  templateKey === t.key ? "border-brand bg-brand/5 font-medium" : "hover:bg-muted/50",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          {templateKey === "personnalise" && (
            <p className="text-xs text-muted-foreground">Modèle personnalisé : choisissez un modèle ci-dessus pour repartir de zéro.</p>
          )}
        </fieldset>

        <div className="grid gap-2">
          <Label htmlFor="review_subject">Objet</Label>
          <Input id="review_subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} />
          <FieldError errors={errors.subject} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="review_body">Message</Label>
          <Textarea
            id="review_body"
            ref={bodyRef}
            rows={12}
            value={body}
            onChange={(e) => editBody(e.target.value)}
            maxLength={3000}
          />
          <div className="flex flex-wrap gap-1.5">
            {REVIEW_VARIABLES.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => insertVariable(v.key)}
                title={v.label}
                className="rounded-md border bg-muted/40 px-2 py-1 font-mono text-[11px] hover:bg-muted"
              >
                {v.key}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {REVIEW_LINK_TOKEN} devient un bouton « Laisser un avis Google ». Seul sur sa ligne, il s'affiche en gros bouton.
          </p>
          {!body.includes(REVIEW_LINK_TOKEN) && (
            <p className="text-xs text-destructive">Le message doit contenir {REVIEW_LINK_TOKEN}.</p>
          )}
          <FieldError errors={errors.body} />
        </div>

        <div className="grid gap-3 rounded-lg border p-4">
          <p className="text-sm font-medium">Envoi automatique</p>
          <AutoRow
            id="auto_won"
            label="Après « Gagné »"
            checked={autoWon}
            onChecked={setAutoWon}
            days={wonDays}
            onDays={setWonDays}
            errors={errors.wonDelayDays}
          />
          <AutoRow
            id="auto_completed"
            label="Après « Terminé » (travaux finis)"
            checked={autoCompleted}
            onChecked={setAutoCompleted}
            days={completedDays}
            onDays={setCompletedDays}
            errors={errors.completedDelayDays}
          />
          <p className="text-xs text-muted-foreground">
            Une seule demande par dossier, envoyée du lundi au samedi entre 8 h et 19 h. Annulée automatiquement si le dossier
            change de statut avant l'envoi. Le client peut se désinscrire en un clic.
          </p>
        </div>

        <div>
          <Button type="submit" variant="brand" disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            {pending ? "Enregistrement…" : "Enregistrer les réglages"}
          </Button>
        </div>
      </div>

      <div className="min-w-0 lg:sticky lg:top-6 lg:self-start">
        <p className="mb-2 text-sm font-medium">Aperçu</p>
        <EmailPreview emails={preview} />
      </div>
    </form>
  );
}

function AutoRow({
  id,
  label,
  checked,
  onChecked,
  days,
  onDays,
  errors,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChecked: (v: boolean) => void;
  days: string;
  onDays: (v: string) => void;
  errors?: string[];
}) {
  return (
    <div className="grid gap-1">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-[12rem] flex-1 items-center gap-3">
          <Switch id={id} checked={checked} onCheckedChange={onChecked} aria-label={label} />
          <Label htmlFor={id} className="cursor-pointer leading-snug">
            {label}
          </Label>
        </div>
        <div className={cn("flex items-center gap-2 pl-12 text-sm sm:pl-0", !checked && "opacity-50")}>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={90}
            value={days}
            onChange={(e) => onDays(e.target.value)}
            disabled={!checked}
            className="h-9 w-20"
            aria-label={`Délai en jours ${label}`}
          />
          <span className="text-muted-foreground">jour(s) après</span>
        </div>
      </div>
      <FieldError errors={errors} />
    </div>
  );
}
