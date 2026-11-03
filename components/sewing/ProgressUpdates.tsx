import type {ProgressUpdate} from '@/lib/sewing/progress';
import {workflow} from '@/lib/sewing/timeline';
import {englishWorkflow} from '@/lib/sewing/request-english';
import MerchantAttachment from './operations/MerchantAttachment';
import './progress-updates.css';
export default function ProgressUpdates({updates,orderId,accessToken,lang='en'}:{updates:ProgressUpdate[];orderId:string;accessToken?:string;lang?:'en'|'zh'}){
 if(!updates.length)return null;
 return <section className="progress-updates"><h3>{lang==='zh'?'进度记录与照片':'Progress updates & photos'}</h3>{[...updates].reverse().map(u=><article key={u.id}><header><strong>{(lang==='zh'?workflow:englishWorkflow).find(s=>s.id===u.stage)?.title} · {u.state==='done'?(lang==='zh'?'团队记录完成':'Reported complete'):(lang==='zh'?'进行中':'In progress')}</strong><time dateTime={u.at}>{new Date(u.at).toLocaleDateString('en-CA',{timeZone:'Asia/Shanghai'})}{lang==='zh'?' 发布':' · Posted'}</time></header>{u.occurredOn&&<small>{lang==='zh'?'实际日期：':'Actual date: '}{u.occurredOn}</small>}{u.note&&<p>{u.note}</p>}{u.files.length>0&&<div className="progress-evidence">{u.files.map((file,index)=><MerchantAttachment key={file.id} orderId={orderId} file={file} index={index} accessToken={accessToken} label={(lang==='zh'?'进度照片 ':'Progress photo ')+(index+1)}/>)}</div>}</article>)}</section>;
}
