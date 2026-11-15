"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { generateRelance, type GenChannel, type GenTone } from "@/lib/content/generator";
import { cn } from "@/lib/utils";

const field = "h-10 w-full rounded-md border border-input bg-background px-3 text-base md:text-sm";

/** Générateur de relance intégré aux pages métiers : tout se passe dans le navigateur. */
export function RelanceGenerator({ works, metier }: { works: string[]; metier: string }) {
  const fiveDaysAgo = useMemo(() => {
    const d = new Date(Date.now() - 5 * 86_400_000);
    return d.toISOString().slice(0, 10);
  }, []);
  const [client, setClient] = useState("Madame Martin");
  const [entreprise, setEntreprise] = useState("");
  const [travaux, setTravaux] = useState(works[0] ?? "vos travaux");
  const [dateDevis, setDateDevis] = useState(fiveDaysAgo);
  const [numero, setNumero] = useState<1 | 2 | 3>(1);
  const [canal, setCanal] = useState<GenChannel>("email");
  const [ton, setTon] = useState<GenTone>("cordial");
  const [copied, setCopied] = useState(false);

  const out = generateRelance({ client, entreprise, travaux, dateDevis, numero, canal, ton });
  const text = out.subject ? `Objet : ${out.subject}\n\n${out.body}` : out.body;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  const seg = (active: boolean) =>
    cn("flex-1 rounded-md px-3 py-2 text-sm transition-colors", active ? "bg-background font-medium shadow-sm" : "text-foreground");

  return (
    <div className="rounded-xl border bg-card">
      <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Nom du client</span>
          <input className={field} value={client} onChange={(e) => setClient(e.target.value)} />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Votre entreprise</span>
          <input className={field} value={entreprise} onChange={(e) => setEntreprise(e.target.value)} placeholder={`Ex. Martin ${metier}`} />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Travaux</span>
          <select className={field} value={travaux} onChange={(e) => setTravaux(e.target.value)}>
            {works.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Date d'envoi du devis</span>
          <input type="date" className={field} value={dateDevis} onChange={(e) => setDateDevis(e.target.value)} />
        </label>
        <div className="grid gap-1.5 text-sm">
          <span className="font-medium">Relance n°</span>
          <div className="flex gap-1 rounded-lg bg-muted p-1" role="radiogroup" aria-label="Numéro de relance">
            {([1, 2, 3] as const).map((n) => (
              <button key={n} type="button" role="radio" aria-checked={numero === n} className={seg(numero === n)} onClick={() => setNumero(n)}>
                {n === 3 ? "3 (clôture)" : n}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-1.5 text-sm">
          <span className="font-medium">Canal et ton</span>
          <div className="flex gap-2">
            <div className="flex flex-1 gap-1 rounded-lg bg-muted p-1" role="radiogroup" aria-label="Canal">
              <button type="button" role="radio" aria-checked={canal === "email"} className={seg(canal === "email")} onClick={() => setCanal("email")}>E-mail</button>
              <button type="button" role="radio" aria-checked={canal === "sms"} className={seg(canal === "sms")} onClick={() => setCanal("sms")}>SMS</button>
            </div>
            <div className="flex flex-1 gap-1 rounded-lg bg-muted p-1" role="radiogroup" aria-label="Ton">
              <button type="button" role="radio" aria-checked={ton === "cordial"} className={seg(ton === "cordial")} onClick={() => setTon("cordial")}>Cordial</button>
              <button type="button" role="radio" aria-checked={ton === "direct"} className={seg(ton === "direct")} onClick={() => setTon("direct")}>Direct</button>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t bg-muted/30 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Votre {canal === "sms" ? "SMS" : "e-mail"} de relance
            {canal === "sms" && <span className="ml-2 normal-case tracking-normal">{out.body.length} caractères</span>}
          </p>
          <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted">
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copié" : "Copier"}
          </button>
        </div>
        <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed" aria-live="polite">{text}</pre>
      </div>
      <div className="flex flex-col gap-2 border-t p-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <p className="text-muted-foreground">Ne copiez plus vos relances : Artisan Relance les envoie seul, à votre nom, au bon moment.</p>
        <Link href="/inscription" className="inline-flex shrink-0 items-center justify-center rounded-md bg-brand px-4 py-2 font-medium text-brand-foreground hover:bg-brand/90">
          Automatiser mes relances
        </Link>
      </div>
    </div>
  );
}
