-- =====================================================================
-- Prospection : effacer la conversation d'un prospect (messages reçus et envoyés).
-- Le prospect, ses envois et ses preuves sont conservés ; une ligne de journal
-- garde la trace de l'effacement (combien de messages, par qui, quand).
-- =====================================================================
create or replace function public.prospect_clear_messages(p_id uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare me uuid := public._prospect_require_admin(); n integer;
begin
  if not exists (select 1 from public.prospects where id = p_id) then
    raise exception 'Prospect introuvable.' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.prospect_messages where prospect_id = p_id and direction = 'out' and status = 'sending'
              and created_at > now() - interval '2 minutes') then
    raise exception 'Un message est en cours d''envoi : réessayez dans un instant.' using errcode = 'P0001';
  end if;
  delete from public.prospect_messages where prospect_id = p_id;
  get diagnostics n = row_count;
  if n = 0 then raise exception 'La conversation est déjà vide.' using errcode = 'P0001'; end if;
  update public.prospects set version = version + 1, updated_at = now() where id = p_id;
  perform public._prospect_log(p_id, null, 'utilisateur', 'conversation_effacee', jsonb_build_object('messages', n));
  return n;
end;
$$;
revoke execute on function public.prospect_clear_messages(uuid) from public, anon;
grant execute on function public.prospect_clear_messages(uuid) to authenticated;
