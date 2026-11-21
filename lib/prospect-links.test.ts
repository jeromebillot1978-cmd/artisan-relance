// Tests : node --experimental-strip-types lib/prospect-links.test.ts
import {
  cleanLinks, confirmNorm, detectPlatform, emailDraftLinks, gmailAndroidIntentUrl, gmailIosUrl, gmailWebUrl, mailtoUrl, phoneNumbers, SAFE_LINK_LENGTH,
} from "./prospect-links.ts";

let ok = 0, ko = 0;
const t = (name: string, got: unknown, exp: unknown) => {
  const pass = JSON.stringify(got) === JSON.stringify(exp);
  if (pass) ok++;
  else ko++;
  console.log(`${pass ? "OK " : "KO "} ${name}${pass ? "" : `  → obtenu ${JSON.stringify(got)}, attendu ${JSON.stringify(exp)}`}`);
};

// --- Appareils
const UA = {
  chromeWin: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
  chromeAndroid: "Mozilla/5.0 (Linux; Android 14; SM-A546B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36",
  safariIphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
  ipadOS: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15",
  claudeAndroidWebview: "Mozilla/5.0 (Linux; Android 13; Pixel 7 Build/TQ3A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0 Mobile Safari/537.36",
};
t("ordinateur Windows", detectPlatform(UA.chromeWin), "desktop");
t("Android Chrome", detectPlatform(UA.chromeAndroid), "android");
t("Android (vue intégrée d'une appli)", detectPlatform(UA.claudeAndroidWebview), "android");
t("iPhone Safari", detectPlatform(UA.safariIphone), "ios");
t("iPad (se présente comme un Mac, écran tactile)", detectPlatform(UA.ipadOS, 5), "ios");
t("vrai Mac (pas tactile)", detectPlatform(UA.ipadOS, 0), "desktop");
t("agent vide = ordinateur", detectPlatform(""), "desktop");

// --- Numéros multiples (M10)
t("deux numéros séparés par /", phoneNumbers("01 00 00 00 01 / 06 00 00 00 02").map((n) => n.href), ["tel:0100000001", "tel:0600000002"]);
t("séparés par « ou »", phoneNumbers("06 00 00 00 06 ou 03 00 00 00 07").map((n) => n.href), ["tel:0600000006", "tel:0300000007"]);
t("séparés par virgule", phoneNumbers("0600000006, 0300000007").length, 2);
t("format international +33", phoneNumbers("+33 7 00 00 00 04").map((n) => n.href), ["tel:+33700000004"]);
t("format 0033", phoneNumbers("0033 7 00 00 00 04").map((n) => n.href), ["tel:+33700000004"]);
t("numéro unique", phoneNumbers("06 00 00 00 05").map((n) => n.label), ["06 00 00 00 05"]);
t("vide", phoneNumbers(null), []);
t("texte sans numéro ignoré", phoneNumbers("voir site"), []);
t("libellé conservé tel quel", phoneNumbers("01 00 00 00 03 / 07 00 00 00 04").map((n) => n.label), ["01 00 00 00 03", "07 00 00 00 04"]);

// --- Liens e-mail
const d = { to: "contact@peinture-exemple.test", bcc: "prospect-0123456789abcdef01234567@reponses.jercat.fr", subject: "Après le devis sous 48 h", body: "Bonjour,\n\nC'est gratuit : https://artisan-relance.jercat.fr\n\nPour ne plus recevoir de message de ma part, répondez « stop »." };
const web = new URL(gmailWebUrl(d));
t("web : compte forcé dans le chemin", web.pathname, "/mail/u/jercat.bilman@gmail.com/");
t("web : destinataire", web.searchParams.get("to"), d.to);
t("web : Cci de preuve présente", web.searchParams.get("bcc"), d.bcc);
t("web : objet", web.searchParams.get("su"), d.subject);
t("web : texte intact (sauts de ligne, accents, guillemets)", web.searchParams.get("body"), d.body);
const m = new URL(mailtoUrl(d));
t("mailto : destinataire", m.pathname, d.to);
t("mailto : Cci présente", m.searchParams.get("bcc"), d.bcc);
t("mailto : texte intact", m.searchParams.get("body"), d.body);
const intent = gmailAndroidIntentUrl(d);
t("Android : cible l'appli Gmail", intent.includes("package=com.google.android.gm"), true);
t("Android : schéma mailto", intent.startsWith(`intent:${d.to}?`) && intent.includes("#Intent;scheme=mailto;"), true);
t("Android : Cci dans l'intent", decodeURIComponent(intent.split("#Intent")[0]).includes(`bcc=${d.bcc}`), true);
t("Android : repli web encodé", decodeURIComponent(intent.split("S.browser_fallback_url=")[1].replace(/;end$/, "")), gmailWebUrl(d));
const ios = new URL(gmailIosUrl(d).replace("googlegmail://", "https://x/"));
t("iPhone : schéma de l'appli Gmail", gmailIosUrl(d).startsWith("googlegmail://co?"), true);
t("iPhone : Cci présente", ios.searchParams.get("bcc"), d.bcc);
t("iPhone : texte intact", ios.searchParams.get("body"), d.body);

