import {db} from './server';
import {result} from './operations-server';
import {readProgressUpdates} from './progress-server';
import {progressTimeline} from './progress';
import {publicOrderTimeline} from './timeline';
import type {ManagedOrder,Confirmation} from './operations';
// Call only after the request or confirmation token has authorized this exact order.
export async function readPublicOrderProgress(orderId:string){
 const [order,confirmations]=await Promise.all([
  db().from('sewing_orders').select('id,version,created_at,work,data').eq('id',orderId).single(),
  db().from('sewing_ops_confirmations').select('id,kind,spec_version,quote_id,snapshot,response,expires_at,revoked_at,superseded_at').eq('order_id',orderId),
 ]);
 const o=result(order) as ManagedOrder,progressUpdates=await readProgressUpdates(orderId);
 const delivery=progressUpdates.filter(u=>u.stage==='delivery').at(-1);const delivered=o.work?.business==='delivered'||delivery?.state==='done';
 return {timeline:progressTimeline(publicOrderTimeline(o,(result(confirmations)??[]) as Confirmation[]),progressUpdates,delivered),progressUpdates,delivered};
}

export async function readPublicTimeline(orderId:string){return (await readPublicOrderProgress(orderId)).timeline;}
