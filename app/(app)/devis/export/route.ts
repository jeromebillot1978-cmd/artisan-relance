import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { EVENT_LABELS, statusDisplay } from "@/lib/campaigns/constants";
import { csvDate, toCsv } from "@/lib/csv";
import type { Campaign } from "@/types/database";

export const dynamic = "force-dynamic";

const PAGE = 1000; // plafond de l'API : on pagine

async function fetchAll<T>(query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const all: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await query(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    all.push(...(data ?? []));
    if (!data || data.length < PAGE) return all;
  }
}

/** Sauvegarde CSV : /devis/export (campagnes) ou /devis/export?type=historique */
export async function GET(request: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const type = request.nextUrl.searchParams.get("type") === "historique" ? "historique" : "campagnes";
  const day = new Date().toISOString().slice(0, 10);

  try {
    if (type === "campagnes") {
      const rows = await fetchAll<Campaign>((from, to) =>
        supabase.from("campaigns").select("*").eq("user_id", user.id).order("created_at").range(from, to),
      );
      const csv = toCsv(
        [
          "ID campagne", "Client", "E-mails", "Téléphone", "N° devis", "Montant (EUR)", "Objet", "Statut",
          "Date d'envoi", "Relances activées", "Intervalle (jours)", "Relances max", "Relances envoyées",
          "Prochaine relance", "Dernière relance", "Fin de campagne", "Répondu le", "Gagné le", "Perdu le",
          "Arrêté le", "Terminé le", "Motif de perte", "Décision par", "Notes", "Message", "Message de relance", "Créé le",
        ],
        rows.map((c) => [
          c.id, c.prospect_name, c.recipients.join(", "), c.client_phone, c.reference, Number(c.amount).toFixed(2).replace(".", ","),
          c.subject, statusDisplay(c).label, csvDate(c.initial_sent_at), c.followup_enabled ? "oui" : "non",
          c.interval_days, c.max_followups, c.followups_sent, csvDate(c.next_followup_at), csvDate(c.last_followup_at),
          csvDate(c.ends_at), csvDate(c.replied_at), csvDate(c.won_at), csvDate(c.lost_at), csvDate(c.stopped_at),
          csvDate(c.completed_at), c.lost_reason, c.decided_by === "client" ? "client" : c.decided_by === "artisan" ? "artisan" : "", c.notes, c.message, c.followup_message, csvDate(c.created_at),
        ]),
      );
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="artisan-relance-campagnes-${day}.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const events = await fetchAll<{
      created_at: string;
      type: string;
      detail: Record<string, unknown>;
      campaign_id: string;
      campaigns: { prospect_name: string; reference: string | null } | null;
    }>((from, to) =>
      supabase
        .from("campaign_events")
        .select("created_at, type, detail, campaign_id, campaigns(prospect_name, reference)")
        .eq("user_id", user.id)
        .order("created_at")
        .range(from, to)
        .returns<{
          created_at: string;
          type: string;
          detail: Record<string, unknown>;
          campaign_id: string;
          campaigns: { prospect_name: string; reference: string | null } | null;
        }[]>(),
    );
    const csv = toCsv(
      ["Date", "ID campagne", "Client", "N° devis", "Événement", "Détail"],
      events.map((e) => [
        csvDate(e.created_at),
        e.campaign_id,
        e.campaigns?.prospect_name,
        e.campaigns?.reference,
        EVENT_LABELS[e.type] ?? e.type,
        JSON.stringify(e.detail),
      ]),
    );
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="artisan-relance-historique-${day}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Export impossible" }, { status: 500 });
  }
}
