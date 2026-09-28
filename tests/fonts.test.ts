import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * The fonts are the app's own files (src/fonts). A wrong file or family name
 * shows no error, only fallback fonts, so this checks the wiring: every face
 * has a real woff2 file, every family and weight the app asks for has a face,
 * and nothing loads from Google any more.
 */
const read = (path: string): string => readFileSync(new URL(path, import.meta.url), "utf8");
const fontsCss = read("../src/fonts/fonts.css");

const faces = [...fontsCss.matchAll(/@font-face\{([^}]*)\}/g)].map((m) => {
  const d = (k: string): string => new RegExp(`${k}:([^;]+)`).exec(m[1])?.[1] ?? "";
  const [lo, hi = lo] = d("font-weight").split(" ").map(Number);
  return { family: d("font-family").replace(/"/g, ""), lo, hi, file: /url\("\.\/([^"]+)"\)/.exec(m[1])?.[1] ?? "" };
});
const hasFace = (family: string, weight: number): boolean =>
  faces.some((f) => f.family === family && f.lo <= weight && weight <= f.hi);

describe("self-hosted fonts", () => {
  it("has a woff2 file for every face", () => {
    expect(faces.length).toBeGreaterThan(0);
    for (const f of faces) {
      const bytes = readFileSync(new URL(`../src/fonts/${f.file}`, import.meta.url));
      expect(String.fromCharCode(...bytes.subarray(0, 4)), f.file).toBe("wOF2");
    }
  });

  it("covers the display, body and condensed families", () => {
    const css = read("../src/styles.css");
    for (const role of ["display", "body", "condensed"]) {
      const family = new RegExp(`--${role}:"([^"]+)"`).exec(css)?.[1] ?? "";
      expect(faces.some((f) => f.family === family), `--${role}: ${family}`).toBe(true);
    }
  });

  it("covers every font the meme export waits for", () => {
    const wanted = [...read("../src/art/export.ts").matchAll(/"(\d{3}) \d+px '?([A-Z][\w ]*?)'?"/g)];
    expect(wanted.length).toBeGreaterThan(3);
    for (const [, weight, family] of wanted) expect(hasFace(family, Number(weight)), `${weight} ${family}`).toBe(true);
  });

  it("loads nothing from Google", () => {
    for (const path of ["../index.html", "../public/sw.js", "../src/styles.css", "../src/fonts/fonts.css"]) {
      expect(read(path), path).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
    }
  });
});
