'use client';

import {useEffect,useState} from 'react';
import {Download,ExternalLink,FileText} from 'lucide-react';

type Attachment={id:string;name:string;mime:string};
function attachmentLabel(file:Attachment,index:number){
 const name=file.name.replace(/\.[^.]+$/,'');
 // Use supplied descriptive labels; never infer a garment variant from an image.
 if(/设计稿|效果图/.test(name))return name;
 return (file.mime?.startsWith('image/')?'设计参考图':'客户附件')+' '+(index+1);
}
export default function MerchantAttachment({orderId,file,index,accessToken,label:providedLabel}:{orderId:string;file:Attachment;index:number;accessToken?:string;label?:string}){
 const [url,setUrl]=useState(''),[mime,setMime]=useState(file.mime),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{let active=true,objectUrl='';const controller=new AbortController();
  fetch(accessToken?'/api/sewing-request/files/'+file.id:'/api/sewing-ops/orders/'+orderId+'/files/'+file.id,{cache:'no-store',signal:controller.signal,headers:accessToken?{authorization:'Bearer '+accessToken}:{}}).then(async response=>{
   if(!response.ok)throw Error('附件暂时无法读取，请重试。');
   const blob=await response.blob();if(!active)return;
   objectUrl=URL.createObjectURL(blob);setMime(response.headers.get('content-type')||file.mime);setUrl(objectUrl);setError('');
  }).catch(e=>{if(active&&e.name!=='AbortError')setError('附件暂时无法读取，请重试。');});
  return()=>{active=false;controller.abort();if(objectUrl)URL.revokeObjectURL(objectUrl);};
 },[orderId,file.id,file.mime,retry,accessToken]);
 const label=providedLabel||attachmentLabel(file,index),image=mime?.startsWith('image/');
 return <figure className={image?'merchant-image':'merchant-document'}>
  {url?image?<a href={url} target="_blank" rel="noopener noreferrer" aria-label={'查看'+label+'原图（新窗口）'}><img src={url} alt="订单附件，点击查看原图"/></a>:<div className="merchant-document-label"><FileText size={28} aria-hidden="true"/><span>{label}</span></div>:error?<p role="alert">{error}<button type="button" onClick={()=>setRetry(value=>value+1)}>重试</button></p>:<p role="status">正在读取附件…</p>}
  <figcaption><span>{label}</span>{url&&<div className="merchant-attachment-actions">{image&&<a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} aria-hidden="true"/>查看原图</a>}<a href={url} download={file.name}><Download size={14} aria-hidden="true"/>{image?'下载原图':'下载文件'}</a></div>}</figcaption>
 </figure>;
}
