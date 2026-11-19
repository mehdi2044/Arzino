-- 007: each currency on the board can have its own buy/sell percentage (settings.board_spread = {"USD/TRY": {"sb":0.2,"ss":0.4}, …}).
-- The public board, the live TV board and Arzino's partner list read the formula settings through rate_cfg, so it now passes them on.
create or replace function rate_cfg(s jsonb) returns jsonb
language sql immutable as $$
  select jsonb_build_object('mode', coalesce(s->>'rate_mode', 'manual'), 'sb', s->'spread_buy', 'ss', s->'spread_sell',
                            'round', s->'round_irt', 'fixed', coalesce(s->'board_fixed', '[]'::jsonb),
                            'pair', coalesce(s->'board_spread', '{}'::jsonb));
$$;
select 'ok' as result, rate_cfg('{"rate_mode":"auto","board_spread":{"USD/TRY":{"sb":0.2,"ss":0.5}}}'::jsonb) as test;
