-- Tests : réponses des prospects et conversation (migration 20261121110000).
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

\echo '== Adresse de réponse par prospect'
select pg_temp.ok((select count(*) from public.prospects where reply_token is null) = 0, 'jeton de réponse pour toutes les fiches (reprise)');
set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
select public.prospect_create('Réponses Démo', 'Ville R (02)', 'Électricien', null, 'contact@reponses-demo.test', null, 'email',
  '', '', 'Vos devis', E'Bonjour\n\nstop', null, 'Site de test', null, current_date) \g /dev/null
select attempt_id as a1 from public.prospect_server_send_begin(pg_temp.pid('Réponses Démo'), pg_temp.ver('Réponses Démo')) \gset
select public.prospect_server_send_result(:'a1', true, '<init@mail.gmail.com>', '250 OK', null, '[]'::jsonb, 100) \g /dev/null
reset role;
select reply_token as rt from public.prospects where company = 'Réponses Démo' \gset
select pg_temp.ok(length(:'rt') = 24, 'jeton créé automatiquement à la création');

\echo '== Réponse reçue'
set role service_role;
select already as d1, kind as k1, sender_matches as s1 from public.prospect_register_inbound(:'rt', 'in-1', 'Paul <contact@reponses-demo.test>', array['prospect-reponse-x@reponses.jercat.fr'],
  'Re: Vos devis', 'Oui, intéressé', 'reply', '<r1@mail.test>') \gset
reset role;
select pg_temp.ok(not :'d1'::boolean and :'k1' = 'reply' and :'s1'::boolean, 'réponse enregistrée, expéditeur = adresse du prospect');
select pg_temp.ok((select stage from public.prospects where company = 'Réponses Démo') = 'en_discussion', 'prospect passé « en discussion »');
select pg_temp.ok((select count(*) from public.prospect_messages where provider_email_id = 'in-1' and direction = 'in' and read_at is null) = 1, 'message dans la conversation, non lu');
select pg_temp.ok(exists (select 1 from public.prospect_events where prospect_id = pg_temp.pid('Réponses Démo') and type = 'reponse_recue'), 'journal : réponse reçue');
set role service_role;
select already as d2 from public.prospect_register_inbound(:'rt', 'in-1', 'x', null, 's', 'b', 'reply', null) \gset
reset role;
select pg_temp.ok(:'d2'::boolean and (select count(*) from public.prospect_messages where provider_email_id = 'in-1') = 1, 'webhook rejoué : aucun doublon');

\echo '== Répondre depuis le site'
set role authenticated;
select public.prospect_mark_read(pg_temp.pid('Réponses Démo')) \g /dev/null
select message_id as m1, subject as subj1, in_reply_to as irt1 from public.prospect_reply_begin(pg_temp.pid('Réponses Démo'), 'Merci, je vous appelle demain.') \gset
select pg_temp.ok(:'subj1' = 'Re: Vos devis' and :'irt1' = '<r1@mail.test>', 'même fil : « Re: » et réponse au dernier message reçu');
select pg_temp.refuse(format($$select * from public.prospect_reply_begin(%L, 'Encore')$$, pg_temp.pid('Réponses Démo')), 'deuxième envoi pendant un envoi en cours');
select public.prospect_reply_result(:'m1', true, '<out1@gmail.com>', '250 OK', null) \g /dev/null
reset role;
select pg_temp.ok((select read_at is not null from public.prospect_messages where provider_email_id = 'in-1'), 'réponse marquée lue à l''ouverture');
select pg_temp.ok((select status = 'sent' and sent_at is not null and message_id = '<out1@gmail.com>' from public.prospect_messages where id = :'m1'), 'réponse envoyée : date et Message-ID');
select pg_temp.ok(exists (select 1 from public.prospect_events where type = 'reponse_envoyee' and detail->>'message' = :'m1'), 'journal : réponse envoyée');
set role authenticated;
select message_id as m2 from public.prospect_reply_begin(pg_temp.pid('Réponses Démo'), 'Deuxième') \gset
select public.prospect_reply_result(:'m2', false, null, '421 try later', 'Gmail ne répond pas') \g /dev/null
reset role;
select pg_temp.ok((select status = 'failed' and error = 'Gmail ne répond pas' from public.prospect_messages where id = :'m2'), 'échec de réponse enregistré');

\echo '== STOP et garde-fous'
set role service_role;
select * from public.prospect_register_inbound(:'rt', 'in-2', 'contact@reponses-demo.test', null, 'STOP', 'STOP', 'opt_out', null) \g /dev/null
reset role;
select pg_temp.ok((select stage = 'ne_plus_contacter' and do_not_contact_at is not null from public.prospects where company = 'Réponses Démo'), '« STOP » reçu : ne plus contacter');
set role authenticated;
select pg_temp.refuse(format($$select * from public.prospect_reply_begin(%L, 'Bonjour')$$, pg_temp.pid('Réponses Démo')), 'répondre à un prospect STOP');
select pg_temp.refuse($$select * from public.prospect_register_inbound('x','y','z',null,'s','b','reply',null)$$, 'fausse réponse par un utilisateur');
reset role;
select pg_temp.refuse($$insert into public.prospect_messages (prospect_id, direction) select id, 'in' from public.prospects limit 1$$, 'écriture directe dans la conversation');
set role service_role;
select pg_temp.ok((select count(*) from public.prospect_register_inbound('000000000000000000000000', 'in-3', 'a', null, 's', 'b', 'reply', null)) = 0, 'jeton inconnu : ignoré');
reset role;
