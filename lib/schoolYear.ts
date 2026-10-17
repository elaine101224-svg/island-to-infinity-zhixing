export function currentSchoolYear(now = new Date()): string {
  const year = now.getUTCFullYear() - (now.getUTCMonth() < 7 ? 1 : 0);
  return `${year}–${String(year + 1).slice(-2)}`;
}

export function yearBounds(year: string) {
  const start = Number(year.slice(0, 4));
  return { start: `${start}-08-01`, end: `${start + 1}-08-01` };
}

export function inSchoolYear(date: string, year: string) {
  const bounds = yearBounds(year);
  return date >= bounds.start && date < bounds.end;
}

export function needsRecording(event: {id:string; date:string; status?:string; requiresRecord?:boolean}, recorded: Set<string>, year: string, today: string, history = false) {
  return event.date < today && !recorded.has(event.id) && event.status !== 'cancelled' && event.requiresRecord !== false && (history || inSchoolYear(event.date, year));
}
