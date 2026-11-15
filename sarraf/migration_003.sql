-- =====================================================================
--  Migration 003 — Sarrafino SaaS: plans, subscriptions, payments by bank
--  transfer + receipt, user profiles, platform admin, ads, exchange directory
-- =====================================================================

-- ---------- platform admins ----------
create table if not exists platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table platform_admins enable row level security;
create or replace function is_platform_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from platform_admins where user_id = auth.uid());
$$;
drop policy if exists pa_sel on platform_admins;
create policy pa_sel on platform_admins for select using (user_id = auth.uid() or is_platform_admin());
grant execute on function is_platform_admin() to anon, authenticated;

-- ---------- user profiles (filled from the signup form) ----------
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text, first_name text, last_name text, phone text, country text,
  created_at timestamptz not null default now()
);
alter table profiles enable row level security;
drop policy if exists prof_sel on profiles;
drop policy if exists prof_upd on profiles;
drop policy if exists prof_ins on profiles;
create policy prof_sel on profiles for select using (user_id = auth.uid() or is_platform_admin());
create policy prof_upd on profiles for update using (user_id = auth.uid() or is_platform_admin());
create policy prof_ins on profiles for insert with check (user_id = auth.uid());

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles(user_id, email, first_name, last_name, phone, country)
  values (new.id, new.email, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name',
          new.raw_user_meta_data->>'phone', new.raw_user_meta_data->>'country')
  on conflict (user_id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();
-- existing users
insert into profiles(user_id, email, first_name, last_name, phone, country)
  select id, email, coalesce(raw_user_meta_data->>'first_name', raw_user_meta_data->>'name'), raw_user_meta_data->>'last_name',
         raw_user_meta_data->>'phone', raw_user_meta_data->>'country' from auth.users
  on conflict (user_id) do nothing;

-- ---------- platform settings (key/value, editable in the admin panel) ----------
create table if not exists platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  visibility text not null default 'admin' check (visibility in ('public','users','admin')),
  updated_at timestamptz not null default now()
);
alter table platform_settings enable row level security;
drop policy if exists ps_sel on platform_settings;
drop policy if exists ps_all on platform_settings;
create policy ps_sel on platform_settings for select using (
  visibility = 'public' or (visibility = 'users' and auth.uid() is not null) or is_platform_admin());
create policy ps_all on platform_settings for all using (is_platform_admin()) with check (is_platform_admin());

insert into platform_settings(key, value, visibility) values
  ('trial', '{"plan":"pro","days":14}', 'public'),
  ('free_plan', '{"plan":"free"}', 'public'),
  ('payment', '{"currency":"USD","bank":{"fa":"","tr":"","en":"","ar":""},"note":{"fa":"پس از واریز، تصویر فیش را بارگذاری کنید. اشتراک پس از تأیید فعال می‌شود.","tr":"Ödemeden sonra dekontun görselini yükleyin. Abonelik onaydan sonra etkinleşir.","en":"After paying, upload a photo of the receipt. The subscription starts once it is approved.","ar":"بعد الدفع ارفع صورة الإيصال. يبدأ الاشتراك بعد الموافقة."}}', 'users'),
  ('contact', '{"whatsapp":"","email":"","brand":"Sarrafino"}', 'public'),
  ('ads', '{
     "enabled": true,
     "adfree_for_subscribers": true,
     "adsense": {"client": "", "slot_banner": "", "slot_feed": "", "langs": ["tr","en","ar"]},
     "banner": {"on": true},
     "feed": {"on": true, "every": 8},
     "converter": {"on": true},
     "interstitial": {"on": true, "after_actions": 6, "first_after_opens": 2, "min_minutes": 5, "countdown": 5, "max_per_day": 6},
     "reward": {"on": true, "hours": 24, "countdown": 15}
   }', 'public')
on conflict (key) do nothing;

-- ---------- plans ----------
create table if not exists plans (
  id text primary key,
  name jsonb not null,
  description jsonb not null default '{}'::jsonb,
  price_month numeric not null default 0,
  price_year numeric not null default 0,
  currency text not null default 'USD',
  limits jsonb not null default '{}'::jsonb,     -- {staff, customers, langs, exchanges}
  features jsonb not null default '{}'::jsonb,   -- {board, receipts_wa, trusts, expenses, reports, excel, partners, public_board, directory, branding}
  is_public boolean not null default true,
  highlight boolean not null default false,
  sort int not null default 0,
  updated_at timestamptz not null default now()
);
alter table plans enable row level security;
drop policy if exists plan_sel on plans;
drop policy if exists plan_all on plans;
create policy plan_sel on plans for select using (is_public or is_platform_admin());
create policy plan_all on plans for all using (is_platform_admin()) with check (is_platform_admin());

