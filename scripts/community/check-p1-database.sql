\set ON_ERROR_STOP on
begin;
create function pg_temp.assert(ok boolean,label text) returns void language plpgsql as $$begin if ok is distinct from true then raise exception 'FAIL: %',label;end if;end$$;
select pg_temp.assert((select bool_and(relrowsecurity) from pg_class where relname like 'community_%' and relkind='r'),'RLS remains on every community table');
select pg_temp.assert(not has_table_privilege('authenticated','public.community_vote_totals','SELECT'),'Archive is not a browser table');
select pg_temp.assert(not has_function_privilege('anon','public.community_maintenance(boolean)','EXECUTE'),'No anonymous cleanup RPC');
select pg_temp.assert(not has_function_privilege('authenticated','public.community_maintenance(boolean)','EXECUTE'),'No reader cleanup RPC');
select pg_temp.assert(not has_function_privilege('service_role','public.community_submit_p0(text,uuid,text,text,jsonb)','EXECUTE'),'Cannot bypass retention using legacy RPC');
select pg_temp.assert(not has_function_privilege('service_role','public.community_expire_responses(text)','EXECUTE'),'Archive helper is owner-only');
set local role authenticated;
do $$begin
 begin perform public.community_maintenance(false);raise exception 'FAIL: reader cleanup';exception when insufficient_privilege then null;end;
 begin select * from public.community_vote_totals;raise exception 'FAIL: reader archive';exception when insufficient_privilege then null;end;
end$$;
reset role;
insert into auth.users(id,is_anonymous) values('11111111-1111-4111-8111-111111111111',true),('22222222-2222-4222-8222-222222222222',false);
insert into public.community_admins(user_id) values('22222222-2222-4222-8222-222222222222');
insert into public.community_votes(poll_id,user_id,option_id,created_at)
 select id,'11111111-1111-4111-8111-111111111111','regularly',now()-interval '90 days' from public.community_polls where article_key='/science/does-red-light-therapy-work' and active;
insert into public.community_feedback(article_key,user_id,helpful,created_at) values('/science/does-red-light-therapy-work','11111111-1111-4111-8111-111111111111',true,now()-interval '90 days');
insert into public.community_comments(article_key,user_id,nickname,body,status,created_at)
 select '/science/does-red-light-therapy-work','11111111-1111-4111-8111-111111111111','Synthetic QA',status||' synthetic retention test comment.',status,now()-age
 from (values('approved',interval '365 days'),('pending',interval '90 days'),('hidden',interval '91 days'),('pending',interval '89 days')) x(status,age);
-- A pending comment hidden before approval remains on the pending retention clock.
insert into public.community_comments(article_key,user_id,nickname,body,created_at) values('/science/does-red-light-therapy-work','11111111-1111-4111-8111-111111111111','Synthetic QA','Synthetic hidden pending retention fixture.',now()-interval '91 days');
update public.community_comments set status='hidden' where body='Synthetic hidden pending retention fixture.';
insert into public.community_comments(article_key,user_id,nickname,body,status,created_at) values('/science/does-red-light-therapy-work','11111111-1111-4111-8111-111111111111','Synthetic QA','Synthetic classified spam retention fixture.','hidden',now()-interval '91 days');
update public.community_comments set retention_category='spam' where body='Synthetic classified spam retention fixture.';
insert into public.community_comments(article_key,user_id,nickname,body,status,created_at) values('/science/does-red-light-therapy-work','11111111-1111-4111-8111-111111111111','Synthetic QA','Synthetic approval returned to moderation.','approved',now()-interval '91 days');
update public.community_comments set status='pending' where body='Synthetic approval returned to moderation.';
insert into public.community_questions(article_key,user_id,body,created_at)
 select '/science/does-red-light-therapy-work','11111111-1111-4111-8111-111111111111','Synthetic private topic for retention test.',now()-age from (values(interval '90 days'),(interval '89 days')) x(age);
