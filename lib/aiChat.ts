export type ChatTurn={role:'user'|'assistant';content:string;error?:boolean};
export function conversationContext(messages:ChatTurn[]){
 const successful=messages.filter(message=>!message.error);
 const firstUser=successful.findIndex(message=>message.role==='user');
 const recent=firstUser<0?[]:successful.slice(firstUser).slice(-20);
 while(recent[0]?.role==='assistant')recent.shift();
 return recent.map(({role,content})=>({role,content:content.slice(0,6000)}));
}
