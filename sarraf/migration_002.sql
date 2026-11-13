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
