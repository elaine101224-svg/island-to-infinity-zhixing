import {expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import React from 'react';
import {memberTaskList,taskOverdue} from '@/lib/members/taskList';
import {taskProgress,type Workspace,type MemberTask} from '@/lib/members/workspace';
import MemberHome from '@/components/members/MemberHome';
import MemberTaskRow from '@/components/members/MemberTaskRow';
vi.mock('next/navigation',()=>({usePathname:()=>'/members'}));
const now=new Date('2026-10-29T10:00:00+08:00');
const task=(id:string,change:Partial<MemberTask>={}):MemberTask=>({id,title:id,ownerId:'a',groupId:null,projectId:null,eventId:null,due:null,priority:'Normal',status:'Not started',update:'',nextStep:'',evidence:'',updatedAt:'2026-10-29T00:00:00Z',...change});
function workspace():Workspace{return {me:{name:'Dummy A',position:'Member',role:'member',personId:'a',groupId:null,canEditRoster:false},personalPlans:[],tasks:[task('family work',{scopeId:'family',deliverable:'Bring the reading materials',due:'2026-10-30'}),task('project work',{scopeId:'project',deliverable:'Submit the materials list',due:'2026-10-29'}),task('undated'),task('finished',{collaboratorIds:['b'],status:'In progress',contributions:{a:{status:'Completed',update:'My part done',nextStep:'',evidence:'Draft',updatedAt:'2026-10-29T00:00:00Z'}}})],scopes:[{id:'family',title:'Dummy Family',kind:'family',memberIds:['a'],coordinatorIds:[],note:'',sourcePlan:'test'},{id:'project',title:'Dummy Project',kind:'project',memberIds:['a','b'],coordinatorIds:[],note:'',sourcePlan:'test'}],roster:[{person_id:'a',name:'Dummy A',group_id:null},{person_id:'b',name:'Dummy B',group_id:null}],projects:[],groups:[],events:[],reflections:[],responsibilities:[]};}
it('includes family and project work together, sorts deadlines first and respects shared contribution progress',()=>{
 const doc=workspace();expect(memberTaskList(doc,{now}).map(task=>task.id)).toEqual(['project work','family work','undated']);
 expect(memberTaskList(doc,{now,done:true}).map(task=>task.id)).toEqual(['finished']);
 expect(taskProgress(task('shared',{collaboratorIds:['b']}),'a')).toBe('Not started');
});
it('filters tasks by description, team and actual China-time deadline without labelling date-only work overdue early',()=>{
 const doc=workspace();expect(memberTaskList(doc,{now,query:'materials list'}).map(task=>task.id)).toEqual(['project work']);
 expect(memberTaskList(doc,{now,scopeId:'family'}).map(task=>task.id)).toEqual(['family work']);
 expect(memberTaskList(doc,{now,focus:'week'})).toHaveLength(2);
 expect(taskOverdue(task('today',{due:'2026-10-29'}),now)).toBe(false);
 expect(taskOverdue(task('early',{due:'2026-10-29',dueAt:'2026-10-29T01:59:00Z'}),now)).toBe(true);
 expect(memberTaskList(doc,{now,focus:'overdue'})).toHaveLength(0);
});
it('renders both kinds of task on the first page and exposes complete instructions without a confirm step',()=>{
 const doc=workspace();const html=renderToStaticMarkup(React.createElement(MemberHome,{workspace:doc,view:'tasks',onTaskSaved:()=>{}}));
 expect(html).toContain('family work');expect(html).toContain('project work');expect(html).toContain('Search tasks');expect(html).not.toContain('NEXT PAGE');
 const row=renderToStaticMarkup(React.createElement(MemberTaskRow,{initiallyOpen:true,task:doc.tasks[0],workspace:doc,onSaved:()=>{},onPrepare:()=>{}}));
 expect(row).toContain('What to do');expect(row).toContain('Bring the reading materials');expect(row).toContain('>Start<');expect(row).not.toContain('>Confirm<');
});

it('defaults the member homepage to the configured year while preserving older tasks in the workspace',()=>{const doc=workspace();doc.schoolYear='2027–28';doc.tasks=[task('old year work',{schoolYear:'2026–27'}),task('current year work',{schoolYear:'2027–28'})];const html=renderToStaticMarkup(React.createElement(MemberHome,{workspace:doc,view:'tasks',onTaskSaved:()=>{}}));expect(html).toContain('current year work');expect(html).not.toContain('old year work');expect(doc.tasks).toHaveLength(2);});
