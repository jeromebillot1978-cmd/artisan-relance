-- =====================================================================
-- Tests de la Prospection v2 (PostgreSQL 16, environnement Supabase simulé).
-- Lancer : voir supabase/tests/run-prospection-tests.sh
-- Chaque ligne affiche « OK … » ou « KO … ». Le script échoue si un KO apparaît.
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
create or replace function pg_temp.age(a uuid) returns void language plpgsql as $$
begin perform set_config('prospect.via_function', 'on', true);
  update public.prospect_attempts set opened_at = now() - interval '1 minute' where id = a;
  perform set_config('prospect.via_function', 'off', true); end; $$;

\echo '== Reprise des anciennes données'
select pg_temp.ok((select count(*) from public.prospects where stage in ('contacte','en_discussion','interesse')) = 0, 'aucun ancien « envoyé » repris comme contact');
select pg_temp.ok((select count(*) from public.prospect_events where type = 'reprise_v2') = (select count(*) from public.prospects), 'une ligne de journal de reprise par prospect');
select pg_temp.ok((select is_test from public.prospects where company like 'TEST%'), 'carte TEST marquée is_test');
select pg_temp.ok((select count(*) from public.prospects where source_label is null or source_checked_at is null) = 0, 'provenance renseignée pour les fiches existantes');

\echo '== C4 / Mi2 : écriture directe interdite, même en superutilisateur'
select pg_temp.refuse($$update public.prospects set stage = 'contacte' where company = 'Peinture Exemple'$$, 'UPDATE direct par le propriétaire');
select pg_temp.refuse($$insert into public.prospect_attempts (prospect_id, channel) select id, 'email' from public.prospects limit 1$$, 'INSERT direct de tentative par le propriétaire');
select pg_temp.refuse($$update public.prospect_events set type = 'x' where id = 1$$, 'modifier le journal');
select pg_temp.refuse($$delete from public.prospect_events where id = 1$$, 'supprimer du journal');

set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
\echo '== Droits SQL côté application'
select pg_temp.refuse($$update public.prospects set stage = 'contacte'$$, 'UPDATE direct par l''application');
select pg_temp.refuse($$insert into public.prospect_events (prospect_id, actor, type) select id, 'utilisateur', 'x' from public.prospects limit 1$$, 'écriture du journal par l''application');

\echo '== C1/C2 : parcours e-mail complet (4 niveaux)'
select attempt_id as a1 from public.prospect_start_attempt(pg_temp.pid('Peinture Exemple'), 'email', pg_temp.ver('Peinture Exemple')) \gset
select pg_temp.refuse(format($$select * from public.prospect_start_attempt(%L, 'email', null)$$, pg_temp.pid('Peinture Exemple')), 'deuxième tentative ouverte');
select pg_temp.refuse(format($$select public.prospect_declare_attempt(%L, array['bon_compte','clique_envoyer','vu_dans_envoyes'])$$, :'a1'), 'déclarer sans avoir ouvert le brouillon');
select public.prospect_mark_draft_opened(:'a1', 'gmail_app_android');
select pg_temp.ok((select draft_method = 'gmail_app_android' and state = 'ouverte' from public.prospect_attempts where id = :'a1'), 'niveau 2 « brouillon ouvert » enregistré sans rien déclarer');
select pg_temp.refuse(format($$select public.prospect_declare_attempt(%L, array['bon_compte','clique_envoyer','vu_dans_envoyes'])$$, :'a1'), 'déclaration moins de 20 s après le début');
reset role; select pg_temp.age(:'a1'); set role authenticated;
select pg_temp.refuse(format($$select public.prospect_declare_attempt(%L, array['clique_envoyer'])$$, :'a1'), 'confirmations incomplètes');
select public.prospect_declare_attempt(:'a1', array['bon_compte','clique_envoyer','vu_dans_envoyes']);
select pg_temp.ok((select a.state = 'declaree' and a.proof = 'declaration' and p.stage = 'contacte' from public.prospect_attempts a join public.prospects p on p.id = a.prospect_id where a.id = :'a1'), 'niveau 3 déclaré : preuve = déclaration, jamais « prouvé »');

\echo '== Niveau 4 : preuve par copie cachée'
reset role;
select wrong_sender, content_check from public.prospect_verify_by_bcc((select bcc_token from public.prospect_attempts where id = :'a1'), 'em-1', 'Jercat <jercat.bilman@gmail.com>', 'jercat.bilman@gmail.com',
  (select message_snapshot from public.prospect_attempts where id = :'a1')) \gset
select pg_temp.ok(:'wrong_sender' = 'f' and :'content_check' = 'complet', 'preuve reçue, bon expéditeur, contenu complet');
select pg_temp.ok((select state = 'verifiee' and proof = 'cci_recue' from public.prospect_attempts where id = :'a1'), 'tentative prouvée');
select count(*) as n_before from public.prospect_events where attempt_id = :'a1' \gset
select * from public.prospect_verify_by_bcc((select bcc_token from public.prospect_attempts where id = :'a1'), 'em-1', 'Jercat <jercat.bilman@gmail.com>', 'jercat.bilman@gmail.com', null) \g /dev/null
select pg_temp.ok((select count(*) from public.prospect_events where attempt_id = :'a1') = :n_before, 'idempotence : même copie reçue deux fois = aucun effet');
set role authenticated;
select pg_temp.refuse(format($$select public.prospect_cancel_attempt(%L, 'test')$$, :'a1'), 'annuler un envoi prouvé');

