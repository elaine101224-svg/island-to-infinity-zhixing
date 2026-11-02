const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const browser=await chromium.launch();
const page=await browser.newPage();
try {
 for(const width of [390,768,1200]) {
  await page.setViewportSize({width,height:900});
  await page.goto((process.env.SEWING_TEST_BASE||'http://localhost:3934')+'/sewing/request');
  await page.getByRole('heading',{name:'How your order progresses',exact:true}).waitFor();
  assert.equal(await page.locator('.request-process li').count(),8);
  const dots=await page.locator('.request-workflow-dot').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y};}));
  assert.equal(dots.length,8);
  for(let i=1;i<dots.length;i++) {
   if(width>=1000){assert(Math.abs(dots[i].y-dots[0].y)<1);assert(dots[i].x>dots[i-1].x);}
   else {assert(Math.abs(dots[i].x-dots[0].x)<1);assert(dots[i].y>dots[i-1].y);}
  }
  const connector=await page.locator('.request-workflow-line li').nth(1).evaluate(n=>{const s=getComputedStyle(n,'::before');return {content:s.content,width:s.width,border:s.borderTopWidth};});
  assert.notEqual(connector.content,'none');
  assert(width>=1000?parseFloat(connector.border)>=2:parseFloat(connector.width)>=2);
  for(const title of ['Timing expectations','Quality expectations'])assert(await page.getByRole('heading',{name:title,exact:true}).isVisible());
  assert.equal(await page.locator('.request-process details').count(),0);
  await page.getByRole('textbox',{name:'Budget per item',exact:true}).fill('150.00');
  assert.equal(await page.locator('[name=sizing]').inputValue(),'pending_chart');
  assert.equal(await page.locator('select[name=sizing]').count(),0);
  assert(!/[\u3400-\u9fff]/.test(await page.locator('.sewing-desk-content').innerText()));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:fileURLToPath(new URL('../../../test-results/request-expectations-'+width+'.png',import.meta.url)),fullPage:true});
 }
 console.log(JSON.stringify({passed:true,viewports:[390,768,1200],visibleStages:8,expectations:['timing','quality'],budget:'per-item',sizing:'awaiting-standard-chart',submittedOrders:0}));
} finally {await browser.close();}
