import { describe, expect, it } from "vitest";
import { handleNotify } from "../supabase/functions/krysa-notify/handler";
import { b64uEncode } from "../src/lib/webpush";

const URL_ = "https://ref.supabase.test";
const TOKEN = "cron-token";
const NOW = Date.UTC(2026, 9, 7, 18, 0); // 20:00 in Prague

interface Row {
  [k: string]: unknown;
}

/** An in-memory stand-in for the parts of Supabase and the push services the function talks to. */
function world(o: { subs: Row[]; docs?: Row[]; pushStatus?: Record<string, number> }) {
  const state = { keys: null as Row | null, subs: o.subs, docs: o.docs ?? [], sent: new Set<string>(), pushes: [] as { url: string; headers: Record<string, string> }[], calls: [] as string[] };
  const reply = (body: unknown, status = 200) => new Response(body === undefined ? null : JSON.stringify(body), { status });
  const fakeFetch = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    const method = init.method ?? "GET";
    if (!url.startsWith(URL_)) {
      // A push service: the body is the encrypted message.
      state.pushes.push({ url, headers: init.headers as Record<string, string> });
      return new Response(null, { status: o.pushStatus?.[url] ?? 201 });
    }
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    const path = decodeURIComponent(url.slice(`${URL_}/rest/v1/`.length));
    state.calls.push(`${method} ${path.split("?")[0]}`);
    if (path === "rpc/push_token_ok") return reply(body.p_token === TOKEN);
    if (path.startsWith("push_keys")) {
      if (method === "POST") state.keys ??= body;
      return method === "POST" ? new Response(null, { status: 201 }) : reply(state.keys ? [state.keys] : []);
    }
    if (path.startsWith("push_subscriptions")) {
      if (method === "DELETE") {
        const endpoint = path.split("endpoint=eq.")[1];
        state.subs = state.subs.filter((s) => s.endpoint !== endpoint);
        return new Response(null, { status: 204 });
      }
      return reply(state.subs);
    }
    if (path.startsWith("docs")) {
      const since = /created_at=gt\.([^&]+)/.exec(path)?.[1];
      const rats = path.includes("collection=eq.rats");
      return reply(state.docs.filter((d) => String(d.path).startsWith("rats/") === rats && (!since || String(d.created_at ?? "") > since)));
    }
    if (path.startsWith("profiles")) return reply([{ id: "u-alex", name: "Alex" }]);
    if (path === "push_sent") {
      const fresh = (body as { key: string }[]).filter((r) => !state.sent.has(r.key));
      for (const r of fresh) state.sent.add(r.key);
      return reply(fresh, 201);
    }
    return reply({ message: `unexpected ${method} ${path}` }, 500);
  }) as typeof globalThis.fetch;
  const run = (token?: string) =>
    handleNotify(new Request("https://fn.test/krysa-notify", { method: "POST", headers: token ? { "x-krysa-token": token } : {} }), { url: URL_, key: "sb_secret_test", fetch: fakeFetch, now: () => NOW });
  return { state, run };
}

async function device(userId: string, endpoint: string, prefs: Partial<Row> = {}): Promise<Row> {
  const pair = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"])) as CryptoKeyPair;
  return {
    endpoint,
    user_id: userId,
    p256dh: b64uEncode(new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey))),
    auth: b64uEncode(crypto.getRandomValues(new Uint8Array(16))),
    reminders: true,
    posts: true,
    ...prefs,
  };
}

const newMeme = { path: "rats/p1", created_at: new Date(NOW - 60000).toISOString(), data: { type: "meme", by: "u-alex", top: "SQUEAK" } };

describe("krysa-notify", () => {
  it("only runs for the scheduled job's token", async () => {
    const w = world({ subs: [] });
    expect((await w.run()).status).toBe(401);
    expect((await w.run("guess")).status).toBe(401);
    expect(w.state.calls).toEqual(["POST rpc/push_token_ok"]);
    expect(w.state.keys).toBeNull();
  });

  it("creates the key pair on its first run, even before anyone subscribed", async () => {
    const w = world({ subs: [] });
    const res = await w.run(TOKEN);
    expect(await res.json()).toEqual({ sent: 0, failed: 0, removed: 0 });
    expect(String(w.state.keys?.public_key)).toMatch(/^[\w-]{87}$/);
    expect(w.state.keys?.private_jwk).toMatchObject({ kty: "EC", crv: "P-256" });
  });

  it("sends a new post to everyone but the poster, once", async () => {
    const w = world({
      subs: [await device("u-alex", "https://push.example.test/alex"), await device("u-sam", "https://push.example.test/sam"), await device("u-jules", "https://push.example.test/jules", { posts: false })],
      docs: [newMeme],
    });
    expect(await (await w.run(TOKEN)).json()).toEqual({ sent: 1, failed: 0, removed: 0 });
    expect(w.state.pushes.map((p) => p.url)).toEqual(["https://push.example.test/sam"]);
    expect(w.state.pushes[0].headers).toMatchObject({ "Content-Encoding": "aes128gcm", TTL: "86400", Urgency: "normal" });
    expect(w.state.pushes[0].headers.Authorization).toMatch(/^vapid t=[\w-]+\.[\w-]+\.[\w-]+, k=[\w-]+$/);
    expect(await (await w.run(TOKEN)).json()).toEqual({ sent: 0, failed: 0, removed: 0 });
    expect(w.state.pushes).toHaveLength(1);
  });

  it("forgets devices the push service says are gone", async () => {
    const w = world({ subs: [await device("u-sam", "https://push.example.test/old")], docs: [newMeme], pushStatus: { "https://push.example.test/old": 410 } });
    expect(await (await w.run(TOKEN)).json()).toEqual({ sent: 0, failed: 0, removed: 1 });
    expect(w.state.subs).toEqual([]);
  });

  it("only accepts POST", async () => {
    const res = await handleNotify(new Request("https://fn.test/krysa-notify"), { url: URL_, key: "k" });
    expect(res.status).toBe(405);
  });
});
