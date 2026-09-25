import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import {
  Store,
  browserDownloads,
  dataError,
  mergeDeep,
  newId,
  type AssetsNS,
  type DataError,
  type DB,
  type DocRef,
  type Json,
  type Profile,
  type PushNS,
  type Runtime,
  type UserNS,
} from "./runtime";

/**
 * Everything lives in its own Postgres schema and bucket, so Krysa can share a
 * Supabase project with other apps (see supabase/schema.sql).
 */
export const SCHEMA = "krysa";
const BUCKET = "krysa-uploads";
const CACHE_KEY = "krysa-cache-v1";

interface DocRow {
  path: string;
  collection: string;
  doc_id: string;
  data: Json;
}

/** `publishableKey` is the public `sb_publishable_…` key (or a legacy anon key). */
export function supabaseClient(url: string, publishableKey: string): SupabaseClient {
  return createClient(url, publishableKey, {
    db: { schema: SCHEMA },
    // Devices sign in anonymously with a trip code; there are no email links to pick up.
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  }) as unknown as SupabaseClient;
}

function toDataError(e: { code?: string; message?: string; status?: number } | null): DataError {
  if (!e) return dataError("unavailable", "Unknown error");
  // 42501 = RLS refused the write: the viewer isn't on the member list.
  if (e.code === "42501" || e.status === 401 || e.status === 403) return dataError("invalid_argument", e.message ?? "Not allowed");
  if (e.code === "P0002") return dataError("invalid_argument", "Document does not exist");
  return dataError("unavailable", e.message ?? "Request failed");
}

/**
 * Shared data in one `docs` table (path → jsonb), kept live with Supabase
 * Realtime. Writes are applied to the local cache first so the UI responds
 * instantly, then rolled back if the server refuses them. The last known
 * data is cached in localStorage so the app still opens offline.
 */
