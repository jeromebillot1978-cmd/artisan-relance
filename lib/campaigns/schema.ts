import { z } from "zod";
import { ATTACHMENT_RULES, MAX_RECIPIENTS } from "@/lib/campaigns/constants";
import { emailIssue } from "@/lib/email-check";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Adresse e-mail invalide.")
  .superRefine((value, ctx) => {
    const issue = emailIssue(value);
    if (issue) ctx.addIssue({ code: "custom", message: issue });
  });

export const strategySchema = z
  .object({
    followupEnabled: z.boolean(),
    intervalDays: z.number().int().min(1, "1 jour minimum.").max(90, "90 jours maximum."),
    maxFollowups: z.number().int().min(1, "1 relance minimum.").max(20, "20 relances maximum."),
    endMode: z.enum(["none", "days", "date"]),
    maxDays: z.number().int().min(1).max(365).nullable(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    attachOnFollowups: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.endMode === "days" && !v.maxDays) ctx.addIssue({ code: "custom", path: ["maxDays"], message: "Indiquez une durée." });
    if (v.endMode === "date" && !v.endDate) ctx.addIssue({ code: "custom", path: ["endDate"], message: "Indiquez une date." });
  });

export const campaignSchema = z
  .object({
    idempotencyKey: z.string().uuid(),
    // compte affiché dans le formulaire : refus si la session a changé entre-temps (autre onglet)
    expectedUserId: z.string().uuid().optional(),
    prospectName: z.string().trim().min(2, "Nom du client requis.").max(120),
    recipients: z
      .array(email)
      .min(1, "Au moins un destinataire.")
      .max(MAX_RECIPIENTS, `${MAX_RECIPIENTS} destinataires maximum.`)
      .transform((list) => Array.from(new Set(list))),
    reference: z.string().trim().max(50).optional().transform((v) => v || null),
    amount: z.number().min(0).max(10_000_000),
    clientPhone: z.string().trim().max(30).optional().transform((v) => v || null),
    notes: z.string().trim().max(1000).optional().transform((v) => v || null),
    subject: z.string().trim().min(3, "Objet requis.").max(200),
    message: z.string().trim().min(10, "Message trop court.").max(5000),
    followupMessage: z.string().trim().min(10, "Message de relance trop court.").max(5000),
    sendInitial: z.boolean(),
    initialSentAt: z.string().datetime({ offset: true }).nullable(),
    attachments: z
      .array(z.object({ path: z.string().min(3), name: z.string().min(1).max(200) }))
      .max(ATTACHMENT_RULES.maxFiles, `${ATTACHMENT_RULES.maxFiles} fichiers maximum.`),
    strategy: strategySchema,
  })
  .superRefine((v, ctx) => {
    if (v.sendInitial && v.attachments.length === 0) {
      ctx.addIssue({ code: "custom", path: ["attachments"], message: "Joignez votre devis (PDF) avant l'envoi." });
    }
    if (!v.sendInitial && !v.initialSentAt) {
      ctx.addIssue({ code: "custom", path: ["initialSentAt"], message: "Indiquez quand le devis a été envoyé." });
    }
  });

export type CampaignInput = z.input<typeof campaignSchema>;
export type StrategyFormInput = z.input<typeof strategySchema>;
