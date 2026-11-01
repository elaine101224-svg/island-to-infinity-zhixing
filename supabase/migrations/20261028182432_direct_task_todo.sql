-- Keep coordinator permissions and assignment checks; remove acknowledgement step.
do $migration$
declare definition text;
begin
 definition:=pg_get_functiondef('iti_private.assign_scope_task(text,jsonb)'::regprocedure);
 if position('''Awaiting confirmation''' in definition)>0 then
  execute replace(definition,'''Awaiting confirmation''','''Not started''');
 elsif position('''Not started''' in definition)=0 then
  raise exception 'Unknown coordinator task function; inspect before changing';
 end if;
end $migration$;
