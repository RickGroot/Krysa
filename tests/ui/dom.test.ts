import { describe, expect, it } from "vitest";
import { attrValue, flatKids } from "../../src/ui/dom";

describe("attrValue", () => {
  it("writes ARIA states as true or false", () => {
    expect(attrValue("aria-pressed", true)).toBe("true");
    expect(attrValue("aria-pressed", false)).toBe("false");
    expect(attrValue("aria-expanded", "true")).toBe("true");
  });
  it("leaves out missing values", () => {
    expect(attrValue("aria-label", undefined)).toBeNull();
    expect(attrValue("aria-label", null)).toBeNull();
    expect(attrValue("title", undefined)).toBeNull();
  });
  it("keeps other booleans as presence flags", () => {
    expect(attrValue("disabled", true)).toBe("");
    expect(attrValue("disabled", false)).toBeNull();
    expect(attrValue("muted", true)).toBe("");
  });
  it("passes everything else through as text", () => {
    expect(attrValue("tabindex", 0)).toBe("0");
    expect(attrValue("spellcheck", "false")).toBe("false");
    expect(attrValue("maxlength", "40")).toBe("40");
  });
});

describe("flatKids", () => {
  const span = { nodeType: 1 };
  it("flattens rows that return pairs of elements", () => {
    expect(flatKids([[[span, span], [span, span]]])).toEqual([span, span, span, span]);
  });
  it("drops the empties but keeps zero", () => {
    expect(flatKids([null, undefined, false, "", 0, "a", [null, ["b"]]])).toEqual([0, "a", "b"]);
  });
});
