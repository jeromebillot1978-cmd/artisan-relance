-- =====================================================================
-- Tests délivrabilité (migration 20261122210000) : prénom, personnalisation, rythme d'envoi.
-- Lancés APRÈS les tests v2 à v4 (qui envoient plusieurs messages d'affilée sous l'ancienne règle).
-- =====================================================================
\set ON_ERROR_STOP on
\pset format unaligned
\pset tuples_only on
create or replace function pg_temp.refuse(sql text, label text) returns text language plpgsql as $$
begin execute sql; return 'KO (accepté à tort) : ' || label;
exception when others then return 'OK refusé : ' || label || ' → ' || sqlerrm; end; $$;
create or replace function pg_temp.ok(cond boolean, label text) returns text language sql as $$
  select case when cond then 'OK : ' else 'KO : ' end || label $$;
create or replace function pg_temp.pid(c text) returns uuid language sql as $$ select id from public.prospects where company = c $$;
create or replace function pg_temp.ver(c text) returns int language sql as $$ select version from public.prospects where company = c $$;

\echo '== Rendu des variables'
select pg_temp.ok(public._prospect_render('Bonjour {prenom},', 'Paul', 'X', 'Y') = 'Bonjour Paul,', 'prénom inséré');
select pg_temp.ok(public._prospect_render('Bonjour {prenom},', null, 'X', 'Y') = 'Bonjour,', 'sans prénom : « Bonjour, »');
select pg_temp.ok(public._prospect_render('Bonjour {prenom},', '  ', 'X', 'Y') = 'Bonjour,', 'prénom vide : « Bonjour, »');
select pg_temp.ok(public._prospect_render('{entreprise} à {ville}', null, 'Toiture Pontillo', 'Gosselies (BE)') = 'Toiture Pontillo à Gosselies', 'entreprise + ville sans le « (BE) »');
select pg_temp.ok(public._prospect_render('{Entreprise} {VILLE}', null, 'A', 'Laon (02)') = 'A Laon', 'variables insensibles à la casse');

-- Les envois précédents des tests v3/v4 ne doivent pas bloquer : on les recule de 2 jours
reset role;
set prospect.via_function = 'on';
update public.prospect_attempts set sent_at = sent_at - interval '2 days', opened_at = opened_at - interval '2 days'
 where sent_at is not null or state = 'ouverte';
reset prospect.via_function;

\echo '== Création avec prénom, envoi personnalisé'
set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
select public.prospect_create('Délivrabilité Démo', 'Namur (BE)', 'Électricien', null, 'info@delivrabilite-demo.test', null, 'email',
  '', '', 'Question pour {entreprise}',
  E'Bonjour {prenom},\n\nJ''ai vu le site de {entreprise} en cherchant des artisans à {ville}.\n\nSi ce n''est pas pour vous, répondez « stop » et je ne vous écrirai plus.',
  null, 'Site de test', null, current_date, 'Alex') \g /dev/null
reset role;
select pg_temp.ok((select first_name from public.prospects where company = 'Délivrabilité Démo') = 'Alex', 'prénom enregistré');
set role authenticated;
select attempt_id as d1, subject as ds, message as dm from public.prospect_server_send_begin(pg_temp.pid('Délivrabilité Démo'), pg_temp.ver('Délivrabilité Démo')) \gset
reset role;
select pg_temp.ok(:'ds' = 'Question pour Délivrabilité Démo', 'objet personnalisé renvoyé au serveur');
select pg_temp.ok(:'dm' like 'Bonjour Alex,%' and :'dm' like '%artisans à Namur.%', 'message personnalisé (prénom, entreprise, ville)');
select pg_temp.ok((select subject_snapshot = 'Question pour Délivrabilité Démo' and message_snapshot like 'Bonjour Alex,%' from public.prospect_attempts where id = :'d1'), 'la tentative garde le texte réellement envoyé');
select pg_temp.ok((select approved_message_md5 = public._prospect_md5(subject, message) from public.prospects where company = 'Délivrabilité Démo'), 'validation calculée sur le modèle saisi');
set role authenticated;
select public.prospect_server_send_result(:'d1', true, '<d1@mail.gmail.com>', '250 OK', null, '["https://artisan-relance.jercat.fr/"]'::jsonb, 600) \g /dev/null

\echo '== Rythme : 90 s minimum entre deux envois automatiques'
select public.prospect_create('Rythme Démo', 'Liège (BE)', 'Plombier', null, 'info@rythme-demo.test', null, 'email',
  '', '', 'Question pour {entreprise}', E'Bonjour {prenom},\n\nTexte.\n\nRépondez « stop ».', null, 'Site de test', null, current_date) \g /dev/null
select pg_temp.refuse(format($$select * from public.prospect_server_send_begin(%L, %s)$$, pg_temp.pid('Rythme Démo'), pg_temp.ver('Rythme Démo')), 'deuxième envoi moins de 90 s après le premier');
reset role;
set prospect.via_function = 'on';
update public.prospect_attempts set sent_at = now() - interval '91 seconds' where id = :'d1';
reset prospect.via_function;
set role authenticated;
select attempt_id as r1, message as rm from public.prospect_server_send_begin(pg_temp.pid('Rythme Démo'), pg_temp.ver('Rythme Démo')) \gset
reset role;
select pg_temp.ok(:'r1' is not null, 'envoi accepté après 90 s');
select pg_temp.ok(:'rm' like E'Bonjour,\n%', 'sans prénom : « Bonjour, »');
set role authenticated;
select public.prospect_fail_attempt(:'r1', 'test') \g /dev/null

\echo '== Variable inconnue bloquée'
select public.prospect_update_content(pg_temp.pid('Rythme Démo'), pg_temp.ver('Rythme Démo'), null, 'info@rythme-demo.test', null,
  'Question', E'Bonjour {nom},\n\nRépondez « stop ».', null, 'Site de test', null, current_date, null) \g /dev/null
reset role;
set prospect.via_function = 'on';
update public.prospect_attempts set sent_at = now() - interval '1 day', opened_at = now() - interval '1 day';
reset prospect.via_function;
set role authenticated;
select pg_temp.refuse(format($$select * from public.prospect_server_send_begin(%L, %s)$$, pg_temp.pid('Rythme Démo'), pg_temp.ver('Rythme Démo')), 'variable {nom} inconnue');

\echo '== Modifier le prénom retire la validation'
select public.prospect_update_content(pg_temp.pid('Délivrabilité Démo'), pg_temp.ver('Délivrabilité Démo'), null, 'info@delivrabilite-demo.test', null,
  'Question pour {entreprise}',
  E'Bonjour {prenom},\n\nJ''ai vu le site de {entreprise} en cherchant des artisans à {ville}.\n\nSi ce n''est pas pour vous, répondez « stop » et je ne vous écrirai plus.',
  null, 'Site de test', null, current_date, 'Alexandre') \g /dev/null
reset role;
select pg_temp.ok((select first_name = 'Alexandre' and approved_message_md5 is null from public.prospects where company = 'Délivrabilité Démo'), 'prénom modifié → à valider de nouveau');

\echo '== Plafond : 20 envois automatiques par 24 h'
select pg_temp.ok(public._prospect_daily_cap() = 20, 'plafond à 20');
select pg_temp.ok(public._prospect_min_gap_seconds() = 90, 'écart minimal 90 s');
