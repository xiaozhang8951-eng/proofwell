-- ProofWell community v1. Run once through Supabase migrations, never in a browser.
-- No direct anon/authenticated access: all operations pass the Edge API boundary.
begin;
create table public.community_articles (
  article_key text primary key check (article_key ~ '^/[a-z0-9-]+/[a-z0-9-]+$'),
  title text not null check (char_length(title) between 1 and 250),
  enabled boolean not null default false,
  discussion_prompt text not null check (char_length(discussion_prompt) between 10 and 1000),
  next_question text not null check (char_length(next_question) between 10 and 250),
  updated_at timestamptz not null default now()
);
create function public.community_options_valid(options jsonb) returns boolean
language sql immutable set search_path = '' as $$
 select jsonb_typeof(options) = 'array'
 and jsonb_array_length(options) between 2 and 6
 and not exists (select 1 from jsonb_array_elements(options) o
   where jsonb_typeof(o) <> 'object' or coalesce(o->>'id','') !~ '^[a-z0-9_-]{1,40}$'
   or char_length(coalesce(o->>'label','')) not between 1 and 150 or (o->>'label') ~ '[<>]')
 and (select count(*) = count(distinct o->>'id') from jsonb_array_elements(options) o)
$$;
create table public.community_polls (
  id uuid primary key default gen_random_uuid(),
  article_key text not null references public.community_articles on delete cascade,
  question text not null check (char_length(question) between 10 and 250 and question !~ '[<>]'),
  options jsonb not null check (public.community_options_valid(options)),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index community_one_active_poll on public.community_polls(article_key) where active;
create table public.community_votes (
  poll_id uuid not null references public.community_polls on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  option_id text not null,
  created_at timestamptz not null default now(),
  primary key (poll_id,user_id)
);
create index community_votes_results on public.community_votes(poll_id,option_id);
create table public.community_feedback (
  article_key text not null references public.community_articles on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  helpful boolean not null,
  created_at timestamptz not null default now(),
  primary key (article_key,user_id)
);
create table public.community_comments (
  id uuid primary key default gen_random_uuid(),
  article_key text not null references public.community_articles on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  nickname text not null check (char_length(btrim(nickname)) between 2 and 40 and nickname !~ '[<>]'),
  body text not null check (char_length(btrim(body)) between 10 and 3000 and body !~ '[<>]'),
  status text not null default 'pending' check (status in ('pending','approved','hidden')),
  created_at timestamptz not null default now(),
  moderated_at timestamptz
);
create index community_comments_public on public.community_comments(article_key,created_at desc,id desc) where status='approved';
create index community_comments_queue on public.community_comments(status,created_at desc,id desc);
create index community_comments_author on public.community_comments(user_id,created_at desc);
create table public.community_questions (
  id uuid primary key default gen_random_uuid(),
  article_key text not null references public.community_articles on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  body text not null check (char_length(btrim(body)) between 10 and 1000 and body !~ '[<>]'),
  status text not null default 'pending' check (status in ('pending','reviewed','hidden')),
  created_at timestamptz not null default now(),
  moderated_at timestamptz
);
create index community_questions_queue on public.community_questions(status,created_at desc,id desc);
create index community_questions_article on public.community_questions(article_key,created_at desc);
create table public.community_admins (
  user_id uuid primary key references auth.users on delete cascade,
  created_at timestamptz not null default now()
);
create table public.community_audit_log (
  id bigint generated always as identity primary key,
  actor uuid references auth.users on delete set null,
  action text not null,
  target text not null,
  created_at timestamptz not null default now()
);
-- Rotating keyed IP hashes only. No raw IP address is persisted here.
create table public.community_rate_buckets (
  key text primary key,
  count integer not null check (count>0),
  expires_at timestamptz not null
);

create index community_rate_expiry on public.community_rate_buckets(expires_at);

-- Guard data invariants even for an operator using the SQL editor.
create function public.community_vote_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if not exists (select 1 from public.community_polls p, jsonb_array_elements(p.options) o
                where p.id=new.poll_id and p.active and o->>'id'=new.option_id) then
   raise exception 'POLL_CHANGED';
 end if;
 return new;
end $$;
create trigger community_vote_valid before insert or update on public.community_votes for each row execute function public.community_vote_guard();
create function public.community_poll_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if new.question is distinct from old.question or new.options is distinct from old.options or new.article_key is distinct from old.article_key then
   raise exception 'CREATE_NEW_POLL_VERSION';
 end if;
 return new;
end $$;
create trigger community_poll_immutable before update on public.community_polls for each row execute function public.community_poll_guard();

-- Strict RLS on every table, including audit/admin/rate data. No permissive policy.
-- SECURITY DEFINER functions below are service_role-only and fix search_path.
do $$ declare name text; begin
 foreach name in array array['community_articles','community_polls','community_votes','community_feedback','community_comments','community_questions','community_admins','community_audit_log','community_rate_buckets'] loop
   execute format('alter table public.%I enable row level security',name);
   execute format('revoke all on public.%I from anon, authenticated',name);
 end loop;
end $$;

create function public.community_read(p_article text, p_actor uuid default null, p_before timestamptz default null, p_before_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.community_articles; p public.community_polls; comments jsonb; cursor jsonb; results jsonb; total bigint;
begin
 select * into a from public.community_articles where article_key=p_article;
 if not found or not a.enabled then return jsonb_build_object('enabled',false); end if;
 select * into p from public.community_polls where article_key=p_article and active;
 select count(*) into total from public.community_votes where poll_id=p.id;
 select jsonb_agg(jsonb_build_object('id',o->>'id','label',o->>'label','count',
   (select count(*) from public.community_votes v where v.poll_id=p.id and v.option_id=o->>'id')) order by ord)
 into results from jsonb_array_elements(coalesce(p.options,'[]'::jsonb)) with ordinality opt(o,ord);
 with batch as (
   select id,nickname,body,created_at from public.community_comments
   where article_key=p_article and status='approved' and
   (p_before is null or (created_at,id)<(p_before,p_before_id)) order by created_at desc,id desc limit 11
 ), shown as (select * from batch order by created_at desc,id desc limit 10)
 select coalesce(jsonb_agg(to_jsonb(shown) order by created_at desc,id desc),'[]'::jsonb),
   case when (select count(*) from batch)>10 then
     (select jsonb_build_object('created_at',created_at,'id',id) from shown order by created_at,id limit 1) else null end
 into comments,cursor from shown;
 return jsonb_build_object('enabled',true,
   'config',jsonb_build_object('question',p.question,'options',p.options,'discussionPrompt',a.discussion_prompt,'nextQuestion',a.next_question),
   'poll',case when p.id is null then null else jsonb_build_object('id',p.id,'total',total,'options',results,'selected',
     (select option_id from public.community_votes where poll_id=p.id and user_id=p_actor)) end,
   'feedback',jsonb_build_object('total',(select count(*) from public.community_feedback where article_key=p_article),
     'helpful',(select count(*) from public.community_feedback where article_key=p_article and helpful),
     'selected',(select helpful from public.community_feedback where article_key=p_article and user_id=p_actor)),
   'comments',comments,'nextCursor',cursor);
end $$;

create function public.community_limit(p_key text,p_max integer,p_expiry timestamptz) returns void
language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 insert into public.community_rate_buckets(key,count,expires_at) values(p_key,1,p_expiry)
 on conflict(key) do update set count=public.community_rate_buckets.count+1 returning count into n;
 if n>p_max then raise exception 'RATE_LIMITED'; end if;
end $$;

create function public.community_submit(p_article text,p_actor uuid,p_ip_hash text,p_action text,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.community_polls; hour text:=to_char(now() at time zone 'UTC','YYYYMMDDHH'); day text:=to_char(now() at time zone 'UTC','YYYYMMDD'); target uuid;
begin
 if p_actor is null or not exists(select 1 from auth.users where id=p_actor) or p_ip_hash is null or p_ip_hash !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_INPUT'; end if;
 -- Lock article config until commit so close/edit races cannot accept a stale poll.
 perform 1 from public.community_articles where article_key=p_article and enabled for share;
 if not found then raise exception 'ARTICLE_CLOSED'; end if;
 perform pg_advisory_xact_lock(hashtextextended('community-ip:'||p_ip_hash,0));
 perform pg_advisory_xact_lock(hashtextextended('community-user:'||p_actor::text,0));
 if p_action='poll' then
   select * into p from public.community_polls where article_key=p_article and active for share;
   if p.id is null or p.id::text is distinct from p_payload->>'pollId' then raise exception 'POLL_CHANGED'; end if;
   if not exists(select 1 from jsonb_array_elements(p.options) o where o->>'id'=p_payload->>'option') then raise exception 'INVALID_INPUT'; end if;
   if exists(select 1 from public.community_votes where poll_id=p.id and user_id=p_actor) then return jsonb_build_object('accepted',false,'duplicate',true); end if;
 elsif p_action='feedback' then
   if jsonb_typeof(p_payload->'helpful') is distinct from 'boolean' then raise exception 'INVALID_INPUT'; end if;
   if exists(select 1 from public.community_feedback where article_key=p_article and user_id=p_actor) then return jsonb_build_object('accepted',false,'duplicate',true); end if;
 elsif p_action='comment' then
   if char_length(btrim(coalesce(p_payload->>'nickname',''))) not between 2 and 40 or char_length(btrim(coalesce(p_payload->>'body',''))) not between 10 and 3000 or (p_payload->>'nickname') ~ '[<>]' or (p_payload->>'body') ~ '[<>]' then raise exception 'INVALID_INPUT'; end if;
   if exists(select 1 from public.community_comments where article_key=p_article and user_id=p_actor and body=btrim(p_payload->>'body') and created_at>now()-interval '1 day') then return jsonb_build_object('accepted',false,'duplicate',true); end if;
 elsif p_action='question' then
   if char_length(btrim(coalesce(p_payload->>'body',''))) not between 10 and 1000 or (p_payload->>'body') ~ '[<>]' then raise exception 'INVALID_INPUT'; end if;
   if exists(select 1 from public.community_questions where article_key=p_article and user_id=p_actor and body=btrim(p_payload->>'body') and created_at>now()-interval '1 day') then return jsonb_build_object('accepted',false,'duplicate',true); end if;
 else raise exception 'INVALID_INPUT'; end if;
 perform public.community_limit('ip-hour:'||p_ip_hash||':'||hour,30,now()+interval '2 days');
 perform public.community_limit('ip-day:'||p_ip_hash||':'||day,100,now()+interval '2 days');
 perform public.community_limit('user-hour:'||p_actor::text||':'||hour,10,now()+interval '2 days');
 if p_action in ('comment','question') then
   perform public.community_limit(p_action||'-user:'||p_actor::text||':'||hour,3,now()+interval '2 days');
   perform public.community_limit(p_action||'-ip:'||p_ip_hash||':'||hour,10,now()+interval '2 days');
 else
   perform public.community_limit(p_action||'-ip:'||p_ip_hash||':'||hour,5,now()+interval '2 days');
   perform public.community_limit(p_action||'-day-ip:'||p_ip_hash||':'||day,20,now()+interval '2 days');
 end if;
 -- Counters and mutation share one transaction: failures roll everything back.
 if p_action='poll' then insert into public.community_votes(poll_id,user_id,option_id) values(p.id,p_actor,p_payload->>'option');
 elsif p_action='feedback' then insert into public.community_feedback(article_key,user_id,helpful) values(p_article,p_actor,(p_payload->>'helpful')::boolean);
 elsif p_action='comment' then insert into public.community_comments(article_key,user_id,nickname,body) values(p_article,p_actor,btrim(p_payload->>'nickname'),btrim(p_payload->>'body')) returning id into target;
 elsif p_action='question' then insert into public.community_questions(article_key,user_id,body) values(p_article,p_actor,btrim(p_payload->>'body')) returning id into target;
 end if;
 delete from public.community_rate_buckets where expires_at<now();
 return jsonb_build_object('accepted',true,'id',target);
end $$;

create function public.community_admin(p_actor uuid,p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.community_articles; p public.community_polls; rows jsonb; c jsonb; q jsonb; off integer; lim integer; filter_article text; target uuid; new_status text;
begin
 if not exists(select 1 from public.community_admins where user_id=p_actor) or
    not exists(select 1 from auth.users where id=p_actor and not coalesce(is_anonymous,false)) then raise exception 'FORBIDDEN'; end if;
 if p_action in ('admin_list','admin_export') then
   off:=greatest(0,least(coalesce((p_payload->>'offset')::integer,0),100000));
   lim:=case when p_action='admin_export' then 1000 else 25 end;
   filter_article:=nullif(p_payload->>'article','');
   select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into rows from (
     select ar.*, (select to_jsonb(poll) from public.community_polls poll where poll.article_key=ar.article_key and active) as poll,
       (select count(*) from public.community_votes v join public.community_polls poll on poll.id=v.poll_id where poll.article_key=ar.article_key and poll.active) as votes,
       (select coalesce(jsonb_agg(jsonb_build_object('id',o->>'id','label',o->>'label','count',(select count(*) from public.community_votes v where v.poll_id=poll.id and v.option_id=o->>'id'))),'[]'::jsonb) from public.community_polls poll, jsonb_array_elements(poll.options) o where poll.article_key=ar.article_key and poll.active) as poll_results,
       (select coalesce(jsonb_agg(jsonb_build_object('id',hp.id,'question',hp.question,'active',hp.active,'created_at',hp.created_at,'results',(select jsonb_agg(jsonb_build_object('id',o->>'id','label',o->>'label','count',(select count(*) from public.community_votes v where v.poll_id=hp.id and v.option_id=o->>'id'))) from jsonb_array_elements(hp.options) o)) order by hp.created_at desc),'[]'::jsonb) from public.community_polls hp where hp.article_key=ar.article_key) as poll_history,
       (select count(*) from public.community_feedback f where f.article_key=ar.article_key) as feedback_total,
       (select count(*) from public.community_feedback f where f.article_key=ar.article_key and f.helpful) as helpful,
       (select count(*) from public.community_comments co where co.article_key=ar.article_key and co.status='pending') as pending_comments,
       (select count(*) from public.community_questions qu where qu.article_key=ar.article_key and qu.status='pending') as pending_questions
     from public.community_articles ar where filter_article is null or ar.article_key=filter_article order by ar.article_key
   ) x;
   select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into c from (
     select id,article_key,nickname,body,status,created_at,moderated_at from public.community_comments
     where (filter_article is null or article_key=filter_article) and (coalesce(p_payload->>'status','')='' or status=p_payload->>'status')
     order by created_at desc,id desc limit lim offset off
   ) x;
   select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into q from (
     select id,article_key,body,status,created_at,moderated_at from public.community_questions
     where (filter_article is null or article_key=filter_article) and (coalesce(p_payload->>'status','')='' or status=p_payload->>'status')
     order by created_at desc,id desc limit lim offset off
   ) x;
   return jsonb_build_object('articles',rows,'comments',c,'questions',q,'nextOffset',case when jsonb_array_length(c)=lim or jsonb_array_length(q)=lim then off+lim else null end);
 elsif p_action='admin_moderate' then
   target:=(p_payload->>'id')::uuid;new_status:=p_payload->>'status';
   if p_payload->>'kind'='comment' then
     if new_status='delete' then delete from public.community_comments where id=target;
     elsif new_status in ('pending','approved','hidden') then update public.community_comments set status=new_status,moderated_at=now() where id=target;
     else raise exception 'INVALID_INPUT';end if;
   elsif p_payload->>'kind'='question' then
     if new_status='delete' then delete from public.community_questions where id=target;
     elsif new_status in ('pending','reviewed','hidden') then update public.community_questions set status=new_status,moderated_at=now() where id=target;
     else raise exception 'INVALID_INPUT';end if;
   else raise exception 'INVALID_INPUT';end if;
   if not found then raise exception 'NOT_FOUND'; end if;
   insert into public.community_audit_log(actor,action,target) values(p_actor,p_action||':'||(p_payload->>'kind')||':'||new_status,target::text);
 elsif p_action='admin_config' then
   select * into a from public.community_articles where article_key=p_payload->>'article' for update;
   if not found then raise exception 'NOT_FOUND'; end if;
   if char_length(coalesce(p_payload->>'discussionPrompt','')) not between 10 and 1000 or char_length(coalesce(p_payload->>'nextQuestion','')) not between 10 and 250 or jsonb_typeof(p_payload->'enabled') is distinct from 'boolean' then raise exception 'INVALID_INPUT';end if;
   update public.community_articles set enabled=(p_payload->>'enabled')::boolean,discussion_prompt=p_payload->>'discussionPrompt',next_question=p_payload->>'nextQuestion',updated_at=now() where article_key=a.article_key;
   select * into p from public.community_polls where article_key=a.article_key and active;
   if p.question is distinct from p_payload->>'question' or p.options is distinct from p_payload->'options' then
     update public.community_polls set active=false where article_key=a.article_key and active;
     insert into public.community_polls(article_key,question,options) values(a.article_key,p_payload->>'question',p_payload->'options');
   end if;
   insert into public.community_audit_log(actor,action,target) values(p_actor,p_action,a.article_key);
 else raise exception 'INVALID_INPUT';end if;
 return jsonb_build_object('accepted',true);
end $$;

-- Privileged functions cannot be invoked directly with a public key or reader JWT.
revoke all on function public.community_read(text,uuid,timestamptz,uuid) from public,anon,authenticated;
revoke all on function public.community_limit(text,integer,timestamptz) from public,anon,authenticated;
revoke all on function public.community_submit(text,uuid,text,text,jsonb) from public,anon,authenticated;
revoke all on function public.community_admin(uuid,text,jsonb) from public,anon,authenticated;
revoke all on function public.community_vote_guard() from public,anon,authenticated;
revoke all on function public.community_poll_guard() from public,anon,authenticated;
grant execute on function public.community_read(text,uuid,timestamptz,uuid) to service_role;
grant execute on function public.community_submit(text,uuid,text,text,jsonb) to service_role;
grant execute on function public.community_admin(uuid,text,jsonb) to service_role;
-- The service role must not be sent to browsers. No admin user is seeded.
commit;
