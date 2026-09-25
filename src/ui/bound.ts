/**
 * The pure functions in src/lib take their inputs as arguments so they can be
 * tested. The UI mostly wants them bound to the current trip state, so these
 * thin wrappers do that.
 */
import * as dates from "../lib/dates";
import * as geo from "../lib/geo";
import * as money from "../lib/money";
import * as schedule from "../lib/schedule";
import { S, pname } from "../state";
import { DISMISSED } from "./timely";

export const rate = (): number => money.rateOf(S.info);
export const toCzk = (e: money.Expense): number => money.toCzk(e, rate());
export const balances = (): Record<string, number> => money.balances(S.people, S.expenses, rate());
export const settle = (bal: Record<string, number>): money.Transfer[] => money.settle(bal);
export const walkMin = (it: { lat?: unknown; lng?: unknown }): number | null => geo.walkMinutes(it, geo.baseOf(S.info));
export const tripDays = (): string[] => dates.tripDays(S.info, S.events);
export const nowNext = (now = dates.nowLocalUTC()) => schedule.nowNext(S.events, now);
export const leaveBy = (e: schedule.PlanEvent, start: number) => schedule.leaveBy(e, start, geo.baseOf(S.info));
export const tripLive = (now = dates.nowLocalUTC()): boolean => schedule.tripLive(S.info, now);
export const reminders = (now = dates.nowLocalUTC()): schedule.Reminder[] =>
  schedule
    .reminders({ flights: S.flights, todos: S.todos, events: S.events, now, today: dates.todayIso(), base: geo.baseOf(S.info), nameOf: pname })
    .filter((r) => !DISMISSED.has(r.id));
/** Signed URL (Supabase) or data URL (local) for an uploaded rat. */
export const resolveAsset = (id: string): Promise<string> => (S.assets?.url ? S.assets.url(id) : Promise.resolve(""));
