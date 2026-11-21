-- =====================================================================
-- Tests de l'envoi direct par le serveur (migration 20261121100000).
-- Lancés après prospection_v2.test.sql par run-prospection-tests.sh.
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

set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
select public.prospect_create('Envoi Serveur Démo', 'Ville S (02)', 'Plombier', 'https://www.serveur-demo.test/', 'contact@serveur-demo.test', null, 'email',
  '', '', 'Vos devis', E'Bonjour,\n\nVidéo : https://pubartisanrelance.vercel.app/\n\nEssai : https://artisan-relance.jercat.fr/\n\nPour ne plus recevoir de message de ma part, répondez « stop ».',
  null, 'Site de test', null, current_date) \g /dev/null

\echo '== Valider et envoyer : réservation (étape A)'
select attempt_id as s1, bcc_token as t1 from public.prospect_server_send_begin(pg_temp.pid('Envoi Serveur Démo'), pg_temp.ver('Envoi Serveur Démo')) \gset
reset role;
select pg_temp.ok((select stage from public.prospects where company = 'Envoi Serveur Démo') = 'pret', 'texte validé en un clic (à relire → relu)');
select pg_temp.ok((select state = 'ouverte' and draft_method = 'serveur' and draft_opened_at is not null from public.prospect_attempts where id = :'s1'), 'tentative serveur ouverte');
select pg_temp.ok(exists (select 1 from public.prospect_events where attempt_id = :'s1' and type = 'envoi_serveur_demande'), 'journal : envoi demandé');
select pg_temp.ok(exists (select 1 from public.prospect_events where prospect_id = pg_temp.pid('Envoi Serveur Démo') and type = 'message_valide' and detail->>'via' = 'valider_et_envoyer'), 'journal : validation via « Valider et envoyer »');
set role authenticated;
select pg_temp.refuse(format($$select * from public.prospect_server_send_begin(%L, %s)$$, pg_temp.pid('Envoi Serveur Démo'), pg_temp.ver('Envoi Serveur Démo')), 'double clic pendant l''envoi');

\echo '== Résultat SMTP accepté (étape B)'
select public.prospect_server_send_result(:'s1', true, '<abc@mail.gmail.com>', '250 2.0.0 OK', null,
  '["https://pubartisanrelance.vercel.app/","https://artisan-relance.jercat.fr/"]'::jsonb, 812) \g /dev/null
reset role;
select pg_temp.ok((select state = 'envoyee' and proof = 'smtp' and sent_at is not null and smtp_message_id = '<abc@mail.gmail.com>' from public.prospect_attempts where id = :'s1'), 'état « envoyée », date et Message-ID enregistrés');
select pg_temp.ok((select stage from public.prospects where company = 'Envoi Serveur Démo') = 'contacte', 'prospect « contacté »');
select pg_temp.ok((select (detail->>'reecriture_detectee')::boolean = false from public.prospect_events where attempt_id = :'s1' and type = 'envoi_serveur_accepte'), 'journal : liens envoyés sans réécriture');
set role authenticated;
select pg_temp.refuse(format($$select public.prospect_cancel_attempt(%L, 'oups')$$, :'s1'), 'annuler un e-mail déjà envoyé');
select pg_temp.refuse(format($$select * from public.prospect_server_send_begin(%L, %s)$$, pg_temp.pid('Envoi Serveur Démo'), pg_temp.ver('Envoi Serveur Démo')), 'renvoyer le même texte dans les 24 h');

\echo '== Preuve : copie cachée reçue, liens directs'
reset role;
set role service_role;
select wrong_sender as w1, content_check as c1 from public.prospect_verify_by_bcc(:'t1', 'em-s1', 'Jercat <jercat.bilman@gmail.com>', 'jercat.bilman@gmail.com',
  E'Bonjour,\nPour ne plus recevoir de message de ma part, répondez « stop ».',
  '<p><a href="https://pubartisanrelance.vercel.app/">x</a> <a href=''https://artisan-relance.jercat.fr/''>y</a></p>') \gset
reset role;
select pg_temp.ok(not :'w1'::boolean and :'c1' = 'complet', 'bon expéditeur, message complet');
select pg_temp.ok((select state = 'verifiee' and proof = 'cci_recue' and link_rewrite_detected = false
                     and received_hrefs @> '["https://pubartisanrelance.vercel.app/","https://artisan-relance.jercat.fr/"]'::jsonb
                   from public.prospect_attempts where id = :'s1'), '« prouvé » + href reçus enregistrés, aucune réécriture');

