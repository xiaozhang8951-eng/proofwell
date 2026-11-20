-- ProofWell Community 上线前只读验收；无 DDL/DML、无密钥、不会配置生产环境。
-- 仅在获准的目标 Supabase 项目 SQL Editor 中由项目管理员执行。
-- 初次 migration 前可先单独运行第 1 组；其余组要求 migration 已执行。

-- 1. 先确认目标项目/数据库及现有对象；迁移历史不存在时，不要猜测已执行。
select current_database() as database_name,
       to_regclass('supabase_migrations.schema_migrations') as migration_history,
       to_regclass('public.community_articles') as existing_community_articles;
select c.relname, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r' and c.relname in
 ('community_articles','community_polls','community_votes','community_feedback',
  'community_comments','community_questions','community_admins','community_audit_log','community_rate_buckets','community_gateway_nonces')
order by c.relname;
-- 初始安装预期：10 张表，rls_enabled 均 true。

-- 2. 匿名和普通已登录角色均不得直接访问表。
select c.relname,
 has_table_privilege('anon',c.oid,'SELECT') as anon_select,
 has_table_privilege('anon',c.oid,'INSERT') as anon_insert,
 has_table_privilege('anon',c.oid,'UPDATE') as anon_update,
 has_table_privilege('anon',c.oid,'DELETE') as anon_delete,
 has_table_privilege('authenticated',c.oid,'SELECT') as user_select,
 has_table_privilege('authenticated',c.oid,'INSERT') as user_insert,
 has_table_privilege('authenticated',c.oid,'UPDATE') as user_update,
 has_table_privilege('authenticated',c.oid,'DELETE') as user_delete
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r' and c.relname like 'community_%'
order by c.relname;
-- 权限列应全 false；不要用关闭 RLS 或新建宽泛 policy 解决 API 配置错误。

-- 3. 四个受保护 RPC：仅 service_role 可执行；SECURITY DEFINER + 固定 search_path。
select p.proname, pg_get_function_identity_arguments(p.oid) as arguments,
 p.prosecdef as security_definer,p.proconfig as function_settings,
 has_function_privilege('anon',p.oid,'EXECUTE') as anon_execute,
 has_function_privilege('authenticated',p.oid,'EXECUTE') as user_execute,
 has_function_privilege('service_role',p.oid,'EXECUTE') as service_execute,
 exists(select 1 from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
        where a.grantee=0 and a.privilege_type='EXECUTE') as public_execute
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in ('community_read','community_submit','community_admin','community_consume_gateway_nonce')
order by p.proname;
-- 预期：security_definer=true，search_path 为空；anon/user/PUBLIC=false，service=true。
select tablename,policyname,roles,cmd,qual,with_check
from pg_policies where schemaname='public' and tablename like 'community_%'
order by tablename,policyname;
-- 当前设计没有开放读写 policy；结果为空是预期行为。

-- 4. 约束及重复记录；下面三个重复查询均应返回零行。
select tablename,indexname,indexdef from pg_indexes
where schemaname='public' and tablename in ('community_polls','community_votes','community_feedback')
order by tablename,indexname;
select article_key,count(*) from public.community_polls where active group by article_key having count(*)>1;
select poll_id,user_id,count(*) from public.community_votes group by poll_id,user_id having count(*)>1;
select article_key,user_id,count(*) from public.community_feedback group by article_key,user_id having count(*)>1;

-- 5. 首次初始化快照；19/10/9 只对应本分支当前内容，未来按真实发布清单复核。
select count(*) as registered_articles,
 count(*) filter(where enabled) as enabled_articles,
 count(*) filter(where not enabled) as disabled_articles from public.community_articles;
select count(*) as all_polls,count(*) filter(where active) as active_polls from public.community_polls;
select 'votes' as dataset,count(*) as rows from public.community_votes
union all select 'feedback',count(*) from public.community_feedback
union all select 'comments',count(*) from public.community_comments
union all select 'questions',count(*) from public.community_questions
union all select 'admins',count(*) from public.community_admins;
-- 全新空项目：19 articles（10 enabled/9 disabled），19 active polls，所有互动和管理员为 0。
-- 已有用户数据的项目不得为追求这个数字删除记录；保留基线并解释差异。
select a.article_key,a.enabled,count(p.id) filter(where p.active) as active_polls
from public.community_articles a left join public.community_polls p on p.article_key=a.article_key
group by a.article_key,a.enabled order by a.article_key;
select status,count(*) from public.community_comments group by status;
select status,count(*) from public.community_questions group by status;

-- 6. 管理员一致性；仅检查，不创建账户或授予权限。
select count(*) as admin_memberships,
 count(*) filter(where u.id is null or coalesce(u.is_anonymous,false)) as invalid_memberships
from public.community_admins a left join auth.users u on u.id=a.user_id;
-- 预期 invalid_memberships=0；管理员数量由所有者批准的实名工作账号清单决定。

-- 7. 清理任务和到期数据；只读，不创建定时任务或删除记录。
select count(*) as expired_rate_buckets from public.community_rate_buckets where expires_at<now();
select count(*) as expired_gateway_nonces from public.community_gateway_nonces where expires_at<now();
select to_regclass('cron.job') as cron_job_table;
-- 如启用了 Supabase Cron，由所有者在 Cron 后台核对任务、时区和执行结果。
