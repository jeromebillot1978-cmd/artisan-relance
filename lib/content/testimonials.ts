/**
 * Témoignages clients : uniquement de VRAIS retours, avec l'accord écrit de l'artisan.
 * Tant que la liste est vide, aucune section ni aucun balisage Review n'apparaît sur le site
 * (un avis inventé est trompeur pour les visiteurs, et pénalisé par Google).
 *
 * Pour en ajouter un : copier l'exemple ci-dessous dans TESTIMONIALS, avec la citation EXACTE.
 * {
 *   name: "Karim B.",                 // prénom + initiale (ou nom complet si l'artisan l'accepte)
 *   trade: "Plombier chauffagiste",
 *   company: "KB Plomberie",          // facultatif
 *   city: "Saint-Quentin",            // facultatif
 *   quote: "…",                       // citation exacte, telle qu'écrite par l'artisan
 *   result: "4 devis signés en 1 mois", // facultatif : résultat déclaré par l'artisan
 *   rating: 5,                        // facultatif : note sur 5 donnée par l'artisan
 *   date: "2026-12-15",               // AAAA-MM-JJ, date du témoignage
 * }
 */
export interface Testimonial {
  name: string;
  trade: string;
  company?: string;
  city?: string;
  quote: string;
  result?: string;
  rating?: 1 | 2 | 3 | 4 | 5;
  date: string; // AAAA-MM-JJ
}

export const TESTIMONIALS: Testimonial[] = [];
