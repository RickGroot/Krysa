import { Store, browserDownloads, dataError, mergeDeep, newId, type AssetsNS, type DB, type Json, type Runtime, type UserNS } from "./runtime";

export const LOCAL_DB_KEY = "krysa-local-db";
const KEY = LOCAL_DB_KEY;

/**
 * Everything in this browser only: for trying the app without a backend and
 * for local development. Uploads are kept as data URLs, so keep them small.
 */
export function localRuntime(seed: Record<string, Json> = {}): Runtime {
  const store = new Store();
  let saved: Record<string, Json> | null = null;
  try {
    saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
  } catch {
    saved = null;
  }
  for (const [p, d] of Object.entries(saved ?? seed)) store.put(p, d, true);
  let timer: ReturnType<typeof setTimeout> | undefined;
  store.onChange = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(store.entries())));
      } catch {
        /* storage full or blocked: keep working in memory */
      }
    }, 200);
  };

  const doc = (path: string) => ({
    id: Store.split(path).id,
    path,
    get: async () => store.docSnap(path),
    set: async (data: Json) => store.put(path, structuredClone(data)),
    update: async (patch: Json) => {
      const cur = store.get(path);
      if (!cur) throw dataError("invalid_argument", "Document does not exist");
      store.put(path, mergeDeep(cur, patch));
    },
    delete: async () => store.put(path, null),
    onSnapshot: (next: (s: ReturnType<Store["docSnap"]>) => void) => {
      queueMicrotask(() => next(store.docSnap(path)));
      return store.listenDoc(path, next);
    },
  });
  const db: DB = {
    doc,
    collection: (col: string) => ({
      path: col,
      doc: (id?: string) => doc(`${col}/${id ?? newId()}`),
      add: async (data: Json) => {
        const d = doc(`${col}/${newId()}`);
        await d.set(data);
        return d;
      },
      onSnapshot: (next) => {
        queueMicrotask(() => next(store.colSnap(col)));
        return store.listenCol(col, next);
      },
    }),
  };
  const user: UserNS = {
    id: async () => "local",
    me: async () => ({ id: "local", name: "You" }),
    isOwner: async () => true,
    canEdit: async () => true,
    can: async () => true,
    // Demo posts, votes and scores use traveller ids, so show those names.
    profiles: async (ids) =>
      Object.fromEntries(
        ids.map((id) => {
          const person = store.get(`people/${id}`);
          const name = id === "local" ? "You" : person && typeof person === "object" && !Array.isArray(person) ? String(person.name ?? "") : "";
          return [id, { id, name }];
        }),
      ),
  };
  const assets: AssetsNS = {
    async upload(blob) {
      const id = newId(32);
      const url = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result));
        r.onerror = () => rej(dataError("upstream_error", "Could not read file"));
        r.readAsDataURL(blob);
      });
      try {
        localStorage.setItem("krysa-asset-" + id, url);
      } catch {
        throw dataError("too_large", "This browser is out of space for uploads");
      }
      return { id, url };
    },
    async delete(id) {
      localStorage.removeItem("krysa-asset-" + id);
      return { deleted: true };
    },
    async url(id) {
      return localStorage.getItem("krysa-asset-" + id) ?? "";
    },
  };
  const table: Record<string, unknown> = { db, user, assets, downloads: browserDownloads() };
  return { use: async (name: string) => table[name] ?? null };
}
