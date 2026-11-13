# Artisan Relance

SaaS de relance automatique des devis pour artisans.
Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Supabase · Resend · Vercel Cron.

- Inscription / connexion / mot de passe oublié / déconnexion (Supabase Auth)
- Tableau de bord : en attente, signés, perdus, taux de conversion, montant gagné
- Gestion des devis : création, modification, suppression, signé / perdu / remis en attente
- Relances e-mail automatiques à **J+4** et **J+10**, annulées dès que le devis est signé ou perdu
- Cron Vercel quotidien → envoi via Resend → mise à jour des statuts
- Landing page, Tarifs, FAQ, Mentions légales, Confidentialité
- Mobile first, mode sombre par défaut (bascule clair/sombre)
- Aucun paiement, aucun Stripe

---

## 1. Arborescence

```
artisan-relance/
├── app/
│   ├── (marketing)/               # Site public
│   │   ├── layout.tsx
│   │   ├── page.tsx               # Landing page
│   │   ├── tarifs/page.tsx
│   │   ├── faq/page.tsx
│   │   ├── mentions-legales/page.tsx
│   │   └── confidentialite/page.tsx
│   ├── (auth)/                    # Pages d'authentification
│   │   ├── layout.tsx
│   │   ├── connexion/page.tsx
│   │   ├── inscription/page.tsx
│   │   ├── mot-de-passe-oublie/page.tsx
│   │   └── reinitialiser-mot-de-passe/page.tsx
│   ├── (app)/                     # Application (protégée)
│   │   ├── layout.tsx             # Sidebar desktop + barre d'onglets mobile
│   │   ├── error.tsx
│   │   ├── dashboard/page.tsx + loading.tsx
│   │   ├── devis/page.tsx + loading.tsx
│   │   └── parametres/page.tsx    # Profil entreprise + aperçu des e-mails
│   ├── api/cron/send-reminders/route.ts   # Tâche quotidienne
│   ├── auth/callback/route.ts     # Retour des liens e-mail Supabase
│   ├── layout.tsx · globals.css · icon.svg · not-found.tsx
├── components/
│   ├── ui/                        # shadcn/ui : button, card, input, label, textarea, badge,
│   │                              # table, dialog, alert-dialog, dropdown-menu, accordion,
│   │                              # separator, skeleton, sonner
│   ├── app/                       # Composants de l'application
│   ├── auth/                      # Formulaires d'authentification
│   ├── marketing/                 # Header, footer, FAQ
│   └── logo · theme-toggle · theme-provider · submit-button · field-error
├── lib/
│   ├── actions/                   # Server Actions (auth, quotes, profile)
│   ├── automations/registry.ts    # Registre des automatisations (point d'extension)
│   ├── email/templates.ts         # Modèles d'e-mails J+4 / J+10
│   ├── email/resend.ts            # Envoi Resend
│   ├── supabase/                  # Clients navigateur, serveur, admin, middleware
│   ├── data.ts · utils.ts
├── supabase/schema.sql            # SQL complet (tables, RLS, déclencheurs, fonctions)
├── types/database.ts
├── middleware.ts                  # Session + protection des routes
├── vercel.json                    # Cron Vercel
└── .env.example
```

---

## 2. Comment fonctionnent les relances

1. Création d'un devis → un **déclencheur SQL** programme les relances dans `scheduled_emails` :
   - `quote_reminder_1` à date du devis + 4 jours ;
   - `quote_reminder_2` à date du devis + 10 jours.
   - Seules les relances dont la date n'est pas passée sont créées (un devis daté d'il y a 6 jours n'aura que J+10).
2. Devis passé en **signé** ou **perdu** → les relances non envoyées passent en `cancelled`.
3. Devis remis **en attente** ou **date modifiée** → les relances sont reprogrammées (jamais de double envoi).
4. Chaque matin, le **cron Vercel** appelle `/api/cron/send-reminders` :
   - réserve les e-mails dus (`claim_due_emails`, verrouillage anti double envoi) ;
   - les envoie via Resend (au nom de l'entreprise ; les réponses arrivent dans la boîte de l'artisan) ;
   - passe le statut en `sent`, ou en `failed` (nouvel essai au passage suivant, 3 essais max).

Les délais sont modifiables dans la table `reminder_steps` (et dans `lib/automations/registry.ts` pour les libellés).

---

## 3. Installation locale

Prérequis : Node.js 20 ou plus.

```bash
npm install
cp .env.example .env.local   # puis remplir les valeurs (voir section 6)
npm run dev                  # http://localhost:3000
```

---

## 4. Supabase

1. Créer un projet sur https://supabase.com — choisir la région **Europe (Paris ou Francfort)**.
2. **SQL Editor → New query** : coller tout le contenu de `supabase/schema.sql` → **Run**.
   (Le script est ré-exécutable sans risque.)
