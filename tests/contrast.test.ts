import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * WCAG contrast for the colour tokens in src/styles.css, in both themes.
 * Text needs 4.5:1 and UI boundaries 3:1 (WCAG 1.4.3 and 1.4.11). Tinted
 * surfaces are mixed the way the CSS does it with color-mix().
 */
const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

const block = (re: RegExp): string => {
  const m = re.exec(css);
  if (!m) throw new Error(`No token block matches ${re}`);
  return m[1];
};
const tokens = (src: string): Record<string, string> =>
  Object.fromEntries([...src.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\b/gi)].map((m) => [m[1], m[2]]));

const dark = tokens(block(/:root\{\s*color-scheme:dark;([^}]*)\}/));
const light = { ...dark, ...tokens(block(/@media \(prefers-color-scheme: light\)\{\s*:root\{([^}]*)\}/)) };

type RGB = number[];
const rgb = (hex: string): RGB => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const lum = (c: RGB): number => {
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
/** color-mix(in srgb, a p, b). */
const mix = (a: RGB, b: RGB, p: number): RGB => a.map((v, i) => v * p + b[i] * (1 - p));
const ratio = (a: RGB, b: RGB): number => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

function palette(t: Record<string, string>): (name: string) => RGB {
  const c = (n: string): RGB => {
    const hex = t[n];
    if (!hex) throw new Error(`Missing token --${n}`);
    return rgb(hex);
  };
  const derived: Record<string, RGB> = {
    // Heads-up rows: amber 14% into the surface.
    huTint: mix(c("signal"), c("surface"), 0.14),
    // A reaction you gave: amber 16% into the surface.
    reactTint: mix(c("signal"), c("surface"), 0.16),
  };
  return (n) => derived[n] ?? c(n);
}

const KINDS = ["k-work", "k-food", "k-sight", "k-night", "k-travel", "k-coffee"];
const FILLS = ["kf-work", "kf-food", "kf-sight", "kf-night", "kf-travel", "kf-coffee"];
const TEXT: [string, string[]][] = [
  ["ink", ["bg", "surface", "surface-2", "huTint", "reactTint"]],
  ["ink-2", ["bg", "surface", "surface-2", "huTint"]],
  ["red-text", ["bg", "surface"]],
  ["signal-text", ["bg", "surface"]],
  ["danger", ["bg", "surface", "surface-2"]],
  ["good", ["bg", "surface"]],
  ...KINDS.map((k): [string, string[]] => [k, ["bg", "surface"]]),
  ["on-red", ["red"]],
  ["on-signal", ["signal"]],
  // The departure board and the enamel plates are the same in both themes.
  ["board-ink", ["board", "board-2"]],
  ["board-dim", ["board", "board-2"]],
  ["amber", ["board"]],
  ["board-red", ["board"]],
  ["plate-ink", ["plate"]],
  ["plate-red", ["plate"]],
  // Line badges draw their icon in --kf-ink; the amber toast button and the in-the-air state too.
  ...FILLS.map((f): [string, string[]] => ["kf-ink", [f]]),
  ["kf-ink", ["amber"]],
  // Pressed filters, votes and chips invert: the page colour on ink.
  ["bg", ["ink", "good", "danger"]],
];
const UI: [string, string[]][] = [
  ["field-border", ["surface", "surface-2"]],
  ["red", ["bg", "surface"]],
  ["focus", ["bg", "surface"]],
  ["amber", ["board"]],
];

const below = (pairs: [string, string[]][], c: (n: string) => RGB, min: number): string[] =>
  pairs.flatMap(([fg, bgs]) =>
    bgs.map((bg) => [fg, bg, ratio(c(fg), c(bg))] as const).filter(([, , r]) => r < min).map(([f, b, r]) => `--${f} on ${b}: ${r.toFixed(2)}:1`),
  );

describe.each([
  ["dark", dark],
  ["light", light],
])("%s theme", (_name, t) => {
  const c = palette(t);
  it("text reaches 4.5:1", () => {
    expect(below(TEXT, c, 4.5)).toEqual([]);
  });
  it("control boundaries and focus reach 3:1", () => {
    expect(below(UI, c, 3)).toEqual([]);
  });
});
