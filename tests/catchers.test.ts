import { describe, expect, it } from "vitest";
import { catchers } from "../src/lib/catchers";

// Rick named his phone and his laptop the same, give or take a capital.
const profiles = { phone: { name: "Rick" }, laptop: { name: " rick " }, sam: { name: "Sam" }, samb: { name: "Sam  B" } };

describe("catchers", () => {
  it("adds up devices with the same name, ignoring case and spaces", () => {
    expect(catchers({ phone: 5, sam: 7, laptop: 3, samb: 1 }, profiles)).toEqual([
      { ids: ["phone", "laptop"], name: "Rick", n: 8 },
      { ids: ["sam"], name: "Sam", n: 7 },
      { ids: ["samb"], name: "Sam  B", n: 1 },
    ]);
  });

  it("keeps devices without a name apart", () => {
    expect(catchers({ x: 1, y: 2 }, { x: { name: "" } })).toEqual([
      { ids: ["y"], name: "", n: 2 },
      { ids: ["x"], name: "", n: 1 },
    ]);
  });

  it("skips anything that isn't a positive count", () => {
    expect(catchers({ sam: 0, phone: "7", laptop: -1 }, profiles)).toEqual([]);
    expect(catchers(undefined, profiles)).toEqual([]);
  });
});
