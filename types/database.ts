export interface Profile {
  id: string;
  email: string;
  company_name: string;
  contact_name: string | null;
  phone: string | null;
  reply_to_email: string | null;
  /** Copie cachée de chaque devis envoyé (désactivée par défaut). */
  send_copy_to_self: boolean;
  reply_notification?: "alert" | "full" | "none";
  plan: string;
  created_at: string;
  updated_at: string;
}

export type CampaignStatus = "draft" | "active" | "paused" | "replied" | "won" | "lost" | "completed" | "stopped";
export type InitialSendStatus = "pending" | "processing" | "sent" | "failed" | "skipped";

export interface Campaign {
  id: string;
  user_id: string;
  idempotency_key: string;
  reference: string | null;
  prospect_name: string;
  recipients: string[];
  subject: string;
  message: string;
  followup_message: string;
  amount: number;
  client_phone: string | null;
  notes: string | null;
  send_initial: boolean;
  initial_send_status: InitialSendStatus;
  initial_sent_at: string | null;
  followup_enabled: boolean;
  interval_days: number;
  max_followups: number;
  end_date: string | null;
  max_days: number | null;
  attach_on_followups: boolean;
  followups_sent: number;
  next_followup_at: string | null;
  last_followup_at: string | null;
  ends_at: string | null;
  status: CampaignStatus;
  pause_reason: string | null;
  replied_at: string | null;
  won_at: string | null;
  lost_at: string | null;
  stopped_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type CampaignListItem = Campaign & { campaign_attachments: { count: number }[] };

export interface CampaignAttachment {
  id: string;
  campaign_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

export interface CampaignSend {
  id: string;
  sequence: number;
  kind: "initial" | "followup";
  status: "processing" | "sent" | "failed";
  attempts: number;
  recipients: string[];
  provider_id: string | null;
  error: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface CampaignEvent {
  id: number;
  type: string;
  detail: Record<string, unknown>;
  created_at: string;
}

export interface CampaignMessageFile {
  id: string;
  message_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  original_size_bytes: number | null;
  url?: string | null;
}

export interface CampaignMessage {
  id: string;
  campaign_id: string;
  direction: "in" | "out";
  kind: "reply" | "auto_reply" | "opt_out" | "suspicious" | "artisan";
  from_address: string | null;
  to_addresses: string[];
  subject: string | null;
  body: string;
  status: "received" | "queued" | "sending" | "sent" | "failed";
  attempts?: number;
  error: string | null;
  files_note: string | null;
  read_at: string | null;
  sent_at: string | null;
  created_at: string;
  files: CampaignMessageFile[];
}

export interface InboundReply {
  id: string;
  from_address: string | null;
  subject: string | null;
  forwarded: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------
// Avis Google
// ---------------------------------------------------------------------
export type ReviewTemplateChoice = "professionnel" | "court" | "chaleureux" | "personnalise";

export interface ReviewSettings {
  user_id: string;
  google_review_url: string | null;
  company_name: string | null;
  template_key: ReviewTemplateChoice;
  subject: string;
  body: string;
  auto_on_won: boolean;
  won_delay_days: number;
  auto_on_completed: boolean;
  completed_delay_days: number;
  google_place_id: string | null;
  created_at: string;
  updated_at: string;
}

export type ReviewRequestStatus = "scheduled" | "processing" | "sent" | "failed" | "cancelled";
export type ReviewTrigger = "manual" | "won" | "completed";

export interface ReviewRequest {
  id: string;
  user_id: string;
  campaign_id: string | null;
  client_name: string;
  recipients: string[];
  trigger: ReviewTrigger;
  status: ReviewRequestStatus;
  scheduled_at: string;
  claimed_at: string | null;
  sent_at: string | null;
  attempts: number;
  last_error: string | null;
  provider_id: string | null;
  cancel_reason: string | null;
  subject: string | null;
  body: string | null;
  clicks: number;
  first_clicked_at: string | null;
  last_clicked_at: string | null;
  review_status: "unknown" | "received";
  review_source: "manual" | "google" | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewEvent {
  id: number;
  request_id: string | null;
  type: string;
  detail: Record<string, unknown>;
  created_at: string;
}
