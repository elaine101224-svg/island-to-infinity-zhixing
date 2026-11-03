const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
const base='http://localhost:3934',browser=await chromium.launch();
const customerContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const makerContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const page=await customerContext.newPage(),maker=await makerContext.newPage(),checks=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));maker.on('pageerror',e=>errors.push(e.message));
page.setDefaultTimeout(12000);maker.setDefaultTimeout(12000);
try {
 await maker.goto(base+'/sewing/manage');await maker.locator('[name=username]').fill('test_maker');await maker.locator('[name=password]').fill('Isolated-Test-2026');await maker.getByRole('button',{name:'登录',exact:true}).click();await maker.getByRole('button',{name:'刷新需求',exact:true}).waitFor();
 for(const decision of ['accept','decline']) {
  const name='Isolated Teams Student '+decision+' '+randomUUID().slice(0,8);
  await page.goto(base+'/sewing/request');await page.getByRole('textbox',{name:'Full name on Teams *',exact:true}).waitFor();
  for(const [field,value]of Object.entries({name,wechat:'test-contact',product:'Embroidered tote bag',quantity:'12',group:'Test House',budget:'150',date:'2027-02-01',requirements:'Blue cotton with initials',notes:'School delivery'}))await page.locator('[name='+field+']').fill(value);
  await page.locator('[name=fabric]').selectOption('specified');await page.locator('[name=fabricDetails]').fill('100% cotton, 300 gsm');
  await page.locator('input[type=file]').setInputFiles(fileURLToPath(new URL('test-sample.png',import.meta.url)));
  assert.equal(await page.locator('details,summary').count(),0);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.getByRole('button',{name:'Submit request',exact:true}).click();await page.getByText('Your request and files have been received. Please save your private link.').waitFor();
  const link=await page.getByRole('textbox',{name:'Private request link'}).inputValue(),token=new URL(link).hash.split('=')[1];
  const view=await(await page.request.get(base+'/api/sewing-request/',{headers:{authorization:'Bearer '+token}})).json();
  assert.equal(view.data.unitBudgetCents,15000);assert.equal(view.data.budgetCents,null);assert.equal(view.data.fabricDetails,'100% cotton, 300 gsm');assert.equal(view.data.quantity,12);assert.equal(view.decision,'pending');
  await page.reload();await page.getByText('test-sample.png (uploaded)').waitFor();
  await page.locator('[name=notes]').fill('Added after submission');await page.getByRole('button',{name:'Save additions',exact:true}).click();await page.getByText('Your additions have been saved. The team will review them before updating the agreed specifications.').waitFor();
  await maker.getByRole('button',{name:'刷新需求',exact:true}).click();const card=maker.locator('.ops-simple-request').filter({hasText:name});await card.waitFor();
  for(const value of ['Test House','100% cotton, 300 gsm','Blue cotton with initials','School delivery','Added after submission','150.00'])assert((await card.innerText()).includes(value),value);
  const img=card.locator('img[alt="订单附件，点击查看原图"]');await img.waitFor();await img.evaluate(i=>i.complete?Promise.resolve():new Promise((resolve,reject)=>{i.onload=resolve;i.onerror=reject;}));assert(await img.evaluate(i=>i.naturalWidth>0));
  if(decision==='decline'){const invalid=await maker.request.post(base+'/api/sewing-ops/orders/'+view.id+'/adopt',{headers:{origin:base,'x-sewing-ops':'1'},data:{decision:'decline',reason:' '}});assert.equal(invalid.status(),400);}
  await card.getByRole('radio',{name:decision==='accept'?'接单':'不接单',exact:true}).check();
  if(decision==='decline')await card.locator('[name=reason]').fill('无法满足本单交期');
  await card.getByRole('button',{name:decision==='accept'?'确认接单':'确认不接单',exact:true}).click();
  await card.locator('.ops-decision-status').filter({hasText:decision==='accept'?'已接单':'不接单'}).waitFor();
  await page.reload();await page.getByText(decision==='accept'?'Your request has been accepted. Please discuss the details in your WeChat group.':'The team cannot take this request. Please discuss alternatives in your WeChat group.',{exact:true}).waitFor();
  const workspace=await(await maker.request.get(base+'/api/sewing-ops/workspace')).json();const order=workspace.orders.find(o=>o.id===view.id);
  assert.equal(order.data.name,name);assert.equal(order.data.fabricDetails,'100% cotton, 300 gsm');assert.equal(order.work.preferences.fabricDetails,'100% cotton, 300 gsm');assert.equal(order.work.business,decision==='accept'?'draft':'cancelled');assert.equal(order.requestFiles.length,1);assert.equal(workspace.orders.filter(o=>o.id===view.id).length,1);
  const headers={origin:base,'x-sewing-ops':'1'},path=base+'/api/sewing-ops/orders/'+view.id+'/adopt';
  assert.equal((await maker.request.post(path,{headers,data:{decision,reason:decision==='decline'?'无法满足本单交期':''}})).status(),200);
  assert.equal((await maker.request.post(path,{headers,data:{decision:decision==='accept'?'decline':'accept',reason:'conflicting decision'}})).status(),409);
  assert.equal((await page.request.get(base+'/api/sewing-ops/workspace')).status(),401);
  checks.push(decision+': full request, image, supplement, single order, recorded decision, private customer status, repeat/conflict handling');
 }
 for(const width of [390,768,1200]){await maker.setViewportSize({width,height:900});assert(await maker.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.equal(await maker.locator('details,summary,.ops-bottom,.ops-tabs').count(),0);await maker.screenshot({path:fileURLToPath(new URL('../../../test-results/simple-maker-'+width+'.png',import.meta.url))});}
 assert.deepEqual(errors,[]);console.log(JSON.stringify({environment:'isolated database + memory storage',checks,passed:true,productionWrites:0}));
} finally {await browser.close();}
