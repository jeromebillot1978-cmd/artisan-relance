# Mise en production v2 — Envoi des devis et campagnes de relance

Version actuelle en production : commit `c1c12ab` (v1, relances J+4/J+10).
Version à déployer : branche `campagnes`.

---

## 1. Inventaire complet des variables et secrets

### Vercel — projet `artisan-relance` (Settings → Environment Variables)

**Aucun changement requis.** Ne supprimer aucune variable : la v1 en a besoin en cas de retour arrière.

| Variable | Utilisée par la v2 | Rôle |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | oui | URL Supabase (+ adresse des Edge Functions) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | oui | Clé publique Supabase |
| `NEXT_PUBLIC_SITE_URL` | oui | `https://artisan-relance.jercat.fr` |
| `CRON_SECRET` | oui | Protège `/api/cron/send-reminders` et l'appel à l'Edge Function |
| `SUPABASE_SERVICE_ROLE_KEY` | non (v1 seulement) | À garder pour le retour arrière |
| `RESEND_API_KEY` | non (v1 seulement) | À garder pour le retour arrière |
| `RESEND_FROM_EMAIL` | non (v1 seulement) | À garder pour le retour arrière |
| `RESEND_EMAIL_DOMAIN` | non | Créée par l'intégration Resend, sans effet |

### Supabase — Edge Functions → Secrets

| Secret | Obligatoire | Valeur |
|---|---|---|
| `CRON_SECRET` | oui | Même valeur que sur Vercel |
| `RESEND_API_KEY` | oui | Clé Resend « supabase-smtp » (envoi seul, domaine jercat.fr) |
| `RESEND_FROM_EMAIL` | oui | `relances@jercat.fr` |
| `SITE_URL` | oui | `https://artisan-relance.jercat.fr` |
| `INBOUND_DOMAIN` | non | `reponses.jercat.fr` — à ajouter seulement quand la réception est vérifiée |
| `RESEND_WEBHOOK_SECRET` | avec `INBOUND_DOMAIN` | `whsec_…` du webhook Resend `email.received` |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | auto | Fournis automatiquement par Supabase |

### Supabase — Vault (pour pg_cron)

| Nom | Valeur |
|---|---|
| `mailer_url` | `https://fcokfsongkniwgdgsimi.supabase.co/functions/v1/campaign-mailer` |
| `mailer_secret` | Même valeur que `CRON_SECRET` |

### Supabase — table `platform_settings` (garde-fous, modifiables à chaud)

| Clé | Défaut | Effet |
|---|---|---|
| `daily_email_limit` | 90 | E-mails max par jour, toute la plateforme (Resend gratuit : 100/j, marge pour les e-mails de connexion) |
| `user_daily_email_limit` | 30 | E-mails max par artisan et par jour |
| `failure_breaker_per_hour` | 20 | Disjoncteur : au-delà de N échecs en 1 h, plus aucun envoi |
| `reply_forward_daily_limit` | 10 | Transferts de réponses max par dossier et par 24 h |
| `attachment_retention_months` | 12 | Conservation des pièces jointes après clôture du dossier |
| `orphan_upload_retention_days` | 2 | Suppression des fichiers téléversés jamais rattachés |

Modifier : `update platform_settings set value = '200' where key = 'daily_email_limit';`

---

## 2. Déroulé du déploiement (≈ 20 min, ordre impératif)