\echo '== M4/M5 : mauvais expéditeur et Mo3 : message tronqué'
select pg_temp.ok((select stage = 'pret' and approved_message_md5 is not null from public.prospects where is_test), 'carte TEST déjà validée par la reprise (ancien statut « envoyé »)');
select attempt_id as a2 from public.prospect_start_attempt(pg_temp.pid('TEST — Jercat (vous-même)'), 'email', null) \gset
reset role;
select wrong_sender as w2, content_check as c2 from public.prospect_verify_by_bcc((select bcc_token from public.prospect_attempts where id = :'a2'), 'em-2', 'Perso <perso@example.test>', 'jercat.bilman@gmail.com', 'Bonjour te') \gset
select pg_temp.ok(:'w2' = 't', 'envoi depuis l''adresse perso détecté');
select pg_temp.ok(:'c2' = 'tronque', 'message tronqué détecté');
select pg_temp.ok((select draft_opened_at is not null and declared_at is not null from public.prospect_attempts where id = :'a2'), 'la preuve complète les niveaux 2 et 3 manquants');
set role authenticated;

\echo '== Retour arrière, échec, preuve après annulation'
select attempt_id as a3 from public.prospect_start_attempt(pg_temp.pid('Toiture Démo'), 'formulaire', pg_temp.ver('Toiture Démo')) \gset
select public.prospect_mark_draft_opened(:'a3', 'site_ouvert');
reset role; select pg_temp.age(:'a3'); set role authenticated;
select pg_temp.refuse(format($$select public.prospect_declare_attempt(%L, array['formulaire_soumis'])$$, :'a3'), 'formulaire sans « confirmation du site »');
select public.prospect_declare_attempt(:'a3', array['formulaire_soumis','confirmation_du_site']);
select pg_temp.refuse(format($$select public.prospect_cancel_attempt(%L, '  ')$$, :'a3'), 'retrait sans raison');
select public.prospect_cancel_attempt(:'a3', 'Le formulaire affichait une erreur');
select pg_temp.ok((select p.stage = 'pret' from public.prospects p where p.company = 'Toiture Démo'), 'retrait : retour à « relu, pas encore contacté »');
select pg_temp.ok((select type = 'declaration_retiree' from public.prospect_events where attempt_id = :'a3' order by id desc limit 1), 'retrait tracé dans le journal');
select attempt_id as a4 from public.prospect_start_attempt(pg_temp.pid('Toiture Démo'), 'formulaire', pg_temp.ver('Toiture Démo')) \gset
select public.prospect_fail_attempt(:'a4', 'Formulaire en panne');
select pg_temp.ok((select state = 'echec' from public.prospect_attempts where id = :'a4'), 'échec enregistré avec motif');

\echo '== C6 : appel = résultat obligatoire'
select attempt_id as a5 from public.prospect_start_attempt(pg_temp.pid('Couverture.Test'), 'telephone', pg_temp.ver('Couverture.Test')) \gset
select public.prospect_mark_draft_opened(:'a5', 'numero_compose');
reset role; select pg_temp.age(:'a5'); set role authenticated;
select pg_temp.refuse(format($$select public.prospect_declare_attempt(%L, array['appel_passe'])$$, :'a5'), 'appel sans résultat');
select public.prospect_declare_attempt(:'a5', array['appel_passe'], 'pas_de_reponse');
select pg_temp.ok((select stage = 'pret' and next_action_at = (now() + interval '2 days')::date from public.prospects where company = 'Couverture.Test'), '« pas de réponse » ne compte pas comme contacté ; rappel dans 2 jours');

\echo '== C5 / M8 : réponses et STOP'
select pg_temp.refuse(format($$select public.prospect_record_reply(%L, 'positive', '', null)$$, pg_temp.pid('Menuiserie Exemple')), 'réponse sans aucun contact');
select public.prospect_record_reply(pg_temp.pid('Peinture Exemple'), 'stop', 'Merci de ne plus m''écrire', null);
select pg_temp.ok((select stage = 'ne_plus_contacter' and do_not_contact_at is not null and next_action_at is null from public.prospects where company = 'Peinture Exemple'), 'STOP enregistré et bloquant');
select pg_temp.refuse(format($$select * from public.prospect_start_attempt(%L, 'email', null)$$, pg_temp.pid('Peinture Exemple')), 'recontacter après STOP');
select pg_temp.refuse(format($$select public.prospect_approve(%L, null)$$, pg_temp.pid('Peinture Exemple')), 'revalider après STOP');
select pg_temp.refuse(format($$select public.prospect_set_next_action(%L, current_date, null)$$, pg_temp.pid('Peinture Exemple')), 'planifier une action après STOP');

