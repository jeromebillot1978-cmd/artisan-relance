/**
 * Registre des automatisations.
 *
 * Point d'extension unique : pour ajouter plus tard les SMS, les avis Google
 * ou les relances de factures, on ajoute ici une entrée (+ une ligne dans la
 * logique SQL et un modèle dans `supabase/functions/_shared/templates.ts`).
 */

export type AutomationKey =
  | "quote_follow_up" // relance des devis (actif)
  | "google_review" // demande d'avis Google (actif)
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
    description: "Envoi du devis avec pièces jointes, puis relances à la fréquence de votre choix, arrêtées en un clic quand le client répond.",
    channels: ["email"],
    available: true,
  },
  {
    key: "google_review",
    label: "Avis Google",
    description: "Demande d'avis envoyée par e-mail quelques jours après « Gagné » ou « Terminé », ou en un clic depuis le devis.",
    channels: ["email"],
    available: true,
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
