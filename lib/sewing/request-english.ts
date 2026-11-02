import type {OrderTimelineData} from './timeline';
export const englishWorkflow = [
 {id:'budget',title:'Request & budget',hint:'Discuss the product, quantity, design and budget'},
 {id:'sample',title:'Free sample',hint:'Target: one week; the actual date is agreed separately'},
 {id:'school',title:'Sample delivery & approval',hint:'Deliver the sample to school for customer approval'},
 {id:'quote',title:'Final quote',hint:'Provide a final quote after sample approval'},
 {id:'approval',title:'Quote approval',hint:'The customer explicitly approves the quote version'},
 {id:'bulk',title:'Bulk order & payment arrangement',hint:'Pay the agreed deposit or full amount and start bulk production'},
 {id:'production',title:'Production & printing',hint:'The sewing team makes the items; a partner handles printing'},
 {id:'delivery',title:'Delivery & final payment',hint:'Check the items and settle the balance; free remakes are available'},
] as const;
const details:Record<string,string>={
 '需求已记录；未明确的信息可继续补充':'Your request is recorded. You can add missing information.',
 '等待团队核对需求与预算':'Waiting for the team to review your request and budget.',
 '样衣已制作；实际完成日期待补充':'Sample made. The actual completion date still needs to be recorded.',
 '样衣已完成，打样费 ¥0':'Sample completed. Sampling fee: CNY 0.',
 '免费打样，具体完成时间与团队沟通':'Free sampling. Agree the completion date with the team.',
 '样衣已送校，客户已确认':'Sample delivered to school and approved by the customer.',
 '客户已确认，送校记录待补充':'Customer approval recorded. School delivery record still needed.',
 '已送校，等待样衣确认':'Delivered to school. Waiting for sample approval.',
 '等待送校与样衣确认':'Waiting for school delivery and sample approval.',
 '当前规格的最终报价已记录':'The final quote for the current specifications is recorded.',
 '样衣确认后提供最终报价':'The final quote will follow sample approval.',
 '客户已确认当前报价版本':'The customer has approved the current quote version.',
 '等待客户明确确认报价':'Waiting for the customer to explicitly approve the quote.',
 '大货已开始，约定付款节点已完成':'Bulk production started. The agreed payment milestone is complete.',
 '大货已开始，约定付款仍待核对':'Bulk production started. The agreed payment still needs checking.',
 '历史记录：正在制作；确认与付款资料待核对':'Historical record: in production. Approval and payment evidence still needs checking.',
 '完成样衣及报价确认后，安排大货与本单付款':'Arrange bulk production and payment after sample and quote approval.',
 '制作及印花工序已完成':'Production and printing are complete.',
 '正在制作，具体工序由团队更新':'In production. The team will update individual steps.',
 '等待生产及印花安排':'Waiting for production and printing arrangements.',
 '已交付，款项已结清':'Delivered and paid in full.',
 '已交付，尾款仍待结清或核对':'Delivered. The remaining balance still needs settling or checking.',
 '等待交付与尾款核对':'Waiting for delivery and a final payment check.',
 '历史流程已完成；送校日期及样衣确认凭证待补充':'Previously completed. School delivery date and sample approval evidence still needed.',
 '历史流程已完成；最终报价单及金额待补充':'Previously completed. The final quote and amount still need recording.',
 '历史流程已完成；客户确认凭证待补充，不代建确认记录':'Previously completed. Customer approval evidence still needed; no approval has been created on their behalf.',
};
export function englishTimeline(timeline:OrderTimelineData):OrderTimelineData {
 const stages=timeline.stages.map(stage=>{
  const label=englishWorkflow.find(s=>s.id===stage.id)!;
  const unpaid=stage.detail.endsWith('；付款尚未进行');
  const detail=unpaid?stage.detail.slice(0,-'；付款尚未进行'.length):stage.detail;
  return {...stage,title:label.title,hint:label.hint,detail:(details[detail]??label.hint)+(unpaid?' Payment has not started.':'')};
 });
 return {...timeline,stages,current:stages.find(s=>s.state==='current')?.title??(timeline.completed===timeline.total?'Delivery and payment complete':'Awaiting review')};
}
export function requestError(message?:string):string {
 if(message==='金额请填写最多两位小数的非负数字')return 'Enter a non-negative budget with no more than two decimal places.';
 if(message==='金额超出范围')return 'The budget is too large. Please check the amount.';
 if(message?.includes('4MB'))return 'Each file must be no larger than 4 MB.';
 if(message?.includes('PNG')||message?.includes('格式'))return 'Check the required fields and private link. Files must be PNG, JPG, WebP, PDF, CSV or XLSX.';
 if(message?.includes('过期')||message?.includes('撤销')||message?.includes('链接无效'))return 'This private link is invalid, expired or revoked. Please contact the team for a new link.';
 if(message?.includes('频繁'))return 'Too many requests. Please wait a moment and try again.';
 if(message&&!/[\u3400-\u9fff]/.test(message))return message;
 return 'Unable to complete this action. Check your connection and try again. If this continues, contact the team.';
}
