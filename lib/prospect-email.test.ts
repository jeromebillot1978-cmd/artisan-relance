// Tests : node --experimental-strip-types lib/prospect-email.test.ts
import { assertDirectLinks, buildProspectEmail, extractHrefs } from "./prospect-email.ts";

let ok = 0, ko = 0;
const t = (name: string, got: unknown, exp: unknown) => {
  const pass = JSON.stringify(got) === JSON.stringify(exp);
  if (pass) ok++;
  else ko++;
  console.log(`${pass ? "OK " : "KO "} ${name}${pass ? "" : `  → obtenu ${JSON.stringify(got)}, attendu ${JSON.stringify(exp)}`}`);
};
const A = "https://artisan-relance.jercat.fr/", V = "https://pubartisanrelance.vercel.app/";
const msg = `Bonjour,\n\nLe principe en vidéo, en 15 secondes : ${V}\n\nPour essayer : ${A}\n\nJercat — jercat.bilman@gmail.com\n\nPour ne plus recevoir de message de ma part, répondez « stop ».`;
const e = buildProspectEmail("Vos devis", msg);

t("href directs, exactement les deux adresses", e.hrefs, [V, A]);
t("balise <a> directe pour l'essai", e.html.includes(`<a href="${A}" style="color:#1d4ed8;">${A}</a>`), true);
t("balise <a> directe pour la vidéo", e.html.includes(`<a href="${V}" style="color:#1d4ed8;">${V}</a>`), true);
t("aucun google.com/url dans le HTML", /google\.[a-z.]+\/url/i.test(e.html), false);
t("aucun google.com/url dans le texte", /google\.[a-z.]+\/url/i.test(e.text), false);
t("extraction = liens construits", extractHrefs(e.html), [V, A]);
t("contrôle avant envoi accepte", assertDirectLinks(e.html), [V, A]);
t("texte brut garde les adresses exactes", e.text.includes(V) && e.text.includes(A), true);
t("ligne stop en dernier dans le texte", e.text.endsWith("répondez « stop »."), true);

const g = buildProspectEmail("x", "Vidéo : https://www.google.com/url?q=https://pubartisanrelance.vercel.app/&source=gmail&sa=E");
t("redirection Google saisie → lien d'origine", g.hrefs, [V]);
t("adresse sans barre → exacte", buildProspectEmail("x", "Essai : https://artisan-relance.jercat.fr.").hrefs, [A]);
t("ponctuation finale hors du lien", buildProspectEmail("x", "Voir https://dev.jercat.fr, merci").hrefs, ["https://dev.jercat.fr"]);

let blocked = false;
try { assertDirectLinks('<a href="https://www.google.com/url?q=https://artisan-relance.jercat.fr/&amp;sa=E">x</a>'); } catch { blocked = true; }
t("contrôle avant envoi bloque une redirection Google", blocked, true);
blocked = false;
try { assertDirectLinks('<a href="https://eur01.safelinks.protection.outlook.com/?url=x">x</a>'); } catch { blocked = true; }
t("contrôle avant envoi bloque Outlook SafeLinks", blocked, true);

t("HTML échappé (pas d'injection)", buildProspectEmail("x", "<script>alert(1)</script>").html.includes("&lt;script&gt;"), true);
t("objet sur une ligne", buildProspectEmail("a\r\nBcc: x@y.z", "m").subject, "a Bcc: x@y.z");
t("guillemet dans une URL ne casse pas l'attribut", buildProspectEmail("x", 'https://a.test/"onmouseover=1').html.includes('href="https://a.test/"'), true);

console.log(`\n${ok} réussis, ${ko} échoués`);
process.exit(ko ? 1 : 0);
