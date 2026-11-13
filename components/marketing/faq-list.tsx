import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const FAQ_ITEMS = [
  {
    q: "Comment fonctionnent les relances ?",
    a: "Quand vous ajoutez un devis, deux e-mails de relance sont programmés automatiquement : le premier 4 jours après la date du devis, le second 10 jours après. Ils partent chaque matin, à votre nom, tant que le devis n'est pas marqué comme signé ou perdu.",
  },
  {
    q: "Mes clients voient-ils que c'est automatique ?",
    a: "Non. L'e-mail est signé avec le nom de votre entreprise, vos coordonnées, et rédigé sur un ton naturel. Quand le client répond, sa réponse arrive directement dans votre boîte mail.",
  },
  {
    q: "Que se passe-t-il quand le client signe ?",
    a: "Vous cliquez sur « Marquer comme signé » (1 clic, depuis votre téléphone). Toutes les relances restantes sont annulées immédiatement.",
  },
  {
    q: "Dois-je changer de logiciel de devis ?",
    a: "Non. Vous continuez à faire vos devis avec votre outil habituel. Artisan Relance s'occupe uniquement du suivi : vous saisissez le nom du client, son e-mail, le montant et la date. Moins de 30 secondes.",
  },
  {
    q: "Et si j'ajoute un devis envoyé il y a plusieurs jours ?",
    a: "Seules les relances dont la date n'est pas encore passée sont programmées. Un devis envoyé il y a 6 jours recevra donc uniquement la relance J+10.",
  },
  {
    q: "Mes données sont-elles en sécurité ?",
    a: "Les données sont hébergées chez Supabase (infrastructure en Europe selon la région choisie), chaque compte est strictement isolé, et nous ne revendons aucune donnée. Vous pouvez supprimer un devis à tout moment.",
  },
  {
    q: "Combien ça coûte ?",
    a: "L'application est gratuite pendant la phase de lancement. Aucune carte bancaire n'est demandée. Vous serez prévenu bien avant l'arrivée d'une offre payante.",
  },
  {
    q: "Puis-je personnaliser le contenu des e-mails ?",
    a: "Les e-mails reprennent automatiquement le nom de votre entreprise, le nom du contact et votre téléphone renseignés dans les paramètres. La personnalisation complète du texte arrive prochainement.",
  },
];

export function FaqList({ items = FAQ_ITEMS }: { items?: typeof FAQ_ITEMS }) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {items.map((item, i) => (
        <AccordionItem key={item.q} value={`item-${i}`}>
          <AccordionTrigger className="text-base">{item.q}</AccordionTrigger>
          <AccordionContent>{item.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
