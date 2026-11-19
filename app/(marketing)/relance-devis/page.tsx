import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { METIERS } from "@/lib/content/metiers";
import { pageMetadata } from "@/lib/seo";
import { CtaBlock } from "@/components/marketing/cta-block";
import { FaqList } from "@/components/marketing/faq-list";
import { BreadcrumbJsonLd, CollectionJsonLd, FaqJsonLd, type QA } from "@/components/seo/json-ld";

const DESCRIPTION =
  "Calendrier de relance, modèles de mail et conseils adaptés à votre métier : plombier, électricien, couvreur, chauffagiste, peintre, menuisier.";

export const metadata = pageMetadata({
  title: "Relance de devis par métier du bâtiment — Artisan Relance",
  description: DESCRIPTION,
  path: "/relance-devis",
});

/** Synthèse des rythmes de relance : reprend les calendriers détaillés de chaque page métier. */
const RHYTHMS: { slug: string; devis: string; first: string; next: string; key: string }[] = [
  { slug: "plombier", devis: "Chauffe-eau, salle de bain, réseau", first: "J+3 (chauffe-eau) à J+5 (salle de bain)", next: "J+7 à J+12, clôture vers J+25", key: "Date de démarrage et durée sans salle de bain" },
  { slug: "electricien", devis: "Mise aux normes, rénovation, borne", first: "J+4 (borne) à J+7 (rénovation)", next: "J+10 à J+15, puis J+30", key: "Expliquer le diagnostic sans faire peur" },
  { slug: "couvreur", devis: "Réparation, réfection, isolation", first: "J+3 (fuite) à J+7 (réfection)", next: "Toutes les deux semaines (J+21, J+35)", key: "Saison, assurance et date de chantier" },
  { slug: "chauffagiste", devis: "Chaudière, pompe à chaleur, clim", first: "J+2 (panne) à J+7 (projet)", next: "Toutes les deux semaines, 4 au maximum", key: "Avancement du dossier d'aide" },
  { slug: "peintre", devis: "Intérieur, ravalement, revêtements", first: "J+3", next: "J+7 avec un créneau, J+12 pour la déco", key: "Détail de la préparation des supports" },
  { slug: "menuisier", devis: "Fenêtres, portes, agencement", first: "J+5 à J+7", next: "J+15 puis clôture vers J+30", key: "Délai de fabrication avant la pose" },
  { slug: "renovation", devis: "Pièce, appartement, maison", first: "J+5", next: "J+12 à J+14, J+30, clôture vers J+45", key: "Phasage et planning des corps d'état" },
];

const HUB_FAQ: QA[] = [
  {
    q: "Pourquoi le rythme de relance change-t-il selon le métier ?",
    a: "Parce que la durée de réflexion du client dépend du montant, de l'urgence et des tiers impliqués. Un dépannage se décide en quelques jours ; une toiture ou une pompe à chaleur avec dossier d'aide, en plusieurs semaines.",
  },
  {
    q: "Mon métier n'a pas de page dédiée : quel calendrier suivre ?",
    a: "Prenez le métier le plus proche par le montant et l'urgence : un maçon ou un carreleur suivra le rythme de la rénovation, un serrurier celui du plombier pour les petits travaux. Les principes généraux sont dans le guide « quand relancer un devis ».",
  },
  {
    q: "Peut-on régler un rythme différent pour chaque devis ?",
    a: "Oui. Avec Artisan Relance, l'intervalle, le nombre maximum de relances et la date de fin se règlent devis par devis : un dépannage et une réfection complète peuvent suivre deux calendriers différents.",
  },
];

