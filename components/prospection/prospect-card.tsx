"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, ExternalLink, Globe, Mail, MessageSquareText, Phone, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { updateProspect } from "@/lib/actions/prospects";

type Status = "a_valider" | "valide" | "envoye" | "repondu" | "pas_interesse";

export type ProspectView = {
  id: string;
  company: string;
  city: string;
  trade: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  channel: "email" | "formulaire" | "telephone";
  why: string;
  findings: string;
  subject: string | null;
  message: string;
  caution: string | null;
  status: Status;
  notes: string;
  sent_at: string | null;
};

const STATUSES: { value: Status; label: string; variant: "pending" | "info" | "violet" | "signed" | "neutral" }[] = [
  { value: "a_valider", label: "À valider", variant: "pending" },
  { value: "valide", label: "Validé, prêt à envoyer", variant: "info" },
  { value: "envoye", label: "Envoyé", variant: "violet" },
  { value: "repondu", label: "A répondu", variant: "signed" },
  { value: "pas_interesse", label: "Pas intéressé", variant: "neutral" },
];

const CHANNEL_LABEL = { email: "E-mail", formulaire: "Formulaire du site", telephone: "Téléphone" } as const;

const SENDER = "jercat.bilman@gmail.com";

/** Brouillon Gmail prérempli : s'ouvre dans Gmail, rien n'est envoyé tant que vous ne cliquez pas sur « Envoyer ». */
function gmailDraftUrl(to: string, subject: string | null, body: string) {
  const p = new URLSearchParams({ view: "cm", fs: "1", authuser: SENDER, to, su: subject ?? "", body });
  return `https://mail.google.com/mail/?${p.toString()}`;
}

/** Lien « mailto » : ouvre l'application e-mail du téléphone ou de l'ordinateur, sans rien envoyer. */
function mailtoUrl(to: string, subject: string | null, body: string) {
  return `mailto:${to}?subject=${encodeURIComponent(subject ?? "")}&body=${encodeURIComponent(body)}`;
}

async function copy(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${what} copié`);
  } catch {
    toast.error("Copie impossible : sélectionnez le texte à la main.");
  }
}

export function ProspectCard({ p, index }: { p: ProspectView; index: number }) {
  const [status, setStatus] = useState<Status>(p.status);
  const [notes, setNotes] = useState(p.notes);
  const [pending, start] = useTransition();
  const current = STATUSES.find((s) => s.value === status) ?? STATUSES[0];
  const validated = status !== "a_valider";

  function save(changes: { status?: Status; notes?: string }) {
    start(async () => {
      const res = await updateProspect({ id: p.id, ...changes });
      if (res.error) toast.error(res.error);
      else toast.success(res.message ?? "Enregistré");
    });
  }

  return (
    <Card>
      <CardHeader className="space-y-2 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base">
            {index + 1}. {p.company}
          </CardTitle>
          <Badge variant={current.variant}>{current.label}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {p.trade} · {p.city} · Canal : {CHANNEL_LABEL[p.channel]}
        </p>
      </CardHeader>

      <CardContent className="space-y-4 text-sm">
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
            {p.email ? (
              <button type="button" className="truncate underline underline-offset-4" onClick={() => copy(p.email!, "E-mail")}>
                {p.email}
              </button>
            ) : (
              <span className="text-muted-foreground">Pas d'e-mail public</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
            {p.phone ? (
              <a href={`tel:${p.phone.replace(/[^\d+]/g, "")}`} className="underline underline-offset-4">
                {p.phone}
              </a>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        </dl>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <h3 className="mb-1 font-medium">Pourquoi c'est une bonne cible</h3>
            <p className="whitespace-pre-line text-muted-foreground">{p.why}</p>
          </div>
          <div>
            <h3 className="mb-1 font-medium">Ce que j'ai vérifié</h3>
            <p className="whitespace-pre-line text-muted-foreground">{p.findings}</p>
          </div>
        </div>

        {p.caution && (
          <p className="flex gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-amber-800 dark:text-amber-300">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{p.caution}</span>
          </p>
        )}

        <div className="rounded-md border bg-muted/30 p-3">
          <div className="mb-2 flex items-center gap-2 font-medium">
            <MessageSquareText className="h-4 w-4" />
            {p.channel === "telephone" ? "Script d'appel" : "Message"}
          </div>
          {p.subject && (
            <p className="mb-2">
              <span className="text-muted-foreground">Objet : </span>
              {p.subject}
            </p>
          )}
          <p className="whitespace-pre-line">{p.message}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => copy(p.message, "Message")}>
            <Copy className="h-4 w-4" /> Copier le message
          </Button>
          {p.subject && (
            <Button type="button" variant="outline" size="sm" onClick={() => copy(p.subject!, "Objet")}>
              <Copy className="h-4 w-4" /> Copier l'objet
            </Button>
          )}
          {p.email && validated && (
            <Button asChild size="sm">
              <a href={gmailDraftUrl(p.email, p.subject, p.message)} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" /> Brouillon Gmail (ordinateur)
              </a>
            </Button>
          )}
          {p.email && validated && (
            <Button asChild variant="outline" size="sm">
              <a href={mailtoUrl(p.email, p.subject, p.message)}>
                <Mail className="h-4 w-4" /> Appli e-mail (téléphone)
              </a>
            </Button>
          )}
          {p.email && !validated && (
            <span className="self-center text-xs text-muted-foreground">
              Validez le message pour pouvoir ouvrir le brouillon.
            </span>
          )}
          {p.channel === "formulaire" && p.website && (
            <Button asChild variant="outline" size="sm">
              <a href={p.website} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" /> Ouvrir leur site (formulaire)
              </a>
            </Button>
          )}
        </div>

        <div className="grid gap-3 border-t pt-4 md:grid-cols-[220px_1fr]">
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Statut</span>
            <select
              className="h-9 w-full rounded-md border bg-background px-2 text-sm"
              value={status}
              disabled={pending}
              onChange={(e) => {
                const next = e.target.value as Status;
                setStatus(next);
                save({ status: next });
              }}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            {p.sent_at && status !== "a_valider" && status !== "valide" && (
              <span className="block text-xs text-muted-foreground">
                Envoyé le {new Date(p.sent_at).toLocaleDateString("fr-FR")}
              </span>
            )}
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Notes (réponse, rappel prévu…)</span>
            <Textarea
              rows={2}
              value={notes}
              maxLength={2000}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => notes !== p.notes && save({ notes })}
            />
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
