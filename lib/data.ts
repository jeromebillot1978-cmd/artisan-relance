import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import type {
  Campaign,
  CampaignAttachment,
  CampaignEvent,
  CampaignListItem,
  CampaignMessage,
  CampaignMessageFile,
  CampaignSend,
  InboundReply,
  Profile,
  ReviewEvent,
  ReviewRequest,
  ReviewSettings,
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
        send_copy_to_self: false,
        reply_notification: "alert",
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
    .select("*, campaign_attachments(count), inbound_replies(count)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1000) // plafond de l'API Supabase ; au-delà, voir l'export CSV
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

  const [attachments, sends, events, replies, messages] = await Promise.all([
    supabase.from("campaign_attachments").select("*").eq("campaign_id", id).order("created_at").returns<CampaignAttachment[]>(),
    supabase.from("campaign_sends").select("*").eq("campaign_id", id).order("sequence").returns<CampaignSend[]>(),
    supabase.from("campaign_events").select("id, type, detail, created_at").eq("campaign_id", id).order("created_at").returns<CampaignEvent[]>(),
    supabase.from("inbound_replies").select("id, from_address, subject, forwarded, created_at").eq("campaign_id", id).order("created_at").returns<InboundReply[]>(),
    supabase
      .from("campaign_messages")
      .select("id, campaign_id, direction, kind, from_address, to_addresses, subject, body, status, attempts, error, files_note, read_at, sent_at, created_at, files:campaign_message_files(id, message_id, storage_path, file_name, mime_type, size_bytes, original_size_bytes)")
      .eq("campaign_id", id)
      .order("created_at")
      .limit(200)
      .returns<CampaignMessage[]>(),
  ]);

  // Pièces jointes des messages : liens temporaires (1 h) vers le stockage privé
  const messageList = messages.data ?? [];
  const messageFiles: CampaignMessageFile[] = messageList.flatMap((m) => m.files ?? []);
  const signedMessageFiles = messageFiles.length
    ? (await supabase.storage.from("messages").createSignedUrls(messageFiles.map((f) => f.storage_path), 3600)).data ?? []
    : [];

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
    messages: messageList.map((m) => ({
      ...m,
      files: (m.files ?? [])
        .slice()
        .sort((a, b) => a.storage_path.localeCompare(b.storage_path, "fr", { numeric: true }))
        .map((f) => ({ ...f, url: signedMessageFiles.find((x) => x.path === f.storage_path)?.signedUrl ?? null })),
    })),
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

/** Avis Google : réglages, demandes (avec le dossier lié) et journal récent. */
export async function getReviewData(opts: { eventsLimit?: number } = {}) {
  const { supabase, user, profile } = await requireUser();
  const [settings, requests, events] = await Promise.all([
    supabase.from("review_settings").select("*").eq("user_id", user.id).maybeSingle<ReviewSettings>(),
    supabase
      .from("review_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1000)
      .returns<ReviewRequest[]>(),
    supabase
      .from("review_events")
      .select("id, request_id, type, detail, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(opts.eventsLimit ?? 50)
      .returns<ReviewEvent[]>(),
  ]);
  return {
    profile,
    settings: settings.data ?? null,
    requests: requests.data ?? [],
    events: events.data ?? [],
  };
}

/** Demandes d'avis d'un dossier (la plus récente d'abord). */
export async function getCampaignReviews(campaignId: string) {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("review_requests")
    .select("*")
    .eq("user_id", user.id)
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false })
    .returns<ReviewRequest[]>();
  return data ?? [];
}

/** Réponses de clients non lues, par devis (badges de la liste et du menu). */
export async function getUnreadByCampaign(): Promise<Record<string, number>> {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("campaign_messages")
    .select("campaign_id")
    .eq("user_id", user.id)
    .eq("direction", "in")
    .is("read_at", null)
    .neq("kind", "auto_reply")
    .limit(1000);
  const out: Record<string, number> = {};
  for (const row of (data ?? []) as { campaign_id: string }[]) out[row.campaign_id] = (out[row.campaign_id] ?? 0) + 1;
  return out;
}
