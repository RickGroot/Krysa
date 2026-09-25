import { describe, expect, it } from "vitest";
import { dtUTC, wallClockIn } from "../src/lib/dates";
import { planPushes, quietHours, wants, type NotifyDoc, type NotifySub } from "../src/lib/notify";

/** A moment given on Prague's clock, as the real time the server sees (CEST, UTC+2, in early October). */
const prague = (d: string, t: string) => dtUTC(d, t)! - 2 * 3600000;
const iso = (ms: number) => new Date(ms).toISOString();

// A made-up trip on a made-up airline.
const trip: NotifyDoc[] = [
  { path: "trip/info", data: { startDate: "2026-10-04", endDate: "2026-10-10", baseLat: 50.0875, baseLng: 14.4213 } },
  { path: "people/alex", data: { name: "Alex" } },
  { path: "people/sam", data: { name: "Sam" } },
  { path: "flights/home", data: { airline: "Krysa Air", flight: "KR418", date: "2026-10-10", dep: "17:10", from: "PRG", to: "AMS", people: ["alex", "sam"] } },
  { path: "flights/early", data: { airline: "Krysa Air", flight: "KR400", date: "2026-10-08", dep: "07:00", from: "PRG", to: "AMS", people: ["sam"] } },
  { path: "events/kon", data: { title: "FrontKon", date: "2026-10-06", time: "10:00", lat: 50.1042, lng: 14.493 } },
  { path: "todos/tickets", data: { text: "Buy tram tickets", due: "2026-10-05", done: false } },
];
/** The same trip without flights, plans or to-dos, so only posts are due. */
const quietTrip = trip.filter((d) => /^(trip|people)\//.test(d.path));
const plan = (nowMs: number, extra: NotifyDoc[] = [], base = trip) => planPushes({ docs: [...base, ...extra], names: { "u-alex": "Alex", "u-sam": "Sam" }, nowMs });
const keys = (nowMs: number, extra?: NotifyDoc[], base = trip) => plan(nowMs, extra, base).map((p) => p.key);

describe("wallClockIn", () => {
  it("reads Prague's clock whatever the server's time zone", () => {
    expect(wallClockIn("Europe/Prague", new Date(Date.UTC(2026, 9, 4, 10, 20)))).toBe(dtUTC("2026-10-04", "12:20"));
    expect(wallClockIn("Europe/Prague", new Date(Date.UTC(2026, 11, 1, 23, 30)))).toBe(dtUTC("2026-12-02", "00:30"));
  });
});

describe("planPushes: reminders", () => {
  it("sends the app's reminders on Prague time", () => {
    const due = plan(prague("2026-10-10", "11:30"));
    const air = due.find((p) => p.key === "rem:air-KR418-2026-10-10");
    expect(air).toMatchObject({ audience: "reminders", urgency: "high", payload: { title: "Time to head to the airport", tab: "flights" } });
    expect(air?.payload.body).toMatch(/^Leave for the airport by 14:25 for KR418 at 17:10/);
    expect(due.find((p) => p.key === "rem:ci-KR418-2026-10-10")?.payload.body).toBe("Online check-in should be open for KR418 (Alex, Sam).");
  });

  it("holds check-in and to-do nudges overnight, but not leaving for the airport", () => {
    expect(keys(prague("2026-10-08", "03:00"))).toEqual(["rem:air-KR400-2026-10-08"]);
    expect(keys(prague("2026-10-04", "23:00"))).toEqual([]);
    expect(keys(prague("2026-10-04", "08:30"))).toEqual(["rem:td-tickets-2026-10-05"]);
    expect(quietHours(dtUTC("2026-10-04", "21:59")!)).toBe(false);
    expect(quietHours(dtUTC("2026-10-04", "22:00")!)).toBe(true);
    expect(quietHours(dtUTC("2026-10-05", "08:00")!)).toBe(false);
  });

  it("gives the next plan item an hour's notice and opens the plan", () => {
    const due = plan(prague("2026-10-06", "09:15"));
    expect(due.map((p) => p.key)).toEqual(["rem:td-tickets-late", expect.stringMatching(/^rem:ev-kon-/)]);
    const ev = due[1];
    expect(ev).toMatchObject({ urgency: "high", payload: { title: "Coming up", tab: "plan" } });
    expect(ev.payload.body).toBe("FrontKon starts at 10:00. Leave by 09:20 (about 35 min by metro or tram).");
    expect(due[0].payload).toMatchObject({ title: "To-do", body: "Overdue: Buy tram tickets.", tab: "todo" });
  });
});

describe("planPushes: new posts", () => {
  const now = prague("2026-10-07", "20:00");
  const meme: NotifyDoc = { path: "rats/p1", created_at: iso(now - 5 * 60000), data: { type: "meme", by: "u-alex", top: "ME AT 9:58", bottom: "THE 10:00 KEYNOTE" } };

  it("tells everyone but the poster", () => {
    const [p] = plan(now, [meme], quietTrip);
    expect(p).toMatchObject({ key: "post:rats/p1", audience: "posts", except: "u-alex", payload: { title: "New rat on the wall", body: "Alex posted a Krysa meme: ME AT 9:58 / THE 10:00 KEYNOTE", tab: "rats" } });
    expect(p.payload.silent).toBeUndefined();
  });

  it("skips old, imported and undated posts", () => {
    const old: NotifyDoc = { path: "rats/p2", created_at: iso(now - 40 * 60000), data: { type: "image", by: "u-sam", caption: "Bridge" } };
    const imported: NotifyDoc = { path: "rats/p3", created_at: iso(now), data: { type: "meme", legacyBy: true } };
    const undated: NotifyDoc = { path: "rats/p4", data: { type: "image", by: "u-sam" } };
    expect(keys(now, [old, imported, undated], quietTrip)).toEqual([]);
  });

  it("uses the caption for photos and stays silent at night", () => {
    const photo: NotifyDoc = { path: "rats/p5", created_at: iso(prague("2026-10-07", "23:40")), data: { type: "image", by: "u-sam", caption: "Tram 22 at night" } };
    const [p] = plan(prague("2026-10-07", "23:41"), [photo], quietTrip);
    expect(p.payload).toMatchObject({ body: "Sam posted a photo: Tram 22 at night", silent: true });
  });
});

describe("wants", () => {
  const sub = (o: Partial<NotifySub>): NotifySub => ({ endpoint: "https://push.example.test/x", user_id: "u-sam", reminders: true, posts: true, ...o });
  const post = plan(prague("2026-10-07", "20:00"), [{ path: "rats/p1", created_at: iso(prague("2026-10-07", "19:58")), data: { type: "meme", by: "u-alex" } }], quietTrip)[0];
  const reminder = plan(prague("2026-10-10", "11:30"))[0];
  expect(post.audience).toBe("posts");
  expect(reminder.audience).toBe("reminders");

  it("follows each device's choices", () => {
    expect(wants(sub({}), post)).toBe(true);
    expect(wants(sub({ posts: false }), post)).toBe(false);
    expect(wants(sub({ user_id: "u-alex" }), post)).toBe(false);
    expect(wants(sub({ posts: false }), reminder)).toBe(true);
    expect(wants(sub({ reminders: false }), reminder)).toBe(false);
  });
});
