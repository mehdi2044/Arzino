-- Migration 004: platform admin can read every exchange (admin panel)
drop policy if exists ex_adm_sel on exchanges;
create policy ex_adm_sel on exchanges for select using (is_platform_admin());
select 'ok' as result;
