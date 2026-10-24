-- Run on staging after term-workspace-schema.sql; no rows are mutated.
begin;
do $$
declare tbl text; role_name text; operation text;
begin
 foreach tbl in array array['term_workspaces','term_workspace_audit'] loop
  if not exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=tbl and c.relrowsecurity) then raise exception 'RLS missing: %',tbl; end if;
  foreach role_name in array array['anon','authenticated'] loop
   foreach operation in array array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] loop
    if has_table_privilege(role_name,'public.'||tbl,operation) then raise exception 'Browser role % has % on %',role_name,operation,tbl; end if;
   end loop;
  end loop;
 end loop;
 foreach operation in array array['SELECT','INSERT','UPDATE'] loop
  if not has_table_privilege('service_role','public.term_workspaces',operation) then raise exception 'Missing server workspace grant: %',operation; end if;
 end loop;
 foreach operation in array array['SELECT','INSERT'] loop
  if not has_table_privilege('service_role','public.term_workspace_audit',operation) then raise exception 'Missing audit grant: %',operation; end if;
 end loop;
end $$;
rollback;
