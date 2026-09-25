/**
 * What the notify function pushes, decided from the trip's documents: the
 * same reminders the app shows (`reminders` in schedule.ts) and new Rat Wall
 * posts. Pure, so it's unit tested; the function only fetches and sends.
 */
// Explicit .ts extensions: the notify function (Deno) imports this file.
import { isoD, wallClockIn } from "./dates.ts";
import { baseOf } from "./geo.ts";
import { reminders, type Flight, type PlanEvent, type Todo } from "./schedule.ts";

/** Reminders are worked out on the trip's wall clock; the function itself runs in UTC. */
export const TRIP_TIME_ZONE = "Europe/Prague";
/** A post counts as new for this long, so a missed run can still catch it. */
export const NEW_POST_MS = 30 * 60000;

export interface NotifyDoc {
  path: string;
  data: Record<string, unknown>;
  created_at?: string | null;
}

export interface NotifySub {
  endpoint: string;
  /** The device (anonymous user) the subscription belongs to. */
  user_id: string;
  reminders: boolean;
  posts: boolean;
}

export interface PushPayload {
  title: string;
  body: string;
  tag: string;
  /** App tab to open when tapped. */
  tab?: string;
  /** Link to open instead, like the airline's check-in page. */
  url?: string;
  /** Show without sound or vibration (new posts at night). */
  silent?: boolean;
}

export interface PlannedPush {
  /** Each key goes out once (krysa.push_sent). */
  key: string;
  audience: "reminders" | "posts";
  /** A device that shouldn't get it: whoever posted. */
  except?: string;
  urgency: "normal" | "high";
  ttl: number;
  payload: PushPayload;
}

const TITLES: Record<string, string> = { ci: "Check-in is open", air: "Time to head to the airport", td: "To-do", ev: "Coming up" };

/** 22:00–08:00 on the trip's clock. */
export function quietHours(wall: number): boolean {
  const h = new Date(wall).getUTCHours();
  return h >= 22 || h < 8;
}

export const wants = (s: NotifySub, p: PlannedPush): boolean => (p.audience === "posts" ? s.posts : s.reminders) && s.user_id !== p.except;

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const clip = (s: string, n: number): string => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

function collection(docs: NotifyDoc[], col: string): Record<string, unknown>[] {
  return docs.filter((d) => d.path.startsWith(col + "/")).map((d) => ({ ...d.data, id: d.path.slice(col.length + 1) }));
}

/**
 * Everything due right now:
 * - The app's reminders. Check-in and to-do nudges wait out the night
 *   (22:00–08:00); leaving for the airport and the next plan item don't.
 * - Posts from the last half hour, to everyone but the poster. Posts without a
 *   poster (imported ones) are never news.
 */
export function planPushes({ docs, names, nowMs }: { docs: NotifyDoc[]; names: Record<string, string>; nowMs: number }): PlannedPush[] {
  const wall = wallClockIn(TRIP_TIME_ZONE, new Date(nowMs));
  const quiet = quietHours(wall);
  const people = collection(docs, "people");
  const info = docs.find((d) => d.path === "trip/info")?.data;
  const out: PlannedPush[] = [];

  const due = reminders({
    flights: collection(docs, "flights") as unknown as Flight[],
    todos: collection(docs, "todos") as unknown as Todo[],
    events: collection(docs, "events") as unknown as PlanEvent[],
    now: wall,
    today: isoD(new Date(wall)),
    base: baseOf(info as { baseLat?: number; baseLng?: number } | undefined),
    nameOf: (id) => str(people.find((p) => p.id === id)?.name) || "Someone",
  });
  for (const r of due) {
    const kind = r.id.split("-")[0];
    const urgent = kind === "air" || kind === "ev";
    if (quiet && !urgent) continue;
    const key = `rem:${r.id}`;
    out.push({
      key,
      audience: "reminders",
      urgency: urgent ? "high" : "normal",
      ttl: urgent ? 3600 : 12 * 3600,
      payload: { title: TITLES[kind] ?? "Krysa", body: r.text, tag: key, tab: r.tab ?? (kind === "ci" || kind === "air" ? "flights" : undefined), url: r.link?.[1] },
    });
  }

  for (const d of docs) {
    if (!d.path.startsWith("rats/")) continue;
    const by = str(d.data.by);
    const age = nowMs - Date.parse(d.created_at ?? "");
    if (!by || !(age <= NEW_POST_MS)) continue; // no poster, no timestamp, or old news
    const type = str(d.data.type);
    const what = type === "meme" ? "a Krysa meme" : type === "video" ? "a video" : "a photo";
    const text = str(d.data.caption) || [str(d.data.top), str(d.data.bottom)].filter(Boolean).join(" / ");
    const key = `post:${d.path}`;
    out.push({
      key,
      audience: "posts",
      except: by,
      urgency: "normal",
      ttl: 24 * 3600,
      payload: { title: "New rat on the wall", body: clip(`${names[by] || "Someone"} posted ${what}${text ? `: ${text}` : ""}`, 180), tag: key, tab: "rats", ...(quiet ? { silent: true } : {}) },
    });
  }
  return out;
}
