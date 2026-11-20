"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProspect, updateProspectContent, type ProspectActionResult } from "@/lib/actions/prospects";
import type { Channel, Prospect } from "@/lib/prospects";

/**
 * Création et modification d'une fiche (Mi2, Mo7, Mo10).
 * La provenance des coordonnées est obligatoire à la création.
 * Modifier le texte retire la validation : la base l'impose, l'écran le dit avant d'enregistrer.
 */
type Values = {
  company: string; city: string; trade: string; channel: Channel; website: string; email: string; phone: string;
  why: string; findings: string; subject: string; message: string; caution: string;
  source_label: string; source_url: string; source_checked_at: string;
};

const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" }); // AAAA-MM-JJ

function initial(p?: Prospect): Values {
  return {
    company: p?.company ?? "", city: p?.city ?? "", trade: p?.trade ?? "", channel: p?.channel ?? "email",
    website: p?.website ?? "", email: p?.email ?? "", phone: p?.phone ?? "", why: p?.why ?? "", findings: p?.findings ?? "",
    subject: p?.subject ?? "", message: p?.message ?? "", caution: p?.caution ?? "",
    source_label: p?.source_label ?? "", source_url: p?.source_url ?? "", source_checked_at: p?.source_checked_at ?? today(),
  };
}

function Field(props: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={props.id}>{props.label}</Label>
      {props.children}
      {props.hint && <p className="text-xs text-muted-foreground">{props.hint}</p>}
    </div>
  );
}

export function ProspectFormDialog(props: { open: boolean; onOpenChange: (v: boolean) => void; prospect?: Prospect }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [v, setV] = useState<Values>(() => initial(props.prospect));
  useEffect(() => {
    if (props.open) setV(initial(props.prospect));
  }, [props.open, props.prospect]);

  const editing = Boolean(props.prospect);
  const textChanged = editing && (v.subject.trim() !== (props.prospect?.subject ?? "") || v.message !== props.prospect?.message);
  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setV((x) => ({ ...x, [k]: e.target.value }));
  const missing = !v.message.trim() || (!editing && (!v.company.trim() || !v.city.trim() || !v.trade.trim() || !v.source_label.trim() || !v.source_checked_at));

  function save() {
    start(async () => {
      let res: ProspectActionResult;
      try {
        res = props.prospect
          ? await updateProspectContent(props.prospect.id, props.prospect.version, {
              website: v.website, email: v.email, phone: v.phone, subject: v.subject, message: v.message, caution: v.caution,
              source_label: v.source_label, source_url: v.source_url, source_checked_at: v.source_checked_at || null,
            })
          : await createProspect({ ...v, source_checked_at: v.source_checked_at || null });
      } catch {
        res = { ok: false, error: "Saisie refusée. Vérifiez les champs." };
      }
      if (!res.ok) {
        toast.error(res.error);
        if (res.conflict) router.refresh();
        return;
      }
      toast.success(editing ? (textChanged ? "Fiche enregistrée — le message est à relire" : "Fiche enregistrée") : "Prospect ajouté — message à relire");
      props.onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={props.open} onOpenChange={(o) => !pending && props.onOpenChange(o)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? `Modifier « ${props.prospect?.company} »` : "Ajouter un prospect"}</DialogTitle>
          <DialogDescription>
            Uniquement des coordonnées professionnelles publiques. Indiquez toujours d&apos;où elles viennent.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          {!editing && (
            <>
              <Field id="pf-company" label="Entreprise *">
                <Input id="pf-company" value={v.company} onChange={set("company")} maxLength={200} />
              </Field>
              <Field id="pf-trade" label="Métier *">
                <Input id="pf-trade" value={v.trade} onChange={set("trade")} maxLength={200} />
              </Field>
              <Field id="pf-city" label="Ville *">
                <Input id="pf-city" value={v.city} onChange={set("city")} maxLength={200} placeholder="Laon (02)" />
              </Field>
              <Field id="pf-channel" label="Canal prévu *">
                <select id="pf-channel" value={v.channel} onChange={set("channel")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="email">E-mail</option>
                  <option value="formulaire">Formulaire de leur site</option>
                  <option value="telephone">Téléphone</option>
                </select>
              </Field>
            </>
          )}
          <Field id="pf-website" label="Site internet">
            <Input id="pf-website" type="url" inputMode="url" value={v.website} onChange={set("website")} placeholder="https://…" />
          </Field>
          <Field id="pf-email" label="E-mail professionnel public">
            <Input id="pf-email" type="email" inputMode="email" value={v.email} onChange={set("email")} />
          </Field>
          <Field id="pf-phone" label="Téléphone(s)" hint="Plusieurs numéros : séparez-les par « / ».">
            <Input id="pf-phone" inputMode="tel" value={v.phone} onChange={set("phone")} />
          </Field>
          <Field id="pf-source-date" label={editing ? "Coordonnées vérifiées le" : "Coordonnées vérifiées le *"}>
            <Input id="pf-source-date" type="date" value={v.source_checked_at} max={today()} onChange={set("source_checked_at")} />
          </Field>
          <Field id="pf-source" label={editing ? "Provenance" : "Provenance *"} hint="Ex. : leur site, page Contact ; PagesJaunes ; annuaire Qualibat.">
            <Input id="pf-source" value={v.source_label} onChange={set("source_label")} maxLength={200} />
          </Field>
          <Field id="pf-source-url" label="Lien de la source">
            <Input id="pf-source-url" type="url" inputMode="url" value={v.source_url} onChange={set("source_url")} placeholder="https://…" />
          </Field>
        </div>

        {!editing && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="pf-why" label="Pourquoi c'est une bonne cible">
              <Textarea id="pf-why" rows={3} value={v.why} onChange={set("why")} maxLength={2000} />
            </Field>
            <Field id="pf-findings" label="Ce qui a été vérifié">
              <Textarea id="pf-findings" rows={3} value={v.findings} onChange={set("findings")} maxLength={2000} />
            </Field>
          </div>
        )}

        <Field id="pf-subject" label="Objet (e-mail)">
          <Input id="pf-subject" value={v.subject} onChange={set("subject")} maxLength={200} />
        </Field>
        <Field id="pf-message" label="Message / script *" hint={`${v.message.length} / 5000 caractères`}>
          <Textarea id="pf-message" rows={8} value={v.message} onChange={set("message")} maxLength={5000} />
        </Field>
        <Field id="pf-caution" label="Point d'attention (facultatif)">
          <Input id="pf-caution" value={v.caution} onChange={set("caution")} maxLength={500} />
        </Field>

        {textChanged && props.prospect?.approved_current && (
          <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
            Vous modifiez un message déjà validé : il faudra le relire et le valider à nouveau avant tout contact.
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => props.onOpenChange(false)} disabled={pending}>
            Annuler
          </Button>
          <Button onClick={save} disabled={pending || missing}>
            {pending ? "Enregistrement…" : editing ? "Enregistrer" : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Bouton « Ajouter un prospect » de la page. */
export function NewProspectButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Ajouter un prospect
      </Button>
      <ProspectFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
