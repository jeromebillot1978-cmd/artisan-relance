#!/usr/bin/env bash
# Rejoue la migration Prospection v2 et ses tests sur un PostgreSQL local jetable.
# Usage : bash supabase/tests/run-prospection-tests.sh   (PostgreSQL 16 requis : initdb, pg_ctl, psql)
set -euo pipefail
cd "$(dirname "$0")/../.."
BIN=${PGBIN:-/usr/lib/postgresql/16/bin}
DIR=$(mktemp -d); PORT=${PGPORT_TEST:-55433}
RUN() { if [ "$(id -u)" = 0 ]; then su postgres -c "$*"; else bash -c "$*"; fi; }
[ "$(id -u)" = 0 ] && chown postgres "$DIR"
RUN "$BIN/initdb -D $DIR/data -A trust -E UTF8 --locale=C.UTF-8" >/dev/null
RUN "$BIN/pg_ctl -D $DIR/data -o '-p $PORT -k /tmp' -l $DIR/log start" >/dev/null
trap 'RUN "$BIN/pg_ctl -D $DIR/data stop" >/dev/null 2>&1; rm -rf "$DIR"' EXIT
sleep 1
P="psql -h /tmp -p $PORT -U postgres -X -q -v ON_ERROR_STOP=1"
$P -f supabase/tests/prospection_stubs.sql
$P -f supabase/migrations/20261120170000_prospection.sql 2>/dev/null
$P -c "grant select, insert, update, delete on public.prospects to authenticated;"
$P <<'SQL'
insert into public.prospects (position, company, city, trade, website, email, phone, channel, message, subject, status, sent_at) values
(0,'TEST — Jercat (vous-même)','Ville Test (02)','Test',null,'perso@example.test',null,'email',E'Bonjour test\n\nPour ne plus recevoir de message de ma part, répondez « stop ».','[TEST] sujet','envoye','2026-11-20 16:45+00'),
(1,'Toiture Démo','Ville B (02)','Couvreur','https://www.toiture-demo.test/',null,'01 00 00 00 01 / 06 00 00 00 02','formulaire','Bonjour couvreur',null,'envoye',now()),
(2,'Peinture Exemple','Ville A (60)','Peintre','https://www.peinture-exemple.test/','contact@peinture-exemple.test','01 00 00 00 03 / 07 00 00 00 04','email',E'Bonjour peintre\n\nPour ne plus recevoir de message de ma part, répondez « stop ».','Après le devis sous 48 h','envoye',now()),
(4,'Menuiserie Exemple','Ville C (80)','Menuisier','https://www.menuiserie-exemple.test/',null,'06 00 00 00 05','formulaire','Bonjour menuisier',null,'valide',null),
(7,'Couverture.Test','Ville B (02)','Couvreur',null,null,'06 00 00 00 06','telephone','Script','','envoye',now());
SQL
$P -f supabase/migrations/20261121090000_prospection_v2.sql 2>&1 | grep -v NOTICE || true
$P -f supabase/migrations/20261121100000_prospection_envoi_serveur.sql 2>&1 | grep -v NOTICE || true
$P -f supabase/migrations/20261121110000_prospection_reponses.sql 2>&1 | grep -v NOTICE || true
OUT=$($P -f supabase/tests/prospection_v2.test.sql 2>&1 && $P -f supabase/tests/prospection_v3_envoi_serveur.test.sql 2>&1 && $P -f supabase/tests/prospection_v4_reponses.test.sql 2>&1) || { echo "$OUT"; echo "ERREUR SQL pendant les tests"; exit 1; }
echo "$OUT"
OK=$(grep -c '^OK' <<<"$OUT" || true); KO=$(grep -c '^KO' <<<"$OUT" || true)
echo; echo "Résultat : $OK réussis, $KO échoués"
[ "$KO" = 0 ]
