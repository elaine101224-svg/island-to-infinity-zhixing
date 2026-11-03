import {db} from './server';
import {result} from './operations-server';
import type {ProgressUpdate} from './progress';
// Call only after authorization for this order. No actor IDs or finance files leave this projection.
export async function readProgressUpdates(orderId:string):Promise<ProgressUpdate[]>{
 const rows=result(await db().from('sewing_progress_updates').select('id,stage,state,note,occurred_on,created_at,file_ids').eq('order_id',orderId).order('created_at',{ascending:true}).order('id',{ascending:true}))??[];
 const ids=[...new Set(rows.flatMap(r=>r.file_ids as string[]))];
 const links=ids.length?result(await db().from('sewing_ops_files').select('id').eq('order_id',orderId).eq('finance_only',false).in('id',ids))??[]:[];
 const files=links.length?result(await db().from('sewing_files').select('id,name,mime').in('id',links.map(f=>f.id)))??[]:[];
 return rows.map(r=>({id:r.id,stage:r.stage,state:r.state,note:r.note,occurredOn:r.occurred_on,at:r.created_at,files:r.file_ids.flatMap((id:string)=>{const file=files.find(f=>f.id===id);return file?[file]:[];})}));
}
