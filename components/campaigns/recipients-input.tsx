"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MAX_RECIPIENTS } from "@/lib/campaigns/constants";
import { emailIssue } from "@/lib/email-check";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Adresses valides contenues dans une saisie libre (séparateurs : espace, virgule, point-virgule). */
export function parseRecipients(raw: string) {
  return raw.split(/[\s,;]+/).map((p) => p.trim().toLowerCase()).filter(Boolean);
}

export function RecipientsInput({
  value,
  onChange,
  id,
  onDraftChange,
}: {
  value: string[];
  onChange: (list: string[]) => void;
  id?: string;
  /** Saisie en cours non encore validée (remplissage automatique, suggestion du clavier…). */
  onDraftChange?: (draft: string) => void;
}) {
  const [draft, setDraftState] = useState("");
  const setDraft = (next: string) => {
    setDraftState(next);
    onDraftChange?.(next);
  };
  const [error, setError] = useState<string | null>(null);

  function commit(raw: string) {
    const parts = parseRecipients(raw);
    if (!parts.length) return true;
    const invalid = parts.find((p) => !EMAIL_RE.test(p));
    if (invalid) {
      setError(`Adresse invalide : ${invalid}`);
      return false;
    }
    // faute de frappe dans le domaine (gmail.con…) ou adresse technique : bloqué avant l'envoi
    for (const p of parts) {
      const issue = emailIssue(p);
      if (issue) {
        setError(issue);
        return false;
      }
    }
    const next = Array.from(new Set([...value, ...parts]));
    if (next.length > MAX_RECIPIENTS) {
      setError(`${MAX_RECIPIENTS} destinataires maximum.`);
      return false;
    }
    onChange(next);
    setDraft("");
    setError(null);
    return true;
  }

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((email) => (
            <span key={email} className="inline-flex items-center gap-1 rounded-full border bg-secondary px-2.5 py-1 text-xs">
              {email}
              <button
                type="button"
                aria-label={`Retirer ${email}`}
                className="text-muted-foreground hover:text-foreground"
                onClick={() => onChange(value.filter((v) => v !== email))}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <Input
        id={id}
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder={value.length ? "Ajouter un autre destinataire…" : "client@email.fr"}
        value={draft}
        onChange={(e) => {
          const next = e.target.value;
          // Suggestion du clavier mobile ou remplissage automatique : l'adresse arrive d'un bloc,
          // souvent suivie d'un espace ou d'une virgule, sans événement clavier → on valide tout de suite.
          if (/[\s,;]$/.test(next) && next.trim()) {
            if (!commit(next)) setDraft(next);
            return;
          }
          setDraft(next);
        }}
        onKeyDown={(e) => {
          if (["Enter", ",", ";", " "].includes(e.key)) {
            e.preventDefault();
            commit(draft);
          }
        }}
        onBlur={() => commit(draft)}
        disabled={value.length >= MAX_RECIPIENTS}
      />
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : (
        <p className="text-xs text-muted-foreground">Entrée ou virgule pour ajouter. {MAX_RECIPIENTS} maximum.</p>
      )}
    </div>
  );
}
