// Tests : node --experimental-strip-types lib/prospect-email.test.ts
import { assertDirectLinks, buildProspectEmail, ensureSiteLink, extractHrefs, SITE_LINE } from "./prospect-email.ts";

let ok = 0, ko = 0;
const t = (name: string, got: unknown, exp: unknown) => {
  const pass = JSON.stringify(got) === JSON.stringify(exp);
  if (pass) ok++;
  else ko++;
  console.log(`${pass ? "OK " : "KO "} ${name}${pass ? "" : `  → obtenu ${JSON.stringify(got)}, attendu ${JSON.stringify(exp)}`}`);
};
const A = "https://artisan-relance.jercat.fr/", V = "https://pubartisanrelance.vercel.app/", S = "https://dev.jercat.fr/";
const msg = `Bonjour,\n\nLe principe en vidéo, en 15 secondes : ${V}\n\nPour essayer : ${A}\n\nJercat — jercat.bilman@gmail.com\n\nPour ne plus recevoir de message de ma part, répondez « stop ».`;
const e = buildProspectEmail("Vos devis", msg);

t("href directs : les deux adresses + le site", e.hrefs, [V, A, S]);
t("balise <a> directe pour l'essai", e.html.includes(`<a href="${A}" style="color:#1d4ed8;">${A}</a>`), true);
t("balise <a> directe pour la vidéo", e.html.includes(`<a href="${V}" style="color:#1d4ed8;">${V}</a>`), true);
t("aucun google.com/url dans le HTML", /google\.[a-z.]+\/url/i.test(e.html), false);
t("aucun google.com/url dans le texte", /google\.[a-z.]+\/url/i.test(e.text), false);
t("extraction = liens construits", extractHrefs(e.html), [V, A, S]);
t("contrôle avant envoi accepte", assertDirectLinks(e.html), [V, A, S]);
t("texte brut garde les adresses exactes", e.text.includes(V) && e.text.includes(A), true);
t("ligne stop en dernier dans le texte", e.text.endsWith("répondez « stop »."), true);

const g = buildProspectEmail("x", "Vidéo : https://www.google.com/url?q=https://pubartisanrelance.vercel.app/&source=gmail&sa=E");
t("redirection Google saisie → lien d'origine", g.hrefs, [V, S]);
t("adresse sans barre → exacte", buildProspectEmail("x", "Essai : https://artisan-relance.jercat.fr.").hrefs, [A, S]);
t("ponctuation finale hors du lien", buildProspectEmail("x", "Voir https://exemple.fr/page, merci").hrefs, ["https://exemple.fr/page", S]);
t("site écrit avec ponctuation → normalisé, ponctuation hors du lien", buildProspectEmail("x", "Voir https://dev.jercat.fr, merci").hrefs, [S]);

let blocked = false;
try { assertDirectLinks('<a href="https://www.google.com/url?q=https://artisan-relance.jercat.fr/&amp;sa=E">x</a>'); } catch { blocked = true; }
t("contrôle avant envoi bloque une redirection Google", blocked, true);
blocked = false;
try { assertDirectLinks('<a href="https://eur01.safelinks.protection.outlook.com/?url=x">x</a>'); } catch { blocked = true; }
t("contrôle avant envoi bloque Outlook SafeLinks", blocked, true);

t("HTML échappé (pas d'injection)", buildProspectEmail("x", "<script>alert(1)</script>").html.includes("&lt;script&gt;"), true);
t("objet sur une ligne", buildProspectEmail("a\r\nBcc: x@y.z", "m").subject, "a Bcc: x@y.z");
t("guillemet dans une URL ne casse pas l'attribut", buildProspectEmail("x", 'https://a.test/"onmouseover=1').html.includes('href="https://a.test/"'), true);

// --- Lien vers le site principal https://dev.jercat.fr/ dans CHAQUE e-mail ---
const modele = `Bonjour,\n\nPour voir comment ça marche :\n${A}\n\nLa présentation en vidéo :\n${V}\n\nBonne journée,\nJercat\n07 63 49 49 24\n\nSi vous ne souhaitez plus recevoir de message de ma part, répondez simplement STOP.`;
const em = buildProspectEmail("Vos devis", modele);
t("site : placé juste sous le téléphone (signature)", em.text.includes(`Jercat\n07 63 49 49 24\n${SITE_LINE}\n\nSi vous ne souhaitez plus`), true);
t("site : présent une seule fois dans le texte brut", em.text.split("dev.jercat.fr").length - 1, 1);
t("site : lien direct cliquable dans le HTML", em.html.includes(`Site web : <a href="${S}" style="color:#1d4ed8;">${S}</a>`), true);
t("site : href exact, sans redirection", em.hrefs.includes(S) && assertDirectLinks(em.html).includes(S), true);
t("site : la phrase STOP reste la dernière ligne (contrôle « complet »)", em.text.trim().split("\n").pop(), "Si vous ne souhaitez plus recevoir de message de ma part, répondez simplement STOP.");
t("site : déjà écrit → pas de doublon", ensureSiteLink(`Bonjour\n\nVous pouvez découvrir nos autres services sur https://dev.jercat.fr/\n\nJercat`), `Bonjour\n\nVous pouvez découvrir nos autres services sur https://dev.jercat.fr/\n\nJercat`);
t("site : écrit sans https → normalisé, pas de doublon", buildProspectEmail("x", "Bonjour\n\nSite : dev.jercat.fr\n\nJercat").text, "Bonjour\n\nSite : https://dev.jercat.fr/\n\nJercat");
t("site : réponse courte depuis la fiche → ajouté en fin", buildProspectEmail("Re: x", "Ok je vous appelle demain").text, `Ok je vous appelle demain\n\n${SITE_LINE}`);
t("site : sans téléphone, après la ligne Jercat", ensureSiteLink("Merci\n\nBonne journée,\nJercat\n\nRépondez STOP."), `Merci\n\nBonne journée,\nJercat\n${SITE_LINE}\n\nRépondez STOP.`);
t("site : sans signature, avant la phrase STOP", ensureSiteLink("Bonjour\n\nTexte\n\nRépondez STOP pour ne plus recevoir."), `Bonjour\n\nTexte\n\n${SITE_LINE}\n\nRépondez STOP pour ne plus recevoir.`);
t("site : texte brut multipart lisible (URL complète)", em.text.includes("Site web : https://dev.jercat.fr/"), true);

console.log(`\n${ok} réussis, ${ko} échoués`);
process.exit(ko ? 1 : 0);
