import { describe, expect, it } from "vitest";
import { dtUTC, fmtD, inDur, tripDays, daysUntil } from "../src/lib/dates";
import { walkMinutes, DEFAULT_BASE } from "../src/lib/geo";
import { checkInRule, eventWindow, leaveBy, nowNext, reminders, tripLive, type Flight, type PlanEvent } from "../src/lib/schedule";

const at = (d: string, t: string) => dtUTC(d, t)!;
const names: Record<string, string> = { alex: "Alex", sam: "Sam", jules: "Jules" };
const nameOf = (id: string) => names[id] ?? "Someone";

const events: PlanEvent[] = [
  { id: "land", title: "Alex & Sam land", date: "2026-10-04", time: "11:05" },
  { id: "clock", title: "Old Town Square", date: "2026-10-04", time: "18:00", endTime: "19:15", lat: 50.087, lng: 14.4207 },
  { id: "dinner", title: "Dinner at Mlejnice", date: "2026-10-04", time: "19:30", lat: 50.0862, lng: 14.4213 },
  { id: "draft", title: "Suggested thing", date: "2026-10-04", time: "18:30", draft: true },
  { id: "kon", title: "FrontKon", date: "2026-10-06", time: "10:00", lat: 50.1042, lng: 14.493 },
];

// Made-up flights on a made-up airline (unknown airline → cautious defaults).
const flights: Flight[] = [
  { airline: "Krysa Air", flight: "KR404", date: "2026-10-04", dep: "09:40", arr: "11:05", from: "AMS", to: "PRG", people: ["alex", "sam"] },
  { airline: "Krysa Air", flight: "KR418", date: "2026-10-10", dep: "17:10", arr: "18:35", from: "PRG", to: "AMS", people: ["alex", "sam"] },
  { airline: "Krysa Air", flight: "KR418", date: "2026-10-10", dep: "17:10", arr: "18:35", from: "PRG", to: "AMS", people: ["jules"] },
];
const klm: Flight = { airline: "KLM", flight: "KL1234", date: "2026-10-10", dep: "14:30", arr: "16:00", from: "PRG", to: "AMS", people: ["jules"] };

describe("dates", () => {
  it("formats and parses trip dates", () => {
    expect(fmtD("2026-10-04")).toBe("Sun 4 Oct");
    expect(fmtD("2026-10-10")).toBe("Sat 10 Oct");
    expect(dtUTC("2026-10-04", "bad")).toBeNull();
  });
  it("lists every trip day plus stray event days", () => {
    const days = tripDays({ startDate: "2026-10-04", endDate: "2026-10-06" }, [{ date: "2026-10-12" }]);
    expect(days).toEqual(["2026-10-04", "2026-10-05", "2026-10-06", "2026-10-12"]);
  });
  it("counts days and durations", () => {
    expect(daysUntil("2026-10-04", "2026-09-24")).toBe(10);
    expect(inDur(35 * 60000)).toBe("in 35 min");
    expect(inDur(130 * 60000)).toBe("in 2 h 10 min");
    expect(inDur(3 * 864e5)).toBe("in 3 days");
  });
});

describe("geo", () => {
  it("estimates short walks in the Old Town", () => {
    const m = walkMinutes({ lat: 50.087, lng: 14.4207 }, DEFAULT_BASE)!;
    expect(m).toBeGreaterThanOrEqual(1);
    expect(m).toBeLessThan(6);
  });
  it("returns null without coordinates", () => {
    expect(walkMinutes({})).toBeNull();
  });
});

describe("now & next", () => {
  it("defaults an event without end time to 90 minutes", () => {
    const w = eventWindow(events[0])!;
    expect(w.en - w.s).toBe(90 * 60000);
  });
  it("handles events that run past midnight", () => {
    const w = eventWindow({ id: "x", date: "2026-10-09", time: "22:00", endTime: "01:30" })!;
    expect(w.en - w.s).toBe(3.5 * 3600000);
  });
  it("finds the current and next event and skips drafts", () => {
    const { current, next } = nowNext(events, at("2026-10-04", "18:58"));
    expect(current?.e.id).toBe("clock");
    expect(next?.e.id).toBe("dinner");
  });
  it("works before anything has started", () => {
    const { current, next } = nowNext(events, at("2026-09-24", "10:00"));
    expect(current).toBeNull();
    expect(next?.e.id).toBe("land");
  });
  it("suggests leaving with a 5-minute buffer", () => {
    const start = at("2026-10-04", "19:30");
    const lb = leaveBy(events[2], start)!;
    expect(start - lb.t).toBeGreaterThanOrEqual(6 * 60000);
    expect(lb.label).toMatch(/walk/);
    const far = leaveBy(events[4], at("2026-10-06", "10:00"))!;
    expect(far.label).toMatch(/metro/);
  });
  it("knows when the trip is live", () => {
    const info = { startDate: "2026-10-04", endDate: "2026-10-10" };
    expect(tripLive(info, at("2026-09-24", "12:00"))).toBe(false);
    expect(tripLive(info, at("2026-10-03", "09:00"))).toBe(true);
    expect(tripLive(info, at("2026-10-11", "09:00"))).toBe(false);
  });
});

