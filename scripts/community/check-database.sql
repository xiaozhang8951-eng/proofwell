\set ON_ERROR_STOP on
begin;
-- Deterministic synthetic identities, never actual readers.
insert into auth.users(id,is_anonymous) values
 ('11111111-1111-4111-8111-111111111111',true),
 ('22222222-2222-4222-8222-222222222222',false),
 ('33333333-3333-4333-8333-333333333333',false);
insert into public.community_admins(user_id) values('22222222-2222-4222-8222-222222222222');
create function pg_temp.assert(ok boolean,label text) returns void language plpgsql as $$begin if ok is distinct from true then raise exception 'FAIL: %',label;end if;end$$;
select pg_temp.assert((select bool_and(relrowsecurity) from pg_class where relname like 'community_%' and relkind='r'),'RLS on all tables');
select pg_temp.assert(not has_table_privilege('anon','public.community_comments','SELECT'),'Anon cannot read pending comments directly');
select pg_temp.assert(not has_table_privilege('authenticated','public.community_votes','INSERT'),'Authenticated cannot bypass Edge writes');
select pg_temp.assert(not has_function_privilege('authenticated','public.community_submit(text,uuid,text,text,jsonb)','EXECUTE'),'No direct write RPC');
select pg_temp.assert(not has_function_privilege('anon','public.community_admin(uuid,text,jsonb)','EXECUTE'),'No direct admin RPC');
select pg_temp.assert(has_function_privilege('service_role','public.community_read(text,uuid,timestamptz,uuid)','EXECUTE'),'Service reader is enabled');
set local role anon;
do $$begin
 begin perform * from public.community_comments;raise exception 'FAIL: anonymous table read';exception when insufficient_privilege then null;end;
 begin perform public.community_read('/science/does-red-light-therapy-work');raise exception 'FAIL: direct anonymous read RPC';exception when insufficient_privilege then null;end;
end$$;
reset role;
set local role authenticated;
do $$begin
 begin insert into public.community_feedback(article_key,user_id,helpful) values('/science/does-red-light-therapy-work','11111111-1111-4111-8111-111111111111',true);raise exception 'FAIL: direct reader insert';exception when insufficient_privilege then null;end;
 begin perform public.community_submit('/science/does-red-light-therapy-work','11111111-1111-4111-8111-111111111111',repeat('a',64),'feedback','{"helpful":true}');raise exception 'FAIL: direct reader write RPC';exception when insufficient_privilege then null;end;
