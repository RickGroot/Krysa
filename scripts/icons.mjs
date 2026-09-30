// Renders Krysa's app icons into public/icons with the local Chrome or Edge, so every raster there is reproducible.
// The mark: Krysa with big whiskers, clinking two Czech lagers, on the app's asphalt ground.
// The rat is the one from src/art/rat.ts (happy face), in its own 120-unit box; the ground is DESIGN.md's `bg`.
//   node scripts/icons.mjs            (set CHROME=/path/to/browser if it isn't found)
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const out = join(root, "public", "icons");

const T = { ground: "#131211", glow: "#2e2923", beerTop: "#f7c244", beerBottom: "#d98a16", glass: "#fbeec8", handle: "#f3e7c9", base: "#f5d98e", facet: "#b5700c", foam: "#fbf7ee" };
const RAT = { fur: "#8e8a96", belly: "#ddd6da", pink: "#e993a4", toe: "#c46b7c", ink: "#1d2433", mouth: "#7a2d3a", whisker: "#efe9dd" };

// Krysa in the art's 120-unit box: body, head, the happy face and three long whiskers a side.
const rat = `
  <ellipse cx="60" cy="86" rx="31" ry="27" fill="${RAT.fur}"/><ellipse cx="60" cy="92" rx="19" ry="17" fill="${RAT.belly}"/>
  <circle cx="39" cy="29" r="12" fill="${RAT.fur}"/><circle cx="39" cy="29" r="7" fill="${RAT.pink}"/>
  <circle cx="81" cy="29" r="12" fill="${RAT.fur}"/><circle cx="81" cy="29" r="7" fill="${RAT.pink}"/>
  <circle cx="60" cy="49" r="23" fill="${RAT.fur}"/>
  <ellipse cx="60" cy="61" rx="12" ry="9.5" fill="${RAT.belly}"/>
  <path d="M46.5 47.5q4.5-5 9 0M64.5 47.5q4.5-5 9 0" fill="none" stroke="${RAT.ink}" stroke-width="2.6" stroke-linecap="round"/>
  <ellipse cx="44" cy="54.5" rx="4.2" ry="2.5" fill="${RAT.pink}" opacity=".75"/><ellipse cx="76" cy="54.5" rx="4.2" ry="2.5" fill="${RAT.pink}" opacity=".75"/>
  <path d="M60 60v3" stroke="${RAT.ink}" stroke-width="1.2"/>
  <path d="M54 63.5h12q-1 7-6 7t-6-7z" fill="${RAT.mouth}"/><rect x="57.5" y="63.5" width="5" height="3" fill="#fff"/>
  <circle cx="60" cy="56.5" r="3.6" fill="${RAT.pink}"/>
  <g fill="none" stroke="${RAT.whisker}" stroke-width="1.7" stroke-linecap="round" opacity=".9">
    <path d="M49 57.5Q30 50 7 47"/><path d="M49 60.5Q28 58 5 60"/><path d="M49.5 63.5Q30 66 9 73"/>
    <path d="M71 57.5Q90 50 113 47"/><path d="M71 60.5Q92 58 115 60"/><path d="M70.5 63.5Q90 66 111 73"/>
  </g>`;

// A Czech lager mug in a paw: bottom centre at 0,0, handle and paw to the right.
const mug = `
  <path d="M42 -120h12a28 28 0 0 1 28 28v34a28 28 0 0 1-28 28h-12" fill="none" stroke="${T.handle}" stroke-width="13"/>
  <rect x="-44" y="-142" width="88" height="142" rx="11" fill="url(#beer)" stroke="${T.glass}" stroke-width="5"/>
  <rect x="-44" y="-20" width="88" height="20" rx="9" fill="${T.base}" opacity=".9"/>
  <path d="M-20 -118v84M0 -118v84M20 -118v84" stroke="${T.facet}" stroke-width="5" stroke-linecap="round" opacity=".35"/>
  <rect x="-34" y="-122" width="8" height="88" rx="4" fill="#fff" opacity=".35"/>
  <g fill="${T.foam}"><ellipse cx="0" cy="-142" rx="50" ry="16"/><circle cx="-27" cy="-152" r="19"/><circle cx="0" cy="-160" r="23"/><circle cx="27" cy="-151" r="19"/><path d="M28 -145v30a7 7 0 0 0 14 0v-30z"/></g>
  <ellipse cx="46" cy="-66" rx="20" ry="16" fill="${RAT.pink}"/>
  <path d="M40 -73v8M47 -74v9M54 -73v8" stroke="${RAT.toe}" stroke-width="3" stroke-linecap="round" opacity=".6"/>`;

