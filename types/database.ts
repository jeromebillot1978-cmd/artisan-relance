export type QuoteStatus = "pending" | "signed" | "lost";
export type ScheduledEmailStatus = "pending" | "processing" | "sent" | "cancelled" | "failed";
export type EmailType = "quote_reminder_1" | "quote_reminder_2";

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

export interface Quote {
  id: string;
  user_id: string;
  reference: string | null;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  amount: number;
  quote_date: string;
  status: QuoteStatus;
  notes: string | null;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduledEmail {
  id: string;
  quote_id: string;
  user_id: string;
  send_date: string;
  email_type: EmailType;
  status: ScheduledEmailStatus;
  attempts: number;
  last_error: string | null;
  provider_id: string | null;
  claimed_at: string | null;
  sent_at: string | null;
  created_at: string;
}

export type QuoteWithEmails = Quote & {
  scheduled_emails: Pick<ScheduledEmail, "id" | "send_date" | "email_type" | "status" | "sent_at">[];
};

/** Ligne renvoyée par la fonction SQL claim_due_emails() */
export interface DueEmail {
  id: string;
  email_type: EmailType;
  attempts: number;
  quote_id: string;
  reference: string | null;
  client_name: string;
  client_email: string;
  amount: number;
  quote_date: string;
  company_name: string;
  contact_name: string | null;
  phone: string | null;
  user_email: string;
  reply_to_email: string | null;
}
