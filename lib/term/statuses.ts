/** Keep display labels independent from the full Zod validation schema. */
export const taskStatuses = ['Awaiting confirmation', 'Not started', 'In progress', 'Blocked', 'Completed', 'Cancelled'] as const;

/** Legacy acknowledgement values remain readable, but are no longer editable workflow choices. */
export const taskEditStatuses=['Not started','In progress','Blocked','Completed','Cancelled'] as const;
