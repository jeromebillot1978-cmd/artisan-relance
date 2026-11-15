import type { MetierKit } from "@/lib/content/metier-kits";
import { RelanceGenerator } from "@/components/marketing/relance-generator";
import { RoiSimulator } from "@/components/marketing/roi-simulator";

function Message({ label, subject, body }: { label: string; subject?: string; body: string }) {
  return (
    <figure className="overflow-hidden rounded-xl border">
      <figcaption className="border-b bg-muted/50 px-4 py-2 text-xs font-medium">{label}</figcaption>
      <div className="p-4 text-sm">
        {subject && (
          <p>
            <span className="text-muted-foreground">Objet :</span> {subject}
          </p>
        )}
        <p className={`${subject ? "mt-3 " : ""}whitespace-pre-line text-muted-foreground`}>{body}</p>
      </div>
    </figure>
  );
}

/** Kit de relance d'un métier : délais, modèles e-mail et SMS, erreurs, générateur, simulateur. */
export function MetierKitSection({ kit, metier }: { kit: MetierKit; metier: string }) {
  return (
    <div className="mt-10 space-y-12 leading-relaxed">
      <section id="delais">
        <h2 className="text-2xl font-semibold tracking-tight">Les délais idéaux pour relancer</h2>
        <p className="mt-3 text-muted-foreground">Comptés à partir du jour d'envoi du devis. Adaptez-les à la taille du chantier.</p>
        <div className="mt-5 overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">Quand</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Quoi</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Canal</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {kit.delays.map((d) => (
                <tr key={d.moment + d.action}>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums">{d.moment}</td>
                  <td className="px-4 py-3 text-muted-foreground">{d.action}</td>
                  <td className="whitespace-nowrap px-4 py-3">{d.channel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="modeles-email">
        <h2 className="text-2xl font-semibold tracking-tight">3 modèles d'e-mail de relance</h2>
        <p className="mt-3 text-muted-foreground">
          Remplacez les mots entre accolades. Dans Artisan Relance, ces variables sont remplies automatiquement.
        </p>
        <div className="mt-5 grid gap-4">
          {kit.emails.map((m) => (
            <Message key={m.label} {...m} />
          ))}
        </div>
      </section>

      <section id="modeles-sms">
        <h2 className="text-2xl font-semibold tracking-tight">3 modèles de SMS de relance</h2>
        <p className="mt-3 text-muted-foreground">
          À envoyer depuis votre téléphone, en complément des e-mails : moins de 160 caractères, signés, sans lien.
          Artisan Relance programme les relances par e-mail.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {kit.sms.map((m) => (
            <Message key={m.label} {...m} />
          ))}
        </div>
      </section>

      <section id="erreurs">
        <h2 className="text-2xl font-semibold tracking-tight">Les erreurs à éviter</h2>
        <ol className="mt-5 space-y-3">
          {kit.mistakes.map((m, i) => (
            <li key={m} className="flex gap-3 rounded-lg border bg-card p-4 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-xs font-semibold text-destructive">{i + 1}</span>
              <span className="text-muted-foreground">{m}</span>
            </li>
          ))}
        </ol>
      </section>

      <section id="generateur">
        <h2 className="text-2xl font-semibold tracking-tight">Générateur de relance gratuit</h2>
        <p className="mt-3 mb-5 text-muted-foreground">
          Choisissez les travaux, le numéro de relance et le canal : votre message est prêt à copier. Rien n'est enregistré.
        </p>
        <RelanceGenerator works={kit.works} metier={metier} />
      </section>

      <section id="simulateur">
        <h2 className="text-2xl font-semibold tracking-tight">Ce que vos relances peuvent rapporter</h2>
        <p className="mt-3 mb-5 text-muted-foreground">
          Pas de statistique inventée : entrez vos propres chiffres et votre hypothèse.
        </p>
        <RoiSimulator />
      </section>
    </div>
  );
}
