const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import assert from 'node:assert/strict';import {randomUUID,randomBytes} from 'node:crypto';
const base='http://localhost:3934',headers={origin:base,'x-sewing-ops':'1'},browser=await chromium.launch(),owner=await browser.newContext(),helper=await browser.newContext(),customer=await browser.newContext();
try {
 assert.equal((await owner.request.post(base+'/api/sewing-ops/login',{headers,data:{username:'test_maker',password:'Isolated-Test-2026'}})).status(),200);
 const aid=randomUUID(),username='helper_'+aid.slice(0,8),password='Isolated-Helper-2026';
 assert.equal((await owner.request.post(base+'/api/sewing-ops/accounts',{headers,data:{id:aid,username,name:'Isolated helper',role:'helper',finance:false,active:true,password}})).status(),200);
 assert.equal((await helper.request.post(base+'/api/sewing-ops/login',{headers,data:{username,password}})).status(),200);
 assert.equal((await helper.request.post(base+'/api/sewing-ops/password',{headers,data:{current:password,password:password+'-new'}})).status(),200);
 assert.equal((await helper.request.post(base+'/api/sewing-ops/login',{headers,data:{username,password:password+'-new'}})).status(),200);
 const id=randomUUID(),token=randomBytes(32).toString('base64url');
 assert.equal((await customer.request.post(base+'/api/sewing-request/create',{headers,data:{id,token,website:'',data:{kind:'personal',name:'Isolated restricted request',wechat:'test',product:'Test tote',quantity:1,date:'',group:'',notes:'Test private notes',fileIds:[],budgetCents:null,unitBudgetCents:9000,sizing:'pending_chart',fabric:'recommend',requirements:''}}})).status(),200);
 const ws=await(await helper.request.get(base+'/api/sewing-ops/workspace')).json();assert.equal(ws.user.role,'helper');assert.equal(ws.orders.some(o=>o.id===id),false);
 assert.equal((await helper.request.post(base+'/api/sewing-ops/orders/'+id+'/adopt',{headers,data:{decision:'accept'}})).status(),404);
 assert.equal((await helper.request.get(base+'/api/sewing-ops/export?format=ledger')).status(),403);
 assert.equal((await customer.request.get(base+'/api/sewing-ops/workspace')).status(),401);
 assert.equal((await owner.request.post(base+'/api/sewing-ops/orders/'+id+'/adopt',{headers,data:{decision:'accept'}})).status(),200);
 const after=await(await helper.request.get(base+'/api/sewing-ops/workspace')).json();assert.equal(after.orders.some(o=>o.id===id),false);
 console.log(JSON.stringify({passed:true,checks:['Unassigned helper cannot read raw customer request or financial export','Unassigned helper cannot accept request','Customer cannot read merchant workspace','Owner may accept, but does not grant helper access'],environment:'isolated'}));
} finally {await browser.close();}
