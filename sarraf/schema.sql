-- =====================================================================
--  Sarraf (حسابداری صرافی) — multi-exchange schema for Supabase / Postgres
--  Every row belongs to one exchange; Row Level Security keeps exchanges apart.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- core tables ----------
create table if not exists exchanges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_ccy text not null default 'USD',          -- reporting currency for profit
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists members (
  exchange_id uuid not null references exchanges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','partner','staff')),
  display_name text,
  email text,
  share_pct numeric default 0,                     -- partner profit share
  created_at timestamptz not null default now(),
  primary key (exchange_id, user_id)
);

create table if not exists invites (
  id uuid primary key default gen_random_uuid(),
  exchange_id uuid not null references exchanges(id) on delete cascade,
  email text not null,
  role text not null check (role in ('partner','staff')),
  display_name text,
  share_pct numeric default 0,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  unique (exchange_id, email)
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  exchange_id uuid not null references exchanges(id) on delete cascade,
  name text not null,
  phone text,
  notes text,
  is_walkin boolean default false,
  archived boolean default false,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists boxes (                 -- صندوق‌ها: cash, bank, wallet
  id uuid primary key default gen_random_uuid(),
  exchange_id uuid not null references exchanges(id) on delete cascade,
  name text not null,
  currency text not null,
  kind text not null default 'cash' check (kind in ('cash','bank','wallet')),
  archived boolean default false,
  sort int default 0,
  created_at timestamptz not null default now()
);

create table if not exists rates (                 -- تابلوی نرخ صرافی
  exchange_id uuid not null references exchanges(id) on delete cascade,
  ccy text not null,
  quote text not null,
  buy numeric,
  sell numeric,
  updated_by uuid default auth.uid(),
  updated_at timestamptz not null default now(),
  primary key (exchange_id, ccy, quote)
);

create table if not exists txns (
  id uuid primary key default gen_random_uuid(),
  exchange_id uuid not null references exchanges(id) on delete cascade,
  no bigserial,
  type text not null check (type in ('trade','deposit','withdraw','trust_out','trust_in','trust_return_in','trust_return_out',
                                      'expense','capital_in','capital_out','transfer','opening','adjust')),
  customer_id uuid references customers(id),
  member_id uuid,                                  -- partner for capital moves
  occurred_at timestamptz not null default now(),
  note text,
  category text,                                   -- expense category
  meta jsonb default '{}'::jsonb,                  -- rates used, market rates, profit in base
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  voided boolean not null default false,
  voided_by uuid,
  voided_at timestamptz,
  void_reason text
);

create table if not exists lines (
  id uuid primary key default gen_random_uuid(),
  txn_id uuid not null references txns(id) on delete cascade,
  exchange_id uuid not null references exchanges(id) on delete cascade,
  party text not null check (party in ('box','customer','trust','expense','equity')),
  box_id uuid references boxes(id),
  customer_id uuid references customers(id),
  member_id uuid,
  currency text not null,
  amount numeric not null,                         -- + = asset for the exchange (cash in, customer owes us)
  usd_rate numeric                                 -- market USD value of 1 unit at the time
);

create table if not exists audit_log (
  id bigserial primary key,
  exchange_id uuid,
  user_id uuid default auth.uid(),
  action text,
  tbl text,
  row_id text,
  data jsonb,
  at timestamptz not null default now()
);

create index if not exists lines_ex_idx on lines(exchange_id);
create index if not exists lines_txn_idx on lines(txn_id);
create index if not exists txns_ex_idx on txns(exchange_id, occurred_at desc);
create index if not exists customers_ex_idx on customers(exchange_id);

-- ---------- helpers ----------
create or replace function is_member(ex uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from members where exchange_id = ex and user_id = auth.uid());
$$;

create or replace function my_role(ex uuid) returns text
language sql stable security definer set search_path = public as $$
  select role from members where exchange_id = ex and user_id = auth.uid();
$$;

create or replace function is_manager(ex uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(my_role(ex) in ('owner','partner'), false);
$$;

-- ---------- row level security ----------
alter table exchanges enable row level security;
alter table members   enable row level security;
alter table invites   enable row level security;
alter table customers enable row level security;
alter table boxes     enable row level security;
alter table rates     enable row level security;
alter table txns      enable row level security;
alter table lines     enable row level security;
alter table audit_log enable row level security;

drop policy if exists ex_sel on exchanges;
create policy ex_sel on exchanges for select using (is_member(id));
drop policy if exists ex_upd on exchanges;
create policy ex_upd on exchanges for update using (my_role(id) = 'owner');

drop policy if exists mem_sel on members;
create policy mem_sel on members for select using (is_member(exchange_id));
drop policy if exists mem_upd on members;
create policy mem_upd on members for update using (my_role(exchange_id) = 'owner');
drop policy if exists mem_del on members;
create policy mem_del on members for delete using (my_role(exchange_id) = 'owner' and user_id <> auth.uid());

drop policy if exists inv_all on invites;
create policy inv_all on invites for all using (is_manager(exchange_id)) with check (is_manager(exchange_id));

drop policy if exists cus_sel on customers;
create policy cus_sel on customers for select using (is_member(exchange_id));
drop policy if exists cus_ins on customers;
create policy cus_ins on customers for insert with check (is_member(exchange_id));
drop policy if exists cus_upd on customers;
create policy cus_upd on customers for update using (is_member(exchange_id));

drop policy if exists box_sel on boxes;
create policy box_sel on boxes for select using (is_member(exchange_id));
drop policy if exists box_mod on boxes;
create policy box_mod on boxes for all using (is_manager(exchange_id)) with check (is_manager(exchange_id));

drop policy if exists rate_sel on rates;
create policy rate_sel on rates for select using (is_member(exchange_id));
drop policy if exists rate_mod on rates;
create policy rate_mod on rates for all using (is_member(exchange_id)) with check (is_member(exchange_id));

drop policy if exists txn_sel on txns;
create policy txn_sel on txns for select using (is_member(exchange_id));
drop policy if exists line_sel on lines;
create policy line_sel on lines for select using (is_member(exchange_id));
-- txns / lines are written only through post_txn() and void_txn() below

drop policy if exists audit_sel on audit_log;
create policy audit_sel on audit_log for select using (is_manager(exchange_id));

-- ---------- audit trigger ----------
create or replace function audit_trg() returns trigger
language plpgsql security definer set search_path = public as $$
declare r jsonb; ex uuid;
begin
  r := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  ex := coalesce((r->>'exchange_id')::uuid, case when tg_table_name = 'exchanges' then (r->>'id')::uuid end);
  insert into audit_log(exchange_id, action, tbl, row_id, data)
  values (ex, tg_op, tg_table_name, coalesce(r->>'id', r->>'user_id', r->>'ccy'), r);
  return null;
end $$;

do $$ declare t text; begin
  foreach t in array array['exchanges','members','invites','customers','boxes','rates','txns'] loop
    execute format('drop trigger if exists audit_%1$s on %1$s', t);
    execute format('create trigger audit_%1$s after insert or update or delete on %1$s for each row execute function audit_trg()', t);
  end loop;
end $$;

-- ---------- RPC: create an exchange with sensible defaults ----------
create or replace function create_exchange(p_name text, p_display_name text, p_base text default 'USD')
returns uuid language plpgsql security definer set search_path = public as $$
declare ex uuid; em text;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
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
  return ex;
end $$;

-- ---------- RPC: join exchanges the user was invited to ----------
create or replace function accept_invites(p_display_name text default null)
returns int language plpgsql security definer set search_path = public as $$
declare em text; n int := 0; i record;
begin
  select lower(email) into em from auth.users where id = auth.uid();
  for i in select * from invites where lower(email) = em loop
    insert into members(exchange_id, user_id, role, display_name, email, share_pct)
      values (i.exchange_id, auth.uid(), i.role, coalesce(i.display_name, p_display_name, em), em, coalesce(i.share_pct,0))
      on conflict (exchange_id, user_id) do nothing;
    delete from invites where id = i.id;
    n := n + 1;
  end loop;
  return n;
end $$;

-- ---------- RPC: post a transaction atomically ----------
-- p: {exchange_id, type, customer_id, member_id, occurred_at, note, category, meta,
--     lines:[{party, box_id, customer_id, member_id, currency, amount, usd_rate}]}
create or replace function post_txn(p jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare ex uuid := (p->>'exchange_id')::uuid; tid uuid; l jsonb;
begin
  if not is_member(ex) then raise exception 'not a member of this exchange'; end if;
  if jsonb_array_length(coalesce(p->'lines','[]'::jsonb)) = 0 then raise exception 'no lines'; end if;
  if (p->>'type') in ('capital_in','capital_out','opening','adjust') and not is_manager(ex) then
    raise exception 'only owner or partner can post this';
  end if;
  insert into txns(exchange_id, type, customer_id, member_id, occurred_at, note, category, meta)
  values (ex, p->>'type', nullif(p->>'customer_id','')::uuid, nullif(p->>'member_id','')::uuid,
          coalesce(nullif(p->>'occurred_at','')::timestamptz, now()), p->>'note', p->>'category',
          coalesce(p->'meta','{}'::jsonb))
  returning id into tid;
  for l in select * from jsonb_array_elements(p->'lines') loop
    if (l->>'box_id') is not null and not exists(select 1 from boxes where id = (l->>'box_id')::uuid and exchange_id = ex) then
      raise exception 'box does not belong to exchange';
    end if;
    if (l->>'customer_id') is not null and not exists(select 1 from customers where id = (l->>'customer_id')::uuid and exchange_id = ex) then
      raise exception 'customer does not belong to exchange';
    end if;
    insert into lines(txn_id, exchange_id, party, box_id, customer_id, member_id, currency, amount, usd_rate)
    values (tid, ex, l->>'party', nullif(l->>'box_id','')::uuid, nullif(l->>'customer_id','')::uuid,
            nullif(l->>'member_id','')::uuid, l->>'currency', (l->>'amount')::numeric, nullif(l->>'usd_rate','')::numeric);
  end loop;
  return tid;
end $$;

-- ---------- RPC: void (cancel) a transaction — owner/partner only ----------
create or replace function void_txn(p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare ex uuid;
begin
  select exchange_id into ex from txns where id = p_id;
  if ex is null then raise exception 'not found'; end if;
  if not is_manager(ex) then raise exception 'only owner or partner can cancel'; end if;
  update txns set voided = true, voided_by = auth.uid(), voided_at = now(), void_reason = p_reason where id = p_id;
end $$;

grant execute on function create_exchange(text, text, text) to authenticated;
grant execute on function accept_invites(text) to authenticated;
grant execute on function post_txn(jsonb) to authenticated;
grant execute on function void_txn(uuid, text) to authenticated;

-- ---------- balances view (respects RLS of the caller) ----------
create or replace view v_balances with (security_invoker = true) as
  select l.exchange_id, l.party, l.box_id, l.customer_id, l.member_id, l.currency, sum(l.amount) as amount
  from lines l join txns t on t.id = l.txn_id
  where not t.voided
  group by l.exchange_id, l.party, l.box_id, l.customer_id, l.member_id, l.currency;
grant select on v_balances to authenticated;

-- Migration 002: exchange settings (logo, contact, spreads, board rows, send times) + public live board
alter table exchanges add column if not exists settings jsonb not null default '{}'::jsonb;

drop policy if exists ex_upd on exchanges;
create policy ex_upd on exchanges for update using (is_manager(id));

-- Public, read-only view of one exchange's rate board (only if the owner turned it on)
create or replace function public_board(p_ex uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when coalesce((e.settings->>'board_public')::boolean, false) then
    jsonb_build_object(
      'name', e.name,
      'logo', e.settings->'logo',
      'phone', e.settings->'phone',
      'address', e.settings->'address',
      'note', e.settings->'board_note',
      'rows', e.settings->'board_rows',
      'digits', e.settings->'board_digits',
      'rates', coalesce((select jsonb_agg(jsonb_build_object('ccy', r.ccy, 'quote', r.quote, 'buy', r.buy, 'sell', r.sell, 'updated_at', r.updated_at))
                         from rates r where r.exchange_id = e.id), '[]'::jsonb))
  else null end
  from exchanges e where e.id = p_ex;
$$;
grant execute on function public_board(uuid) to anon, authenticated;
