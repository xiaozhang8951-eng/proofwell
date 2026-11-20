-- Local isolated PostgreSQL test harness only. Never apply this to Supabase.
create role anon;
create role authenticated;
create role service_role bypassrls;
create schema auth;
create table auth.users(id uuid primary key,is_anonymous boolean not null default false);