describe("check-in rules", () => {
  it("knows KLM's timings", () => {
    expect(checkInRule(" klm ")).toMatchObject({ opensH: 30, desksCloseMin: 40, known: true });
  });
  it("falls back to cautious defaults for other airlines", () => {
    expect(checkInRule("Krysa Air")).toEqual({ opensH: 24, desksCloseMin: 45, known: false });
    expect(checkInRule()).toMatchObject({ known: false });
  });
});

describe("reminders", () => {
  const base = { flights, todos: [], events, today: "2026-10-03", nameOf };

  it("nudges about check-in once it should be open", () => {
    const r = reminders({ ...base, now: at("2026-10-03", "09:40") });
    const ci = r.find((x) => x.id === "ci-KR404-2026-10-04");
    expect(ci?.text).toBe("Online check-in should be open for KR404 (Alex, Sam).");
    expect(ci?.link).toBeUndefined();
  });

  it("stays quiet before check-in opens", () => {
    const r = reminders({ ...base, now: at("2026-10-03", "09:30") });
    expect(r.some((x) => x.id.startsWith("ci-"))).toBe(false);
  });

  it("uses the airline's own timings and link when it knows them", () => {
    const early = reminders({ ...base, flights: [klm], today: "2026-10-09", now: at("2026-10-09", "08:30") });
    expect(early.find((x) => x.id.startsWith("ci-"))?.link).toEqual(["Check in at KLM", "https://www.klm.com/check-in"]);
    const r = reminders({ ...base, flights: [klm], today: "2026-10-10", now: at("2026-10-10", "10:00") });
    const air = r.find((x) => x.id.startsWith("air-"));
    expect(air?.text).toContain("11:45");
    expect(air?.text).toContain("The KLM desk closes at 13:50.");
  });

  it("groups everyone on the flight home and sets a leave-by time", () => {
    const r = reminders({ ...base, today: "2026-10-10", now: at("2026-10-10", "13:00") });
    expect(r.find((x) => x.id === "ci-KR418-2026-10-10")?.text).toContain("Alex, Sam, Jules");
    const air = r.find((x) => x.id.startsWith("air-"));
    expect(air?.text).toContain("Leave for the airport by 14:25");
    expect(air?.text).toContain("Bag drop usually closes around 16:25.");
  });

  it("flags to-dos that are overdue, due today or tomorrow", () => {
    const todos = [
      { id: "a", text: "Book Lokál", due: "2026-09-30" },
      { id: "b", text: "Install PID app", due: "2026-10-04", owner: "Everyone" },
      { id: "c", text: "Later", due: "2026-10-08" },
      { id: "d", text: "Done already", due: "2026-10-01", done: true },
    ];
    const r = reminders({ ...base, todos, now: at("2026-10-03", "05:00") });
    expect(r.find((x) => x.id === "td-a-late")?.text).toBe("Overdue: Book Lokál.");
    expect(r.find((x) => x.id === "td-b-2026-10-04")?.text).toBe("Due tomorrow: Install PID app (Everyone).");
    expect(r.some((x) => x.id.startsWith("td-c") || x.id.startsWith("td-d"))).toBe(false);
  });

  it("reminds about the next plan item within the hour", () => {
    const r = reminders({ ...base, today: "2026-10-04", now: at("2026-10-04", "18:58") });
    const ev = r.find((x) => x.id.startsWith("ev-dinner"));
    expect(ev?.text).toMatch(/Dinner at Mlejnice starts at 19:30\. Leave by \d\d:\d\d/);
  });
});
