import { daysUntil, isoD, parseD } from "./dates";

const DAY = 864e5;
const DATE_KEYS = new Set(["date", "due", "startDate", "endDate"]);
const DATETIME_KEYS = new Set(["arrive", "depart"]);
const STAMP_KEYS = new Set(["createdAt"]);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME = /^(\d{4}-\d{2}-\d{2})(T.*)$/;

type Doc = Record<string, unknown>;

function shiftDate(s: string, days: number): string {
  const d = parseD(s);
  return d ? isoD(new Date(d.getTime() + days * DAY)) : s;
}

function shiftDoc(doc: Doc, days: number): Doc {
  const out: Doc = { ...doc };
  for (const [k, v] of Object.entries(doc)) {
    if (typeof v !== "string" || !v) continue;
    if (DATE_KEYS.has(k) && ISO_DATE.test(v)) out[k] = shiftDate(v, days);
    else if (DATETIME_KEYS.has(k)) {
      const m = ISO_DATETIME.exec(v);
      if (m) out[k] = shiftDate(m[1], days) + m[2];
    } else if (STAMP_KEYS.has(k)) {
      const t = Date.parse(v);
      if (!Number.isNaN(t)) out[k] = new Date(t + days * DAY).toISOString();
    }
  }
  return out;
}

/**
 * Moves the demo trip so it's always happening: `dayOfTrip` of the trip
 * (1 = first day) lands on `today`. Every date, due date, arrival and
 * timestamp moves by the same number of days, so the plan, reminders,
 * "Now & next" and the Rat Wall stay consistent. Returns the seed unchanged
 * when it has no trip start date.
 */
export function shiftTrip<T extends Doc>(seed: Record<string, T>, today: string, dayOfTrip = 2): Record<string, T> {
  const start = seed["trip/info"]?.startDate;
  if (typeof start !== "string") return seed;
  const until = daysUntil(today, start);
  if (until == null) return seed;
  const days = until - (dayOfTrip - 1);
  if (days === 0) return seed;
  return Object.fromEntries(Object.entries(seed).map(([path, doc]) => [path, shiftDoc(doc, days) as T]));
}
