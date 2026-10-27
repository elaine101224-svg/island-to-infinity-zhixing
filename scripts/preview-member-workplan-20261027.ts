import {readFile,writeFile} from 'node:fs/promises';
import {applyMemberWorkplan} from '../lib/term/workplan20261027';
import {termSchema} from '../lib/term/schema';
import {scheduleConflicts} from '../lib/term/scheduling';
async function main(){
const [snapshotPath,bindingsPath,outputPath]=process.argv.slice(2);
if(!snapshotPath||!bindingsPath||!outputPath)throw Error('Provide a private admin snapshot, reviewed member-plan bindings and private output path.');
const snapshot=JSON.parse(await readFile(snapshotPath,'utf8')),plan=JSON.parse(await readFile(bindingsPath,'utf8'));
const bindings=Object.fromEntries(plan.members.filter((member:{personId:string|null})=>member.personId).map((member:{key:string;personId:string})=>[member.key,member.personId]));
const result=applyMemberWorkplan(termSchema.parse(snapshot.term.document),bindings,new Date().toISOString());
await writeFile(outputPath,JSON.stringify({...result,baseRevision:snapshot.term.revision,conflicts:scheduleConflicts(result.document.events)},null,2),{mode:0o600});
console.log(JSON.stringify({baseRevision:snapshot.term.revision,...result.preview,conflicts:scheduleConflicts(result.document.events)},null,2));

}
void main().catch(error=>{console.error(error instanceof Error?error.message:error);process.exitCode=1;});
