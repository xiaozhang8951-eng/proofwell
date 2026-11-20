-- P1 additive migration. Apply once after 001 + 002; do not edit/re-run them.
-- Does not schedule jobs, enable Community, alter Auth, or grant browser access.
begin;
create table public.community_vote_totals (
  poll_id uuid not null references public.community_polls on delete cascade,
  option_id text not null,
  responses bigint not null check (responses >= 0),
  primary key(poll_id,option_id)
);
create table public.community_feedback_totals (
  article_key text primary key references public.community_articles on delete cascade,
  helpful bigint not null default 0 check(helpful >= 0),
  needs_improvement bigint not null default 0 check(needs_improvement >= 0)
);
alter table public.community_vote_totals enable row level security;
alter table public.community_feedback_totals enable row level security;
revoke all on public.community_vote_totals,public.community_feedback_totals from public,anon,authenticated;
-- Hiding an approved comment does not make it spam or authorize age deletion.
-- Unknown historical hidden records are treated conservatively as normal.
alter table public.community_comments add column retention_category text not null default 'pending'
 check(retention_category in ('pending','normal','spam'));
update public.community_comments set retention_category=case when status='pending' then 'pending' else 'normal' end;
create function public.community_comment_retention_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if new.status='approved' then new.retention_category:='normal';
 elsif new.status='pending' then new.retention_category:='pending';
 elsif tg_op='INSERT' then new.retention_category:=case when new.status='pending' then 'pending' else 'normal' end;
 end if;
 return new;
end $$;
create trigger community_comment_retention before insert or update on public.community_comments
 for each row execute function public.community_comment_retention_guard();
revoke all on function public.community_comment_retention_guard() from public,anon,authenticated,service_role;

create index community_votes_retention on public.community_votes(created_at);
create index community_feedback_retention on public.community_feedback(created_at);
create index community_questions_retention on public.community_questions(created_at);
create index community_comments_retention on public.community_comments(created_at) where retention_category in ('pending','spam');
create index community_audit_retention on public.community_audit_log(created_at);

-- The caller holds the P1 exclusive advisory lock. DELETE RETURNING is the source
-- of aggregate counts: never increment from a pre-delete SELECT or retain an actor/hash.
create function public.community_expire_responses(p_article text default null)
returns void language plpgsql set search_path='' as $$
begin
 with removed as (
   delete from public.community_votes v using public.community_polls p
   where v.poll_id=p.id and v.created_at<=now()-interval '90 days'
   and (p_article is null or p.article_key=p_article)
   returning v.poll_id,v.option_id
 ) insert into public.community_vote_totals(poll_id,option_id,responses)
 select poll_id,option_id,count(*) from removed group by poll_id,option_id
 on conflict(poll_id,option_id) do update set responses=public.community_vote_totals.responses+excluded.responses;
 with removed as (
   delete from public.community_feedback where created_at<=now()-interval '90 days'
   and (p_article is null or article_key=p_article) returning article_key,helpful
 ) insert into public.community_feedback_totals(article_key,helpful,needs_improvement)
 select article_key,count(*) filter(where helpful),count(*) filter(where not helpful) from removed group by article_key
 on conflict(article_key) do update set helpful=public.community_feedback_totals.helpful+excluded.helpful,
 needs_improvement=public.community_feedback_totals.needs_improvement+excluded.needs_improvement;
end $$;
create function public.community_counted_options(p_poll uuid,p_options jsonb)
returns jsonb language sql stable set search_path='' as $$
 select coalesce(jsonb_agg(o || jsonb_build_object('count',(o->>'count')::bigint+coalesce(t.responses,0)) order by ord),'[]'::jsonb)
 from jsonb_array_elements(coalesce(p_options,'[]'::jsonb)) with ordinality x(o,ord)
 left join public.community_vote_totals t on t.poll_id=p_poll and t.option_id=o->>'id'
$$;

-- Keep the validated P0 bodies intact, private and owner-callable only. External
-- RPC names/signatures remain identical; wrappers add retention/count adaptation.
alter function public.community_read(text,uuid,timestamptz,uuid) rename to community_read_p0;
alter function public.community_submit(text,uuid,text,text,jsonb) rename to community_submit_p0;
alter function public.community_admin(uuid,text,jsonb) rename to community_admin_p0;
revoke all on function public.community_read_p0(text,uuid,timestamptz,uuid),
 public.community_submit_p0(text,uuid,text,text,jsonb),public.community_admin_p0(uuid,text,jsonb)
 from public,anon,authenticated,service_role;

