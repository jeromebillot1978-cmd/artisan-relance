"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MAX_RECIPIENTS } from "@/lib/campaigns/constants";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function RecipientsInput({
  value,
  onChange,
  id,
}: {
  value: string[];
  onChange: (list: string[]) => void;
  id?: string;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  function commit(raw: string) {
    const parts = raw.split(/[\s,;]+/).map((p) => p.trim().toLowerCase()).filter(Boolean);
    if (!parts.length) return true;
    const invalid = parts.find((p) => !EMAIL_RE.test(p));
    if (invalid) {
      setError(`Adresse invalide : ${invalid}`);
      return false;
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
        autoComplete="off"
        placeholder={value.length ? "Ajouter un autre destinataire…" : "client@email.fr"}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
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
