/** Public calendar times are explicitly edited, never copied from private events. */
export function eventTimeLabel(event: { startTime?: string; endTime?: string }): string {
  if (event.startTime && event.endTime) return `${event.startTime}–${event.endTime} (China time)`;
  if (event.startTime) return `${event.startTime} (China time; end time to be confirmed)`;
  if (event.endTime) return `Ends ${event.endTime} (China time; start time to be confirmed)`;
  return 'Time to be confirmed';
}
