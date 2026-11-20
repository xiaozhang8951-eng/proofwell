-- P2: SELECT-only catalog/data checks for an APPROVED STAGING project.
-- Not executed against a remote project in this task. No initialization, cron
-- scheduling, dry-run function, DELETE, GRANT, extension creation, or mutation RPC.
-- Never include secrets, raw IPs, user IDs, nicknames or body text in the output.
-- A: inspect catalogs first. If migrations/tables differ, STOP before B.
select now() as observed_at,current_database() as database_name,current_user as execution_role;
-- current_database() often is simply postgres: it does NOT identify project/region.
-- Verify project REF/region separately in the Dashboard and deployment records.
select extname,extversion from pg_extension where extname in ('pg_cron','pg_net') order by extname;
select to_regclass('supabase_migrations.schema_migrations') as migration_history,
       to_regclass('cron.job') as cron_jobs,to_regclass('cron.job_run_details') as cron_runs;
select c.relname,c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r' and c.relname like 'community_%' order by c.relname;
select tablename,policyname,roles,cmd,qual,with_check from pg_policies
where schemaname='public' and tablename like 'community_%' order by tablename,policyname;
select table_name,grantee,privilege_type from information_schema.role_table_grants
where table_schema='public' and table_name like 'community_%' order by table_name,grantee,privilege_type;
select p.proname,pg_get_function_identity_arguments(p.oid) as signature,p.prosecdef,p.proconfig,
 has_function_privilege('anon',p.oid,'EXECUTE') as anon_execute,
 has_function_privilege('authenticated',p.oid,'EXECUTE') as reader_execute,
 has_function_privilege('service_role',p.oid,'EXECUTE') as service_execute
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname like 'community_%' order by p.proname;
-- Pure input validator community_options_valid can be public; not a data RPC.
select tablename,indexname,indexdef from pg_indexes
where schemaname='public' and tablename like 'community_%' order by tablename,indexname;

-- B: only AFTER schema/migration review confirms 001/002/003 are present.
-- Aggregates only; inspect raw records, audit targets and provider logs privately.
select article_key,enabled from public.community_articles order by article_key;
select count(*) as staff_allowlist_entries from public.community_admins;
select count(*) as invalid_allowlisted_staff from public.community_admins a
left join auth.users u on u.id=a.user_id where u.id is null or coalesce(u.is_anonymous,true);
select status,retention_category,count(*) as rows,min(created_at) as oldest_created_at
from public.community_comments group by status,retention_category order by status,retention_category;
select 'votes' as dataset,count(*) as expired_rows,min(created_at) as oldest_expired_at
from public.community_votes where created_at<=now()-interval '90 days'
union all select 'feedback',count(*),min(created_at) from public.community_feedback where created_at<=now()-interval '90 days'
union all select 'questions',count(*),min(created_at) from public.community_questions where created_at<=now()-interval '90 days'
union all select 'pending_or_spam_comments',count(*),min(created_at) from public.community_comments
 where retention_category in ('pending','spam') and created_at<=now()-interval '90 days'
union all select 'admin_audit',count(*),min(created_at) from public.community_audit_log where created_at<=now()-interval '180 days';
select 'votes' as dataset,count(*) as raw_rows,min(created_at) as oldest_created_at from public.community_votes
union all select 'feedback',count(*),min(created_at) from public.community_feedback
union all select 'questions',count(*),min(created_at) from public.community_questions;
select count(*) as poll_option_buckets,coalesce(sum(responses),0) as archived_vote_responses from public.community_vote_totals;
select count(*) as article_buckets,coalesce(sum(helpful),0) as archived_helpful,
 coalesce(sum(needs_improvement),0) as archived_needs_improvement from public.community_feedback_totals;
select 'rate_buckets' as dataset,count(*) filter(where expires_at<now()) as expired,
 count(*) filter(where expires_at>=now()) as unexpired from public.community_rate_buckets
union all select 'gateway_nonces',count(*) filter(where expires_at<now()),count(*) filter(where expires_at>=now())
 from public.community_gateway_nonces;
select count(*) as cleanup_markers,max(created_at) as latest_cleanup_marker
from public.community_audit_log where action='retention_cleanup';
select action,count(*) as events,max(created_at) as last_event from public.community_audit_log
where action in ('admin_export','admin_config','admin_moderate:comment:approved','admin_moderate:comment:hidden',
 'admin_moderate:comment:delete','admin_moderate:question:delete','retention_cleanup') group by action order by action;
-- No admin_export row is expected from current application code: do not infer
-- zero exports occurred; actual export audit is a documented gap.
-- Cron job/run rows should be inspected only if the catalog checks find cron
-- and the operator has permission. Avoid dumping unrelated job commands or
-- return_message bodies that could contain secrets. See T16/T17 for evidence.
