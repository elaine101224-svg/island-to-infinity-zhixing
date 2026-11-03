// Read-only UI regression with fictional fixtures. Never use this against production.
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import assert from 'node:assert/strict';
import {defaultHomepage} from '../../lib/contentSchema.ts';
const base='http://localhost:3934',browser=await chromium.launch(),admin=await browser.newContext();
const task={id:'test-task',schoolYear:'2026–27',title:'Test assigned task',ownerId:'test-person',groupId:'A',projectId:null,eventId:null,due:null,priority:'Normal',status:'Not started',update:'Test update visible',nextStep:'Test next action',evidence:'',deliverable:'Test instructions are visible without expanding',updatedAt:'2026-11-01T00:00:00.000Z',scopeId:'test-scope'};
const scope={id:'test-scope',title:'Test scope',kind:'project',memberIds:['test-person'],coordinatorIds:['test-person'],sourcePlan:'test',note:'',coordinationRoles:[]};
const document={term:'2026-27-T1',activeSchoolYear:'2026–27',events:[],groups:['A','B','C','D'].map(id=>({id,coordinator:'Test coordinator',plan:'',assignments:[]})),people:[{id:'test-person',name:'Test Student',groupId:'A',availability:''}],projects:[],tasks:[task],scopes:[scope],responsibilities:[],reflections:[],recaps:[]};
const errors=[];const fixtures=new Map([
 ['/api/admin/content',{draft:defaultHomepage,published:defaultHomepage,revision:0}],['/api/admin/term',{document,revision:0}],['/api/admin/activities',[]],
 ['/api/admin/member-tasks',{document,revision:0,accounts:[{user_id:'test-user',person_id:'test-person',name:'Test Student',state:'active'}],proposals:[]}],
]);
try {
 const login=await admin.request.post(base+'/api/admin/login',{data:{password:'isolated-admin-acceptance'}});assert.equal(login.status(),200);
 await admin.route('**/api/**',async route=>{const request=route.request(),path=new URL(request.url()).pathname;if(fixtures.has(path)){assert.equal(request.method(),'GET');return route.fulfill({json:fixtures.get(path)});}return route.continue();});
 const page=await admin.newPage();page.on('pageerror',e=>errors.push(e.message));
 for(const width of [390,1200])for(const path of ['/admin/content','/admin/tasks']){
  await page.setViewportSize({width,height:900});await page.goto(base+path);
  if(path==='/admin/content')await page.getByRole('heading',{name:'Introduction & school year',exact:true}).waitFor();else await page.getByText('Test instructions are visible without expanding',{exact:true}).waitFor();
  assert.equal(await page.locator('details,summary').count(),0);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),path);
 }
 for(const role of ['member','coordinator']){
  const context=await browser.newContext({viewport:{width:390,height:900}});await context.addCookies([{name:'iti-member-entry',value:'isolated-fixture',url:base}]);
  const workspace={schoolYear:'2026–27',me:{name:'Test Student',position:role,role,personId:'test-person',groupId:'A',canEditRoster:false},tasks:[task],teamTasks:[task],assignmentMemberIds:['test-person'],personalPlans:[],groups:document.groups,projects:[],events:[],scopes:[scope],responsibilities:[],reflections:[],roster:[{person_id:'test-person',name:'Test Student',group_id:'A'}]};
  await context.route('**/api/members/**',async route=>{assert.equal(route.request().method(),'GET');return route.fulfill({json:workspace});});
  const member=await context.newPage();member.on('pageerror',e=>errors.push(e.message));await member.goto(base+'/members');await member.getByRole('heading',{name:'My Tasks',exact:true}).waitFor();await member.getByText('Test instructions are visible without expanding',{exact:true}).first().waitFor();assert.equal(await member.locator('details,summary').count(),0);assert(await member.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await context.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,fixtures:'fictional and read-only',roles:['admin','coordinator','member'],routes:['/admin/content','/admin/tasks','/members'],disclosures:0}));
} finally {await browser.close();}
