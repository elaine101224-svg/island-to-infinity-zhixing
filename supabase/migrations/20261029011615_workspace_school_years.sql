-- Current-year metadata is independent from the stable shared-workspace storage key.
do $migration$
declare definition text;
begin
 definition:=pg_get_functiondef('iti_private.assign_scope_task(text,jsonb)'::regprocedure);
 if position('''schoolYear''' in definition)=0 then
  if position('''status'',''Not started''' in definition)=0 then raise exception 'Unknown task default';end if;
  execute replace(definition,'''status'',''Not started''','''schoolYear'',coalesce(w.document->>''activeSchoolYear'',replace(left(w.document->>''term'',7),''-'',''–'')),''status'',''Not started''');
 end if;
end $migration$;
-- Keep old records in their original school year when the current year later changes.
with mapped as (
 select id,revision,jsonb_set(jsonb_set(document,'{activeSchoolYear}',to_jsonb(coalesce(document->>'activeSchoolYear',replace(left(document->>'term',7),'-','–')))),'{tasks}',
  (select coalesce(jsonb_agg(case when task ? 'schoolYear' then task else task||jsonb_build_object('schoolYear',replace(left(document->>'term',7),'-','–')) end order by position),'[]'::jsonb) from jsonb_array_elements(document->'tasks') with ordinality a(task,position))) as document
 from public.term_workspaces
)
update public.term_workspaces w set document=m.document,revision=w.revision+1 from mapped m where w.id=m.id and w.revision=m.revision and w.document is distinct from m.document;
