/**
 * Historique d'un prospect — même présentation que l'historique d'un dossier de devis
 * (components/campaigns/campaign-timeline.tsx) : frise verticale, icône par type, date, détail.
 */
import { AlertTriangle, CheckCircle2, CircleDot, MessageCircleReply, Send, ShieldCheck, Settings2 } from "lucide-react";
import { formatDateTime } from "@/lib/campaigns/constants";
import type { ProspectEvent } from "@/lib/prospects";
import { cn } from "@/lib/utils";

export const PROSPECT_EVENT_LABELS: Record<string, string> = {
  prospect_cree: "Fiche créée",
  fiche_modifiee: "Fiche modifiée",
  message_valide: "Message validé",
  envoi_serveur_demande: "Envoi demandé (Valider et envoyer)",
  envoi_serveur_accepte: "E-mail envoyé",
  envoi_serveur_echec: "Échec de l'envoi",
  envoi_prouve: "Réception prouvée (copie de contrôle reçue)",
  envoi_prouve_mauvais_expediteur: "Réception prouvée, mais depuis un AUTRE compte",
  liens_reecrits: "ALERTE : liens réécrits dans l'e-mail reçu",
  reponse_recue: "Réponse reçue du prospect",
  reponse_automatique: "Réponse automatique reçue",
  stop_recu: "Le prospect a demandé l'arrêt (STOP)",
  message_non_authentifie: "Message non authentifié reçu",
  reponse_demandee: "Votre réponse : envoi demandé",
  reponse_envoyee: "Votre réponse envoyée au prospect",
  reponse_echec: "Échec de l'envoi de votre réponse",
  tentative_ouverte: "Tentative de contact commencée",
  tentative_declaree: "Action déclarée par vous",
  tentative_annulee: "Tentative annulée",
  declaration_retiree: "Déclaration retirée",
  tentative_echouee: "Échec signalé",
  brouillon_ouvert: "Brouillon / outil ouvert",
  reponse_enregistree: "Réponse enregistrée à la main",
  ne_plus_contacter: "Opposition enregistrée (ne plus contacter)",
  notes_modifiees: "Notes modifiées",
  prochaine_action: "Prochaine action planifiée",
  archive: "Archivé",
  desarchive: "Désarchivé",
  reprise_v2: "Reprise des anciennes données",
  conversation_effacee: "Conversation effacée",
};

function iconFor(type: string) {
  if (type === "envoi_serveur_accepte" || type === "reponse_envoyee") return { Icon: Send, tone: "text-brand" };
  if (type === "envoi_prouve") return { Icon: ShieldCheck, tone: "text-success" };
  if (type.endsWith("_echec") || type === "liens_reecrits" || type === "envoi_prouve_mauvais_expediteur" || type === "message_non_authentifie")
    return { Icon: AlertTriangle, tone: "text-destructive" };
  if (type === "reponse_recue") return { Icon: MessageCircleReply, tone: "text-sky-500" };
  if (type === "reponse_automatique" || type === "stop_recu") return { Icon: MessageCircleReply, tone: "text-muted-foreground" };
  if (type === "message_valide") return { Icon: CheckCircle2, tone: "text-success" };
  if (type === "fiche_modifiee" || type === "prochaine_action") return { Icon: Settings2, tone: "text-muted-foreground" };
  return { Icon: CircleDot, tone: "text-muted-foreground" };
}

function describe(e: ProspectEvent) {
  const d = (e.detail ?? {}) as Record<string, unknown>;
  const s = (v: unknown) => (v == null ? "" : String(v));
  switch (e.type) {
    case "envoi_serveur_demande":
      return d.destinataire ? `À ${s(d.destinataire)}` : null;
    case "envoi_serveur_accepte":
      return [d.reponse_smtp && `Gmail : ${s(d.reponse_smtp).slice(0, 80)}`, d.duree_ms != null && `${s(d.duree_ms)} ms`,
        Array.isArray(d.liens_envoyes) && `liens : ${(d.liens_envoyes as string[]).join(", ")}`].filter(Boolean).join(" · ") || null;
    case "envoi_serveur_echec":
    case "reponse_echec":
      return s(d.erreur) || null;
    case "envoi_prouve":
    case "envoi_prouve_mauvais_expediteur":
      return [`De ${s(d.expediteur)}`, d.contenu && `contenu ${s(d.contenu)}`,
        d.reecriture_detectee === false && "liens reçus directs", d.reecriture_detectee === true && "LIENS RÉÉCRITS"].filter(Boolean).join(" · ");
    case "liens_reecrits":
      return Array.isArray(d.liens_recus) ? `Reçus : ${(d.liens_recus as string[]).join(", ")}` : null;
    case "reponse_recue":
    case "reponse_automatique":
    case "stop_recu":
    case "message_non_authentifie":
      return `De ${s(d.from)}${d.subject ? ` — « ${s(d.subject)} »` : ""}${d.unexpected_sender ? " · expéditeur différent de l'adresse du prospect" : ""}`;
    case "reponse_demandee":
      return d.destinataire ? `À ${s(d.destinataire)}` : null;
    case "reponse_envoyee":
      return d.reponse_smtp ? `Gmail : ${s(d.reponse_smtp).slice(0, 80)}` : null;
    case "conversation_effacee":
      return d.messages != null ? `${s(d.messages)} message(s) supprimé(s)` : null;
    default:
      return typeof d.raison === "string" ? d.raison : null;
  }
}

export function ProspectTimeline({ events }: { events: ProspectEvent[] }) {
  return (
    <ol className="relative space-y-4 border-l pl-6">
      {[...events].sort((a, b) => a.id - b.id).reverse().map((e) => {
        const { Icon, tone } = iconFor(e.type);
        const text = describe(e);
        return (
          <li key={e.id} className="relative">
            <span className="absolute -left-[34px] flex h-6 w-6 items-center justify-center rounded-full border bg-background">
              <Icon className={cn("h-3.5 w-3.5", tone)} />
            </span>
            <p className="text-sm font-medium">
              {PROSPECT_EVENT_LABELS[e.type] ?? e.type}
              {e.actor === "reception" && <span className="font-normal text-muted-foreground"> (automatique)</span>}
            </p>
            <p className="text-xs text-muted-foreground">{formatDateTime(e.created_at)}</p>
            {text && <p className="mt-0.5 break-words text-xs text-muted-foreground">{text}</p>}
          </li>
        );
      })}
    </ol>
  );
}
