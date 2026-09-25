// Explicit .ts extensions: the notify function (Deno) imports this file too.
import { dtUTC, fmtClock, daysUntil } from "./dates.ts";
import { walkMinutes, type LatLng, DEFAULT_BASE } from "./geo.ts";

export interface PlanEvent {
  id: string;
  title?: string;
  date?: string;
  time?: string;
  endTime?: string;
  draft?: boolean;
  kind?: string;
  location?: string;
  lat?: number | null;
  lng?: number | null;
}

export interface Flight {
  id?: string;
  airline?: string;
  flight: string;
  date: string;
  dep?: string;
  arr?: string;
  from?: string;
  to?: string;
  people?: string[];
}

export interface Todo {
  id: string;
  text: string;
  due?: string;
  done?: boolean;
  owner?: string;
}

export interface Reminder {
  id: string;
  text: string;
  link?: [string, string];
  tab?: string;
}

export interface Slot {
  e: PlanEvent;
  s: number;
  en: number;
}

const MIN = 60000;
const HOUR = 60 * MIN;

export interface CheckInRule {
  /** Online check-in opens this many hours before departure. */
  opensH: number;
  /** Desks and bag drop close this many minutes before departure. */
  desksCloseMin: number;
  /** Whether the timings are the airline's own or a cautious guess. */
  known: boolean;
  url?: string;
}

const CHECK_IN: Record<string, Omit<CheckInRule, "known">> = {
  klm: { opensH: 30, desksCloseMin: 40, url: "https://www.klm.com/check-in" },
};

/** Check-in timings for an airline. Unknown airlines get a cautious 24 hours and 45 minutes. */
export function checkInRule(airline?: string): CheckInRule {
  const rule = CHECK_IN[(airline ?? "").trim().toLowerCase()];
  return rule ? { ...rule, known: true } : { opensH: 24, desksCloseMin: 45, known: false };
}

/** Start and end of an event. Events without an end time last 90 minutes. */
export function eventWindow(e: PlanEvent): { s: number; en: number } | null {
  const s = dtUTC(e.date, e.time);
  if (s == null) return null;
  let en = e.endTime ? dtUTC(e.date, e.endTime) : null;
  if (en != null && en <= s) en += 24 * HOUR; // runs past midnight
  return { s, en: en ?? s + 90 * MIN };
}

/** What's happening now and what's next. Suggestions (drafts) are ignored. */
export function nowNext(events: PlanEvent[], now: number): { current: Slot | null; next: Slot | null } {
  const list = events
    .filter((e) => !e.draft)
    .map((e) => {
      const w = eventWindow(e);
      return w ? { e, ...w } : null;
    })
    .filter((x): x is Slot => x !== null)
    .sort((a, b) => a.s - b.s);
  return {
    current: list.filter((x) => x.s <= now && now < x.en).pop() ?? null,
    next: list.find((x) => x.s > now) ?? null,
  };
}

/** When to head out: walking time plus 5 minutes; far places assume 35 min by metro or tram. */
export function leaveBy(e: PlanEvent, start: number, base: LatLng = DEFAULT_BASE): { t: number; label: string } | null {
  const m = walkMinutes(e, base);
  if (m == null) return null;
  const far = m > 35;
  const mins = far ? 35 : m;
  return { t: start - (mins + 5) * MIN, label: far ? "about 35 min by metro or tram" : `~${m} min walk` };
}

/** From the day before the trip until the last evening. */
export function tripLive(info: { startDate?: string; endDate?: string }, now: number): boolean {
  const a = dtUTC(info.startDate, "00:00");
  const b = dtUTC(info.endDate, "23:59");
  return a != null && b != null && now >= a - 24 * HOUR && now <= b;
}

export interface ReminderInput {
  flights: Flight[];
  todos: Todo[];
  events: PlanEvent[];
  now: number;
  today: string;
  base?: LatLng;
  nameOf?: (id: string) => string;
}

/**
 * Everything that deserves a nudge right now:
 * - Online check-in, from when the airline opens it until 3 h before departure
 *   (see `checkInRule`).
 * - Flying out of Prague: be at the airport 2 h early and allow 45 min to get there.
 * - To-dos due today, tomorrow or overdue.
 * - The next plan item when it starts within the hour.
 */
export function reminders({ flights, todos, events, now, today, base = DEFAULT_BASE, nameOf = (id) => id }: ReminderInput): Reminder[] {
  const out: Reminder[] = [];
  const groups = new Map<string, Flight[]>();
  for (const f of flights) {
    const k = `${f.flight}|${f.date}`;
    groups.set(k, [...(groups.get(k) ?? []), f]);
  }
  for (const legs of groups.values()) {
    const f = legs[0];
    const dep = dtUTC(f.date, f.dep);
    if (dep == null) continue;
    const who = [...new Set(legs.flatMap((l) => (Array.isArray(l.people) ? l.people : [])))].map(nameOf).join(", ");
    const rule = checkInRule(f.airline);
    if (now >= dep - rule.opensH * HOUR && now < dep - 3 * HOUR) {
      out.push({
        id: `ci-${f.flight}-${f.date}`,
        text: `Online check-in ${rule.known ? "is" : "should be"} open for ${f.flight}${who ? ` (${who})` : ""}.`,
        ...(rule.url ? { link: [`Check in at ${f.airline?.trim()}`, rule.url] as [string, string] } : {}),
      });
    }
    if (f.from === "PRG" && now >= dep - 6 * HOUR && now < dep - 90 * MIN) {
      const closes = fmtClock(dep - rule.desksCloseMin * MIN);
      out.push({
        id: `air-${f.flight}-${f.date}`,
        text: `Leave for the airport by ${fmtClock(dep - 165 * MIN)} for ${f.flight} at ${f.dep}. ${
          rule.known ? `The ${f.airline?.trim()} desk closes at ${closes}.` : `Bag drop usually closes around ${closes}.`
        }`,
      });
    }
  }
  for (const t of todos) {
    if (t.done || !t.due) continue;
    const d = daysUntil(t.due, today);
    if (d == null) continue;
    const who = t.owner ? ` (${t.owner})` : "";
    if (d < 0) out.push({ id: `td-${t.id}-late`, text: `Overdue: ${t.text}${who}.`, tab: "todo" });
    else if (d <= 1) out.push({ id: `td-${t.id}-${t.due}`, text: `${d === 0 ? "Due today" : "Due tomorrow"}: ${t.text}${who}.`, tab: "todo" });
  }
  const { next } = nowNext(events, now);
  if (next && next.s - now <= HOUR) {
    const lb = leaveBy(next.e, next.s, base);
    out.push({
      id: `ev-${next.e.id}-${next.s}`,
      text: `${next.e.title} starts at ${next.e.time}${lb ? `. Leave by ${fmtClock(lb.t)} (${lb.label})` : ""}.`,
      tab: "plan",
    });
  }
  return out;
}
