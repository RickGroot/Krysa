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
  const nav = mix(c("surface"), c("bg"), 0.9);
  const derived: Record<string, RGB> = {
    // Cards, lists and days: color-mix(surface 78%, transparent) over the page.
    card: mix(c("surface"), c("bg"), 0.78),
    // The selected tab: tram 12% over the 90% surface bar.
    navActive: mix(c("tram"), nav, 0.12),
    // Reminder cards: tram 14% into surface.
    remTint: mix(c("tram"), c("surface"), 0.14),
    // A voted idea: gold 16% into surface.
    voteTint: mix(c("gold"), c("surface"), 0.16),
  };
  return (n) => derived[n] ?? c(n);
}

const KINDS = ["k-work", "k-food", "k-sight", "k-night", "k-travel", "k-coffee"];
const TEXT: [string, string[]][] = [
  ["ink", ["bg", "surface", "surface-2", "card"]],
  ["ink-2", ["bg", "surface", "surface-2", "card", "remTint"]],
  ["tram-text", ["bg", "surface", "card", "navActive"]],
  ["vltava", ["surface", "card", "remTint"]],
  ["gold", ["surface", "card", "voteTint"]],
  ["danger", ["surface", "surface-2", "card"]],
  ...KINDS.map((k): [string, string[]] => [k, ["surface", "card"]]),
  ["tram-ink", ["tram", "vltava", "gold"]],
  ["bg", ["ink"]],
];
const UI: [string, string[]][] = [
  ["field-border", ["surface", "surface-2"]],
  ["tram", ["bg", "surface"]],
  ["focus", ["bg", "surface"]],
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