insert into plans(id, name, description, price_month, price_year, limits, features, highlight, sort) values
 ('free', '{"fa":"رایگان","tr":"Ücretsiz","en":"Free","ar":"مجاني"}',
  '{"fa":"برای شروع و صرافی‌های تک‌نفره","tr":"Başlangıç ve tek kişilik bürolar için","en":"To get started, for one-person offices","ar":"للبداية وللمكاتب الفردية"}',
  0, 0, '{"staff":1,"customers":50,"langs":1,"exchanges":1}',
  '{"board":true,"receipts_wa":true,"trusts":false,"expenses":true,"reports":false,"excel":false,"partners":false,"public_board":false,"directory":false,"branding":false}', false, 1),
 ('starter', '{"fa":"پایه","tr":"Başlangıç","en":"Starter","ar":"أساسي"}',
  '{"fa":"برای صرافی کوچک با چند کارمند","tr":"Birkaç çalışanı olan küçük bürolar için","en":"For a small office with a few staff","ar":"لمكتب صغير مع بضعة موظفين"}',
  9, 90, '{"staff":3,"customers":500,"langs":2,"exchanges":1}',
  '{"board":true,"receipts_wa":true,"trusts":true,"expenses":true,"reports":true,"excel":true,"partners":false,"public_board":false,"directory":false,"branding":false}', false, 2),
 ('pro', '{"fa":"حرفه‌ای","tr":"Profesyonel","en":"Pro","ar":"احترافي"}',
  '{"fa":"همه‌ی امکانات، شریک‌ها، تابلوی زنده و معرفی در ارزینو","tr":"Tüm özellikler, ortaklar, canlı pano ve Arzino’da tanıtım","en":"Everything: partners, live board and a listing in Arzino","ar":"كل الميزات: الشركاء واللوحة المباشرة والظهور في أرزينو"}',
  19, 190, '{"staff":10,"customers":1000,"langs":4,"exchanges":1}',
  '{"board":true,"receipts_wa":true,"trusts":true,"expenses":true,"reports":true,"excel":true,"partners":true,"public_board":true,"directory":true,"branding":true}', true, 3),
 ('business', '{"fa":"تجاری","tr":"Kurumsal","en":"Business","ar":"أعمال"}',
  '{"fa":"برای صرافی‌های بزرگ و چند شعبه","tr":"Büyük ve çok şubeli bürolar için","en":"For large offices with several branches","ar":"للمكاتب الكبيرة متعددة الفروع"}',
  39, 390, '{"staff":25,"customers":5000,"langs":4,"exchanges":3}',
  '{"board":true,"receipts_wa":true,"trusts":true,"expenses":true,"reports":true,"excel":true,"partners":true,"public_board":true,"directory":true,"branding":true}', false, 4)
on conflict (id) do nothing;

-- ---------- subscriptions (one per exchange) ----------
create table if not exists subscriptions (
  exchange_id uuid primary key references exchanges(id) on delete cascade,
  plan_id text references plans(id),
  status text not null default 'trial' check (status in ('trial','active','suspended')),
  period_end timestamptz,
  overrides jsonb not null default '{}'::jsonb,  -- {"limits":{...},"features":{...}} custom package for one exchange
  note text,
  updated_at timestamptz not null default now()
);
alter table subscriptions enable row level security;
drop policy if exists sub_sel on subscriptions;
drop policy if exists sub_all on subscriptions;
create policy sub_sel on subscriptions for select using (is_member(exchange_id) or is_platform_admin());
create policy sub_all on subscriptions for all using (is_platform_admin()) with check (is_platform_admin());