\echo '== Diagnostic : réécriture Google détectée'
set role authenticated;
select public.prospect_update_content(pg_temp.pid('Envoi Serveur Démo'), pg_temp.ver('Envoi Serveur Démo'), 'https://www.serveur-demo.test/', 'contact@serveur-demo.test', null,
  'Relance', E'Deuxième message\n\nPour ne plus recevoir de message de ma part, répondez « stop ».', null, 'Site de test', null, current_date) \g /dev/null
select attempt_id as s2, bcc_token as t2 from public.prospect_server_send_begin(pg_temp.pid('Envoi Serveur Démo'), pg_temp.ver('Envoi Serveur Démo')) \gset
select public.prospect_server_send_result(:'s2', true, '<def@mail.gmail.com>', '250 OK', null, '["https://artisan-relance.jercat.fr/"]'::jsonb, 500) \g /dev/null
reset role; set role service_role;
select * from public.prospect_verify_by_bcc(:'t2', 'em-s2', 'jercat.bilman@gmail.com', 'jercat.bilman@gmail.com', 'Pour ne plus recevoir de message de ma part, répondez « stop ».',
  '<a href="https://www.google.com/url?q=https://artisan-relance.jercat.fr/&amp;source=gmail&amp;sa=E">lien</a>') \g /dev/null
reset role;
select pg_temp.ok((select link_rewrite_detected from public.prospect_attempts where id = :'s2'), 'réécriture google.com/url détectée');
select pg_temp.ok(exists (select 1 from public.prospect_events where attempt_id = :'s2' and type = 'liens_reecrits'), 'journal : alerte « liens réécrits »');

\echo '== Échec SMTP'
set role authenticated;
select public.prospect_update_content(pg_temp.pid('Envoi Serveur Démo'), pg_temp.ver('Envoi Serveur Démo'), 'https://www.serveur-demo.test/', 'contact@serveur-demo.test', null,
  'Troisième', E'Troisième message\n\nstop', null, 'Site de test', null, current_date) \g /dev/null
select attempt_id as s3 from public.prospect_server_send_begin(pg_temp.pid('Envoi Serveur Démo'), pg_temp.ver('Envoi Serveur Démo')) \gset
select public.prospect_server_send_result(:'s3', false, null, '535 5.7.8 Username and Password not accepted', 'Identifiants Gmail refusés', null, 300) \g /dev/null
reset role;
select pg_temp.ok((select state = 'echec' and failure_reason = 'Identifiants Gmail refusés' and closed_at is not null from public.prospect_attempts where id = :'s3'), 'échec enregistré avec la raison');
select pg_temp.ok(exists (select 1 from public.prospect_events where attempt_id = :'s3' and type = 'envoi_serveur_echec' and detail->>'reponse_smtp' like '535%'), 'journal : réponse SMTP de l''échec');
select pg_temp.ok((select stage from public.prospects where company = 'Envoi Serveur Démo') = 'contacte', 'un échec ne retire pas les envois précédents');

\echo '== Garde-fous'
set role authenticated;
select pg_temp.refuse(format($$select public.prospect_server_send_result(%L, true, 'x', 'y', null, null, 1)$$, :'s3'), 'compte rendu sur une tentative close');
select public.prospect_do_not_contact(pg_temp.pid('Envoi Serveur Démo'), 'a répondu stop', pg_temp.ver('Envoi Serveur Démo')) \g /dev/null
select pg_temp.refuse(format($$select * from public.prospect_server_send_begin(%L, %s)$$, pg_temp.pid('Envoi Serveur Démo'), pg_temp.ver('Envoi Serveur Démo')), 'envoi à un prospect STOP');
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
select pg_temp.refuse(format($$select * from public.prospect_server_send_begin(%L, 1)$$, pg_temp.pid('Envoi Serveur Démo')), 'envoi par un non-administrateur');
select pg_temp.refuse($$select * from public.prospect_verify_by_bcc('x','y','z','w',null,null)$$, 'fausse preuve par un utilisateur');
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
reset role;
select pg_temp.refuse($$update public.prospect_attempts set state = 'envoyee'$$, 'écriture directe d''un état « envoyée »');
select pg_temp.ok(public._prospect_hrefs('<a href="https://a.test/?x=1&amp;y=2">') = '["https://a.test/?x=1&y=2"]'::jsonb, 'extraction des href (entités décodées)');
