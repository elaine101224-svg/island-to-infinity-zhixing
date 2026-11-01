// CI-only editorial fixture. This server is never included in deployments.
import http from 'node:http';
import {defaultHomepage} from '../../lib/contentSchema.ts';
http.createServer((request,response)=>{
 const url=new URL(request.url,'http://127.0.0.1:54436');
 if(url.pathname!=='/rest/v1/website_content'&&url.pathname!=='/health'){
  response.writeHead(404,{'content-type':'application/json'});response.end(JSON.stringify({error:'No CI fixture for this resource'}));return;
 }
 response.writeHead(200,{'content-type':'application/json'});
 response.end(JSON.stringify(url.pathname==='/health'?{ok:true}:{published:defaultHomepage}));
}).listen(54436,'127.0.0.1');
