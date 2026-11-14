import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const FAQ_ITEMS = [
  {
    q: "Comment fonctionnent les relances ?",
    a: "Vous envoyez votre devis depuis l'application (PDF joint) et choisissez la stratégie : tous les 3, 7, 14 ou 30 jours, ou un intervalle personnalisé, avec un nombre maximum de relances et une date ou une durée de fin. Les relances partent ensuite toutes seules, du lundi au samedi entre 8 h et 19 h.",
  },
  {
    q: "Que se passe-t-il quand le client répond ?",
    a: "Les relances s'arrêtent automatiquement et sa réponse vous est transférée par e-mail : vous lui répondez directement depuis votre messagerie. Vous pouvez aussi marquer le dossier gagné ou perdu en un clic.",
  },
  {
    q: "Mes clients voient-ils que c'est automatique ?",
    a: "Non. L'e-mail est envoyé au nom de votre entreprise, avec votre signature et le message que vous avez rédigé. Chaque relance est une réponse au premier e-mail, comme si vous l'aviez écrite vous-même.",
  },
  {
    q: "Dois-je changer de logiciel de devis ?",
    a: "Non. Vous continuez à faire vos devis avec votre outil habituel, vous exportez le PDF et vous le joignez ici. Si vous avez déjà envoyé le devis vous-même, vous pouvez simplement l'enregistrer : seules les relances partiront.",
  },
  {
    q: "Quels fichiers puis-je joindre ?",
    a: "Jusqu'à 5 fichiers par devis : PDF en priorité, mais aussi JPG, PNG, DOCX ou XLSX. 10 Mo maximum par fichier, 20 Mo au total. Ils sont stockés de façon privée et ne sont accessibles qu'à vous.",
  },
  {
    q: "Puis-je suspendre ou arrêter une campagne ?",
    a: "Oui, à tout moment : suspendre, reprendre, arrêter définitivement ou modifier la fréquence. Le calendrier se recalcule tout seul.",
  },
  {
    q: "Mes données sont-elles en sécurité ?",
    a: "Les données sont hébergées en Europe (Supabase, Zurich), chaque compte est strictement isolé, et nous ne revendons aucune donnée. Vous pouvez supprimer un dossier et ses fichiers à tout moment.",
  },
  {
    q: "Combien ça coûte ?",
    a: "L'application est gratuite pendant la phase de lancement. Aucune carte bancaire n'est demandée. Vous serez prévenu bien avant l'arrivée d'une offre payante.",
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
