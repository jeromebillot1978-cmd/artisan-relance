"use server";

import { z } from "zod";
import { emailIssue } from "@/lib/email-check";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE } from "@/lib/site";

const schema = z.object({
  kind: z.enum(["question", "demo"]),
  name: z.string().trim().min(2, "Indiquez votre nom.").max(120),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Adresse e-mail invalide.")
    .max(200)
    .superRefine((value, ctx) => {
      const issue = emailIssue(value);
      if (issue) ctx.addIssue({ code: "custom", message: issue });
    }),
  phone: z.string().trim().max(30).optional().default(""),
  trade: z.string().trim().max(80).optional().default(""),
  message: z.string().trim().min(5, "Votre message est trop court.").max(4000),
  // anti-robot : champ caché qui doit rester vide, et délai minimal de remplissage
  website: z.string().max(0).optional().default(""),
  startedAt: z.number().int(),
});

export type ContactState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string[] | undefined> };

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}

export async function sendContact(input: z.input<typeof schema>): Promise<ContactState> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return { error: "Vérifiez les champs.", fieldErrors: flat.fieldErrors };
  }
  const v = parsed.data;
  // robots : champ caché rempli ou formulaire envoyé en moins de 3 secondes → ignoré sans le dire
  if (v.website || Date.now() - v.startedAt < 3000) return { ok: true };

  const admin = createAdminClient();
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("contact_messages")
    .select("id", { count: "exact", head: true })
    .eq("email", v.email)
    .gte("created_at", since);
  if ((count ?? 0) >= 3) return { error: "Vous avez déjà envoyé plusieurs messages. Nous vous répondons rapidement." };

  const { data: saved, error } = await admin
    .from("contact_messages")
    .insert({ kind: v.kind, name: v.name, email: v.email, phone: v.phone || null, trade: v.trade || null, message: v.message })
    .select("id")
    .single();
  if (error || !saved) return { error: "L'envoi a échoué. Écrivez-nous directement à " + SITE.contactEmail };

  // Notification par e-mail (le message est déjà enregistré : un échec ici ne perd rien)
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (key && from) {
    const subject = `${v.kind === "demo" ? "Demande de démonstration" : "Question"} — ${v.name}${v.trade ? ` (${v.trade})` : ""}`;
    const lines = [
      ["Type", v.kind === "demo" ? "Demande de démonstration" : "Question"],
      ["Nom", v.name],
      ["E-mail", v.email],
      ["Téléphone", v.phone || "—"],
      ["Métier", v.trade || "—"],
    ];
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": `contact-${saved.id}` },
      body: JSON.stringify({
        from: `Artisan Relance <${from}>`,
        to: [SITE.contactEmail],
        reply_to: v.email,
        subject,
        text: `${lines.map(([k, val]) => `${k} : ${val}`).join("\n")}\n\n${v.message}`,
        html: `<p>${lines.map(([k, val]) => `<strong>${k} :</strong> ${escape(val)}`).join("<br>")}</p><p style="white-space:pre-line">${escape(v.message)}</p>`,
      }),
    }).catch(() => null);
    if (res?.ok) await admin.from("contact_messages").update({ notified: true }).eq("id", saved.id);
  }
  return { ok: true };
}
