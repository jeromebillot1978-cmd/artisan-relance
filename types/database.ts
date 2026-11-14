export interface Profile {
  id: string;
  email: string;
  company_name: string;
  contact_name: string | null;
  phone: string | null;
  reply_to_email: string | null;
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

export interface InboundReply {
  id: string;
  from_address: string | null;
  subject: string | null;
  forwarded: boolean;
  created_at: string;
}
