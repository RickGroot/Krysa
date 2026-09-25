// Supabase Edge Function (Deno). Deploy: see "Push notifications" in the README.
import { handleNotify } from "./handler.ts";

interface DenoLike {
  env: { get(name: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): unknown;
}
const deno = (globalThis as unknown as { Deno: DenoLike }).Deno;

/** Supabase injects the secret keys as a JSON dictionary; older projects have the service role key. */
function secretKey(): string {
  try {
    const keys = JSON.parse(deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}") as Record<string, unknown>;
    const k = keys.default ?? Object.values(keys)[0];
    if (typeof k === "string" && k) return k;
  } catch {
    /* fall back to the legacy key */
  }
  return deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
}

deno.serve((req) => handleNotify(req, { url: deno.env.get("SUPABASE_URL") ?? "", key: secretKey() }));
