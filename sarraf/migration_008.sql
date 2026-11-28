-- 008: demo without sign-up, referrals, cleaner admin lists.
--   • Demo: a visitor can open a sample exchange without an email (anonymous sign-in). Demo exchanges are marked is_demo,
--     never appear in the admin lists or in Arzino, and are deleted after 24 hours.
--   • Referral: every exchange has a short code. A new exchange that signs up with that code is linked to the one that
--     invited it. When the new exchange's first payment is approved, both get free days (platform_settings.referral).
--   • Admin lists skip anonymous demo users and demo exchanges, and show who invited whom.

-- ---------- columns ----------
alter table exchanges add column if not exists is_demo boolean not null default false;
alter table exchanges add column if not exists ref_code text;
alter table exchanges add column if not exists referred_by uuid references exchanges(id) on delete set null;
alter table exchanges add column if not exists ref_rewarded boolean not null default false;
update exchanges set ref_code = upper(substr(replace(id::text, '-', ''), 1, 6)) where ref_code is null;
alter table exchanges alter column ref_code set default upper(substr(md5(gen_random_uuid()::text), 1, 6));
create unique index if not exists exchanges_ref_code_idx on exchanges(ref_code);

insert into platform_settings(key, value, visibility) values ('referral', '{"on":true,"days":30}', 'public')
  on conflict (key) do nothing;

-- ---------- helpers ----------
create or replace function is_anon() returns boolean
language sql stable as $$ select coalesce((auth.jwt()->>'is_anonymous')::boolean, false); $$;

-- free days for one exchange: extends a running paid/trial plan, otherwise gives the Pro plan for those days
create or replace function ref_bonus(p_ex uuid, p_days int) returns void
language plpgsql security definer set search_path = public as $$
declare s subscriptions;
begin
  if p_days is null or p_days <= 0 then return; end if;
  select * into s from subscriptions where exchange_id = p_ex;
  if s.status = 'suspended' then return; end if;
  if s.exchange_id is not null and s.status in ('active','trial') and s.period_end > now() and coalesce(s.plan_id, 'free') <> 'free' then
    update subscriptions set period_end = period_end + make_interval(days => p_days), updated_at = now() where exchange_id = p_ex;
  else
    insert into subscriptions(exchange_id, plan_id, status, period_end, updated_at)
    values (p_ex, 'pro', 'active', now() + make_interval(days => p_days), now())
    on conflict (exchange_id) do update set plan_id = 'pro', status = 'active', period_end = excluded.period_end, updated_at = now();
  end if;
end $$;
revoke all on function ref_bonus(uuid, int) from public, anon, authenticated;

-- ---------- create exchange (with optional referral code); demo users cannot create real exchanges ----------
create or replace function create_exchange(p_name text, p_display_name text, p_base text, p_ref text)
returns uuid language plpgsql security definer set search_path = public as $$
declare ex uuid; em text; owned int; allowed int; tr jsonb; refx uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if is_anon() then raise exception 'DEMO_ACCOUNT'; end if;
  select count(*) into owned from members m join exchanges e on e.id = m.exchange_id where m.user_id = auth.uid() and m.role = 'owner' and not e.is_demo;
  select coalesce(max(ex_limit(exchange_id, 'exchanges')), 1) into allowed from members where user_id = auth.uid() and role = 'owner';
  if owned >= allowed and not is_platform_admin() then raise exception 'LIMIT_EXCHANGES'; end if;
  select email into em from auth.users where id = auth.uid();
  if nullif(trim(coalesce(p_ref, '')), '') is not null then
    select e.id into refx from exchanges e where e.ref_code = upper(trim(p_ref)) and not e.is_demo
      and not exists(select 1 from members m where m.exchange_id = e.id and m.user_id = auth.uid());   -- no self-referral
  end if;
  insert into exchanges(name, base_ccy, created_by, referred_by) values (p_name, coalesce(p_base,'USD'), auth.uid(), refx) returning id into ex;
  insert into members(exchange_id, user_id, role, display_name, email, share_pct) values (ex, auth.uid(), 'owner', p_display_name, em, 100);
  insert into boxes(exchange_id, name, currency, kind, sort) values
    (ex, 'صندوق نقد لیر', 'TRY', 'cash', 1), (ex, 'صندوق نقد دلار', 'USD', 'cash', 2), (ex, 'صندوق نقد یورو', 'EUR', 'cash', 3),
    (ex, 'حساب تومانی ایران', 'IRT', 'bank', 4), (ex, 'کیف پول تتر', 'USDT', 'wallet', 5);
  insert into customers(exchange_id, name, notes, is_walkin) values (ex, 'مشتری گذری', 'برای معاملات نقدی بدون نام', true);
  select value into tr from platform_settings where key = 'trial';
  if coalesce((tr->>'days')::int, 0) > 0 then
    insert into subscriptions(exchange_id, plan_id, status, period_end)
      values (ex, coalesce(tr->>'plan', 'pro'), 'trial', now() + make_interval(days => (tr->>'days')::int));
  end if;
  return ex;
