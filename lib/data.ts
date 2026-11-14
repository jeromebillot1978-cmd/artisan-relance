import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import type {
  Campaign,
  CampaignAttachment,
  CampaignEvent,
  CampaignListItem,
  CampaignSend,
  InboundReply,
  Profile,
} from "@/types/database";

/** Utilisateur + profil, mis en cache pour la durée d'une requête. */
export const requireUser = cache(async () => {
  const { supabase, user } = await getUser();
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();

  return {
    supabase,
    user,
    profile:
      profile ??
      ({
        id: user.id,
        email: user.email ?? "",
        company_name: "",
        contact_name: null,
        phone: null,
        reply_to_email: null,
        plan: "free",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } satisfies Profile),
  };
});

export async function getCampaigns() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*, campaign_attachments(count)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<CampaignListItem[]>();
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getCampaignDetail(id: string) {
  const { supabase, user } = await requireUser();
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle<Campaign>();
  if (!campaign) return null;

  const [attachments, sends, events, replies] = await Promise.all([
    supabase.from("campaign_attachments").select("*").eq("campaign_id", id).order("created_at").returns<CampaignAttachment[]>(),
    supabase.from("campaign_sends").select("*").eq("campaign_id", id).order("sequence").returns<CampaignSend[]>(),
    supabase.from("campaign_events").select("id, type, detail, created_at").eq("campaign_id", id).order("created_at").returns<CampaignEvent[]>(),
    supabase.from("inbound_replies").select("id, from_address, subject, forwarded, created_at").eq("campaign_id", id).order("created_at").returns<InboundReply[]>(),
  ]);

  const files = attachments.data ?? [];
  const signed = files.length
    ? (await supabase.storage.from("devis").createSignedUrls(files.map((f) => f.storage_path), 600)).data ?? []
    : [];

  return {
    campaign,
    attachments: files.map((f) => ({ ...f, url: signed.find((s) => s.path === f.storage_path)?.signedUrl ?? null })),
    sends: sends.data ?? [],
    events: events.data ?? [],
    replies: replies.data ?? [],
  };
}

export function computeStats(campaigns: Campaign[]) {
  const sent = campaigns.filter((c) => c.initial_sent_at);
  const replied = sent.filter((c) => c.replied_at);
  const won = campaigns.filter((c) => c.status === "won");
  const lost = campaigns.filter((c) => c.status === "lost");
  const open = campaigns.filter((c) => ["draft", "active", "paused", "replied"].includes(c.status));
  return {
    total: campaigns.length,
    open: open.length,
    openAmount: open.reduce((s, c) => s + Number(c.amount), 0),
    scheduled: campaigns.filter((c) => c.status === "active" && c.next_followup_at).length,
    replyRate: sent.length ? Math.round((replied.length / sent.length) * 100) : null,
    winRate: won.length + lost.length ? Math.round((won.length / (won.length + lost.length)) * 100) : null,
    amountWon: won.reduce((s, c) => s + Number(c.amount), 0),
    followupsSent: campaigns.reduce((s, c) => s + c.followups_sent, 0),
  };
}
