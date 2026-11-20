-- Isolated database only; requires migrations 001 and 002. No real user data.
\set ON_ERROR_STOP on
begin;
create function pg_temp.assert(ok boolean,label text) returns void language plpgsql as $$begin if ok is distinct from true then raise exception 'FAIL: %',label;end if;end$$;
select pg_temp.assert((select relrowsecurity from pg_class where oid='public.community_gateway_nonces'::regclass),'Nonce table RLS enabled');
select pg_temp.assert(not has_table_privilege('anon','public.community_gateway_nonces','SELECT'),'Nonce table not public');
select pg_temp.assert(not has_table_privilege('authenticated','public.community_gateway_nonces','INSERT'),'Reader cannot poison replay store');
select pg_temp.assert(not has_function_privilege('anon','public.community_consume_gateway_nonce(uuid)','EXECUTE'),'Anonymous cannot invoke nonce RPC');
select pg_temp.assert(not has_function_privilege('authenticated','public.community_consume_gateway_nonce(uuid)','EXECUTE'),'Authenticated cannot invoke nonce RPC');
set local role anon;
do $$begin begin perform public.community_consume_gateway_nonce('11111111-1111-4111-8111-111111111111');raise exception 'FAIL: public RPC';exception when insufficient_privilege then null;end;end$$;
reset role;
set local role service_role;
do $$begin
 if (public.community_consume_gateway_nonce('11111111-1111-4111-8111-111111111111')->>'accepted')::boolean is distinct from true then raise exception 'FAIL: first nonce';end if;
 if (public.community_consume_gateway_nonce('11111111-1111-4111-8111-111111111111')->>'accepted')::boolean is distinct from false then raise exception 'FAIL: replay accepted';end if;
end$$;
reset role;
select pg_temp.assert((select count(*)=1 from public.community_gateway_nonces where nonce='11111111-1111-4111-8111-111111111111'),'One durable nonce row only');
insert into public.community_gateway_nonces(nonce,expires_at) values('22222222-2222-4222-8222-222222222222',now()-interval '1 minute');
select public.community_consume_gateway_nonce('33333333-3333-4333-8333-333333333333');
select pg_temp.assert(not exists(select 1 from public.community_gateway_nonces where nonce='22222222-2222-4222-8222-222222222222'),'Expired nonce pruned');
select pg_temp.assert((select bool_and(expires_at>now()+interval '4 minutes') from public.community_gateway_nonces where nonce in ('11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333')),'Replay retention exceeds complete signature freshness window');
rollback;
\echo 'Gateway nonce RLS, private RPC, durable replay rejection and expiry cleanup passed; synthetic records rolled back.'