// --- Ordre proposé selon l'appareil
t("ordinateur : Gmail web d'abord", emailDraftLinks(d, "desktop").map((l) => l.method), ["gmail_web", "mailto"]);
t("Android : appli Gmail d'abord", emailDraftLinks(d, "android").map((l) => l.method), ["gmail_app_android", "mailto"]);
t("iPhone : appli Gmail d'abord", emailDraftLinks(d, "ios").map((l) => l.method), ["gmail_app_ios", "mailto"]);
t("Gmail web ouvert dans un nouvel onglet seulement sur ordinateur", emailDraftLinks(d, "desktop")[0].newTab && !emailDraftLinks(d, "android")[0].newTab, true);
const longBody = { ...d, body: "é".repeat(400) };
t("message long signalé (accents encodés ×6)", emailDraftLinks(longBody, "desktop")[0].long, true);
t("message normal non signalé", emailDraftLinks(d, "desktop")[0].long, false);
t("seuil de longueur", SAFE_LINK_LENGTH, 2000);

// --- Liens propres : jamais de redirection Google, adresses officielles exactes
const A = "https://artisan-relance.jercat.fr/", V = "https://pubartisanrelance.vercel.app/";
t("redirection Google (texte) → lien d'origine",
  cleanLinks("Vidéo : https://www.google.com/url?q=https://pubartisanrelance.vercel.app/&source=gmail&ust=1795280000298000&sa=E"), `Vidéo : ${V}`);
t("redirection Google (HTML &amp;) → lien d'origine",
  cleanLinks('<a href="https://www.google.com/url?q=https://artisan-relance.jercat.fr/&amp;source=gmail&amp;ust=1&amp;sa=E">x</a>'), `<a href="${A}">x</a>`);
t("redirection Google avec lien encodé", cleanLinks("https://www.google.com/url?q=https%3A%2F%2Fpubartisanrelance.vercel.app%2F&sa=D"), V);
t("sans barre finale → barre ajoutée", cleanLinks("Essai : https://artisan-relance.jercat.fr"), `Essai : ${A}`);
t("fin de phrase", cleanLinks("Voir https://artisan-relance.jercat.fr."), `Voir ${A}.`);
t("sans https ni barre", cleanLinks("pubartisanrelance.vercel.app"), V);
t("http → https", cleanLinks("http://artisan-relance.jercat.fr/"), A);
t("déjà exact : inchangé", cleanLinks(`${A} et ${V}`), `${A} et ${V}`);
t("sous-page conservée", cleanLinks("https://artisan-relance.jercat.fr/inscription"), "https://artisan-relance.jercat.fr/inscription");
t("adresse e-mail non touchée", cleanLinks("contact@artisan-relance.jercat.fr"), "contact@artisan-relance.jercat.fr");
t("autre site non touché", cleanLinks("https://dev.jercat.fr"), "https://dev.jercat.fr");
t("brouillon : liens nettoyés", decodeURIComponent(emailDraftLinks({ ...d, body: "https://www.google.com/url?q=https://artisan-relance.jercat.fr&sa=E" }, "desktop")[0].href).includes(`body=${A}`), true);

// --- Confirmation d'effacement tolérante au copier-coller
const N = "TEST complet — Jercat";
t("nom identique", confirmNorm(N) === confirmNorm("TEST complet — Jercat"), true);
t("collé avec espaces autour et retour à la ligne", confirmNorm(N) === confirmNorm("  TEST complet — Jercat \n"), true);
t("tiret court ou trait d'union tapé au clavier", confirmNorm(N) === confirmNorm("TEST complet - Jercat"), true);
t("espace insécable", confirmNorm(N) === confirmNorm("TEST complet\u00A0—\u00A0Jercat"), true);
t("minuscules", confirmNorm(N) === confirmNorm("test complet — jercat"), true);
t("autre nom refusé", confirmNorm(N) === confirmNorm("TEST complet — Autre"), false);
t("nom incomplet refusé", confirmNorm(N) === confirmNorm("TEST complet"), false);
console.log(`\n${ok} réussis, ${ko} échoués`);
process.exit(ko ? 1 : 0);
