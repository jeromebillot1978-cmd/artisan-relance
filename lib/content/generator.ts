/**
 * Générateur de messages de relance (pages métiers) : TypeScript pur, sans
 * dépendance, exécuté dans le navigateur. Aucune donnée n'est envoyée.
 */
export type GenChannel = "email" | "sms";
export type GenTone = "cordial" | "direct";

export interface GenInput {
  client: string;
  entreprise: string;
  travaux: string;
  dateDevis: string; // AAAA-MM-JJ
  numero: 1 | 2 | 3;
  canal: GenChannel;
  ton: GenTone;
}

function dateFr(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime())
    ? "récemment"
    : new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(d);
}

export function generateRelance(i: GenInput): { subject?: string; body: string } {
  const client = i.client.trim() || "Madame, Monsieur";
  const ent = i.entreprise.trim() || "votre artisan";
  const travaux = i.travaux.trim() || "vos travaux"; // avec son article : « la rénovation de… »
  const date = dateFr(i.dateDevis);
  const hello = i.ton === "cordial" ? `Bonjour ${client},` : `Bonjour ${client},`;

  if (i.canal === "sms") {
    const sms = {
      1: `Bonjour ${client}, ${ent} ici. Je vous ai envoyé le devis pour ${travaux} le ${date}. Une question ? Je reste disponible.`,
      2:
        i.ton === "cordial"
          ? `Bonjour ${client}, j'ai une disponibilité prochainement pour ${travaux}. Voulez-vous que je vous réserve des dates ? ${ent}`
          : `Bonjour ${client}, pour ${travaux} je peux démarrer bientôt. On valide les dates ? ${ent}`,
      3: `Bonjour ${client}, sans nouvelles de votre part, je mets votre dossier en pause. Le devis reste valable, n'hésitez pas à me recontacter. ${ent}`,
    } as const;
    return { body: sms[i.numero] };
  }

  const subject = i.numero === 1 ? `Votre devis pour ${travaux} — envoyé le ${date}` : `Re: votre devis pour ${travaux}`;
  const bodies = {
    1:
      i.ton === "cordial"
        ? `${hello}\n\nAvez-vous pu prendre connaissance du devis pour ${travaux} que je vous ai envoyé le ${date} ?\n\nSi un point vous semble flou, je vous l'explique volontiers en quelques minutes, par téléphone ou sur place. Je peux aussi adapter le devis à votre budget.\n\nBonne journée,\n${ent}`
        : `${hello}\n\nJe reviens vers vous au sujet du devis pour ${travaux} envoyé le ${date}.\n\nAvez-vous des questions avant de vous décider ? Je reste disponible.\n\nCordialement,\n${ent}`,
    2:
      i.ton === "cordial"
        ? `${hello}\n\nPour vous aider à vous projeter : à ce jour, je pourrais démarrer ${travaux} dans les prochaines semaines.\n\nSi vous souhaitez une variante ou un phasage, dites-le-moi : on trouve souvent une solution.\n\nBien cordialement,\n${ent}`
        : `${hello}\n\nMon planning se remplit pour les prochaines semaines. Si vous souhaitez que les travaux soient réalisés bientôt, c'est le bon moment pour valider le devis.\n\nCordialement,\n${ent}`,
    3: `${hello}\n\nSans nouvelles de votre part, je suppose que le projet est reporté ou confié à un autre professionnel, ce que je comprends tout à fait.\n\nLe devis reste valable jusqu'à sa date d'échéance si vous souhaitez y revenir.\n\nBien cordialement,\n${ent}`,
  } as const;
  return { subject, body: bodies[i.numero] };
}
