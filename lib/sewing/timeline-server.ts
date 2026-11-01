import {db} from './server';
import {result} from './operations-server';
import {publicOrderTimeline} from './timeline';
import type {ManagedOrder,Confirmation} from './operations';
// Call only after the request or confirmation token has authorized this exact order.
export async function readPublicTimeline(orderId:string){
 const [order,confirmations]=await Promise.all([
  db().from('sewing_orders').select('id,version,created_at,work,data').eq('id',orderId).single(),
  db().from('sewing_ops_confirmations').select('id,kind,spec_version,quote_id,snapshot,response,expires_at,revoked_at,superseded_at').eq('order_id',orderId),
 ]);
 return publicOrderTimeline(result(order) as ManagedOrder,(result(confirmations)??[]) as Confirmation[]);
}
