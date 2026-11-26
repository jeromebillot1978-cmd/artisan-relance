import type { Metadata } from "next";
import HomePage from "../page";
import { pageMetadata } from "@/lib/seo";

/**
 * Page d'arrivée des e-mails de prospection : https://artisan-relance.jercat.fr/artisans
 *
 * Même contenu que l'accueil, mais une adresse à part : ses visites apparaissent
 * séparément dans Vercel Analytics (onglet Pages), ce qui mesure ce que la prospection
 * amène, SANS paramètre de suivi ni redirection dans le lien de l'e-mail.
 *
 * Non indexée (et adresse canonique « / ») : Google ne voit pas de contenu en double.
 */
export const metadata: Metadata = {
  ...pageMetadata({
    title: "Logiciel de relance de devis pour artisans | Artisan Relance",
    ogTitle: "Artisan Relance — vos devis deviennent des chantiers signés",
    description:
      "Gardez votre logiciel de devis : Artisan Relance envoie vos devis, relance vos clients automatiquement et s'arrête dès qu'ils répondent. Gratuit, rapide en 4G.",
    path: "/",
  }),
  robots: { index: false, follow: true },
};

export default HomePage;
