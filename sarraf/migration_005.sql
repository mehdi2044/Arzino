-- Migration 005
-- 1) Two-step login is enforced by the database: a user who turned it on only gets their data
--    with a session that passed the 6-digit code (JWT "aal2").
-- 2) Live board and Arzino's partner list get each exchange's auto-rate settings,
--    so "auto" boards are recalculated from the market everywhere.
-- 3) Platform admin can reset a user's two-step login (lost phone) and sees who has it on.

create or replace function mfa_ok() returns boolean
language sql stable security definer set search_path = public, auth as $$
  select coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'
      or not exists (select 1 from auth.mfa_factors f where f.user_id = auth.uid() and f.status = 'verified');
$$;
grant execute on function mfa_ok() to anon, authenticated;

create or replace function is_member(ex uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from members where exchange_id = ex and user_id = auth.uid()) and mfa_ok();
$$;

create or replace function my_role(ex uuid) returns text
language sql stable security definer set search_path = public as $$
  select role from members where exchange_id = ex and user_id = auth.uid() and mfa_ok();
$$;

create or replace function is_platform_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from platform_admins where user_id = auth.uid()) and mfa_ok();
$$;

-- auto-rate settings shared with the public views
create or replace function rate_cfg(s jsonb) returns jsonb
language sql immutable as $$
  select jsonb_build_object('mode', coalesce(s->>'rate_mode', 'manual'), 'sb', s->'spread_buy', 'ss', s->'spread_sell',
                            'round', s->'round_irt', 'fixed', coalesce(s->'board_fixed', '[]'::jsonb));
$$;

create or replace function public_board(p_ex uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when coalesce((e.settings->>'board_public')::boolean, false) and ex_feature(e.id, 'public_board') then
    jsonb_build_object(
      'name', e.name, 'logo', e.settings->'logo', 'phone', e.settings->'phone', 'address', e.settings->'address',
      'note', e.settings->'board_note', 'rows', e.settings->'board_rows', 'digits', e.settings->'board_digits',
      'branding', ex_feature(e.id, 'branding'), 'auto', rate_cfg(e.settings),
      'rates', coalesce((select jsonb_agg(jsonb_build_object('ccy', r.ccy, 'quote', r.quote, 'buy', r.buy, 'sell', r.sell, 'updated_at', r.updated_at))
                         from rates r where r.exchange_id = e.id), '[]'::jsonb))
  else null end
  from exchanges e where e.id = p_ex;
$$;
grant execute on function public_board(uuid) to anon, authenticated;

create or replace function public_directory() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', e.id, 'name', e.name, 'logo', e.settings->'logo', 'phone', e.settings->'phone',
      'city', e.settings->'city', 'address', e.settings->'address', 'rows', e.settings->'board_rows', 'auto', rate_cfg(e.settings),
      'rates', coalesce((select jsonb_agg(jsonb_build_object('ccy', r.ccy, 'quote', r.quote, 'buy', r.buy, 'sell', r.sell, 'updated_at', r.updated_at))
                         from rates r where r.exchange_id = e.id), '[]'::jsonb))
    order by e.created_at), '[]'::jsonb)
  from exchanges e
  where coalesce((e.settings->>'directory')::boolean, false) and ex_feature(e.id, 'directory');
$$;
grant execute on function public_directory() to anon, authenticated;

create or replace function admin_users() returns jsonb
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not is_platform_admin() then raise exception 'not allowed'; end if;
  return coalesce((select jsonb_agg(x order by x.created_at desc) from (
    select u.id, u.email, u.created_at, u.last_sign_in_at, u.email_confirmed_at is not null as confirmed,
      pr.first_name, pr.last_name, pr.phone, pr.country,
      (select jsonb_agg(jsonb_build_object('name', e.name, 'role', m.role)) from members m join exchanges e on e.id = m.exchange_id where m.user_id = u.id) as exchanges,
      exists(select 1 from platform_admins a where a.user_id = u.id) as is_admin,
      exists(select 1 from auth.mfa_factors f where f.user_id = u.id and f.status = 'verified') as mfa
    from auth.users u left join profiles pr on pr.user_id = u.id) x), '[]'::jsonb);
end $$;

create or replace function admin_reset_mfa(p_user uuid) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not is_platform_admin() then raise exception 'not allowed'; end if;
  delete from auth.mfa_factors where user_id = p_user;
end $$;
grant execute on function admin_reset_mfa(uuid) to authenticated;

select 'ok' as result;
