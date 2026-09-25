import "./styles.css";
import seed from "../supabase/seed/demo.json";
import { LOCAL_DB_KEY, localRuntime } from "./data/local";
import type { Json } from "./data/runtime";
import { supabaseClient, supabaseRuntime } from "./data/supabase";
import { ensureProfile, joinWithTripCode, showDemoBanner, takeTripCodeFromUrl } from "./ui/auth";
import { boot } from "./ui/boot";
import { todayIso } from "./lib/dates";
import { shiftTrip } from "./lib/demo";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
// The publishable key is public by design; a legacy anon key works too.
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

/**
 * Demo data is a made-up trip that is always "on": day 2 is today. Edits a
 * visitor made on an earlier visit move along with it.
 */
function demoData(): Record<string, Json> {
  const today = todayIso();
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(LOCAL_DB_KEY) ?? "null");
    if (saved && typeof saved === "object" && !Array.isArray(saved)) {
      localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(shiftTrip(saved as Record<string, Record<string, unknown>>, today)));
    }
  } catch {
    /* storage blocked: the runtime falls back to the seed */
  }
  return shiftTrip(seed as Record<string, Record<string, unknown>>, today) as Record<string, Json>;
}

const JOINED_KEY = "krysa-joined";
const remembered = (): boolean => {
  try {
    return localStorage.getItem(JOINED_KEY) === "1";
  } catch {
    return false;
  }
};
const remember = (): void => {
  try {
    localStorage.setItem(JOINED_KEY, "1");
  } catch {
    /* private mode: fine, the code check runs again next time */
  }
};

async function start(): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    boot(localRuntime(demoData()));
    showDemoBanner();
    return;
  }
  const sb = supabaseClient(SUPABASE_URL, SUPABASE_KEY);
  const fromLink = takeTripCodeFromUrl();
  const { data } = await sb.auth.getSession();
  let member = false;
  if (data.session) {
    const { data: isMember, error } = await sb.rpc("is_member");
    // Offline (or a hiccup): trust that this device joined before, so the cached plan still opens.
    member = error ? remembered() : isMember === true;
  }
  if (!member) await joinWithTripCode(sb, fromLink);
  remember();
  const { data: after } = await sb.auth.getSession();
  if (!after.session) throw new Error("No session after joining");
  await ensureProfile(sb, after.session.user);
  boot(await supabaseRuntime(sb));
  sb.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") location.reload();
  });
}

start().catch((e) => {
  console.error(e);
  const main = document.getElementById("main");
  if (main) main.textContent = "The rats couldn't load the plan. Check your connection and reload.";
});

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* offline support is optional */
    });
  });
}
