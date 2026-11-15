-- Migration 006: "Dedicated Arzino" package
-- An exchange office with the feature "arzino_wl" gets its own Arzino (its name, logo and rates, no Arzino ads)
-- at  …/Arzino/?x=<slug>, and can plug its own price APIs into any section (fiat, crypto, metals, toman)
-- or into a single currency. APIs are fetched by the database (no browser limits, API keys stay hidden)
-- and cached for at least 30 seconds.

create extension if not exists http with schema extensions;

-- new feature on existing plans (off), and the new top plan that includes it
update plans set features = features || '{"arzino_wl": false}'::jsonb where not (features ? 'arzino_wl');
insert into plans(id, name, description, price_month, price_year, limits, features, highlight, sort) values
 ('enterprise', '{"fa":"اختصاصی","tr":"Kurumsal Plus","en":"Enterprise","ar":"مؤسسي"}',
  '{"fa":"ارزینوی اختصاصی با نام و لوگوی شما و منبع قیمت دلخواه","tr":"Kendi adınız ve logonuzla özel Arzino, kendi fiyat kaynağınız","en":"Your own Arzino with your name and logo and your own price feeds","ar":"أرزينو خاص باسمك وشعارك ومصادر أسعارك"}',
  79, 790, '{"staff":50,"customers":20000,"langs":4,"exchanges":5}',
  '{"board":true,"receipts_wa":true,"trusts":true,"expenses":true,"reports":true,"excel":true,"partners":true,"public_board":true,"directory":true,"branding":true,"arzino_wl":true}',
  false, 5)
on conflict (id) do nothing;

-- answers from the price APIs (only the functions below read or write it)
create table if not exists wl_cache (
  ex uuid not null references exchanges(id) on delete cascade,
  sid text not null,
  status int,
  body jsonb,
  fetched_at timestamptz not null default now(),
  primary key (ex, sid)
);
alter table wl_cache enable row level security;

-- which exchange a link belongs to: its id or its chosen short name
create or replace function wl_find(p_key text) returns uuid
language sql stable security definer set search_path = public as $$
  select e.id from exchanges e
  where (e.id::text = p_key or lower(e.settings->'wl'->>'slug') = lower(p_key)) and ex_feature(e.id, 'arzino_wl')
  limit 1;
$$;
grant execute on function wl_find(text) to anon, authenticated;

-- is a short name free? returns the exchange that already uses it
create or replace function wl_slug_owner(p_slug text) returns uuid
language sql stable security definer set search_path = public as $$
  select id from exchanges where lower(settings->'wl'->>'slug') = lower(p_slug) limit 1;
$$;
grant execute on function wl_slug_owner(text) to authenticated;

-- one GET request (5 s timeout, 300 KB max); not callable from outside
create or replace function wl_fetch(p_url text, p_header text) returns jsonb
language plpgsql volatile security definer set search_path = public, extensions as $$
declare r extensions.http_response; hs extensions.http_header[] := '{}'; b jsonb;
begin
  if coalesce(p_url, '') !~* '^https?://' then return jsonb_build_object('status', 0, 'error', 'bad url'); end if;
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '5000');
  if coalesce(p_header, '') like '%:%' then
    hs := array[extensions.http_header(trim(split_part(p_header, ':', 1)), trim(substr(p_header, position(':' in p_header) + 1)))];
  end if;
  r := extensions.http(('GET', p_url, hs, null, null)::extensions.http_request);
  if length(coalesce(r.content, '')) > 300000 then return jsonb_build_object('status', r.status, 'error', 'too large'); end if;
  begin b := r.content::jsonb; exception when others then b := to_jsonb(left(coalesce(r.content, ''), 2000)); end;
  return jsonb_build_object('status', r.status, 'body', b);
exception when others then
  return jsonb_build_object('status', 0, 'error', sqlerrm);
end $$;
revoke all on function wl_fetch(text, text) from public, anon, authenticated;

-- everything a dedicated Arzino needs, with fresh (cached) API answers; API addresses and keys are not returned
create or replace function public_wl(p_key text) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare ex_id uuid; e exchanges; src jsonb; out jsonb := '{}'::jsonb; c wl_cache; ttl int; res jsonb;
begin
  ex_id := wl_find(p_key); if ex_id is null then return null; end if;
  select * into e from exchanges where id = ex_id;
  for src in select * from jsonb_array_elements(coalesce(e.settings->'wl'->'sources', '[]'::jsonb)) loop
    continue when coalesce(src->>'url', '') !~* '^https?://' or coalesce(src->>'id', '') = '';
    ttl := greatest(30, coalesce(nullif(src->>'ttl', '')::int, 60));
    select * into c from wl_cache where wl_cache.ex = e.id and wl_cache.sid = src->>'id';
    if c.ex is null or c.fetched_at < now() - make_interval(secs => ttl) then
      res := wl_fetch(src->>'url', src->>'header');
      insert into wl_cache(ex, sid, status, body, fetched_at) values (e.id, src->>'id', coalesce((res->>'status')::int, 0), coalesce(res->'body', jsonb_build_object('error', res->>'error')), now())
        on conflict (ex, sid) do update set status = excluded.status, body = excluded.body, fetched_at = now();
      out := out || jsonb_build_object(src->>'id', jsonb_build_object('status', res->'status', 'body', coalesce(res->'body', jsonb_build_object('error', res->>'error')), 't', now()));
    else
      out := out || jsonb_build_object(src->>'id', jsonb_build_object('status', c.status, 'body', c.body, 't', c.fetched_at));
    end if;
  end loop;
  return jsonb_build_object(
    'id', e.id, 'name', coalesce(nullif(e.settings->'wl'->>'title', ''), e.name), 'logo', e.settings->'logo',
    'phone', e.settings->'phone', 'address', e.settings->'address', 'note', e.settings->'board_note',
    'rows', e.settings->'board_rows', 'digits', e.settings->'board_digits', 'auto', rate_cfg(e.settings),
    'show_board', coalesce((e.settings->'wl'->>'show_board')::boolean, true),
    'sources', coalesce((select jsonb_agg(s - 'url' - 'header') from jsonb_array_elements(coalesce(e.settings->'wl'->'sources', '[]'::jsonb)) s), '[]'::jsonb),
    'data', out,
    'rates', coalesce((select jsonb_agg(jsonb_build_object('ccy', r.ccy, 'quote', r.quote, 'buy', r.buy, 'sell', r.sell, 'updated_at', r.updated_at))
                       from rates r where r.exchange_id = e.id), '[]'::jsonb));
end $$;
grant execute on function public_wl(text) to anon, authenticated;

-- "Test" button in the panel: owner/partner of an exchange with the package tries an API before saving it
create or replace function wl_test(p_ex uuid, p_url text, p_header text) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
begin
  if not is_manager(p_ex) then raise exception 'not allowed'; end if;
  if not ex_feature(p_ex, 'arzino_wl') then raise exception 'FEATURE_arzino_wl'; end if;
  return wl_fetch(p_url, p_header);
end $$;
grant execute on function wl_test(uuid, text, text) to authenticated;

select 'ok' as result;
