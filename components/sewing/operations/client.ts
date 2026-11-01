import type {ManagedOrder,Confirmation} from '@/lib/sewing/operations';
import type {OpsUser} from '@/lib/sewing/operations-server';
export type Account={id:string;name:string;username:string;role:'owner'|'helper';finance:boolean;active:boolean};
export type Partner={id:string;version:number;data:{name:string;contact:string;capabilities:string;notes:string}};
export type Workspace={user:OpsUser;orders:ManagedOrder[];confirmations:(Confirmation&{order_id:string})[];partners:Partner[];accounts:Account[];dueDays:number};
export async function ops<T=unknown>(path:string,input?:unknown,token?:string):Promise<T>{const r=await fetch('/api/sewing-ops/'+path,{method:input===undefined?'GET':'POST',headers:{...(input===undefined?{}:{'Content-Type':'application/json','x-sewing-ops':'1'}),...(token?{Authorization:'Bearer '+token}:{})},...(input===undefined?{}:{body:JSON.stringify(input)}),cache:'no-store'});let data;try{data=await r.json();}catch{throw Error('服务暂时不可用，请重试；尚未确认保存。');}if(!r.ok)throw Object.assign(Error(data.error||'操作失败，请重试'),{status:r.status});return data as T;}
export const businessNames={draft:'待完善',active:'进行中',paused:'已暂停',delivered:'已交付',archived:'已归档',cancelled:'已取消'};
export const kindNames={quote:'报价与交期',sample:'样衣／沿用标准',change:'需求修改及费用／交期变化'};