export default function RelanceDevisHub() {
  const bySlug = new Map(METIERS.map((m) => [m.slug, m]));
  return (
    <section className="container max-w-4xl py-12 md:py-16">
      <BreadcrumbJsonLd items={[{ name: "Accueil", path: "/" }, { name: "Relance de devis par métier", path: "/relance-devis" }]} />
      <CollectionJsonLd
        path="/relance-devis"
        name="Relance de devis par métier du bâtiment"
        description={DESCRIPTION}
        items={METIERS.map((m) => ({ name: `Relance de devis pour ${m.metier}`, path: `/relance-devis/${m.slug}` }))}
      />
      <FaqJsonLd items={HUB_FAQ} />
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Relance de devis par métier du bâtiment</h1>
      <div className="mt-4 max-w-2xl space-y-4 text-muted-foreground">
        <p>
          Un devis de toiture ne se relance pas comme un devis de peinture. Le montant, l'urgence, la saison et les tiers qui
          interviennent dans la décision (assurance, banque, aide à la rénovation, copropriété) changent le bon moment pour
          relancer, le nombre de messages et ce qu'il faut y écrire.
        </p>
        <p>
          Chaque page métier rassemble un calendrier de relance détaillé, des modèles de mail et de SMS, des exemples de
          chantiers réels, les erreurs propres au métier et une FAQ dédiée. Le tableau ci-dessous en donne la synthèse.
        </p>
      </div>

      <h2 className="mt-12 text-2xl font-semibold tracking-tight">Choisissez votre métier</h2>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {METIERS.map((m) => (
          <li key={m.slug}>
            <Link href={`/relance-devis/${m.slug}`} className="flex h-full flex-col rounded-xl border bg-card p-5 hover:bg-muted/40">
              <span className="flex items-center justify-between font-medium">
                Relance de devis pour {m.metier}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </span>
              <span className="mt-2 text-sm text-muted-foreground">{m.description}</span>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mt-14 text-2xl font-semibold tracking-tight">Le rythme de relance conseillé, métier par métier</h2>
      <p className="mt-2 text-muted-foreground">
        Délais comptés à partir de l'envoi du devis. Le premier chiffre vaut pour les petits travaux ou les urgences, le
        second pour les projets.
      </p>
      <div className="mt-5 overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <caption className="sr-only">Calendrier de relance de devis par métier du bâtiment</caption>
          <thead className="bg-muted/50">
            <tr>
              <th scope="col" className="p-3 font-medium">Métier</th>
              <th scope="col" className="p-3 font-medium">Devis typiques</th>
              <th scope="col" className="p-3 font-medium">1re relance</th>
              <th scope="col" className="p-3 font-medium">Ensuite</th>
              <th scope="col" className="p-3 font-medium">Ce qui fait signer</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {RHYTHMS.map((r) => {
              const m = bySlug.get(r.slug);
              if (!m) return null;
              return (
                <tr key={r.slug}>
                  <th scope="row" className="p-3 font-medium">
                    <Link href={`/relance-devis/${r.slug}`} className="underline underline-offset-4">{m.short}</Link>
                  </th>
                  <td className="p-3 text-muted-foreground">{r.devis}</td>
                  <td className="p-3 text-muted-foreground">{r.first}</td>
                  <td className="p-3 text-muted-foreground">{r.next}</td>
                  <td className="p-3 text-muted-foreground">{r.key}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 className="mt-14 text-2xl font-semibold tracking-tight">Les règles communes à tous les métiers</h2>
      <ul className="mt-4 space-y-2 text-muted-foreground">
        <li>Envoyer le devis dans les 48 heures après le rendez-vous, pendant que la visite est encore fraîche.</li>
        <li>Apporter une information nouvelle à chaque relance : une date, une variante, une précision technique.</li>
        <li>Fixer un nombre maximum de relances et une date de fin dès l'envoi.</li>
        <li>Arrêter immédiatement dès que le client répond ou demande d'arrêter.</li>
        <li>Garder le téléphone pour les gros devis restés sans réponse après deux relances écrites.</li>
      </ul>
      <p className="mt-4 text-muted-foreground">
        Ces règles sont détaillées dans les guides{" "}
        <Link href="/guides/quand-relancer-un-devis" className="underline underline-offset-4">quand relancer un devis</Link>,{" "}
        <Link href="/guides/combien-de-relances-devis" className="underline underline-offset-4">combien de relances envoyer</Link> et{" "}
        <Link href="/guides/relancer-devis-sans-harceler" className="underline underline-offset-4">relancer sans harceler</Link>.
      </p>

      <h2 className="mt-14 mb-5 text-2xl font-semibold tracking-tight">Questions sur la relance par métier</h2>
      <FaqList items={HUB_FAQ} />

      <div className="mt-14">
        <CtaBlock title="Votre métier n'est pas dans la liste ?" text="Artisan Relance fonctionne pour tous les artisans et indépendants qui envoient des devis : maçon, plaquiste, carreleur, paysagiste, serrurier…" />
      </div>
    </section>
  );
}
