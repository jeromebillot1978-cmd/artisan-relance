/**
 * Registre des automatisations.
 *
 * Point d'extension unique : pour ajouter plus tard les SMS, les avis Google
 * ou les relances de factures, on ajoute ici une entrée (+ une ligne dans la
 * table SQL `reminder_steps` et un template dans `lib/email/templates`).
 */

export type AutomationKey =
  | "quote_follow_up" // relance des devis (actif)
  | "google_review" // demande d'avis Google (à venir)
  | "invoice_follow_up" // relance des factures (à venir)
  | "maintenance_reminder"; // rappel d'entretien annuel (à venir)

export type Channel = "email" | "sms";

export interface AutomationDefinition {
  key: AutomationKey;
  label: string;
  description: string;
  channels: Channel[];
  available: boolean;
}

export const AUTOMATIONS: AutomationDefinition[] = [
  {
    key: "quote_follow_up",
    label: "Relance des devis",
    description: "Deux relances e-mail automatiques à J+4 et J+10 tant que le devis n'est pas signé.",
    channels: ["email"],
    available: true,
  },
  {
    key: "google_review",
    label: "Avis Google",
    description: "Demande d'avis envoyée automatiquement après le chantier.",
    channels: ["email", "sms"],
    available: false,
  },
  {
    key: "invoice_follow_up",
    label: "Relance des factures",
    description: "Relances échelonnées des factures impayées.",
    channels: ["email", "sms"],
    available: false,
  },
  {
    key: "maintenance_reminder",
    label: "Rappel d'entretien",
    description: "Rappel annuel aux clients (chaudière, PAC, climatisation…).",
    channels: ["email", "sms"],
    available: false,
  },
];

/** Étapes de relance de devis — doivent correspondre à la table `reminder_steps`. */
export const QUOTE_REMINDER_STEPS = [
  { emailType: "quote_reminder_1", delayDays: 4, label: "Relance J+4" },
  { emailType: "quote_reminder_2", delayDays: 10, label: "Relance J+10" },
] as const;

export function reminderLabel(emailType: string) {
  return QUOTE_REMINDER_STEPS.find((s) => s.emailType === emailType)?.label ?? emailType;
}
