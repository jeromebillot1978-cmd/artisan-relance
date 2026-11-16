import "server-only";
import { SITE } from "@/lib/site";
import { siteUrl } from "@/lib/utils";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

const parisDate = (d: Date) =>
  new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short", timeZone: "Europe/Paris" }).format(d);

type Row = [label: string, value: string, href?: string];

/**
 * E-mail d'information envoyé à l'administrateur (nouvelle inscription, profil complété…).
 * Ne lève jamais d'erreur : une notification ratée ne doit pas bloquer l'artisan.
 */
export async function notifyAdmin(opts: {
  subject: string;
  intro: string;
  rows: Row[];
  replyTo?: string;
  actions?: { label: string; href: string }[];
  note?: string;
  idempotencyKey: string;
}) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!key || !from) return;

  const text = [
    opts.intro,
    "",
    ...opts.rows.map(([k, v]) => `${k} : ${v}`),
    ...(opts.actions?.length ? ["", ...opts.actions.map((a) => `${a.label} : ${a.href}`)] : []),
    ...(opts.note ? ["", opts.note] : []),
  ].join("\n");

  const html = `<!DOCTYPE html><html lang="fr"><body style="margin:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
<div style="background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:24px">
<p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#c2410c">Artisan Relance · Administration</p>
<h1 style="margin:0 0 12px;font-size:20px;line-height:1.3">${esc(opts.subject)}</h1>
<p style="margin:0 0 16px;line-height:1.6;color:#3f3f46">${esc(opts.intro)}</p>
<table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px">
${opts.rows
  .map(
    ([k, v, href]) =>
      `<tr><td style="padding:8px 12px 8px 0;border-top:1px solid #f4f4f5;color:#71717a;white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:8px 0;border-top:1px solid #f4f4f5;font-weight:500">${
        href ? `<a href="${esc(href)}" style="color:#c2410c">${esc(v)}</a>` : esc(v)
      }</td></tr>`,
  )
  .join("\n")}
</table>
${
  opts.actions?.length
    ? `<p style="margin:20px 0 0">${opts.actions
        .map(
          (a, i) =>
            `<a href="${esc(a.href)}" style="display:inline-block;margin:0 8px 8px 0;padding:10px 16px;border-radius:8px;font-weight:600;font-size:14px;text-decoration:none;${
              i === 0 ? "background:#ea580c;color:#fff" : "border:1px solid #e4e4e7;color:#18181b"
            }">${esc(a.label)}</a>`,
        )
        .join("")}</p>`
    : ""
}
${opts.note ? `<p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#71717a">${esc(opts.note)}</p>` : ""}
</div>
<p style="margin:12px 0 0;text-align:center;font-size:12px;color:#a1a1aa">Notification automatique envoyée à l'administrateur d'Artisan Relance.</p>
</div></body></html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": opts.idempotencyKey },
      body: JSON.stringify({
        from: `Artisan Relance <${from}>`,
        to: [SITE.contactEmail],
        reply_to: opts.replyTo,
        subject: opts.subject,
        text,
        html,
        tags: [{ name: "kind", value: "admin_notification" }],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("notifyAdmin", res.status, await res.text().catch(() => ""));
  } catch (e) {
    console.error("notifyAdmin", e instanceof Error ? e.message : e);
  }
}

/** Nouvelle inscription (le nom de l'entreprise n'est pas encore connu à ce stade). */
export function notifySignup(user: { id: string; email: string; createdAt?: string; confirmed: boolean }) {
  const site = siteUrl();
  return notifyAdmin({
    subject: `Nouvel artisan inscrit : ${user.email}`,
    intro: "Un artisan vient de créer son compte sur Artisan Relance.",
    rows: [
      ["E-mail", user.email, `mailto:${user.email}`],
      ["Inscrit le", parisDate(user.createdAt ? new Date(user.createdAt) : new Date())],
      ["Statut", user.confirmed ? "Compte actif" : "E-mail à confirmer (lien d'activation envoyé)"],
    ],
    replyTo: user.email,
    actions: [
      {
        label: "Lui écrire",
        href: `mailto:${user.email}?subject=${encodeURIComponent("Bienvenue sur Artisan Relance")}`,
      },
      { label: "Voir les statistiques", href: `${site}/statistiques` },
    ],
    note: "Le nom de son entreprise n'est pas demandé à l'inscription : vous recevrez un second e-mail dès qu'il l'aura renseigné dans ses paramètres. Répondre à cet e-mail lui écrit directement.",
    idempotencyKey: `signup-${user.id}`,
  });
}

/** Premier remplissage du profil : on connaît enfin l'entreprise et le téléphone. */
export function notifyProfileCompleted(p: {
  id: string;
  email: string;
  company: string;
  contact: string | null;
  phone: string | null;
}) {
  const rows: Row[] = [
    ["Entreprise", p.company],
    ["Contact", p.contact || "—"],
    ["E-mail", p.email, `mailto:${p.email}`],
    p.phone ? ["Téléphone", p.phone, `tel:${p.phone.replace(/[^\d+]/g, "")}`] : ["Téléphone", "—"],
  ];
  const actions = [
    ...(p.phone ? [{ label: "L'appeler", href: `tel:${p.phone.replace(/[^\d+]/g, "")}` }] : []),
    { label: "Lui écrire", href: `mailto:${p.email}?subject=${encodeURIComponent("Bienvenue sur Artisan Relance")}` },
  ];
  return notifyAdmin({
    subject: `Nouvel artisan inscrit : ${p.company} (${p.email})`,
    intro: `${p.company} a complété son profil : il est prêt à envoyer ses premiers devis.`,
    rows,
    replyTo: p.email,
    actions,
    idempotencyKey: `profile-${p.id}`,
  });
}
