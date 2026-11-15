/**
 * Témoignages clients : uniquement de VRAIS retours, avec l'accord écrit de l'artisan.
 * Tant que la liste est vide, la section n'apparaît pas sur le site.
 * Champs : prénom + initiale, métier, ville (facultatif), citation exacte, date.
 */
export interface Testimonial {
  name: string;
  trade: string;
  city?: string;
  quote: string;
  date: string; // AAAA-MM-JJ
}

export const TESTIMONIALS: Testimonial[] = [];
