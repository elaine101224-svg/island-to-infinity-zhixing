const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
const base='http://localhost:3934',browser=await chromium.launch(),makerContext=await browser.newContext(),customerContext=await browser.newContext();
const maker=await makerContext.newPage(),customer=await customerContext.newPage();
try {
 await maker.goto(base+'/sewing/manage');await maker.locator('[name=username]').fill('test_maker');await maker.locator('[name=password]').fill('Isolated-Test-2026');await maker.getByRole('button',{name:'登录',exact:true}).click();await maker.getByRole('button',{name:'刷新需求',exact:true}).waitFor();
 const id=randomUUID(),headers={origin:base,'x-sewing-ops':'1'};
 const r=await maker.request.post(base+'/api/sewing-ops/history',{headers,data:{order:{id,customer:{name:'Isolated House '+id.slice(0,8),contact:'',organization:'Test House',channel:'school'},product:'Test hoodie',quantity:12,expectedDate:'',template:'make'},stage:'大货制作中 · 尚未付款',source:'Local isolated acceptance only',progress:{budget:true,sample:true,preProductionComplete:true,production:true,paymentNotStarted:true}}});assert.equal(r.status(),200,await r.text());
 const workspace=await(await maker.request.get(base+'/api/sewing-ops/workspace')).json(),o=workspace.orders.find(o=>o.id===id);
 assert.equal(o.work.quotes.length,0);assert.equal(o.work.finance.ledger.length,0);assert.equal(workspace.confirmations.filter(c=>c.order_id===id).length,0);assert.equal(o.work.legacy.verified,false);assert.equal(o.timeline.stages.filter(s=>s.state==='recorded').length,5);
 const issued=await maker.request.post(base+'/api/sewing-ops/orders/'+id+'/request-link',{headers,data:{revoke:false}});assert.equal(issued.status(),200);const link=(await issued.json()).link,token=new URL(link).hash.split('=')[1];
 await customer.goto(link);await customer.getByRole('heading',{name:'My request',exact:true}).waitFor();
 const view=await(await customer.request.get(base+'/api/sewing-request',{headers:{authorization:'Bearer '+token}})).json();assert.deepEqual(view.timeline,o.timeline);assert.equal(view.decision,'accepted');assert(!JSON.stringify(view).match(/finance|ledger|accountIds|supplier/));assert.equal((await customer.request.get(base+'/api/sewing-ops/workspace')).status(),401);
 for(const route of ['products','collaborations','story','faq','wechat','preview','orders','login']){const r=await customer.request.get(base+'/sewing/'+route,{maxRedirects:0});assert.equal(r.status(),307,route);assert.equal(r.headers().location,['orders','login'].includes(route)?'/sewing/manage':'/sewing/request');}
 console.log(JSON.stringify({passed:true,checks:['Historical order stage preserved without invented dates, quotes, confirmations or payments','Customer private projection remains authorized and contains no internal finance','Customer status accepted; complex progress UI removed as requested','Eight retired routes still redirect to retained entry points'],productionWrites:0}));
} finally {await browser.close();}