end$$;
reset role;
set local role service_role;
select public.community_read('/science/does-red-light-therapy-work')->>'enabled' as service_read_enabled;
reset role;
select pg_temp.assert((public.community_read('/science/does-red-light-therapy-work')->>'enabled')::boolean,'Published guide registered');
select pg_temp.assert(not (public.community_read('/science/red-light-therapy-skin')->>'enabled')::boolean,'Existing draft closed');
select pg_temp.assert((public.community_read('/science/does-red-light-therapy-work')->'poll'->>'total')::int=0,'No fake votes');
select pg_temp.assert(jsonb_array_length(public.community_read('/science/does-red-light-therapy-work')->'comments')=0,'No fake comments');
do $$declare p uuid; r jsonb; actor uuid:='11111111-1111-4111-8111-111111111111'; admin uuid:='22222222-2222-4222-8222-222222222222'; other uuid:='33333333-3333-4333-8333-333333333333'; k text:='/science/does-red-light-therapy-work'; c uuid; old_poll uuid;
begin
 select id into p from public.community_polls where article_key=k and active;old_poll:=p;
 r:=public.community_submit(k,actor,repeat('a',64),'poll',jsonb_build_object('pollId',p,'option','regularly'));
 perform pg_temp.assert((r->>'accepted')::boolean,'First vote accepted');
 r:=public.community_submit(k,actor,repeat('a',64),'poll',jsonb_build_object('pollId',p,'option','occasionally'));
 perform pg_temp.assert(not (r->>'accepted')::boolean,'Duplicate vote rejected');
 perform pg_temp.assert((public.community_read(k,actor)->'poll'->>'total')::int=1,'Exactly one vote after repeat');
 perform pg_temp.assert((public.community_read('/science/how-led-masks-work')->'poll'->>'total')::int=0,'Different article has independent poll results');
 perform pg_temp.assert(public.community_read(k,actor)->'poll'->>'selected'='regularly','Identity-specific choice restored');
 begin perform public.community_submit(k,actor,repeat('a',64),'poll',jsonb_build_object('pollId',p,'option','invalid'));raise exception 'FAIL: invalid option';exception when others then if sqlerrm<>'INVALID_INPUT' then raise;end if;end;
 perform public.community_submit(k,actor,repeat('a',64),'feedback','{"helpful":true}');
 r:=public.community_submit(k,actor,repeat('a',64),'feedback','{"helpful":false}');
 perform pg_temp.assert(not (r->>'accepted')::boolean,'One feedback per article');
 perform pg_temp.assert((public.community_read(k,actor)->'feedback'->>'helpful')::int=1,'Real helpful count');
 r:=public.community_submit(k,actor,repeat('a',64),'comment','{"nickname":"QA Reader","body":"Synthetic review comment for moderation.","status":"approved"}');c:=(r->>'id')::uuid;
 perform pg_temp.assert((select status='pending' from public.community_comments where id=c),'Client cannot auto-approve');
 perform pg_temp.assert(jsonb_array_length(public.community_read(k)->'comments')=0,'Pending comment is private');
 begin perform public.community_admin(other,'admin_list');raise exception 'FAIL: unauthorized staff';exception when others then if sqlerrm<>'FORBIDDEN' then raise;end if;end;
 begin perform public.community_admin(actor,'admin_list');raise exception 'FAIL: anonymous staff';exception when others then if sqlerrm<>'FORBIDDEN' then raise;end if;end;
 perform public.community_admin(admin,'admin_moderate',jsonb_build_object('kind','comment','id',c,'status','approved'));
 perform pg_temp.assert(jsonb_array_length(public.community_read(k)->'comments')=1,'Approved comment visible');
 perform pg_temp.assert(not (public.community_read(k)->'comments'->0 ? 'user_id'),'Public response omits auth user identity');
 perform public.community_admin(admin,'admin_moderate',jsonb_build_object('kind','comment','id',c,'status','hidden'));
 perform pg_temp.assert(jsonb_array_length(public.community_read(k)->'comments')=0,'Hidden comment private');
 perform public.community_admin(admin,'admin_moderate',jsonb_build_object('kind','comment','id',c,'status','delete'));
 perform pg_temp.assert(not exists(select 1 from public.community_comments where id=c),'Delete is permanent');
 perform public.community_submit(k,actor,repeat('a',64),'question','{"body":"Could you research optical measurement methods?"}');
 perform pg_temp.assert(not(public.community_read(k) ? 'questions'),'Suggestions never returned publicly');
 perform pg_temp.assert(jsonb_array_length(public.community_admin(admin,'admin_list')->'questions')=1,'Staff can review suggestions');
 begin perform public.community_submit(k,actor,repeat('a',64),'comment','{"nickname":"QA","body":"<script>alert(1)</script>"}');raise exception 'FAIL: HTML accepted';exception when others then if sqlerrm<>'INVALID_INPUT' then raise;end if;end;
 begin perform public.community_submit('/science/red-light-therapy-skin',actor,repeat('a',64),'feedback','{"helpful":true}');raise exception 'FAIL: draft open';exception when others then if sqlerrm<>'ARTICLE_CLOSED' then raise;end if;end;
 perform public.community_admin(admin,'admin_config',jsonb_build_object('article',k,'enabled',true,'question','Which research question matters most to you?','options','[{"id":"skin","label":"Skin research"},{"id":"safety","label":"Safety research"}]'::jsonb,'discussionPrompt','Share a thoughtful experience without personal medical information.','nextQuestion','What should we explore in a future article?'));
 select id into p from public.community_polls where article_key=k and active;
 perform pg_temp.assert(p<>old_poll,'Option edit creates new version');
 perform pg_temp.assert((select count(*) from public.community_votes where poll_id=old_poll)=1,'Old votes preserved, not relabeled');
 perform pg_temp.assert((public.community_read(k)->'poll'->>'total')::int=0,'New version has no invented votes');
 begin perform public.community_submit(k,actor,repeat('a',64),'poll',jsonb_build_object('pollId',old_poll,'option','regularly'));raise exception 'FAIL: stale poll';exception when others then if sqlerrm<>'POLL_CHANGED' then raise;end if;end;
 perform pg_temp.assert(jsonb_array_length(public.community_admin(admin,'admin_list')->'articles')=19,'Every article represented');
 perform pg_temp.assert(jsonb_array_length(public.community_admin(admin,'admin_list')->'articles'->0->'poll_history')>=1,'History is available to staff');
 -- Stable cursor pagination does not duplicate the boundary comment.
 insert into public.community_comments(article_key,user_id,nickname,body,status,created_at)
 select k,actor,'Synthetic QA','Synthetic pagination test comment '||n,'approved',now()-n*interval '1 second' from generate_series(1,12) n;
 r:=public.community_read(k);
 perform pg_temp.assert(jsonb_array_length(r->'comments')=10 and r->'nextCursor'<>'null'::jsonb,'Ten public comments per page');
 r:=public.community_read(k,null,(r->'nextCursor'->>'created_at')::timestamptz,(r->'nextCursor'->>'id')::uuid);
 perform pg_temp.assert(jsonb_array_length(r->'comments')=2 and r->'nextCursor'='null'::jsonb,'Cursor returns exactly remaining records');
 -- Identity rotation cannot bypass the network cap.
 for i in 1..6 loop
   insert into auth.users(id,is_anonymous) values(md5('qa-rate-user-'||i)::uuid,true);
   begin
     perform public.community_submit(k,md5('qa-rate-user-'||i)::uuid,repeat('b',64),'poll',jsonb_build_object('pollId',p,'option','skin'));
     if i=6 then raise exception 'FAIL: IP cap not enforced';end if;
   exception when others then if i<>6 or sqlerrm<>'RATE_LIMITED' then raise;end if;end;
 end loop;
 perform pg_temp.assert((select count(*) from public.community_votes where poll_id=p)=5,'Five network votes, sixth rejected atomically');
 perform pg_temp.assert((select count(*) from public.community_audit_log)>=4,'Moderation and configuration audited without comment copies');
end$$;
rollback;
\echo 'Database invariants, RLS/grants, moderation, deduplication, pagination, poll versioning and IP rate limits passed (synthetic records rolled back).'
