/**
 * Date helpers. The trip runs in Prague, which shares a time zone with
 * Amsterdam, so "wall clock" times are compared as if they were UTC:
 * `dtUTC("2026-10-04", "12:20")` and `nowLocalUTC()` live on the same scale
 * and no time-zone conversion is ever needed.
 */
export const CZ = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"] as const;
export const EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

const DAY = 864e5;

export function parseD(s?: string | null): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? "");
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
}

export function fmtD(s: string): string {
  const d = parseD(s);
  return d ? `${EN[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]}` : s;
}

export const isoD = (d: Date): string => d.toISOString().slice(0, 10);

export function todayIso(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export const anchor = (d: string): string => "d" + d.replaceAll("-", "");

/** Wall-clock date + time as milliseconds on the "local-as-UTC" scale. */
export function dtUTC(d?: string | null, t?: string | null): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d ?? "");
  const n = /^(\d{1,2}):(\d{2})$/.exec(t ?? "");
  return m && n ? Date.UTC(+m[1], +m[2] - 1, +m[3], +n[1], +n[2]) : null;
}

/** The viewer's current wall-clock time on the same scale as `dtUTC`. */
export function nowLocalUTC(n: Date = new Date()): number {
  return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate(), n.getHours(), n.getMinutes());
}

/**
 * Wall-clock time in `timeZone` on the same scale as `dtUTC`. The app can use
 * the device clock (`nowLocalUTC`); the notify function runs in UTC and can't.
 */
export function wallClockIn(timeZone: string, n: Date = new Date()): number {
  const p: Record<string, string> = {};
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  for (const x of fmt.formatToParts(n)) p[x.type] = x.value;
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
}

export function fmtClock(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export function fmtStamp(ms: number): string {
  const d = new Date(ms);
  return `${EN[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${fmtClock(ms)}`;
}

export function splitDT(s?: string | null): [string, string] {
  const [d = "", t = ""] = (s ?? "").split("T");
  return [d, t.slice(0, 5)];
}

export const joinDT = (d: string, t: string): string => (d ? `${d}T${t || ""}` : "");

/** "in 5 min", "in 2 h 10 min", "in 3 days". */
export function inDur(ms: number): string {
  const m = Math.round(ms / 60000);
  if (m < 1) return "now";
  if (m < 60) return `in ${m} min`;
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  if (hh < 24) return `in ${hh} h${mm ? ` ${mm} min` : ""}`;
  const d = Math.round(ms / DAY);
  return `in ${d} day${d === 1 ? "" : "s"}`;
}

/** Every day of the trip, plus any day an event was planned outside it. */
export function tripDays(info: { startDate?: string; endDate?: string }, events: { date?: string }[]): string[] {
  const a = parseD(info.startDate);
  const b = parseD(info.endDate);
  const set = new Set<string>();
  if (a && b && b >= a && (b.getTime() - a.getTime()) / DAY < 31) {
    for (let d = new Date(a); d <= b; d = new Date(d.getTime() + DAY)) set.add(isoD(d));
  }
  for (const e of events) if (e.date && parseD(e.date)) set.add(e.date);
  return [...set].sort();
}

/** Whole days from `today` to `date` (negative when in the past). */
export function daysUntil(date: string, today: string): number | null {
  const a = parseD(date);
  const b = parseD(today);
  return a && b ? Math.round((a.getTime() - b.getTime()) / DAY) : null;
}