3. **Authentication → URL Configuration** :
   - *Site URL* : `https://votre-domaine.fr` (ou l'URL Vercel)
   - *Redirect URLs* : ajouter
     - `http://localhost:3000/auth/callback`
     - `https://votre-domaine.fr/auth/callback`
     - `https://*.vercel.app/auth/callback` (pour les prévisualisations)
4. **Authentication → Sign In / Providers → Email** : laisser « Confirm email » activé (recommandé).
5. **Project Settings → API** : copier `Project URL`, la clé `anon` et la clé `service_role`.
6. (Recommandé) **Authentication → Emails → SMTP Settings** : brancher le SMTP de Resend
   (`smtp.resend.com`, port 465, utilisateur `resend`, mot de passe = clé API Resend).
   Le serveur d'e-mails intégré de Supabase est très limité en volume (quelques e-mails par heure) :
   sans SMTP, les e-mails de confirmation d'inscription risquent de ne pas partir.
7. (Optionnel) Traduire les modèles d'e-mails d'authentification en français dans **Authentication → Emails → Templates**.

---

## 5. Resend

1. Créer un compte sur https://resend.com.
2. **Domains → Add domain** : ajouter votre domaine (ex. `jercat.fr`) et créer chez votre registrar
   les enregistrements DNS indiqués (SPF, DKIM, et idéalement DMARC). Attendre le statut **Verified**.
3. **API Keys → Create** : clé avec permission *Sending access*.
4. Variable `RESEND_FROM_EMAIL` : une adresse de ce domaine, par ex. `relances@jercat.fr`.
   Les e-mails partent sous la forme `Dupont Plomberie <relances@jercat.fr>`, avec en *Répondre à*
   l'adresse de l'artisan.

Limites de l'offre gratuite Resend : environ 100 e-mails par jour. Le cron envoie au maximum 80 e-mails
par passage, avec une pause entre chaque envoi. Au-delà, le reste part au passage suivant.
Vérifiez les limites actuelles sur la page tarifs de Resend avant de grossir.

---

## 6. Variables d'environnement

| Variable | Où la trouver | Exposée au navigateur |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | oui |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API (clé `anon`) | oui |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (clé `service_role`) | **non, secret** |
| `NEXT_PUBLIC_SITE_URL` | URL publique, sans `/` final | oui |
| `RESEND_API_KEY` | Resend → API Keys | **non, secret** |
| `RESEND_FROM_EMAIL` | Adresse de votre domaine vérifié | non |
| `CRON_SECRET` | Chaîne aléatoire de 16 caractères ou plus (ex. `openssl rand -hex 32`) | **non, secret** |

---

## 7. Déploiement Vercel

1. Pousser le projet sur GitHub.
2. https://vercel.com → **Add New → Project** → importer le dépôt (framework détecté : Next.js).
3. **Environment Variables** : ajouter les 7 variables (Production + Preview).
4. **Deploy**.
5. Mettre à jour `NEXT_PUBLIC_SITE_URL` avec l'URL finale, ainsi que la *Site URL* de Supabase, puis redéployer.
6. (Optionnel) **Settings → Domains** : brancher un sous-domaine, par ex. `relance.jercat.fr`.

### Cron Vercel

Déclaré dans `vercel.json` : `0 7 * * *`, soit tous les jours à 7h UTC (8h à Paris en hiver, 9h en été).
Vercel envoie automatiquement l'en-tête `Authorization: Bearer <CRON_SECRET>` : la route refuse tout autre appel.
L'offre gratuite de Vercel autorise un cron quotidien. Les crons ne tournent que sur le déploiement de **Production**.

Tester manuellement :

```bash
curl -H "Authorization: Bearer VOTRE_CRON_SECRET" https://votre-domaine.fr/api/cron/send-reminders
# → {"ok":true,"processed":0,"sent":0,"failed":0,...}
```

Pour tester un envoi réel tout de suite : créez un devis avec **votre propre adresse** comme e-mail client,
puis dans Supabase (SQL Editor) :

```sql
update scheduled_emails set send_date = public.today_paris()
where status = 'pending' and email_type = 'quote_reminder_1';
```

Relancez ensuite la commande `curl` : l'e-mail doit arriver.

Les journaux du cron sont visibles dans Vercel → Project → **Logs** (filtre `send-reminders`).

---

## 8. Faire évoluer le produit

L'architecture est prête pour :

| Évolution | Où intervenir |
|---|---|
| **Abonnement** | colonne `profiles.plan` déjà présente (non modifiable par l'utilisateur) ; ajouter un contrôle dans les Server Actions et la page Tarifs |
| **SMS automatiques** | `reminder_steps.channel = 'sms'` ; ajouter un module `lib/sms/` et une branche dans le cron |
| **Avis Google** | nouvelle `automation` dans `reminder_steps` + déclencheur sur `quotes.status = 'signed'` + template |
| **Relances de factures** | table `invoices` sur le modèle de `quotes`, mêmes mécanismes de programmation |
| **Délais personnalisés** | ajouter `user_id` à `reminder_steps` (règles par artisan) |

Le registre `lib/automations/registry.ts` liste déjà ces automatisations. Elles s'affichent « Bientôt » dans les Paramètres.

---

## 9. Avant la mise en ligne publique

- Compléter `app/(marketing)/mentions-legales/page.tsx` et `confidentialite/page.tsx` (champs `[À COMPLÉTER]`).
- Configurer le SMTP Resend dans Supabase (section 4, étape 6).
- Vérifier le domaine d'envoi (SPF, DKIM, DMARC) pour éviter les spams.
- Faire un test de bout en bout : inscription → confirmation → devis → relance reçue → passage en signé.
