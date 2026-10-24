-- Optimistic business conflicts are permanent until the client reloads.
-- SQLSTATE 40001 asks PostgREST to retry transactions; PT409 returns promptly.
-- Only function error codes change; no data, authorization or grants change.
do $fix$
declare fn regprocedure; definition text;
begin
 foreach fn in array array['public.member_change(text,jsonb)'::regprocedure,'public.member_manage_access(uuid,text,text,text,text)'::regprocedure] loop
  definition:=pg_get_functiondef(fn);
  if position('''40001''' in definition)>0 then
   execute replace(definition,'''40001''','''PT409''');
  elsif position('''PT409''' in definition)=0 then
   raise exception 'Expected conflict status missing from %',fn;
  end if;
 end loop;
end $fix$;