insert into public.community_audit_log(action,target,created_at) values('synthetic_old','fixture',now()-interval '180 days'),('synthetic_recent','fixture',now()-interval '179 days');
insert into public.community_rate_buckets(key,count,expires_at) values('synthetic:expired',1,now()-interval '1 second'),('synthetic:live',1,now()+interval '1 hour');
insert into public.community_gateway_nonces(nonce,expires_at) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',now()-interval '1 second'),('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',now()+interval '5 minutes');
select pg_temp.assert(public.community_maintenance()->>'dry_run'='true','Default maintenance is dry-run');
select pg_temp.assert((select count(*) from public.community_votes)=1,'Dry-run does not remove raw rows');
select pg_temp.assert(not exists(select 1 from public.community_vote_totals),'Dry-run does not create counts');
select pg_temp.assert(public.community_read('/science/does-red-light-therapy-work','11111111-1111-4111-8111-111111111111')->'poll'->'selected'='null'::jsonb,'Expiry already allows a new response');
set local role service_role;
select public.community_maintenance(false);
reset role;
select pg_temp.assert(not exists(select 1 from public.community_votes),'Expired raw votes removed');
select pg_temp.assert(not exists(select 1 from public.community_feedback),'Expired raw feedback removed');
select pg_temp.assert((select responses=1 from public.community_vote_totals),'Exact deleted vote is archived once');
select pg_temp.assert((select helpful=1 and needs_improvement=0 from public.community_feedback_totals),'Real feedback counts archived');
select pg_temp.assert((select count(*) from public.community_comments)=3,'Pending comments expire; normal hidden, approved and recent comments preserved');
select pg_temp.assert(exists(select 1 from public.community_comments where status='hidden' and retention_category='normal'),'Hiding does not classify a normal comment as spam');
select pg_temp.assert(exists(select 1 from public.community_comments where status='approved'),'Normal approved comment never age-deleted');
select pg_temp.assert((select count(*) from public.community_questions)=1,'Suggestions use 90-day cutoff');
select pg_temp.assert(not exists(select 1 from public.community_audit_log where action='synthetic_old'),'180-day audit cleanup');
select pg_temp.assert(exists(select 1 from public.community_audit_log where action='synthetic_recent'),'Recent audit preserved');
select pg_temp.assert(not exists(select 1 from public.community_rate_buckets where key='synthetic:expired'),'Expired counters deleted');
select pg_temp.assert(exists(select 1 from public.community_rate_buckets where key='synthetic:live'),'Active rate limits preserved');
select pg_temp.assert(exists(select 1 from public.community_gateway_nonces where nonce='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),'Active replay window preserved');
select public.community_maintenance(false);
select pg_temp.assert((select responses=1 from public.community_vote_totals),'Repeated cleanup cannot double count');
do $$declare k text:='/science/does-red-light-therapy-work'; actor uuid:='11111111-1111-4111-8111-111111111111'; staff uuid:='22222222-2222-4222-8222-222222222222'; p uuid; r jsonb; ar jsonb;
begin
 select id into p from public.community_polls where article_key=k and active;
 perform pg_temp.assert((public.community_read(k)->'poll'->>'total')::int=1,'Public total survives purge');
 perform pg_temp.assert((public.community_read(k)->'poll'->'options'->0->>'count')::int=1,'Public option count survives purge');
 r:=public.community_submit(k,actor,repeat('a',64),'poll',jsonb_build_object('pollId',p,'option','occasionally'));
 perform pg_temp.assert((r->>'accepted')::boolean,'Same guest can vote after expiry');
 r:=public.community_submit(k,actor,repeat('a',64),'poll',jsonb_build_object('pollId',p,'option','regularly'));
 perform pg_temp.assert(not(r->>'accepted')::boolean,'Fresh duplicate still blocked');
 perform pg_temp.assert((public.community_read(k,actor)->'poll'->>'total')::int=2,'Aggregate plus new raw response');
 perform pg_temp.assert(public.community_read(k,actor)->'poll'->>'selected'='occasionally','Fresh selection restored');
 perform public.community_submit(k,actor,repeat('a',64),'feedback','{"helpful":false}');
 perform pg_temp.assert((public.community_read(k)->'feedback'->>'total')::int=2,'Helpfulness total survives purge');
 perform pg_temp.assert((public.community_read(k)->'feedback'->>'helpful')::int=1,'Helpfulness numerator truthful');
 select value into ar from jsonb_array_elements(public.community_admin(staff,'admin_export')->'articles') where value->>'article_key'=k;
 perform pg_temp.assert((ar->>'votes')::int=2 and (ar->>'feedback_total')::int=2,'Admin export has same counts');
 perform pg_temp.assert((ar->'poll_results'->0->>'count')::int=1,'Admin option totals include archive');
 perform public.community_admin(staff,'admin_config',jsonb_build_object('article',k,'enabled',true,'question','Which synthetic research topic is interesting?','options','[{"id":"a","label":"Topic A"},{"id":"b","label":"Topic B"}]'::jsonb,'discussionPrompt','A synthetic discussion prompt for isolated tests.','nextQuestion','What should this isolated test explore next?'));
 perform pg_temp.assert((public.community_read(k)->'poll'->>'total')::int=0,'New poll does not inherit old counts');
 select value into ar from jsonb_array_elements(public.community_admin(staff,'admin_list')->'articles') where value->>'article_key'=k;
 select value into r from jsonb_array_elements(ar->'poll_history') where value->>'id'=p::text;
 perform pg_temp.assert((r->'results'->0->>'count')::int=1,'Historical poll preserves original option counts');
 -- Expiry on submission works even before the next scheduled job.
 update public.community_feedback set created_at=now()-interval '91 days' where article_key=k and user_id=actor;
 begin
   perform public.community_submit(k,actor,repeat('a',64),'feedback','{"helpful":"invalid"}');
   raise exception 'FAIL: invalid feedback accepted';
 exception when others then if sqlerrm<>'INVALID_INPUT' then raise; end if; end;
 perform pg_temp.assert(exists(select 1 from public.community_feedback where article_key=k and user_id=actor and created_at<=now()-interval '90 days'),'Failed mutation rolls expiry back');
 perform pg_temp.assert((select helpful=1 and needs_improvement=0 from public.community_feedback_totals where article_key=k),'Failed mutation does not increment archive');
 perform public.community_submit(k,actor,repeat('a',64),'feedback','{"helpful":true}');
 perform pg_temp.assert((public.community_read(k)->'feedback'->>'total')::int=3,'On-demand expiry archives once before new feedback');
 perform pg_temp.assert((public.community_read(k)->'feedback'->>'helpful')::int=2,'New helpful numerator consistent');
end$$;
select pg_temp.assert((select count(*) from information_schema.columns where table_name in ('community_vote_totals','community_feedback_totals') and (column_name like '%user%' or column_name like '%ip%' or column_name like '%time%' or column_name like '%hash%'))=0,'Aggregates have no user/IP/time/hash fields');
rollback;
\echo 'P1 retention: permissions, real counts, dry-run, cutoff boundaries, repeat responses, admin history and P0 controls passed (rolled back).'
