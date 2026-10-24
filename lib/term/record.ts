import { z } from 'zod';
import { termSchema, type Term } from './schema';
export const recordSections = ['events','groups','projects','tasks','reflections','recaps'] as const;
export const termRecordSchema = z.object({ section:z.enum(recordSections), record:z.record(z.string(),z.unknown()), expected:z.record(z.string(),z.unknown()).nullable() }).strict();
export function validateTermRecord(document:Term, input:z.infer<typeof termRecordSchema>) {
 const next=structuredClone(document);const records=next[input.section] as {id:string}[];
 const index=records.findIndex(record=>record.id===input.record.id);
 if(index<0) records.push(input.record as {id:string});else records[index]=input.record as {id:string};
 return termSchema.parse(next);
}