create function public.community_read(p_article text,p_actor uuid default null,p_before timestamptz default null,p_before_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r jsonb; p uuid; v bigint; f public.community_feedback_totals;
begin
 -- Shared lock keeps raw+archive counts consistent across the P0 read and augmentation.
 perform pg_advisory_xact_lock_shared(hashtextextended('community:p1:retention',0));
 r:=public.community_read_p0(p_article,p_actor,p_before,p_before_id);
 if not coalesce((r->>'enabled')::boolean,false) then return r; end if;
 p:=(r->'poll'->>'id')::uuid;
 if p is not null then
   select coalesce(sum(responses),0) into v from public.community_vote_totals where poll_id=p;
   r:=jsonb_set(r,'{poll,total}',to_jsonb((r->'poll'->>'total')::bigint+v));
   r:=jsonb_set(r,'{poll,options}',public.community_counted_options(p,r->'poll'->'options'));
   if not exists(select 1 from public.community_votes where poll_id=p and user_id=p_actor and created_at>now()-interval '90 days') then
     r:=jsonb_set(r,'{poll,selected}','null'::jsonb);
   end if;
 end if;
 select * into f from public.community_feedback_totals where article_key=p_article;
 r:=jsonb_set(r,'{feedback,total}',to_jsonb((r->'feedback'->>'total')::bigint+coalesce(f.helpful,0)+coalesce(f.needs_improvement,0)));
 r:=jsonb_set(r,'{feedback,helpful}',to_jsonb((r->'feedback'->>'helpful')::bigint+coalesce(f.helpful,0)));
 if not exists(select 1 from public.community_feedback where article_key=p_article and user_id=p_actor and created_at>now()-interval '90 days') then
   r:=jsonb_set(r,'{feedback,selected}','null'::jsonb);
 end if;
 return r || jsonb_build_object('responseRetentionDays',90);
end $$;

create function public.community_submit(p_article text,p_actor uuid,p_ip_hash text,p_action text,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 -- Same lock order for maintenance/submission/admin; no bypass of P0 actor checks,
 -- article closure, validation, quotas or duplicate checks for live records.
 perform pg_advisory_xact_lock(hashtextextended('community:p1:retention',0));
 perform public.community_expire_responses(p_article);
 return public.community_submit_p0(p_article,p_actor,p_ip_hash,p_action,p_payload);
end $$;

create function public.community_admin(p_actor uuid,p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r jsonb; a jsonb; h jsonb; rows jsonb:='[]'; hist jsonb; p uuid; n bigint; f public.community_feedback_totals;
begin
 if p_action in ('admin_list','admin_export') then
   perform pg_advisory_xact_lock_shared(hashtextextended('community:p1:retention',0));
 else
   perform pg_advisory_xact_lock(hashtextextended('community:p1:retention',0));
 end if;
 r:=public.community_admin_p0(p_actor,p_action,p_payload); -- P0 allowlist/non-anonymous checks always run.
 if p_action not in ('admin_list','admin_export') then return r; end if;
 for a in select value from jsonb_array_elements(r->'articles') loop
   p:=(a->'poll'->>'id')::uuid;
   select coalesce(sum(responses),0) into n from public.community_vote_totals where poll_id=p;
   a:=a || jsonb_build_object('votes',(a->>'votes')::bigint+n,
     'poll_results',public.community_counted_options(p,a->'poll_results'));
   hist:='[]';
   for h in select value from jsonb_array_elements(a->'poll_history') loop
     hist:=hist || jsonb_build_array(h || jsonb_build_object('results',public.community_counted_options((h->>'id')::uuid,h->'results')));
   end loop;
   select * into f from public.community_feedback_totals where article_key=a->>'article_key';
   a:=a || jsonb_build_object('poll_history',hist,
     'feedback_total',(a->>'feedback_total')::bigint+coalesce(f.helpful,0)+coalesce(f.needs_improvement,0),
     'helpful',(a->>'helpful')::bigint+coalesce(f.helpful,0));
   rows:=rows || jsonb_build_array(a);
 end loop;
 return jsonb_set(r,'{articles}',rows);
end $$;

-- Operator-only, dry-run by default. No browser/Edge action exposes this function.
-- No job/extension is created. Exact expiry deletion requires an approved scheduler
-- and monitoring; this migration alone does not promise a retention SLA.
create function public.community_maintenance(p_dry_run boolean default true)
returns jsonb language plpgsql security definer set search_path='' as $$
declare report jsonb;
begin
 if p_dry_run is null then raise exception 'INVALID_INPUT'; end if;
 perform pg_advisory_xact_lock(hashtextextended('community:p1:retention',0));
 select jsonb_build_object('dry_run',p_dry_run,
   'votes',(select count(*) from public.community_votes where created_at<=now()-interval '90 days'),
   'feedback',(select count(*) from public.community_feedback where created_at<=now()-interval '90 days'),
   'questions',(select count(*) from public.community_questions where created_at<=now()-interval '90 days'),
   'pending_or_spam_comments',(select count(*) from public.community_comments where retention_category in ('pending','spam') and created_at<=now()-interval '90 days'),
   'audit_logs',(select count(*) from public.community_audit_log where created_at<=now()-interval '180 days'),
   'rate_buckets',(select count(*) from public.community_rate_buckets where expires_at<now()),
   'gateway_nonces',(select count(*) from public.community_gateway_nonces where expires_at<now())) into report;
 if p_dry_run then return report; end if;
 perform public.community_expire_responses();
 delete from public.community_questions where created_at<=now()-interval '90 days';
 delete from public.community_comments where retention_category in ('pending','spam') and created_at<=now()-interval '90 days';
 delete from public.community_audit_log where created_at<=now()-interval '180 days';
 delete from public.community_rate_buckets where expires_at<now();
 delete from public.community_gateway_nonces where expires_at<now();
 insert into public.community_audit_log(actor,action,target) values(null,'retention_cleanup','community');
 return report;
end $$;
revoke all on function public.community_expire_responses(text),public.community_counted_options(uuid,jsonb),
 public.community_maintenance(boolean),public.community_read(text,uuid,timestamptz,uuid),
 public.community_submit(text,uuid,text,text,jsonb),public.community_admin(uuid,text,jsonb)
 from public,anon,authenticated,service_role;
grant execute on function public.community_maintenance(boolean),public.community_read(text,uuid,timestamptz,uuid),
 public.community_submit(text,uuid,text,text,jsonb),public.community_admin(uuid,text,jsonb) to service_role;
commit;
