-- SELECT-only. Run in the approved project's SQL Editor; do not paste test bootstrap.
select c.relname,c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r' and c.relname like 'community_%' order by c.relname;
select p.proname,p.prosecdef,p.proconfig,
 has_function_privilege('anon',p.oid,'EXECUTE') as anon_execute,
 has_function_privilege('authenticated',p.oid,'EXECUTE') as reader_execute,
 has_function_privilege('service_role',p.oid,'EXECUTE') as service_execute
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname like 'community_%' order by p.proname;
select status,retention_category,count(*),min(created_at) as oldest
from public.community_comments group by status,retention_category;
select count(*) as expired_votes from public.community_votes where created_at<=now()-interval '90 days';
select count(*) as expired_feedback from public.community_feedback where created_at<=now()-interval '90 days';
select count(*) as expired_questions from public.community_questions where created_at<=now()-interval '90 days';
select count(*) as expired_admin_logs from public.community_audit_log where created_at<=now()-interval '180 days';
select max(created_at) as last_cleanup from public.community_audit_log where action='retention_cleanup';
-- Pure argument validator community_options_valid is not a data-access boundary.
-- Review legacy/helper permissions: these should NOT be service_role-callable.