end $$;
grant execute on function create_exchange(text, text, text, text) to authenticated;

-- the old 3-argument version (pages still open in a browser) now goes through the new one
create or replace function create_exchange(p_name text, p_display_name text, p_base text default 'USD')
returns uuid language sql security definer set search_path = public as $$
  select create_exchange(p_name, p_display_name, p_base, null::text);
$$;

-- ---------- demo exchange for an anonymous visitor ----------
create or replace function create_demo_exchange(p_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare ex uuid;
begin
  if auth.uid() is null or not is_anon() then raise exception 'only for demo visitors'; end if;
  delete from exchanges where is_demo and created_at < now() - interval '24 hours';        -- tidy up old demos
  select m.exchange_id into ex from members m join exchanges e on e.id = m.exchange_id where m.user_id = auth.uid() and e.is_demo limit 1;
  if ex is not null then return ex; end if;
  insert into exchanges(name, base_ccy, created_by, is_demo) values (coalesce(nullif(trim(p_name), ''), 'Demo'), 'USD', auth.uid(), true) returning id into ex;
  insert into members(exchange_id, user_id, role, display_name, email, share_pct) values (ex, auth.uid(), 'owner', 'Demo', null, 100);
  insert into boxes(exchange_id, name, currency, kind, sort) values
    (ex, 'صندوق نقد لیر', 'TRY', 'cash', 1), (ex, 'صندوق نقد دلار', 'USD', 'cash', 2), (ex, 'صندوق نقد یورو', 'EUR', 'cash', 3),
    (ex, 'حساب تومانی ایران', 'IRT', 'bank', 4), (ex, 'کیف پول تتر', 'USDT', 'wallet', 5);
  insert into customers(exchange_id, name, notes, is_walkin) values (ex, 'مشتری گذری', 'برای معاملات نقدی بدون نام', true);
  insert into subscriptions(exchange_id, plan_id, status, period_end) values (ex, 'pro', 'trial', now() + interval '24 hours');
  return ex;
end $$;
grant execute on function create_demo_exchange(text) to authenticated;

-- ---------- referral info for the exchange's own panel ----------
create or replace function my_referrals(p_ex uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_manager(p_ex) then raise exception 'not allowed'; end if;
  return jsonb_build_object(
    'code', (select ref_code from exchanges where id = p_ex),
    'joined', (select count(*) from exchanges where referred_by = p_ex and not is_demo),
    'rewarded', (select count(*) from exchanges where referred_by = p_ex and ref_rewarded),
    'settings', (select value from platform_settings where key = 'referral'));
end $$;
grant execute on function my_referrals(uuid) to authenticated;

-- ---------- payment approval: also pays out the referral bonus on the first approved payment ----------
create or replace function admin_review_payment(p_id uuid, p_approve boolean, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare pay payments; s subscriptions; start_at timestamptz; e exchanges; rs jsonb; days int;
begin
  if not is_platform_admin() then raise exception 'not allowed'; end if;
  select * into pay from payments where id = p_id;
  if pay.id is null or pay.status <> 'pending' then raise exception 'payment is not pending'; end if;
  update payments set status = case when p_approve then 'approved' else 'rejected' end, admin_note = p_note, reviewed_at = now() where id = p_id;
  if p_approve then
    select * into s from subscriptions where exchange_id = pay.exchange_id;
    start_at := case when s.status = 'active' and s.plan_id = pay.plan_id and s.period_end > now() then s.period_end else now() end;
    insert into subscriptions(exchange_id, plan_id, status, period_end, updated_at)
    values (pay.exchange_id, pay.plan_id, 'active', start_at + make_interval(months => pay.months), now())
    on conflict (exchange_id) do update set plan_id = excluded.plan_id, status = 'active', period_end = excluded.period_end, updated_at = now();
    -- referral bonus, once per invited exchange
    select * into e from exchanges where id = pay.exchange_id;
    select value into rs from platform_settings where key = 'referral';
    days := coalesce((rs->>'days')::int, 30);
    if e.referred_by is not null and not e.ref_rewarded and coalesce((rs->>'on')::boolean, true) then
      perform ref_bonus(e.id, days);
      perform ref_bonus(e.referred_by, days);
      update exchanges set ref_rewarded = true where id = e.id;
    end if;
  end if;
end $$;

-- ---------- admin lists without demo data ----------
create or replace function admin_overview() returns jsonb
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not is_platform_admin() then raise exception 'not allowed'; end if;
  return jsonb_build_object(
    'exchanges', (select count(*) from exchanges where not is_demo),
    'users', (select count(*) from auth.users where not coalesce(is_anonymous, false)),
    'users_7d', (select count(*) from auth.users where not coalesce(is_anonymous, false) and created_at > now() - interval '7 days'),
    'paid', (select count(*) from subscriptions s join exchanges e on e.id = s.exchange_id where not e.is_demo and s.status = 'active' and (s.period_end is null or s.period_end > now())),
    'trial', (select count(*) from subscriptions s join exchanges e on e.id = s.exchange_id where not e.is_demo and s.status = 'trial' and s.period_end > now()),
    'pending', (select count(*) from payments where status = 'pending'),
    'income_30d', (select coalesce(jsonb_object_agg(currency, s), '{}'::jsonb) from (select currency, sum(amount) s from payments where status = 'approved' and reviewed_at > now() - interval '30 days' group by currency) x),
    'txns_7d', (select count(*) from txns t join exchanges e on e.id = t.exchange_id where not e.is_demo and t.created_at > now() - interval '7 days'),
    'demos_24h', (select count(*) from exchanges where is_demo and created_at > now() - interval '24 hours'));
end $$;

create or replace function admin_exchanges() returns jsonb
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not is_platform_admin() then raise exception 'not allowed'; end if;
  return coalesce((select jsonb_agg(x order by x.created_at desc) from (
    select e.id, e.name, e.created_at, e.ref_code, e.ref_rewarded,
      (select r.name from exchanges r where r.id = e.referred_by) as referred_by,
      (select count(*) from exchanges r where r.referred_by = e.id) as referrals,
      (select jsonb_build_object('email', u.email, 'name', concat_ws(' ', pr.first_name, pr.last_name), 'phone', pr.phone, 'country', pr.country)
         from members m join auth.users u on u.id = m.user_id left join profiles pr on pr.user_id = m.user_id
         where m.exchange_id = e.id and m.role = 'owner' limit 1) as owner,
      (select count(*) from members m where m.exchange_id = e.id) as staff,
      (select count(*) from customers c where c.exchange_id = e.id and not c.is_walkin) as customers,
      (select count(*) from txns t where t.exchange_id = e.id) as txns,
      (select max(t.created_at) from txns t where t.exchange_id = e.id) as last_txn,
      ex_plan(e.id) as plan,
      (select to_jsonb(s) from subscriptions s where s.exchange_id = e.id) as sub
    from exchanges e where not e.is_demo) x), '[]'::jsonb);
end $$;

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
    from auth.users u left join profiles pr on pr.user_id = u.id
    where not coalesce(u.is_anonymous, false)) x), '[]'::jsonb);
end $$;

select 'ok' as result,
  (select count(*) from exchanges where ref_code is not null) as exchanges_with_code,
  (select value from platform_settings where key = 'referral') as referral;
