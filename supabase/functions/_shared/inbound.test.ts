// Tests : node --experimental-strip-types supabase/functions/_shared/inbound.test.ts
import { stripQuoted, classifyInbound, extractToken, htmlToText, isOptOut, addressOnly } from "./inbound.ts";
import { renderReplyForward, replySubject } from "./templates.ts";
let ok = 0, ko = 0;
const t = (name: string, got: unknown, exp: unknown) => {
  const pass = JSON.stringify(got) === JSON.stringify(exp);
  pass ? ok++ : ko++;
  console.log(`${pass ? "OK " : "KO "} ${name}${pass ? "" : `  → obtenu ${JSON.stringify(got)}, attendu ${JSON.stringify(exp)}`}`);
};
const T = "0123456789abcdef01234567", U = "fedcba9876543210fedcba98";
// Classement
t("réponse normale", classifyInbound({ from: "Jean <jean@gmail.com>", subject: "Re: Votre devis", text: "Bonjour, c'est d'accord pour le devis." }), "reply");
t("absence Outlook (Auto-Submitted)", classifyInbound({ from: "jean@x.fr", subject: "Réponse automatique : Re: Votre devis", headers: { "Auto-Submitted": "auto-replied" } }), "auto_reply");
t("absence Gmail (objet seul)", classifyInbound({ from: "jean@x.fr", subject: "Absence du bureau", text: "Je suis absent" }), "auto_reply");
t("absence anglais", classifyInbound({ from: "jean@x.fr", subject: "Automatic reply: Votre devis" }), "auto_reply");
t("Precedence: auto_reply", classifyInbound({ from: "a@b.fr", subject: "Re: devis", headers: { precedence: "auto_reply" } }), "auto_reply");
t("X-Autoreply", classifyInbound({ from: "a@b.fr", subject: "Re: devis", headers: { "X-Autoreply": "yes" } }), "auto_reply");
t("rebond MAILER-DAEMON", classifyInbound({ from: "MAILER-DAEMON@mx.orange.fr", subject: "Undelivered Mail Returned to Sender" }), "auto_reply");
t("Auto-Submitted: no = humain", classifyInbound({ from: "a@b.fr", subject: "Re: devis", headers: { "auto-submitted": "no" }, text: "Merci" }), "reply");
t("STOP en objet", classifyInbound({ from: "a@b.fr", subject: "STOP" }), "opt_out");
t("STOP en 1re ligne + citation", classifyInbound({ from: "a@b.fr", subject: "Re: Votre devis", text: "Stop.\n\n> Le 12 nov. vous avez écrit :\n> Bonjour" }), "opt_out");
t("« stop » dans une phrase ≠ STOP", classifyInbound({ from: "a@b.fr", subject: "Re: devis", text: "Stop, attendez, je vous appelle demain pour le devis" }), "reply");
t("désinscription", isOptOut({ from: "a@b.fr", subject: "Re: devis", text: "Désabonnez-moi" }), true);
t("STOP en HTML seul", isOptOut({ from: "a@b.fr", subject: "Re", html: "<div>STOP</div><blockquote>…</blockquote>" }), true);
t("DMARC en échec = suspect", classifyInbound({ from: "a@b.fr", subject: "Re", authentication: { dmarc: "fail", spf: "pass", dkim: "pass" } }), "suspicious");
t("SPF+DKIM en échec = suspect", classifyInbound({ from: "a@b.fr", subject: "Re", authentication: { spf: { result: "fail" }, dkim: { result: "fail" } } }), "suspicious");
t("SPF échec seul = OK", classifyInbound({ from: "a@b.fr", subject: "Re", text: "ok", authentication: { spf: "fail", dkim: "pass", dmarc: "pass" } }), "reply");
// Jeton
t("jeton dans À", extractToken({ to: [`Devis <devis-${T}@reponses.jercat.fr>`] }, "reponses.jercat.fr"), { token: T, ambiguous: false });
t("jeton en majuscules", extractToken({ to: [`DEVIS-${T.toUpperCase()}@REPONSES.JERCAT.FR`] }, "reponses.jercat.fr"), { token: T, ambiguous: false });
t("autre domaine ignoré", extractToken({ to: [`devis-${T}@pirate.com`] }, "reponses.jercat.fr"), { token: null, ambiguous: false });
t("domaine voisin ignoré", extractToken({ to: [`devis-${T}@reponses.jercat.fr.evil.com`] }, "reponses.jercat.fr"), { token: null, ambiguous: false });
t("deux devis : À prioritaire + signalé", extractToken({ to: [`devis-${T}@reponses.jercat.fr`], cc: [`devis-${U}@reponses.jercat.fr`] }, "reponses.jercat.fr"), { token: T, ambiguous: true });
t("même jeton répété = non ambigu", extractToken({ to: [`devis-${T}@reponses.jercat.fr`], cc: [`devis-${T}@reponses.jercat.fr`] }, "reponses.jercat.fr"), { token: T, ambiguous: false });
t("destinataire réel (received_for) prioritaire", extractToken({ to: [`devis-${U}@reponses.jercat.fr`], received_for: [`devis-${T}@reponses.jercat.fr`] }, "reponses.jercat.fr"), { token: T, ambiguous: true });
t("jeton trop court refusé", extractToken({ to: ["devis-abc@reponses.jercat.fr"] }, "reponses.jercat.fr"), { token: null, ambiguous: false });
// Divers
t("adresse seule", addressOnly('"Jean, Dupont" <Jean.Dupont@GMAIL.com>'), "jean.dupont@gmail.com");
t("HTML → texte sans balise", htmlToText('<p>Bonjour&nbsp;<b>Paul</b></p><script>alert(1)</script><p>OK &amp; merci</p>'), "Bonjour Paul\nOK & merci");
t("objet sans Re: empilés", replySubject("RE: Re: TR: Votre devis n° 12 — Plomberie"), "Re: Votre devis n° 12 — Plomberie");
const fw = renderReplyForward({ prospectName: "Jean <script>", originalSubject: "Votre devis n° 12", from: "jean@x.fr", receivedText: "<img src=x onerror=alert(1)>", companyName: "P", dashboardUrl: "https://a/devis/1" });
t("transfert : objet = Re: objet du devis", fw.subject, "Re: Votre devis n° 12");
t("transfert : HTML client échappé", fw.html.includes("<img src=x") || fw.html.includes("<script>"), false);
const auto = renderReplyForward({ prospectName: "Jean", originalSubject: "Votre devis", from: "jean@x.fr", receivedText: "absent", companyName: "P", dashboardUrl: "u", kind: "auto_reply" });
t("transfert absence : objet marqué", auto.subject, "[Réponse automatique] Re: Votre devis");
const other = renderReplyForward({ prospectName: "Jean", originalSubject: "Devis", from: "autre@x.fr", receivedText: "ok", companyName: "P", dashboardUrl: "u", unexpectedSender: true, recipients: ["jean@x.fr"] });
t("transfert : alerte expéditeur inattendu", other.html.includes("autre@x.fr, qui n'est pas l'adresse") || other.html.includes("autre@x.fr</") || other.html.includes("n&#39;est pas") || other.html.includes("n'est pas l'adresse"), true);
t("préfixe collé ignoré", extractToken({ to: [`mydevis-${T}@reponses.jercat.fr`] }, "reponses.jercat.fr"), { token: null, ambiguous: false });
t("citation Gmail FR", stripQuoted("Bonjour,\nOK pour moi.\n\nLe lun. 17 nov. 2026 à 18:42, Plomberie <devis-x@reponses.jercat.fr> a écrit :\n> Bonjour Jean\n> Voici le devis"), "Bonjour,\nOK pour moi.");
t("citation Gmail sur deux lignes", stripQuoted("Merci\n\nLe lun. 17 nov. 2026 à 18:42, Plomberie <\ndevis-x@reponses.jercat.fr> a écrit :\n> texte"), "Merci");
t("citation Outlook", stripQuoted("Oui c'est bon\n\nDe : Plomberie <relances@jercat.fr>\nEnvoyé : lundi 17 novembre 2026 18:42\nÀ : Jean\nObjet : Votre devis"), "Oui c'est bon");
t("citation anglaise", stripQuoted("Thanks\nOn Mon, Nov 17, 2026 at 6:42 PM Plomberie wrote:\n> hi"), "Thanks");
t("message d'origine", stripQuoted("Ok\n-----Message d'origine-----\nDe: x"), "Ok");
t("lignes > finales", stripQuoted("D'accord\n> ancien\n> texte\n"), "D'accord");
t("réponse sous la citation : texte gardé", stripQuoted("Le lun. 17 nov. 2026, X a écrit :\n> devis\nOK"), "Le lun. 17 nov. 2026, X a écrit :\n> devis\nOK");
t("sans citation", stripQuoted("  Bonjour, merci.  "), "Bonjour, merci.");
console.log(`\n${ok} réussis, ${ko} échoués`);
process.exit(ko ? 1 : 0);
