import {currentSchoolYear} from '@/lib/schoolYear';
export const schoolYearPattern=/^20\d{2}–\d{2}$/;
export function workspaceSchoolYear(document:{activeSchoolYear?:string;term?:string}){
 return document.activeSchoolYear??document.term?.slice(0,7).replace('-','–')??currentSchoolYear();
}
export function taskSchoolYear(task:{schoolYear?:string},fallback:string){return task.schoolYear??fallback;}
