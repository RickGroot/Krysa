/**
 * The krysa-notify function: sends what `planPushes` decides on. pg_cron calls
 * it every minute through `krysa.run_notify()`, with a token only the database
 * knows. Each push is claimed in krysa.push_sent before it goes out, so it's
 * sent once even when two runs overlap. The key pair pushes are signed with is
 * created on the first run and never leaves the database.
 *
 * Kept free of Deno APIs so the tests can run it in Node; index.ts wires it up.
 */
import { NEW_POST_MS, planPushes, wants, type NotifyDoc, type NotifySub } from "../../../src/lib/notify.ts";
import { generateVapidKeys, pushRequest, type VapidKeys } from "../../../src/lib/webpush.ts";

export interface NotifyEnv {
  /** SUPABASE_URL. Also the VAPID contact, which push services require. */
  url: string;
  /** A secret key: the function reads tables the app never can. */
  key: string;
  fetch?: typeof fetch;
  now?: () => number;
}

interface SubRow extends NotifySub {
  p256dh: string;
  auth: string;
}

type Rest = <T>(path: string, init?: { method?: string; body?: unknown; prefer?: string }) => Promise<T>;

const json = (status: number, body: unknown): Response => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
/** Every successful run answers the same way, which is what shows up in net._http_response. */
const done = (sent = 0, failed = 0, removed = 0): Response => json(200, { sent, failed, removed });

export async function handleNotify(req: Request, env: NotifyEnv): Promise<Response> {
  if (req.method !== "POST") return json(405, { error: "POST only" });
  if (!env.url || !env.key) return json(500, { error: "SUPABASE_URL or a secret key is missing" });
  const f = env.fetch ?? fetch;
  const nowMs = (env.now ?? Date.now)();

  const rest: Rest = async <T>(path: string, init: { method?: string; body?: unknown; prefer?: string } = {}) => {
    const headers: Record<string, string> = { apikey: env.key, "Accept-Profile": "krysa", "Content-Profile": "krysa", "Content-Type": "application/json" };
    if (env.key.startsWith("eyJ")) headers.Authorization = `Bearer ${env.key}`; // legacy service_role JWT
    if (init.prefer) headers.Prefer = init.prefer;
    const method = init.method ?? "GET";
    const res = await f(`${env.url}/rest/v1/${path}`, { method, headers, body: init.body === undefined ? undefined : JSON.stringify(init.body) });
    const text = await res.text();
    if (!res.ok) throw new Error(`${method} ${path.split("?")[0]}: ${res.status} ${text}`);
    return (text ? JSON.parse(text) : null) as T;
  };

  try {
    const token = req.headers.get("x-krysa-token") ?? "";
    if (!token || (await rest<boolean>("rpc/push_token_ok", { method: "POST", body: { p_token: token } })) !== true) {
      return json(401, { error: "Unauthorized" });
    }
    const keys = await vapidKeys(rest);
    const subs = await rest<SubRow[]>("push_subscriptions?select=endpoint,user_id,p256dh,auth,reminders,posts");
    if (!subs.length) return done();

    const since = new Date(nowMs - NEW_POST_MS).toISOString();
    const [trip, posts] = await Promise.all([
      rest<NotifyDoc[]>("docs?select=path,data,created_at&collection=in.(trip,people,flights,events,todos)"),
      rest<NotifyDoc[]>(`docs?select=path,data,created_at&collection=eq.rats&created_at=gt.${since}`),
    ]);
    const names: Record<string, string> = {};
    if (posts.length) for (const p of await rest<{ id: string; name: string }[]>("profiles?select=id,name")) names[p.id] = p.name;

    const planned = planPushes({ docs: [...trip, ...posts], names, nowMs }).filter((p) => subs.some((s) => wants(s, p)));
    if (!planned.length) return done();
    const fresh = await rest<{ key: string }[]>("push_sent", {
      method: "POST",
      body: planned.map((p) => ({ key: p.key })),
      prefer: "resolution=ignore-duplicates,return=representation",
    });
    const claimed = new Set(fresh.map((r) => r.key));

    let sent = 0;
    let failed = 0;
    const gone = new Set<string>();
    const jobs = planned
      .filter((p) => claimed.has(p.key))
      .flatMap((p) =>
        subs
          .filter((s) => wants(s, p))
          .map(async (s) => {
            try {
              const { url, init } = await pushRequest(s, JSON.stringify(p.payload), keys, env.url, { ttl: p.ttl, urgency: p.urgency, nowMs });
              const res = await f(url, init);
              if (res.status === 404 || res.status === 410) gone.add(s.endpoint); // unsubscribed or expired
              else if (res.ok) sent++;
              else {
                failed++;
                console.error(`push ${p.key}: ${res.status} ${await res.text()}`);
              }
            } catch (e) {
              failed++;
              console.error(`push ${p.key} failed`, e);
            }
          }),
      );
    await Promise.all(jobs);
    for (const endpoint of gone) await rest(`push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`, { method: "DELETE" });
    return done(sent, failed, gone.size);
  } catch (e) {
    console.error(e);
    return json(500, { error: e instanceof Error ? e.message : String(e) });
  }
}

/** The VAPID key pair, created on the first run. `push_keys` holds one row, so a race is harmless. */
async function vapidKeys(rest: Rest): Promise<VapidKeys> {
  const read = async () => (await rest<{ public_key: string; private_jwk: JsonWebKey }[]>("push_keys?select=public_key,private_jwk"))[0];
  let row = await read();
  if (!row) {
    const k = await generateVapidKeys();
    await rest("push_keys", { method: "POST", body: { public_key: k.publicKey, private_jwk: k.privateJwk }, prefer: "resolution=ignore-duplicates,return=minimal" });
    row = await read();
  }
  if (!row) throw new Error("Couldn't create the push key pair");
  return { publicKey: row.public_key, privateJwk: row.private_jwk };
}