export async function supabaseRuntime(sb: SupabaseClient): Promise<Runtime> {
  const { data: sess } = await sb.auth.getSession();
  const user: User | null = sess.session?.user ?? null;
  const store = new Store();
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null") as Record<string, Json> | null;
    if (cached) for (const [p, d] of Object.entries(cached)) store.put(p, d, true);
  } catch {
    /* ignore a broken cache */
  }
  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  store.onChange = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(store.entries())));
      } catch {
        /* cache is best-effort */
      }
    }, 500);
  };

  const loaded = new Map<string, Promise<void>>();
  const ensureCollection = (col: string): Promise<void> => {
    let p = loaded.get(col);
    if (!p) {
      p = (async () => {
        const { data, error } = await sb.from("docs").select("path,collection,doc_id,data").eq("collection", col);
        if (error) throw toDataError(error);
        for (const [path] of store.entries()) if (Store.split(path).col === col) store.put(path, null, true);
        for (const row of (data ?? []) as DocRow[]) store.put(row.path, row.data, true);
        store.touchCollection(col);
      })();
      loaded.set(col, p);
      p.catch(() => loaded.delete(col));
    }
    return p;
  };

  sb.channel("docs-live")
    .on("postgres_changes", { event: "*", schema: SCHEMA, table: "docs" }, (payload) => {
      if (payload.eventType === "DELETE") {
        const old = payload.old as Partial<DocRow>;
        if (old.path) store.put(old.path, null);
      } else {
        const row = payload.new as DocRow;
        store.put(row.path, row.data);
      }
    })
    .subscribe();

  const doc = (path: string): DocRef => {
    const { col, id } = Store.split(path);
    return {
      id,
      path,
      get: async () => {
        await ensureCollection(col);
        return store.docSnap(path);
      },
      set: async (data) => {
        const before = store.get(path);
        store.put(path, structuredClone(data));
        const { error } = await sb.from("docs").upsert({ path, collection: col, doc_id: id, data });
        if (error) {
          store.put(path, before ?? null);
          throw toDataError(error);
        }
      },
      update: async (patch) => {
        await ensureCollection(col);
        const before = store.get(path);
        if (!before) throw dataError("invalid_argument", "Document does not exist");
        store.put(path, mergeDeep(before, patch));
        const { error } = await sb.rpc("docs_merge", { p_path: path, p_patch: patch });
        if (error) {
          store.put(path, before);
          throw toDataError(error);
        }
      },
      delete: async () => {
        const before = store.get(path);
        store.put(path, null);
        const { error } = await sb.from("docs").delete().eq("path", path);
        if (error) {
          if (before) store.put(path, before);
          throw toDataError(error);
        }
      },
      onSnapshot: (next, onError) => {
        const off = store.listenDoc(path, next);
        if (store.has(path)) queueMicrotask(() => next(store.docSnap(path)));
        ensureCollection(col).then(
          () => next(store.docSnap(path)),
          (e) => onError?.(e),
        );
        return off;
      },
    };
  };

  const db: DB = {
    doc,
    collection: (col) => ({
      path: col,
      doc: (id) => doc(`${col}/${id ?? newId()}`),
      add: async (data) => {
        const d = doc(`${col}/${newId()}`);
        await d.set(data);
        return d;
      },
      onSnapshot: (next, onError) => {
        const off = store.listenCol(col, next);
        if (loaded.has(col) || store.colSnap(col).size) queueMicrotask(() => next(store.colSnap(col)));
        ensureCollection(col).catch((e) => onError?.(e));
        return off;
      },
    }),
  };

  const profileCache = new Map<string, Profile>();
  const [{ data: isMember }, { data: isOwner }] = await Promise.all([sb.rpc("is_member"), sb.rpc("is_owner")]);
  const userNS: UserNS = {
    id: async () => user?.id ?? null,
    me: async () => {
      if (!user) return { id: null, name: "" };
      const p = (await userNS.profiles([user.id]))[user.id];
      return { id: user.id, name: p?.name || (user.email ?? "").split("@")[0] };
    },
    isOwner: async () => isOwner === true,
    canEdit: async () => !!isMember,
    can: async (c) => (c === "data.write" ? !!isMember : null),
    profiles: async (ids) => {
      const missing = [...new Set(ids)].filter((id) => !profileCache.has(id) && /^[0-9a-f-]{36}$/i.test(id));
      if (missing.length) {
        const { data } = await sb.from("profiles").select("id,name").in("id", missing);
        for (const p of (data ?? []) as Profile[]) profileCache.set(p.id, p);
      }
      return Object.fromEntries(ids.map((id) => [id, profileCache.get(id) ?? { id, name: "" }]));
    },
  };

  const urlCache = new Map<string, { url: string; until: number }>();
  const assets: AssetsNS = {
    async upload(blob, o) {
      const id = newId(32);
      const { error } = await sb.storage.from(BUCKET).upload(id, blob, { contentType: o?.type ?? blob.type, upsert: false });
      if (error) throw dataError(/exceed|too large/i.test(error.message) ? "too_large" : "upstream_error", error.message);
      return { id, url: await assets.url(id) };
    },
    async delete(id) {
      const { error } = await sb.storage.from(BUCKET).remove([id]);
      if (error) throw dataError("upstream_error", error.message);
      urlCache.delete(id);
      return { deleted: true };
    },
    async url(id) {
      const hit = urlCache.get(id);
      if (hit && hit.until > Date.now()) return hit.url;
      const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(id, 3600);
      if (error || !data) return "";
      urlCache.set(id, { url: data.signedUrl, until: Date.now() + 50 * 60000 });
      return data.signedUrl;
    },
  };

  // Sending happens in the krysa-notify function; the app only registers this device.
  const push: PushNS = {
    async publicKey() {
      const { data, error } = await sb.rpc("push_public_key");
      if (error) throw toDataError(error);
      return typeof data === "string" && data ? data : null;
    },
    async save(s, p) {
      const { error } = await sb.rpc("push_subscribe", { p_endpoint: s.endpoint, p_p256dh: s.p256dh, p_auth: s.auth, p_reminders: p.reminders, p_posts: p.posts });
      if (error) throw toDataError(error);
    },
    async remove(endpoint) {
      const { error } = await sb.rpc("push_unsubscribe", { p_endpoint: endpoint });
      if (error) throw toDataError(error);
    },
  };

  const table: Record<string, unknown> = { db, user: userNS, assets, downloads: browserDownloads(), push };
  return { use: async (name: string) => table[name] ?? null };
}
