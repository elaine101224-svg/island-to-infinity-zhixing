import {money} from './operations';
/** Old totals stay totals; a per-item budget is never treated as a confirmed quote. */
export function budgetSummary(value:{budgetCents?:number|null;unitBudgetCents?:number|null}):string {
 if(value.unitBudgetCents!=null)return '客户单件心理预算：'+money(value.unitBudgetCents)+' / 件';
 if(value.budgetCents!=null)return '客户整单心理预算（历史填写）：'+money(value.budgetCents);
 return '客户单件心理预算：未提供';
}
export function sizingSummary(value?:'specified'|'recommend'|'pending_chart'):string {
 return value==='pending_chart'?'尺码：待统一尺码表发布后确认':value==='specified'?'尺码：客户自行指定':'尺码：请团队推荐';
}