| # | Étape | Qui | Réversible |
|---|---|---|---|
| 1 | Export de sécurité : `select * from quotes` et `select * from scheduled_emails` (CSV depuis le Table Editor) | Jérôme | — |
| 2 | Appliquer `supabase/migrations/20261114120000_campagnes.sql` (transaction unique, s'annule seule si le contrôle d'intégrité échoue) | Claude | oui (rollback) |
| 3 | Déployer les Edge Functions `campaign-mailer` et `resend-inbound` (vérification JWT désactivée, contrôle par secret / signature) | Claude | oui |
| 4 | Saisir les 4 secrets obligatoires des Edge Functions | Jérôme | oui |
| 5 | Appel `{"mode":"health"}` : tous les secrets obligatoires à `true` | Claude | — |
| 6 | Créer les 2 secrets Vault puis appliquer `20261114120100_cron_mailer.sql` | Jérôme (Vault) + Claude | oui |
| 7 | Fusionner `campagnes` dans `main` → déploiement Vercel automatique | Claude | oui (Instant Rollback) |
| 8 | Ré-appliquer la migration (idempotente) pour convertir un devis créé entre les étapes 2 et 7 | Claude | — |
| 9 | Test : envoi d'un devis PDF à soi-même, puis forcer une relance | Jérôme + Claude | — |
| 10 | (optionnel) Réception des réponses : domaine `reponses.jercat.fr` + MX OVH + webhook, puis `INBOUND_DOMAIN` | Claude + Jérôme | oui |

---

## 3. Retour arrière (< 10 minutes)

Déclencher si : erreurs à l'affichage des devis, e-mails non envoyés, envois en double, ou tout comportement anormal.

| Temps | Action | Où |
|---|---|---|
| 0–1 min | **Vercel → projet artisan-relance → Deployments** → déploiement « Audit : relances en échec visibles… » (`c1c12ab`) → **…** → **Instant Rollback** | Vercel |
| 1–3 min | Exécuter `supabase/rollback/rollback_v2.sql` dans le SQL Editor | Supabase |
| 3–4 min | Vérifier le résultat affiché : `taches_v2_restantes = 0` | Supabase |
| 4–6 min | Ouvrir le site, se connecter, vérifier la liste des devis | Navigateur |
| 6–8 min | (si besoin) Supprimer le webhook Resend ou retirer `INBOUND_DOMAIN` | Resend / Supabase |

Ce que fait `rollback_v2.sql` :
1. arrête les 2 tâches pg_cron de la v2 ;
2. reporte sur les anciens devis les statuts gagné / perdu décidés pendant la v2 ;
3. recrée dans l'ancien système les devis envoyés pendant la v2 (même identifiant, donc aucun doublon en cas de nouvelle mise en production) ;
4. ne relance pas les dossiers répondus, arrêtés, terminés ou suspendus pendant la v2 ;
5. restaure les relances J+4 / J+10 encore à venir, annulées par la migration.

Aucune donnée n'est supprimée : les tables v2 restent en place, inactives. L'Edge Function `resend-inbound` peut rester active : les réponses des clients continuent d'être transférées.

**Limites du retour arrière** :
- un devis créé en v2 avec plusieurs destinataires ne garde que le premier en v1 ;
- les pièces jointes et l'historique v2 ne sont pas visibles en v1 (ils restent en base) ;
- un dossier v2 dont la relance J+4 est déjà passée n'aura que la J+10 en v1.

---

## 4. Contrôles faits avant mise en production

| Contrôle | Résultat |
|---|---|
| Migration sur données réelles simulées (4 devis, téléphones, notes, relances envoyées) | 4/4 convertis, montants identiques (61 625,50 €), téléphone et notes conservés |
| Migration exécutée 2 fois | Aucun doublon |
| Contrôle d'intégrité | Un écart devis/campagnes annule toute la migration |
| Retour arrière exécuté 2 fois | Idempotent, aucun doublon |
| Nouvelle mise en production après retour arrière | Aucun doublon |
| Plafond par artisan (30/j) | 40 relances dues → 30 envoyées, le reste le lendemain ; un autre artisan n'est pas bloqué |
| Plafond global | Respecté, envois repris quand la limite est relevée |
| Disjoncteur | Plus aucun envoi après N échecs en 1 h ; l'artisan est prévenu |
| Transferts de réponses | Plafonnés à 10 par dossier et par 24 h ; e-mails de nos propres adresses ignorés |
| Conservation des pièces jointes | Dossier clos depuis 13 mois purgé ; dossiers récents conservés ; fichiers orphelins de plus de 2 jours supprimés |
| Charge : 300 artisans, 6 000 campagnes, 30 000 événements, 18 000 envois | Requêtes de l'application < 8 ms ; réservation des relances dues < 5 ms ; purge nocturne < 50 ms (toutes sur index) |
