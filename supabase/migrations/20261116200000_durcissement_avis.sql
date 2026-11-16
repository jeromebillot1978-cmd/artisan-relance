-- Durcissement (audit du 16/11/2026) : les fonctions des liens publics d'avis
-- ne sont plus exposées à l'API REST pour anon / authenticated.
-- Elles restent appelées par le serveur Next.js (clé service_role) sur /r/<jeton>.
revoke execute on function public.register_review_click(text, boolean) from public, anon, authenticated;
revoke execute on function public.review_token_company(text)          from public, anon, authenticated;
revoke execute on function public.review_opt_out(text)                from public, anon, authenticated;
grant  execute on function public.register_review_click(text, boolean) to service_role;
grant  execute on function public.review_token_company(text)          to service_role;
grant  execute on function public.review_opt_out(text)                to service_role;
