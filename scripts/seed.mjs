// Load a seed file into the `krysa.docs` table.
// Usage: pnpm seed                       → the made-up demo trip (supabase/seed/demo.json)
//        pnpm seed path/to/my-trip.json  → your own data (keep it out of git: *.private.json is ignored)
// Needs VITE_SUPABASE_URL and SUPABASE_SECRET_KEY (or a legacy SUPABASE_SERVICE_ROLE_KEY) in .env.
// That key bypasses row level security: run this from your own machine only and
// never put it in the app or in GitHub.
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set VITE_SUPABASE_URL and SUPABASE_SECRET_KEY in .env first.");
  process.exit(1);
}

const file = process.argv[2] ? resolve(process.argv[2]) : new URL("../supabase/seed/demo.json", import.meta.url);
let seed;
try {
  seed = JSON.parse(await readFile(file, "utf8"));
} catch (e) {
  console.error(`Could not read ${file}: ${e.message}`);
  process.exit(1);
}

const sb = createClient(url, key, { db: { schema: "krysa" }, auth: { persistSession: false } });
const rows = Object.entries(seed).map(([path, data]) => {
  const i = path.lastIndexOf("/");
  return { path, collection: path.slice(0, i), doc_id: path.slice(i + 1), data };
});

// Keep what's already there so re-running doesn't wipe changes people made.
const { data: existing, error: readErr } = await sb.from("docs").select("path");
if (readErr) {
  console.error("Could not read docs:", readErr.message, "(did you run supabase/schema.sql and expose the krysa schema?)");
  process.exit(1);
}
const have = new Set((existing ?? []).map((r) => r.path));
const fresh = rows.filter((r) => !have.has(r.path));

if (!fresh.length) {
  console.log("Nothing to seed: every document already exists.");
  process.exit(0);
}
const { error } = await sb.from("docs").insert(fresh);
if (error) {
  console.error("Seeding failed:", error.message);
  process.exit(1);
}
console.log(`Seeded ${fresh.length} documents (${rows.length - fresh.length} already existed).`);
