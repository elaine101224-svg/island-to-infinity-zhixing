-- Read-only. An empty result means these explicit grant/RLS checks passed.
with protected_tables as (
 select c.oid,c.relname,c.relrowsecurity
 from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relkind='r'
 and (c.relname like 'member\_%' escape '\' or c.relname in ('term_workspaces','term_workspace_audit'))
), violations as (
 select 'Expected 12 member/workspace tables; found '||count(*) as finding
 from protected_tables having count(*)<>12
 union all
 select 'RLS disabled: '||relname as finding from protected_tables where not relrowsecurity
 union all
 select 'Unexpected table grant: '||t.relname||':'||coalesce(r.rolname,'PUBLIC')||':'||a.privilege_type
 from protected_tables t join pg_class c on c.oid=t.oid
 cross join lateral aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a
 left join pg_roles r on r.oid=a.grantee
 where a.grantee=0 or r.rolname='anon'
 or (r.rolname='authenticated' and not (
   a.privilege_type='SELECT' and t.relname in ('member_accounts','member_tasks','member_reflections','member_groups','member_projects','member_events')
 ))
 union all
 select 'Unexpected privileged RPC execution: '||p.proname||':'||r.rolname
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 cross join (values ('anon'),('authenticated')) r(rolname)
 where n.nspname='public' and p.proname in ('member_limit','member_manage_access','audit_term_workspace')
 and has_function_privilege(r.rolname,p.oid,'EXECUTE')
 union all
 select 'Anonymous member_change execution'
 where has_function_privilege('anon','public.member_change(text,jsonb)','EXECUTE')
)
select finding from violations order by finding;
