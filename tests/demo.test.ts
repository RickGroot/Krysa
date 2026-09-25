import { describe, expect, it } from "vitest";
import demo from "../supabase/seed/demo.json";
import { nowNext, tripLive, type PlanEvent } from "../src/lib/schedule";
import { dtUTC } from "../src/lib/dates";
import { shiftTrip } from "../src/lib/demo";

type Seed = Record<string, Record<string, unknown>>;
const seed = demo as unknown as Seed;

describe("shiftTrip", () => {
  const mini: Seed = {
    "trip/info": { startDate: "2026-10-04", endDate: "2026-10-10", title: "Trip" },
    "events/a": { date: "2026-10-05", time: "19:00", title: "Dinner" },
    "todos/b": { due: "2026-09-30", text: "Book", done: false },
    "todos/c": { due: "", text: "Someday" },
    "people/d": { arrive: "2026-10-04T11:05", name: "Alex" },
    "rats/e": { createdAt: "2026-10-04T15:20:00Z", top: "2026-10-04 is not a date field" },
  };

  it("puts day 2 of the trip on today and moves every date with it", () => {
    const out = shiftTrip(mini, "2027-03-02");
    expect(out["trip/info"]).toMatchObject({ startDate: "2027-03-01", endDate: "2027-03-07", title: "Trip" });
    expect(out["events/a"]).toMatchObject({ date: "2027-03-02", time: "19:00" });
    expect(out["todos/b"].due).toBe("2027-02-25");
    expect(out["todos/c"].due).toBe("");
    expect(out["people/d"].arrive).toBe("2027-03-01T11:05");
    expect(out["rats/e"]).toEqual({ createdAt: "2027-03-01T15:20:00.000Z", top: "2026-10-04 is not a date field" });
  });

  it("can move backwards and leaves the input alone", () => {
    const out = shiftTrip(mini, "2026-01-11", 1);
    expect(out["trip/info"].startDate).toBe("2026-01-11");
    expect(mini["trip/info"].startDate).toBe("2026-10-04");
  });

  it("returns the seed as is when there's nothing to move", () => {
    expect(shiftTrip(mini, "2026-10-05")).toBe(mini);
    const noTrip: Seed = { "events/a": { date: "2026-10-05" } };
    expect(shiftTrip(noTrip, "2030-01-01")).toBe(noTrip);
  });
});

describe("demo seed", () => {
  it("is live on any day it's opened", () => {
    const out = shiftTrip(seed, "2031-06-15");
    const info = out["trip/info"] as { startDate: string; endDate: string };
    expect(tripLive(info, dtUTC("2031-06-15", "12:00")!)).toBe(true);
    const events = Object.entries(out)
      .filter(([k]) => k.startsWith("events/"))
      .map(([k, v]) => ({ id: k, ...v }) as PlanEvent);
    expect(nowNext(events, dtUTC("2031-06-15", "07:00")!).next).not.toBeNull();
  });

  it("keeps booking codes and private notes out of the public repo", () => {
    for (const [path, doc] of Object.entries(seed)) {
      expect(doc, path).not.toHaveProperty("booking");
      if (path.startsWith("flights/")) expect(doc, path).not.toHaveProperty("note");
      if (path.startsWith("rats/")) expect(doc, path).not.toHaveProperty("legacyBy");
    }
  });
});