/**
 * One icon as SVG on a 512 grid.
 * round: bake in the corners (for "any" icons and the favicon); iOS and maskable icons are full bleed and the OS masks them
 * scale: the mark's size about the centre; 0.94 leaves it some air, a maskable icon needs less to stay in the safe circle
 */
function icon({ round = true, scale = 0.94 } = {}) {
  const k = (512 * (1 - scale)) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<defs>
  <radialGradient id="glow" cx="256" cy="220" r="340" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${T.glow}"/><stop offset="1" stop-color="${T.ground}"/></radialGradient>
  <linearGradient id="beer" x1="0" y1="-140" x2="0" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${T.beerTop}"/><stop offset="1" stop-color="${T.beerBottom}"/></linearGradient>
  <filter id="lift" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#000" flood-opacity=".45"/></filter>
  ${round ? `<clipPath id="corners"><rect width="512" height="512" rx="114"/></clipPath>` : ""}
</defs>
<g${round ? ` clip-path="url(#corners)"` : ""}>
<rect width="512" height="512" fill="url(#glow)"/>
<g transform="translate(${k} ${k}) scale(${scale})">
  <g transform="translate(16 -24) scale(4)">${rat}</g>
  <g filter="url(#lift)">
    <g transform="translate(178 470) rotate(16) scale(-1 1)">${mug}</g>
    <g transform="translate(334 470) rotate(-16)">${mug}</g>
  </g>
</g>
</g>
</svg>`;
}

// At full size the mark's farthest points (the outer mug corners and the ears) sit about 237 units from the centre;
// Android's safe circle is 204.8, so the maskable icon draws it at 0.8.
const RASTERS = [
  { file: "icon-192.png", size: 192, opts: {} },
  { file: "icon-512.png", size: 512, opts: {} },
  { file: "apple-touch-icon.png", size: 180, opts: { round: false } },
  { file: "maskable-512.png", size: 512, opts: { round: false, scale: 0.8 } },
];

function findBrowser() {
  const candidates = [
    process.env.CHROME,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  const hit = candidates.find((p) => existsSync(p));
  if (!hit) throw new Error("No Chrome, Chromium or Edge found. Set CHROME to the browser's executable.");
  return hit;
}

// A PNG's width and height sit in its IHDR chunk, bytes 16 to 23.
function pngSize(file) {
  const b = readFileSync(file);
  if (b.toString("latin1", 1, 4) !== "PNG") throw new Error(`${file} is not a PNG`);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

const browser = findBrowser();
const tmp = mkdtempSync(join(tmpdir(), "krysa-icons-"));
try {
  for (const { file, size, opts } of RASTERS) {
    const page = join(tmp, file.replace(/\.png$/, ".html"));
    writeFileSync(page, `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${icon(opts)}`);
    const target = join(out, file);
    const run = spawnSync(
      browser,
      [
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--force-device-scale-factor=1",
        "--default-background-color=00000000",
        `--window-size=${size},${size}`,
        `--screenshot=${target}`,
        pathToFileURL(page).href,
      ],
      { encoding: "utf8", timeout: 60_000 },
    );
    if (run.error) throw run.error;
    if (!existsSync(target)) throw new Error(`${file} wasn't written:\n${run.stderr}`);
    const [w, h] = pngSize(target);
    if (w !== size || h !== size) throw new Error(`${file} came out ${w}×${h}, expected ${size}×${size}`);
    console.log(`${file}  ${size}×${size}`);
  }
  // The favicon is the same mark as a vector, so it stays sharp in a tab.
  writeFileSync(join(out, "icon.svg"), icon() + "\n");
  console.log("icon.svg  (favicon)");
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
