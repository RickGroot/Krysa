import { describe, expect, it } from "vitest";
import { normMeme, surpriseMeme, MM } from "../../src/art/model";

describe("normMeme", () => {
  it("fills defaults for an empty meme", () => {
    const m = normMeme({});
    expect(m.layout).toBe("classic");
    expect(m.face).toBe("classic");
    expect(m.fur).toBe("grey");
    expect(m.stickers).toEqual([]);
  });
  it("drops values that aren't on the menu (shared data is untrusted)", () => {
    const m = normMeme({ layout: "<script>", face: "evil", stickers: ["fire", "nope", "fire"], count: 99, top: "x".repeat(500) });
    expect(m.layout).toBe("classic");
    expect(m.face).toBe("classic");
    expect(m.stickers).toEqual(["fire"]);
    expect(m.count).toBe("1");
    expect(m.top.length).toBeLessThanOrEqual(120);
  });
  it("upgrades memes from the first version (pose field)", () => {
    expect(normMeme({ pose: "cheers" }).item).toBe("beer");
    expect(normMeme({ pose: "sus" }).face).toBe("sus");
  });
  it("only surprises with options that exist", () => {
    for (let i = 0; i < 50; i++) {
      const m = surpriseMeme();
      expect(MM.layouts.some(([k]: [string]) => k === m.layout)).toBe(true);
      expect(MM.faces.some(([k]: [string]) => k === m.face)).toBe(true);
    }
  });
});