\echo '== M9 : texte modifié = nouvelle validation obligatoire'
select public.prospect_update_content(pg_temp.pid('Menuiserie Exemple'), pg_temp.ver('Menuiserie Exemple'), 'https://www.menuiserie-exemple.test/', null, '06 00 00 00 05', null, 'Bonjour, texte modifié', null, null, null, null);
select pg_temp.ok((select stage = 'a_preparer' and approved_message_md5 is null from public.prospects where company = 'Menuiserie Exemple'), 'validation retirée après modification du texte');
select pg_temp.refuse(format($$select * from public.prospect_start_attempt(%L, 'formulaire', null)$$, pg_temp.pid('Menuiserie Exemple')), 'contacter avec un texte non relu');
select public.prospect_approve(pg_temp.pid('Menuiserie Exemple'), null) \g /dev/null
select pg_temp.refuse(format($$select public.prospect_approve(%L, null)$$, pg_temp.pid('Menuiserie Exemple')), 'valider deux fois le même texte');

\echo '== Mo2 : conflit entre deux onglets'
select pg_temp.refuse(format($$select public.prospect_update_notes(%L, 'x', %s)$$, pg_temp.pid('Menuiserie Exemple'), pg_temp.ver('Menuiserie Exemple') - 1), 'écriture avec une version périmée');
select pg_temp.ok(public.prospect_update_notes(pg_temp.pid('Menuiserie Exemple'), 'ok', pg_temp.ver('Menuiserie Exemple')) > 0, 'écriture avec la bonne version');

\echo '== Mo7 / Mo10 : création, doublons, provenance'
select pg_temp.refuse($$select public.prospect_create('Nouvelle SARL','Ville D','Maçon',null,'a@b.fr',null,'email','','','Sujet','Message',null,'',null,null)$$, 'création sans provenance');
select pg_temp.refuse($$select public.prospect_create('Autre','Ville D','Maçon',null,'contact@peinture-exemple.test',null,'email','','','S','M',null,'Annuaire',null,current_date)$$, 'doublon d''e-mail');
select pg_temp.refuse($$select public.prospect_create('toiture demo','VILLE B','Couvreur',null,null,'0600000000','telephone','','','','M',null,'Annuaire',null,current_date)$$, 'doublon entreprise + ville (casse, accents et « (02) » ignorés)');
select pg_temp.ok(public._prospect_norm('Ville B (02)') = public._prospect_norm('VILLE B') and public._prospect_norm('Toiture Démo') = 'toituredemo', 'normalisation des noms');
select pg_temp.ok(public.prospect_create('Nouvelle SARL','Ville D','Maçon',null,'A@B.fr',null,'email','','','Sujet','Message',null,'PagesJaunes','https://exemple.fr',current_date) is not null, 'création valide');
select pg_temp.ok((select email = 'a@b.fr' and stage = 'a_preparer' from public.prospects where company = 'Nouvelle SARL'), 'e-mail normalisé, étape « à relire »');

\echo '== Mo8 : archivage'
select attempt_id as a6 from public.prospect_start_attempt(pg_temp.pid('Menuiserie Exemple'), 'formulaire', null) \gset
select pg_temp.refuse(format($$select public.prospect_archive(%L, true, null)$$, pg_temp.pid('Menuiserie Exemple')), 'archiver avec une tentative en cours');
select public.prospect_cancel_attempt(:'a6', 'Test archivage');
select public.prospect_archive(pg_temp.pid('Menuiserie Exemple'), true, null);
select pg_temp.ok((select archived_at is not null from public.prospects where company = 'Menuiserie Exemple'), 'archivé');
select public.prospect_archive(pg_temp.pid('Menuiserie Exemple'), false, null);
select pg_temp.ok((select archived_at is null from public.prospects where company = 'Menuiserie Exemple'), 'désarchivé');

\echo '== Accès non administrateur'
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
select pg_temp.ok((select count(*) from public.prospects) = 0 and (select count(*) from public.prospect_attempts) = 0 and (select count(*) from public.prospect_events) = 0, 'artisan inscrit : rien de visible');
select pg_temp.refuse($$select public.prospect_create('X','Y','Z',null,null,'0600000000','telephone','','','','M',null,'S',null,current_date)$$, 'création par un non-administrateur');
select pg_temp.refuse($$select * from public.prospect_verify_by_bcc('x','y','z','w',null)$$, 'fausse preuve par un utilisateur');

\echo '== RGPD : effacement'
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
select pg_temp.refuse(format($$select public.prospect_erase(%L, 'mauvais nom')$$, pg_temp.pid('Couverture.Test')), 'effacement avec un mauvais nom');
select public.prospect_erase(pg_temp.pid('Couverture.Test'), 'Couverture.Test');
reset role;
select pg_temp.ok((select count(*) from public.prospects where company = 'Couverture.Test') = 0, 'fiche, tentatives et journal effacés');
select pg_temp.refuse($$delete from public.prospects$$, 'suppression directe après effacement (garde toujours actif)');
