import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { DecisionForm } from "@/components/decision/decision-form";

export const metadata: Metadata = {
  title: "Réponse à votre devis",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

interface ClientQuote {
  prospect_name: string;
  company_name: string;
  reference: string | null;
  amount: number;
  status: string;
  initial_sent_at: string | null;
  won_at: string | null;
  lost_at: string | null;
  contact_email: string | null;
  phone: string | null;
}

export default async function DecisionPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ choix?: string }>;
}) {
  const { token } = await params;
  const { choix } = await searchParams;
  if (!/^[a-f0-9]{24}$/.test(token)) notFound();

  const supabase = await createClient();
  const { data: q } = await supabase.rpc("client_quote", { p_token: token }).maybeSingle<ClientQuote>();
  if (!q) notFound();

  const decided = q.status === "won" ? "won" : q.status === "lost" ? "lost" : null;
  const sentOn = q.initial_sent_at
    ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" }).format(new Date(q.initial_sent_at))
    : null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-10">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">{q.company_name}</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">
          Votre devis{q.reference ? ` n° ${q.reference}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {q.prospect_name}
          {Number(q.amount) > 0 ? ` · ${formatCurrency(q.amount)}` : ""}
          {sentOn ? ` · envoyé le ${sentOn}` : ""}
        </p>

        <div className="mt-6">
          <DecisionForm token={token} initialChoice={choix === "refuser" ? "refuse" : "accept"} decided={decided} />
        </div>

        <p className="mt-6 border-t pt-4 text-xs text-muted-foreground">
          Une question ? Contactez directement {q.company_name}
          {q.contact_email ? ` : ${q.contact_email}` : ""}
          {q.phone ? ` · ${q.phone}` : ""}.
        </p>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">Service fourni par Artisan Relance</p>
    </main>
  );
}