-- effective plan of an exchange: paid/trial plan while valid, otherwise the free plan; plus per-exchange overrides
create or replace function ex_plan(p_ex uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare s subscriptions; free_id text; pid text; st text; p plans;
begin
  select coalesce(value->>'plan', 'free') into free_id from platform_settings where key = 'free_plan';
  free_id := coalesce(free_id, 'free');
  select * into s from subscriptions where exchange_id = p_ex;
  if s.exchange_id is not null and s.status in ('trial','active') and (s.period_end is null or s.period_end > now()) then
    pid := s.plan_id; st := s.status;
  elsif s.exchange_id is not null and s.status = 'suspended' then
    pid := free_id; st := 'suspended';
  else
    pid := free_id; st := case when s.exchange_id is null then 'free' else 'expired' end;
  end if;
  select * into p from plans where id = pid;
  return jsonb_build_object(
    'plan', pid, 'paid_plan', s.plan_id, 'status', st, 'period_end', s.period_end,
    'name', p.name,
    'limits', coalesce(p.limits, '{}'::jsonb) || coalesce(s.overrides->'limits', '{}'::jsonb),
    'features', coalesce(p.features, '{}'::jsonb) || coalesce(s.overrides->'features', '{}'::jsonb));
end $$;
grant execute on function ex_plan(uuid) to authenticated;

create or replace function ex_limit(p_ex uuid, k text) returns int
language sql stable security definer set search_path = public as $$
  select coalesce((ex_plan(p_ex)->'limits'->>k)::int, 1000000);
$$;
create or replace function ex_feature(p_ex uuid, k text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((ex_plan(p_ex)->'features'->>k)::boolean, false);
$$;

-- ---------- limits enforced in the database ----------
create or replace function chk_customer_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.is_walkin then return new; end if;
  if (select count(*) from customers where exchange_id = new.exchange_id and not is_walkin) >= ex_limit(new.exchange_id, 'customers') then
    raise exception 'LIMIT_CUSTOMERS';
  end if;
  return new;
end $$;
drop trigger if exists limit_customers on customers;
create trigger limit_customers before insert on customers for each row execute function chk_customer_limit();

create or replace function chk_staff_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  n := (select count(*) from members where exchange_id = new.exchange_id)
     + (select count(*) from invites where exchange_id = new.exchange_id);
  if tg_table_name = 'members' then n := n - (select count(*) from invites where exchange_id = new.exchange_id and lower(email) = lower(coalesce(new.email,''))); end if;
  if n >= ex_limit(new.exchange_id, 'staff') then raise exception 'LIMIT_STAFF'; end if;
  return new;
end $$;
drop trigger if exists limit_staff_inv on invites;
create trigger limit_staff_inv before insert on invites for each row execute function chk_staff_limit();
drop trigger if exists limit_staff_mem on members;
create trigger limit_staff_mem before insert on members for each row execute function chk_staff_limit();

-- invites that no longer fit the plan must not stop the invited person from signing in
create or replace function accept_invites(p_display_name text default null)
returns int language plpgsql security definer set search_path = public as $$
declare em text; n int := 0; i record;
begin
  select lower(email) into em from auth.users where id = auth.uid();
  for i in select * from invites where lower(email) = em loop
    begin
      insert into members(exchange_id, user_id, role, display_name, email, share_pct)
        values (i.exchange_id, auth.uid(), i.role, coalesce(i.display_name, p_display_name, em), em, coalesce(i.share_pct,0))
        on conflict (exchange_id, user_id) do nothing;
      delete from invites where id = i.id;
      n := n + 1;
    exception when others then null;
    end;
  end loop;
  return n;
end $$;

-- new exchange: trial of the configured plan; owners can only own as many exchanges as their plan allows
create or replace function create_exchange(p_name text, p_display_name text, p_base text default 'USD')
returns uuid language plpgsql security definer set search_path = public as $$
declare ex uuid; em text; owned int; allowed int; tr jsonb;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select count(*) into owned from members where user_id = auth.uid() and role = 'owner';
  select coalesce(max(ex_limit(exchange_id, 'exchanges')), 1) into allowed from members where user_id = auth.uid() and role = 'owner';
  if owned >= allowed and not is_platform_admin() then raise exception 'LIMIT_EXCHANGES'; end if;
  select email into em from auth.users where id = auth.uid();
  insert into exchanges(name, base_ccy, created_by) values (p_name, coalesce(p_base,'USD'), auth.uid()) returning id into ex;
  insert into members(exchange_id, user_id, role, display_name, email, share_pct)
    values (ex, auth.uid(), 'owner', p_display_name, em, 100);
  insert into boxes(exchange_id, name, currency, kind, sort) values
    (ex, 'صندوق نقد لیر', 'TRY', 'cash', 1),
    (ex, 'صندوق نقد دلار', 'USD', 'cash', 2),
    (ex, 'صندوق نقد یورو', 'EUR', 'cash', 3),
    (ex, 'حساب تومانی ایران', 'IRT', 'bank', 4),
    (ex, 'کیف پول تتر', 'USDT', 'wallet', 5);
  insert into customers(exchange_id, name, notes, is_walkin) values (ex, 'مشتری گذری', 'برای معاملات نقدی بدون نام', true);
  select value into tr from platform_settings where key = 'trial';
  if coalesce((tr->>'days')::int, 0) > 0 then
    insert into subscriptions(exchange_id, plan_id, status, period_end)
      values (ex, coalesce(tr->>'plan', 'pro'), 'trial', now() + make_interval(days => (tr->>'days')::int));
  end if;
  return ex;
end $$;

-- ---------- payments: bank transfer + receipt image, approved by the admin ----------
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  exchange_id uuid not null references exchanges(id) on delete cascade,
  plan_id text not null references plans(id),
  months int not null check (months in (1, 12)),
  amount numeric not null,
  currency text not null default 'USD',
  receipt_path text,
  payer_note text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_note text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
alter table payments enable row level security;
drop policy if exists pay_sel on payments;
drop policy if exists pay_ins on payments;
drop policy if exists pay_adm on payments;
create policy pay_sel on payments for select using (is_manager(exchange_id) or is_platform_admin());
create policy pay_ins on payments for insert with check (is_manager(exchange_id) and status = 'pending');
create policy pay_adm on payments for update using (is_platform_admin()) with check (is_platform_admin());

-- price is always taken from the plans table, never from the browser
create or replace function request_payment(p_ex uuid, p_plan text, p_months int, p_receipt text, p_note text)
returns uuid language plpgsql security definer set search_path = public as $$
declare p plans; id uuid;
begin
  if not is_manager(p_ex) then raise exception 'only owner or partner can pay'; end if;
  select * into p from plans where plans.id = p_plan and is_public;
  if p.id is null then raise exception 'plan not found'; end if;
  insert into payments(exchange_id, plan_id, months, amount, currency, receipt_path, payer_note)
  values (p_ex, p_plan, p_months, case when p_months = 12 then p.price_year else p.price_month end, p.currency, p_receipt, p_note)
  returning payments.id into id;
  return id;
end $$;
grant execute on function request_payment(uuid, text, int, text, text) to authenticated;

-- receipts bucket (private): files live under <exchange_id>/...
insert into storage.buckets(id, name, public) values ('receipts', 'receipts', false) on conflict (id) do nothing;
drop policy if exists rcpt_ins on storage.objects;
drop policy if exists rcpt_sel on storage.objects;
create policy rcpt_ins on storage.objects for insert to authenticated
  with check (bucket_id = 'receipts' and is_manager(((storage.foldername(name))[1])::uuid));
create policy rcpt_sel on storage.objects for select to authenticated
  using (bucket_id = 'receipts' and (is_platform_admin() or is_manager(((storage.foldername(name))[1])::uuid)));

-- ---------- admin RPCs ----------
create or replace function admin_overview() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_platform_admin() then raise exception 'not allowed'; end if;
  return jsonb_build_object(
    'exchanges', (select count(*) from exchanges),
    'users', (select count(*) from auth.users),
    'users_7d', (select count(*) from auth.users where created_at > now() - interval '7 days'),
    'paid', (select count(*) from subscriptions where status = 'active' and (period_end is null or period_end > now())),
    'trial', (select count(*) from subscriptions where status = 'trial' and period_end > now()),
    'pending', (select count(*) from payments where status = 'pending'),
    'income_30d', (select coalesce(jsonb_object_agg(currency, s), '{}'::jsonb) from (select currency, sum(amount) s from payments where status = 'approved' and reviewed_at > now() - interval '30 days' group by currency) x),
    'txns_7d', (select count(*) from txns where created_at > now() - interval '7 days'));
end $$;

create or replace function admin_exchanges() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_platform_admin() then raise exception 'not allowed'; end if;
  return coalesce((select jsonb_agg(x order by x.created_at desc) from (
    select e.id, e.name, e.created_at,
      (select jsonb_build_object('email', u.email, 'name', concat_ws(' ', pr.first_name, pr.last_name), 'phone', pr.phone, 'country', pr.country)
         from members m join auth.users u on u.id = m.user_id left join profiles pr on pr.user_id = m.user_id
         where m.exchange_id = e.id and m.role = 'owner' limit 1) as owner,
      (select count(*) from members m where m.exchange_id = e.id) as staff,
      (select count(*) from customers c where c.exchange_id = e.id and not c.is_walkin) as customers,
      (select count(*) from txns t where t.exchange_id = e.id) as txns,
      (select max(t.created_at) from txns t where t.exchange_id = e.id) as last_txn,
      ex_plan(e.id) as plan,
      (select to_jsonb(s) from subscriptions s where s.exchange_id = e.id) as sub
    from exchanges e) x), '[]'::jsonb);
end $$;

create or replace function admin_users() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_platform_admin() then raise exception 'not allowed'; end if;
  return coalesce((select jsonb_agg(x order by x.created_at desc) from (
    select u.id, u.email, u.created_at, u.last_sign_in_at, u.email_confirmed_at is not null as confirmed,
      pr.first_name, pr.last_name, pr.phone, pr.country,
      (select jsonb_agg(jsonb_build_object('name', e.name, 'role', m.role)) from members m join exchanges e on e.id = m.exchange_id where m.user_id = u.id) as exchanges,
      exists(select 1 from platform_admins a where a.user_id = u.id) as is_admin
    from auth.users u left join profiles pr on pr.user_id = u.id) x), '[]'::jsonb);
end $$;

create or replace function admin_set_subscription(p_ex uuid, p_plan text, p_status text, p_end timestamptz, p_overrides jsonb, p_note text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_platform_admin() then raise exception 'not allowed'; end if;
  insert into subscriptions(exchange_id, plan_id, status, period_end, overrides, note, updated_at)
  values (p_ex, p_plan, p_status, p_end, coalesce(p_overrides, '{}'::jsonb), p_note, now())
  on conflict (exchange_id) do update set plan_id = excluded.plan_id, status = excluded.status, period_end = excluded.period_end,
    overrides = excluded.overrides, note = excluded.note, updated_at = now();
end $$;

create or replace function admin_review_payment(p_id uuid, p_approve boolean, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare pay payments; s subscriptions; start_at timestamptz;
begin
  if not is_platform_admin() then raise exception 'not allowed'; end if;
  select * into pay from payments where id = p_id;
  if pay.id is null or pay.status <> 'pending' then raise exception 'payment is not pending'; end if;
  update payments set status = case when p_approve then 'approved' else 'rejected' end, admin_note = p_note, reviewed_at = now() where id = p_id;
  if p_approve then
    select * into s from subscriptions where exchange_id = pay.exchange_id;
    -- renewal of the same paid plan continues from the current end date
    start_at := case when s.status = 'active' and s.plan_id = pay.plan_id and s.period_end > now() then s.period_end else now() end;
    insert into subscriptions(exchange_id, plan_id, status, period_end, updated_at)
    values (pay.exchange_id, pay.plan_id, 'active', start_at + make_interval(months => pay.months), now())
    on conflict (exchange_id) do update set plan_id = excluded.plan_id, status = 'active', period_end = excluded.period_end, updated_at = now();
  end if;
end $$;

create or replace function admin_set_admin(p_user uuid, p_on boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_platform_admin() then raise exception 'not allowed'; end if;
  if p_on then insert into platform_admins(user_id) values (p_user) on conflict do nothing;
  elsif p_user <> auth.uid() then delete from platform_admins where user_id = p_user; end if;
end $$;

grant execute on function admin_overview() to authenticated;
grant execute on function admin_exchanges() to authenticated;
grant execute on function admin_users() to authenticated;
grant execute on function admin_set_subscription(uuid, text, text, timestamptz, jsonb, text) to authenticated;
grant execute on function admin_review_payment(uuid, boolean, text) to authenticated;
grant execute on function admin_set_admin(uuid, boolean) to authenticated;

-- ---------- house ads (own ads + ads sold directly to sponsors) ----------
create table if not exists house_ads (
  id uuid primary key default gen_random_uuid(),
  advertiser text,
  title jsonb not null default '{}'::jsonb,        -- per language
  body jsonb not null default '{}'::jsonb,
  cta jsonb not null default '{}'::jsonb,
  image text,                                      -- URL or small data URL
  link text,
  langs text[],                                    -- null = every language
  placements text[] not null default '{banner,feed,interstitial}',
  weight int not null default 1,
  active boolean not null default true,
  starts_at timestamptz, ends_at timestamptz,
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  created_at timestamptz not null default now()
);
alter table house_ads enable row level security;
drop policy if exists ad_sel on house_ads;
drop policy if exists ad_all on house_ads;
create policy ad_sel on house_ads for select using (
  (active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now())) or is_platform_admin());
create policy ad_all on house_ads for all using (is_platform_admin()) with check (is_platform_admin());

create or replace function ad_hit(p_id uuid, p_click boolean) returns void
language sql security definer set search_path = public as $$
  update house_ads set impressions = impressions + (case when p_click then 0 else 1 end),
                       clicks = clicks + (case when p_click then 1 else 0 end) where id = p_id and active;
$$;
grant execute on function ad_hit(uuid, boolean) to anon, authenticated;

insert into house_ads(advertiser, title, body, cta, link, placements, weight)
select 'Sarrafino',
  '{"fa":"صرافی دارید؟ حسابش را با صرافینو نگه دارید","tr":"Döviz büronuz mu var? Hesabını Sarrafino ile tutun","en":"Run an exchange office? Keep its books with Sarrafino","ar":"لديك مكتب صرافة؟ نظّم حساباته مع صرافينو"}',
  '{"fa":"معامله، طلب و بدهی مشتری، صندوق‌ها، رسید واتس‌اپ و تابلوی نرخ — رایگان شروع کنید.","tr":"İşlemler, müşteri alacak/borçları, kasalar, WhatsApp makbuzu ve kur panosu — ücretsiz başlayın.","en":"Trades, customer balances, cash boxes, WhatsApp receipts and a rate board — start free.","ar":"المعاملات وذمم العملاء والصناديق وإيصالات واتساب ولوحة الأسعار — ابدأ مجاناً."}',
  '{"fa":"شروع رایگان","tr":"Ücretsiz başla","en":"Start free","ar":"ابدأ مجاناً"}',
  'sarrafino/', '{banner,feed,interstitial}', 3
where not exists (select 1 from house_ads where advertiser = 'Sarrafino');

-- ---------- feature gates on server-side features ----------
-- live public board only for plans with "public_board"
create or replace function public_board(p_ex uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when coalesce((e.settings->>'board_public')::boolean, false) and ex_feature(e.id, 'public_board') then
    jsonb_build_object(
      'name', e.name, 'logo', e.settings->'logo', 'phone', e.settings->'phone', 'address', e.settings->'address',
      'note', e.settings->'board_note', 'rows', e.settings->'board_rows', 'digits', e.settings->'board_digits',
      'branding', ex_feature(e.id, 'branding'),
      'rates', coalesce((select jsonb_agg(jsonb_build_object('ccy', r.ccy, 'quote', r.quote, 'buy', r.buy, 'sell', r.sell, 'updated_at', r.updated_at))
                         from rates r where r.exchange_id = e.id), '[]'::jsonb))
  else null end
  from exchanges e where e.id = p_ex;
$$;
grant execute on function public_board(uuid) to anon, authenticated;

-- exchanges listed in Arzino ("featured exchanges"): opted in + plan allows it
create or replace function public_directory() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', e.id, 'name', e.name, 'logo', e.settings->'logo', 'phone', e.settings->'phone',
      'city', e.settings->'city', 'address', e.settings->'address',
      'rates', coalesce((select jsonb_agg(jsonb_build_object('ccy', r.ccy, 'quote', r.quote, 'buy', r.buy, 'sell', r.sell, 'updated_at', r.updated_at))
                         from rates r where r.exchange_id = e.id), '[]'::jsonb))
    order by e.created_at), '[]'::jsonb)
  from exchanges e
  where coalesce((e.settings->>'directory')::boolean, false) and ex_feature(e.id, 'directory');
$$;
grant execute on function public_directory() to anon, authenticated;

-- ---------- existing exchanges start a trial too ----------
insert into subscriptions(exchange_id, plan_id, status, period_end)
  select id, 'pro', 'trial', now() + interval '14 days' from exchanges
  on conflict (exchange_id) do nothing;

-- ---------- the owner of the first real exchange (Ario EX) becomes platform admin ----------
insert into platform_admins(user_id)
  select m.user_id from members m join exchanges e on e.id = m.exchange_id where e.name = 'Ario EX' and m.role = 'owner'
  on conflict do nothing;
select (select count(*) from platform_admins) as admins, (select count(*) from plans) as plans,
       (select count(*) from subscriptions) as subscriptions, (select count(*) from profiles) as profiles;
