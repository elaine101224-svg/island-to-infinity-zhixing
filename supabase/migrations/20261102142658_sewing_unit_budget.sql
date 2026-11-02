-- Add an explicit per-item budget to future fixed confirmation snapshots.
-- Existing budgets, snapshots, permissions and customer records remain unchanged.
begin;
create or replace function public.sewing_ops_issue(session_hash text,admin_mode boolean,order_id uuid,expected_version integer,confirmation_id uuid,kind text,token_hash text,expires_at timestamptz,message text,file_ids uuid[],offline_response jsonb default null) returns jsonb language plpgsql security invoker set search_path='' as $$
declare a jsonb;o public.sewing_orders;w jsonb;snap jsonb;c public.sewing_ops_confirmations;begin
 a:=public.sewing_ops_actor(session_hash,admin_mode);select * into o from public.sewing_orders where id=order_id for update;
 if o.id is null or o.work is null or not public.sewing_ops_allowed(a,o.work) or (a->>'requireChange')::boolean then raise exception '无权发送确认' using errcode='PT403';end if;
 if o.version<>expected_version then raise exception '资料已更新，请刷新' using errcode='PT409';end if;
 if kind not in ('quote','sample','change') or expires_at<=now() or expires_at>now()+interval '90 days' or length(message)>3000 then raise exception '确认参数无效';end if;
 if exists(select 1 from public.sewing_ops_files af where af.id=any(file_ids) and af.finance_only) then raise exception '财务凭证不能发送至客户规格确认网页';end if;
 w:=o.work;if kind='sample' and w ? 'sample' and not w ? 'legacy' and (nullif(w->'sample'->>'completed','') is null or nullif(w->'sample'->>'schoolDelivery','') is null) then raise exception '请先记录样衣完成及送校日期';end if;if kind<>'sample' and (jsonb_array_length(w->'quotes')=0 or w->'quotes'->-1->>'specVersion'<>w->'spec'->>'version') then raise exception '当前规格没有报价';end if;
 if kind='sample' and cardinality(file_ids)=0 then raise exception '请附样衣或沿用标准记录';end if;
 if exists(select 1 from unnest(file_ids) f where not exists(select 1 from public.sewing_ops_files where id=f and sewing_ops_files.order_id=o.id)) then raise exception '附件不属于此订单';end if;
 if exists(select 1 from unnest(file_ids) f where not exists(select 1 from jsonb_array_elements(w->'files') r where r->>'id'=f::text)) then raise exception '请先关联订单附件';end if;
 if offline_response is not null and (coalesce(offline_response->>'name','')='' or coalesce(offline_response->>'record','')='' or cardinality(file_ids)=0 or offline_response->>'choice' not in ('confirm','modify')) then raise exception '线下确认须注明来源及附记录';end if;
 snap:=jsonb_build_object('budgetCents',w->'budgetCents','unitBudgetCents',w->'unitBudgetCents','sampleFeeCents',0,'reference',o.id,'customer',w->'customer'->>'name','product',w->>'product','quantity',w->'quantity','kind',kind,'specVersion',w->'spec'->'version','spec',w->'spec','quote',case when kind='sample' then null else w->'quotes'->-1 end,'message',message,'files',coalesce((select jsonb_agg(f) from jsonb_array_elements(w->'files') f where (f->>'id')::uuid=any(file_ids)),'[]'::jsonb),'committedDate',case when kind='sample' then null else w->'quotes'->-1->'delivery' end);
 update public.sewing_ops_confirmations old set superseded_at=now() where old.order_id=o.id and old.kind=sewing_ops_issue.kind and old.superseded_at is null;
 insert into public.sewing_ops_confirmations(id,order_id,kind,spec_version,quote_id,token_hash,snapshot,created_by,expires_at,response) values(confirmation_id,o.id,kind,(w->'spec'->>'version')::int,case when kind='sample' then null else w->'quotes'->-1->>'id' end,token_hash,snap,a->>'id',expires_at,case when offline_response is null then null else offline_response||jsonb_build_object('source','offline','at',now()) end) returning * into c;
 if offline_response->>'choice'='confirm' and kind in ('quote','change') then perform set_config('sewing.ops_write','1',true);update public.sewing_orders set work=jsonb_set(work,'{committedDate}',snap->'committedDate'),version=version+1 where id=o.id;end if;
 insert into public.sewing_audit(actor,action,data) values(a->>'id','ops:issue',jsonb_build_object('orderId',o.id,'confirmationId',c.id,'source',case when offline_response is null then 'web' else 'offline' end));
 return to_jsonb(c)-'token_hash';
end $$;
revoke all on function public.sewing_ops_issue(text,boolean,uuid,integer,uuid,text,text,timestamptz,text,uuid[],jsonb) from public,anon,authenticated;
grant execute on function public.sewing_ops_issue(text,boolean,uuid,integer,uuid,text,text,timestamptz,text,uuid[],jsonb) to service_role;
commit;
