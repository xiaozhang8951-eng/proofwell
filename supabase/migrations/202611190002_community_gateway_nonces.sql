-- Apply after 202611190001. Prevent replay of authenticated gateway writes.
-- No IP, user UUID, token, body or signature is persisted in this table.
begin;
create table public.community_gateway_nonces (
  nonce uuid primary key,
  expires_at timestamptz not null default (now() + interval '5 minutes')
);
create index community_gateway_nonce_expiry on public.community_gateway_nonces(expires_at);
alter table public.community_gateway_nonces enable row level security;
revoke all on public.community_gateway_nonces from public,anon,authenticated;
create function public.community_consume_gateway_nonce(p_nonce uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare inserted integer;
begin
 if p_nonce is null then raise exception 'INVALID_INPUT'; end if;
 delete from public.community_gateway_nonces where expires_at<now();
 insert into public.community_gateway_nonces(nonce) values(p_nonce) on conflict(nonce) do nothing;
 get diagnostics inserted=row_count;
 return jsonb_build_object('accepted',inserted=1);
end $$;
revoke all on function public.community_consume_gateway_nonce(uuid) from public,anon,authenticated;
grant execute on function public.community_consume_gateway_nonce(uuid) to service_role;
commit;
