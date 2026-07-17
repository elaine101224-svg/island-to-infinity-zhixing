/**
 * Single-line JSON logger for server-side code paths. Writes one JSON object
 * per line so Vercel/Edge logs remain greppable and the payload can be
 * forwarded to an aggregator without parsing.
 */

type Level = 'info' | 'warn' | 'error';

export interface LogFields {
  [key: string]: unknown;
}

function emit(level: Level, msg: string, fields?: LogFields) {
  const record = {
    t: new Date().toISOString(),
    level,
    msg,
    ...(fields ?? {}),
  };
  const line = JSON.stringify(record);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const log = {
  info: (msg: string, fields?: LogFields) => emit('info', msg, fields),
  warn: (msg: string, fields?: LogFields) => emit('warn', msg, fields),
  error: (msg: string, fields?: LogFields) => emit('error', msg, fields),
};
